from django.db import models
from django.conf import settings
from django.utils import timezone

class Notification(models.Model):
    class Level(models.TextChoices):
        INFO = 'info', 'Information'
        WARNING = 'warning', 'Warning'
        CRITICAL = 'critical', 'Critical Alert'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='notifications',
        help_text="Target user. Null means broadcast to all active clinical staff."
    )
    title = models.CharField(max_length=200)
    message = models.TextField()
    level = models.CharField(
        max_length=20,
        choices=Level.choices,
        default=Level.INFO
    )
    is_read = models.BooleanField(default=False)
    action_url = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        recipient = self.user.username if self.user else "Broadcast"
        return f"[{self.level.upper()}] {self.title} -> {recipient}"
