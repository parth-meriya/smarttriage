"""
Centralized queue logic for the SmartTriage priority queue.

All queue ordering / position / estimate decisions live here so the backend
remains the single source of truth. The React frontend only renders values
returned by these functions; it never computes queue state itself.

Ordering rules (enforced by ``active_tickets`` and ``WaitingQueueView``):
  1. Lower triage level first  (L1 emergency -> L4 non-urgent)
  2. Within the same level, FIFO by arrival time (fair ordering)

A ticket is "eligible" when it is still active (not completed / cancelled)
and has not started consultation yet.
"""

from django.conf import settings
from django.db import transaction
from .models import QueueTicket

# Triage levels that are still eligible to be called by a doctor,
# ordered highest priority first.
ELIGIBLE_STATUSES = [
    QueueTicket.Status.WAITING,
    QueueTicket.Status.TRIAGE_IN_PROGRESS,
    QueueTicket.Status.TRIAGE_COMPLETE,
]


def get_average_consultation_minutes() -> int:
    """Configurable average doctor consultation time (minutes). Set via env."""
    return getattr(settings, "AVERAGE_CONSULTATION_MINUTES", 15)


def active_tickets():
    """Tickets still moving through the active workflow (exclude completed/cancelled)."""
    return QueueTicket.objects.exclude(status__in=[
        QueueTicket.Status.COMPLETED,
        getattr(QueueTicket.Status, "CANCELLED", "Cancelled"),
    ])


def eligible_tickets():
    """
    Waiting tickets in strict priority order.
    The first entry is the next patient a doctor should see.
    """
    return (
        active_tickets()
        .filter(status__in=ELIGIBLE_STATUSES)
        .order_by("priority", "arrived_at", "id")
    )


def in_consultation_tickets():
    return active_tickets().filter(status=QueueTicket.Status.IN_CONSULTATION)


def _eligible_order() -> list:
    """Ordered list of eligible ticket pks (priority, then FIFO arrival)."""
    return list(eligible_tickets().values_list("id", flat=True))


def queue_position(ticket: QueueTicket) -> int:
    """1-based position of the ticket among eligible tickets (priority order).
    0 means the ticket is not currently eligible (e.g. in consultation)."""
    order = _eligible_order()
    try:
        return order.index(ticket.pk) + 1
    except ValueError:
        return 0


def patients_ahead(ticket: QueueTicket) -> int:
    """Number of eligible patients ahead of this ticket (position - 1)."""
    position = queue_position(ticket)
    return max(position - 1, 0) if position else 0


def estimated_wait_minutes(ticket: QueueTicket) -> int:
    """
    Rough estimate only: patients ahead x average consultation time.

    Not a medical guarantee - the frontend must present this as an estimate.
    Higher-priority interruptions are partially accounted for by the fact
    that higher-priority patients occupy the front of the queue.
    """
    avg = get_average_consultation_minutes()
    return max(patients_ahead(ticket), 0) * avg


def next_eligible_ticket():
    """The single next patient a doctor should attend, per backend priority rules."""
    return eligible_tickets().first()


@transaction.atomic
def recalculate_estimates() -> int:
    """Refresh stored estimated_wait_minutes for every active ticket."""
    count = 0
    for ticket in active_tickets():
        ticket.estimated_wait_minutes = estimated_wait_minutes(ticket)
        ticket.save(update_fields=["estimated_wait_minutes"])
        count += 1
    return count


def serialize_queue_state(ticket: QueueTicket) -> dict:
    """Canonical queue snapshot for one ticket (patient dashboard + WebSocket)."""
    position = queue_position(ticket)
    ahead = max(position - 1, 0) if position else 0
    return {
        "ticket_id": ticket.id,
        "patient_id": ticket.patient_id,
        "patient_name": ticket.patient.name,
        "ticket_number": ticket.ticket_number,
        "priority": ticket.priority,
        "status": ticket.status,
        "queue_position": position,
        "patients_ahead": ahead,
        "estimated_wait_minutes": estimated_wait_minutes(ticket) if position else 0,
        "average_consultation_minutes": get_average_consultation_minutes(),
        "arrived_at": ticket.arrived_at.isoformat() if ticket.arrived_at else None,
        "called_at": ticket.called_at.isoformat() if ticket.called_at else None,
        "completed_at": ticket.completed_at.isoformat() if ticket.completed_at else None,
    }


def serialize_next_patient(ticket: QueueTicket) -> dict:
    """Doctor-focused snapshot of the next eligible patient."""
    state = serialize_queue_state(ticket)
    assessment = ticket.triage_assessment
    state.update({
        "complaint": (
            assessment.primary_complaint
            if assessment
            else (ticket.visit.chief_complaint if ticket.visit else "Pending triage")
        ),
        "is_emergency": ticket.priority == 1,
        "room": ticket.assigned_room,
        "age": ticket.patient.age,
        "gender": ticket.patient.gender,
    })
    return state
