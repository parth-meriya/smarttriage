from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    class Role(models.TextChoices):
        DOCTOR = 'Doctor', 'Doctor'
        NURSE = 'Nurse', 'Nurse'
        ADMIN = 'Admin', 'Admin'
        PATIENT = 'Patient', 'Patient'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.PATIENT,
        help_text="Clinical or administrative role of the user."
    )
    initials = models.CharField(max_length=8, blank=True, help_text="User initials for UI avatar")
    phone_number = models.CharField(max_length=25, blank=True)
    license_number = models.CharField(max_length=50, blank=True, help_text="Medical license or registration number")
    department = models.CharField(max_length=100, blank=True, default="Emergency Department")
    is_available = models.BooleanField(default=True, help_text="Whether doctor/nurse is available for triage or consultation")

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['username']

    def save(self, *args, **kwargs):
        if not self.initials:
            parts = [p for p in [self.first_name, self.last_name] if p]
            if parts:
                self.initials = "".join([p[0].upper() for p in parts])
            elif self.username:
                self.initials = self.username[:2].upper()
        super().save(*args, **kwargs)

    @property
    def display_name(self):
        full = f"{self.first_name} {self.last_name}".strip()
        if not full:
            return self.username
        if self.role == self.Role.DOCTOR and not full.startswith("Dr."):
            return f"Dr. {full}"
        return full

    def __str__(self):
        return f"{self.display_name} ({self.role})"
