# AURA IoT API Endpoints Guide

## Base URL
```
http://10.80.69.94:8000/api/
```

## Available Endpoints

### 📱 Users
```
GET    /api/users/                  # List all users
POST   /api/users/                  # Create new user
GET    /api/users/{id}/             # Get specific user
PUT    /api/users/{id}/             # Update user
DELETE /api/users/{id}/             # Delete user
```

### 🔧 Devices
```
GET    /api/devices/                      # List all devices
POST   /api/devices/                      # Create new device
GET    /api/devices/{id}/                 # Get specific device
PUT    /api/devices/{id}/                 # Update device
DELETE /api/devices/{id}/                 # Delete device
GET    /api/devices/{id}/latest_reading/  # Get latest sensor reading for device
GET    /api/devices/{id}/latest_logs/     # Get last 10 logs for device
```

### 📊 Logs (Sensor Data)
```
GET    /api/logs/                   # Get all sensor logs (paginated, ordered by -timestamp)
POST   /api/logs/                   # Create new log entry
GET    /api/logs/{id}/              # Get specific log
PUT    /api/logs/{id}/              # Update log
DELETE /api/logs/{id}/              # Delete log
GET    /api/logs/latest/            # Get the most recent log entry
```

#### Log Filtering & Sorting
```
GET /api/logs/?device_id=1                          # Filter by device
GET /api/logs/?temp_min=20&temp_max=30              # Filter by temperature range
GET /api/logs/?ordering=-timestamp                  # Order by most recent (default)
GET /api/logs/?ordering=temperature                 # Order by temperature
GET /api/logs/?device_id=1&ordering=-timestamp      # Combine filters
```

### 🔐 Permissions
```
GET    /api/permissions/            # List all permissions
POST   /api/permissions/            # Grant device access to user
GET    /api/permissions/{id}/       # Get specific permission
PUT    /api/permissions/{id}/       # Update permission
DELETE /api/permissions/{id}/       # Remove permission
```

### ⚠️ Alerts
```
GET    /api/alerts/                 # List all alerts
POST   /api/alerts/                 # Create new alert
GET    /api/alerts/{id}/            # Get specific alert
PUT    /api/alerts/{id}/            # Update alert
DELETE /api/alerts/{id}/            # Delete alert
GET    /api/alerts/unresolved/      # Get all unresolved alerts
```

## Example API Calls

### Get Latest Temperature Reading
```bash
curl http://10.80.69.94:8000/api/logs/latest/
```

Response:
```json
{
  "log_id": 1,
  "device": {
    "device_id": 1,
    "name": "ESP32 Sensor",
    "type": "sensor",
    "location": "Living Room",
    "is_on": true,
    "power_rating_w": 0
  },
  "temperature": 25.8,
  "humidity": 53,
  "current_load": -27.38,
  "power_load": -5749.48,
  "current_solar": -0.29,
  "power_solar": -61.14,
  "timestamp": "2026-05-17T09:53:06.811Z"
}
```

### Get All Logs for a Device
```bash
curl http://10.80.69.94:8000/api/logs/?device_id=1
```

### Get Temperature Readings Between 20-30°C
```bash
curl http://10.80.69.94:8000/api/logs/?temp_min=20&temp_max=30
```

### Create New Log Entry (POST)
```bash
curl -X POST http://10.80.69.94:8000/api/logs/ \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": 1,
    "temperature": 25.5,
    "humidity": 60,
    "current_load": 15.2,
    "power_load": 3000,
    "current_solar": 2.5,
    "power_solar": 500
  }'
```

## Frontend Usage

Your React Native frontend automatically:
- Fetches from `/api/logs/` every 10 seconds
- Displays latest temperature, humidity, and power readings
- Shows all logs in a scrollable table
- Indicates if ESP32 device is active (has recent data)

## Troubleshooting

### No data showing in frontend?
1. Check if Django server is running: `python manage.py runserver`
2. Verify IP address matches your machine: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Check database connection: `python manage.py dbshell`
4. Verify ESP32 is sending data to the database

### Database Connection Issues?
Check settings in `aura_backend/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'postgres',
        'USER': 'omar',
        'PASSWORD': '12345678',
        'HOST': 'sensordb.cshii6i2m95z.us-east-1.rds.amazonaws.com',
        'PORT': '5432',
    }
}
```

### CORS Issues?
Already configured with `CORS_ALLOW_ALL_ORIGINS = True` in settings.py for development.
