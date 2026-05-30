from celery import shared_task
from django.utils import timezone
from .models import LedControl, SensorData
import logging

logger = logging.getLogger(__name__)

@shared_task
def check_led_timer():
    """
    Check if current time matches LED timer schedule.
    This task runs every minute and turns LED on/off based on timer settings.
    """
    try:
        led, created = LedControl.objects.get_or_create(id=1)
        
        # If timer is not configured, skip
        if not led.turn_on_at or not led.turn_off_at:
            return {'status': 'timer not configured'}
        
        # Get current time (hour and minute only, no seconds)
        now = timezone.localtime().time().replace(second=0, microsecond=0)
        on_time = led.turn_on_at.replace(second=0, microsecond=0)
        off_time = led.turn_off_at.replace(second=0, microsecond=0)
        
        # Turn LED on if current time matches turn_on_at
        if now == on_time:
            led.is_on = True
            led.save()
            logger.info(f"LED turned ON at {now}")
            return {'status': 'LED turned on', 'color': led.color}
        
        # Turn LED off if current time matches turn_off_at
        elif now == off_time:
            led.is_on = False
            led.color = 'off'
            led.save()
            logger.info(f"LED turned OFF at {now}")
            return {'status': 'LED turned off'}
        
        return {'status': 'no action required'}
    
    except Exception as e:
        logger.error(f"Error in check_led_timer: {str(e)}")
        return {'status': 'error', 'error': str(e)}

@shared_task
def record_sensor_data(temperature, humidity):
    """
    Record DHT11 sensor data to database.
    This task can be called from IoT device via HTTP webhook.
    """
    try:
        sensor_data = SensorData.objects.create(
            temperature=temperature,
            humidity=humidity
        )
        logger.info(f"Sensor data recorded: Temp={temperature}°C, Humidity={humidity}%")
        return {'status': 'recorded', 'id': sensor_data.sensor_id}
    except Exception as e:
        logger.error(f"Error recording sensor data: {str(e)}")
        return {'status': 'error', 'error': str(e)}

@shared_task
def cleanup_old_sensor_data(days=30):
    """
    Delete sensor data older than specified days to maintain database performance.
    """
    try:
        from datetime import timedelta
        from django.utils import timezone as tz
        
        cutoff_date = tz.now() - timedelta(days=days)
        deleted_count, _ = SensorData.objects.filter(timestamp__lt=cutoff_date).delete()
        
        logger.info(f"Deleted {deleted_count} sensor records older than {days} days")
        return {'status': 'cleanup completed', 'deleted_count': deleted_count}
    except Exception as e:
        logger.error(f"Error in cleanup_old_sensor_data: {str(e)}")
        return {'status': 'error', 'error': str(e)}
