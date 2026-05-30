# LED Control & DHT11 Sensor System - Complete Setup Guide

## Overview
This system provides full control over an LED and DHT11 temperature/humidity sensor integrated with your Django backend and React Native frontend. The system includes:

- **LED Control**: Turn LED on/off, change colors, adjust brightness
- **Timer System**: Schedule LED turn-on/off times (e.g., 08:00 AM - 6:00 PM)
- **DHT11 Sensor**: Real-time temperature and humidity monitoring
- **Automatic Tasks**: Celery Beat tasks for timer checking and data cleanup

---

## Backend Setup

### 1. Database Models
**File**: `iot_manager/models.py`

Two new models added:
- **LedControl**: Stores LED state, color, brightness, and timer settings
- **SensorData**: Stores DHT11 temperature and humidity readings with timestamps

### 2. API Endpoints

#### LED Control Endpoints
```
GET  /api/led/current/          - Get current LED status
POST /api/led/toggle/           - Toggle LED on/off
POST /api/led/set_color/        - Set LED color and brightness
POST /api/led/set_timer/        - Set LED timer schedule
```

#### Sensor Data Endpoints
```
GET  /api/sensors/              - List all sensor readings (with pagination)
GET  /api/sensors/latest/       - Get latest sensor reading
GET  /api/sensors/average/      - Get average readings (last N records)
POST /api/sensors/record/       - Record new sensor reading
```

### 3. Celery Background Tasks
**File**: `iot_manager/tasks.py`

- **check_led_timer()**: Runs every minute, checks if LED should turn on/off based on timer
- **record_sensor_data()**: Record DHT11 readings to database
- **cleanup_old_sensor_data()**: Delete sensor data older than 30 days (runs daily at 2:00 AM)

### 4. Configuration

#### Settings.py
Added Celery configuration:
```python
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
```

#### celery.py
Beat schedule configured for:
- LED timer check every minute
- Sensor data cleanup daily at 2:00 AM

---

## Frontend Setup

### 1. Components

#### LED Control Component
**File**: `components/led-control.tsx`

Features:
- Toggle LED on/off
- 8 color options (Red, Green, Blue, Yellow, Cyan, Magenta, White, Off)
- Brightness control (0-255%)
- Timer scheduling with on/off times
- Real-time status display
- Auto-refresh every 5 seconds

#### Sensor Display Component
**File**: `components/sensor-display.tsx`

Features:
- Current temperature and humidity reading
- Average values for last 10 readings
- Recent 5 readings list with timestamps
- Auto-refresh every 10 seconds
- Pull-to-refresh functionality
- Thermal/humidity status visualization

### 2. IoT Control Screen
**File**: `app/iot-control.tsx`

Combined interface with two tabs:
1. **LED Tab**: Full LED control
2. **Sensor Tab**: Temperature/humidity monitoring

### 3. Navigation
Updated `app/index.tsx` with IoT Control button in bottom navigation bar

---

## API Request Examples

### LED Control

**Toggle LED**
```bash
curl -X POST http://10.80.69.94:8000/api/led/toggle/ \
  -H "Content-Type: application/json"
```

**Set LED Color**
```bash
curl -X POST http://10.80.69.94:8000/api/led/set_color/ \
  -H "Content-Type: application/json" \
  -d '{"color": "blue", "brightness": 200}'
```

**Set Timer**
```bash
curl -X POST http://10.80.69.94:8000/api/led/set_timer/ \
  -H "Content-Type: application/json" \
  -d '{"turn_on_at": "08:00", "turn_off_at": "18:00", "color": "white"}'
```

### Sensor Data

**Get Latest Reading**
```bash
curl http://10.80.69.94:8000/api/sensors/latest/
```

Response:
```json
{
  "sensor_id": 1,
  "temperature": 24.5,
  "humidity": 65.2,
  "timestamp": "2026-05-23T10:30:45Z"
}
```

**Get Averages**
```bash
curl http://10.80.69.94:8000/api/sensors/average/?limit=10
```

Response:
```json
{
  "average_temperature": 23.8,
  "average_humidity": 64.5,
  "readings_count": 10
}
```

**Record New Reading**
```bash
curl -X POST http://10.80.69.94:8000/api/sensors/record/ \
  -H "Content-Type: application/json" \
  -d '{"temperature": 25.0, "humidity": 66.0}'
```

---

## ESP32/IoT Device Integration

### Sending LED Commands from ESP32
```cpp
// Example Arduino code
#include <WiFi.h>
#include <HTTPClient.h>

void setLedColor(String color) {
  HTTPClient http;
  http.begin("http://10.80.69.94:8000/api/led/set_color/");
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"color\": \"" + color + "\", \"brightness\": 200}";
  http.POST(payload);
  
  http.end();
}
```

### Sending DHT11 Data from ESP32
```cpp
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

void recordSensorData() {
  float temp = dht.readTemperature();
  float humidity = dht.readHumidity();
  
  HTTPClient http;
  http.begin("http://10.80.69.94:8000/api/sensors/record/");
  http.addHeader("Content-Type", "application/json");
  
  String payload = "{\"temperature\": " + String(temp) + 
                   ", \"humidity\": " + String(humidity) + "}";
  http.POST(payload);
  
  http.end();
}
```

---

## Running the System

### 1. Start Redis (required for Celery)
```bash
redis-server
```

### 2. Start Django Development Server
```bash
python manage.py runserver
```

### 3. Start Celery Worker
```bash
celery -A aura_backend worker -l info
```

### 4. Start Celery Beat (for scheduled tasks)
```bash
celery -A aura_backend beat -l info
```

### 5. Run Frontend
```bash
npm start
# or for React Native
expo start
```

---

## Troubleshooting

### Issue: LED commands not working
- **Check**: Redis is running (`redis-cli ping` should return PONG)
- **Check**: Celery worker is running
- **Check**: LED record exists in database (should auto-create on first access)

### Issue: Sensor data not showing
- **Check**: ESP32/device is sending data via POST to `/api/sensors/record/`
- **Check**: Timestamps are in ISO 8601 format
- **Check**: Database permissions allow INSERT on sensor_data table

### Issue: Timer not working
- **Check**: `timer_enabled` is set to True
- **Check**: Celery Beat task is running
- **Check**: Time format is HH:MM (24-hour)

### Issue: Frontend not connecting to backend
- **Check**: Backend is running on correct IP (10.80.69.94:8000)
- **Check**: Firewall allows HTTP on port 8000
- **Check**: CORS is enabled in Django settings

---

## Database Migrations

If you haven't run migrations yet:
```bash
python manage.py makemigrations
python manage.py migrate
```

---

## Security Notes

⚠️ **For Production**:
- Change `DEBUG = True` to `DEBUG = False` in settings.py
- Update `SECRET_KEY` with a secure value
- Use environment variables for sensitive credentials
- Implement proper authentication (JWT tokens, OAuth)
- Use HTTPS instead of HTTP
- Restrict CORS to specific domains
- Add rate limiting to API endpoints

---

## File Summary

### Backend Files Modified/Created:
- `iot_manager/models.py` - Added LedControl and SensorData models
- `iot_manager/serializers.py` - Added LED and Sensor serializers
- `iot_manager/views.py` - Added LED and Sensor viewsets
- `iot_manager/tasks.py` - ✨ NEW - Celery tasks
- `aura_backend/urls.py` - Added LED and Sensor routes
- `aura_backend/settings.py` - Added Celery configuration
- `aura_backend/celery.py` - ✨ NEW - Celery app configuration
- `aura_backend/__init__.py` - Updated to import Celery

### Frontend Files Created:
- `components/led-control.tsx` - LED control component
- `components/sensor-display.tsx` - Sensor display component
- `app/iot-control.tsx` - Combined IoT control screen
- `app/_layout.tsx` - Updated routing

---

## Next Steps

1. **ESP32 Hardware Setup**: Connect DHT11 sensor to GPIO 4, LED to GPIO 5
2. **WiFi Configuration**: Set ESP32 WiFi credentials
3. **Database Setup**: Run migrations to create tables
4. **Start Services**: Run Redis, Django, Celery, and Celery Beat
5. **Test Endpoints**: Use curl or Postman to test API
6. **Deploy Frontend**: Build and deploy React Native app
7. **Monitor**: Check logs for any errors or issues

---

## Support

For detailed API documentation, check:
- Django REST Framework: http://10.80.69.94:8000/api/
- Celery Documentation: https://docs.celeryproject.io/
- DHT11 Sensor Specs: https://www.mouser.com/ds/2/758/DHT11-English-921322.pdf

