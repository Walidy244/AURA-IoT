import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aura_backend.settings')

app = Celery('aura_backend')

# Load configuration from Django settings, all CELERY_ prefixed settings will be loaded
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks from all registered Django apps
app.autodiscover_tasks()

# Configure Celery Beat schedule for periodic tasks
app.conf.beat_schedule = {
    'check-led-timer-every-minute': {
        'task': 'iot_manager.tasks.check_led_timer',
        'schedule': crontab(minute='*'),  # Run every minute
    },
    'cleanup-old-sensor-data-daily': {
        'task': 'iot_manager.tasks.cleanup_old_sensor_data',
        'schedule': crontab(hour=2, minute=0),  # Run daily at 2:00 AM
        'args': (30,),  # Delete data older than 30 days
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
