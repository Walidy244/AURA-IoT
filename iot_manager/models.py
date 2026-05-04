from django.db import models

# Removed the duplicate import line that was likely yellow

class Device(models.Model):
    device_key = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=100)
    owner_email = models.EmailField()

    class Meta:
        db_table = 'device' # Matches lowercase 'device' in DBeaver
        managed = False

    def __str__(self):
        return self.name

class Telemetry(models.Model):
    # Added db_column to match your DBeaver screenshot
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='data', db_column='device_id')
    temperature = models.FloatField()
    humidity = models.FloatField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        managed = False
        db_table = 'sensor_readings' # Links to your existing data
        verbose_name_plural = "Telemetry"