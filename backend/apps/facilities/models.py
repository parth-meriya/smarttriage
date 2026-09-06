from django.db import models

class Facility(models.Model):
    name = models.CharField(max_length=200, default="Northside Medical Center")
    code = models.CharField(max_length=50, unique=True, default="NMC-01")
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Facilities'
        ordering = ['name']

    def __str__(self):
        return self.name

class Department(models.Model):
    facility = models.ForeignKey(Facility, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=150, default="Emergency Department")
    code = models.CharField(max_length=50, default="ED")
    rooms = models.CharField(max_length=255, default="A-01,A-02,A-04,B-03,B-07,C-02", help_text="Comma-separated room list")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.facility.name})"
