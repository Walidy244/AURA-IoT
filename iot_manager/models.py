from django.db import models

class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=50, default='user')
    voice_control_enabled = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = 'user'

    def __str__(self):
        return self.username

class Device(models.Model):
    device_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50)
    location = models.CharField(max_length=100, blank=True, null=True)
    is_on = models.BooleanField(default=False)
    power_rating_w = models.IntegerField()

    class Meta:
        managed = False
        db_table = 'device'

    def __str__(self):
        return self.name

class Log(models.Model):
    log_id = models.AutoField(primary_key=True)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='logs', db_column='device_id')
    temperature = models.FloatField(blank=True, null=True)
    humidity = models.FloatField(blank=True, null=True)
    current_load = models.FloatField(blank=True, null=True)
    power_load = models.FloatField(blank=True, null=True)
    current_solar = models.FloatField(blank=True, null=True)
    power_solar = models.FloatField(blank=True, null=True)
    timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'log'
        verbose_name_plural = "Logs"
        ordering = ['-timestamp']

    def __str__(self):
        return f"Log {self.log_id} - {self.device.name}"

class Permission(models.Model):
    permission_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='permissions', db_column='user_id')
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='permissions', db_column='device_id')
    can_control = models.BooleanField(default=False)

    class Meta:
        managed = False
        db_table = 'permission'
        unique_together = ('user', 'device')

    def __str__(self):
        return f"{self.user.username} - {self.device.name}"

class Alert(models.Model):
    alert_id = models.AutoField(primary_key=True)
    device = models.ForeignKey(Device, on_delete=models.CASCADE, related_name='alerts', db_column='device_id')
    alert_message = models.CharField(max_length=255)
    resolved = models.BooleanField(default=False)
    timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'alert'
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.alert_message} - {self.device.name}"
