import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer


class QueueConsumer(AsyncWebsocketConsumer):
    """
    Real-time queue feed.

    Groups:
      - triage_queue_updates : staff (Doctor/Nurse/Admin) live queue feed
      - patient_queue_<id>   : per-patient personal queue updates

    Connections are authenticated via the JWT in the query string
    (e.g. /ws/queue/?token=<access token>), mirroring the REST API auth.
    """

    async def connect(self):
        self.authenticated_user = None
        self.staff_group = "triage_queue_updates"
        self.patient_group = None
        self.joined_groups = []

        user = await self._authenticate()
        if user is None:
            # Unauthorized connections are closed with a policy-violation code
            await self.close(code=4003)
            return

        self.authenticated_user = user
        role = getattr(user, "role", "")
        self.joined_groups.append(self.staff_group)
        await self.channel_layer.group_add(self.staff_group, self.channel_name)

        if role == "Patient":
            patient = await self._get_patient_for_user(user)
            if patient:
                self.patient_group = f"patient_queue_{patient.id}"
                self.joined_groups.append(self.patient_group)
                await self.channel_layer.group_add(self.patient_group, self.channel_name)

        await self.accept()

        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'Connected to SmartTriage real-time queue feed.',
            'role': role,
        }))

    async def disconnect(self, close_code):
        for group in self.joined_groups:
            await self.channel_layer.group_discard(group, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            action = data.get('action')
            if action == 'ping':
                await self.send(text_data=json.dumps({'type': 'pong'}))
        except Exception:
            pass

    # ------------------------------------------------------------------
    # Event handlers (server -> client)
    # ------------------------------------------------------------------
    async def queue_updated(self, event):
        await self.send(text_data=json.dumps({
            'type': 'queue_updated',
            'data': event.get('data'),
        }))

    async def emergency_alert(self, event):
        await self.send(text_data=json.dumps({
            'type': 'emergency_alert',
            'data': event.get('data'),
        }))

    async def patient_queue_update(self, event):
        """Personal queue snapshot for a single patient."""
        await self.send(text_data=json.dumps({
            'type': 'patient_queue_update',
            'data': event.get('data'),
        }))

    # ------------------------------------------------------------------
    # Auth helpers
    # ------------------------------------------------------------------
    @database_sync_to_async
    def _authenticate(self):
        from rest_framework_simplejwt.exceptions import TokenError
        from rest_framework_simplejwt.tokens import AccessToken
        from django.contrib.auth import get_user_model

        token = self.scope.get('query_string', b'').decode()
        params = dict(p.split('=', 1) for p in token.split('&') if '=' in p)
        raw_token = params.get('token', '')
        if not raw_token:
            return None
        try:
            access = AccessToken(raw_token)
            user_id = access.get('user_id')
        except TokenError:
            return None
        User = get_user_model()
        try:
            return User.objects.get(pk=user_id, is_active=True)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def _get_patient_for_user(self, user):
        from apps.triage.models import Patient
        patient = getattr(user, 'patient_profile', None)
        if patient:
            return patient
        return Patient.objects.filter(email=user.email).first()
