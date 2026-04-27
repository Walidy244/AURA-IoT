from django.db import models

# Create your models here.
from django.db import models

class Device(models.Model):
    device_key = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    owner_email = models.EmailField() # Matches your Cognito/User logic

    def __str__(self):
        return self.name

class Telemetry(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='data')
    temperature = models.FloatField()
    humidity = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Telemetry"