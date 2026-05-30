from rest_framework import serializers
from .models import User, Device, Log, Permission, Alert, LedControl, SensorData

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'role', 'voice_control_enabled']
        read_only_fields = ['user_id']

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'
        read_only_fields = ['device_id']

class LogSerializer(serializers.ModelSerializer):
    device = DeviceSerializer(read_only=True)
    device_id = serializers.PrimaryKeyRelatedField(
        queryset=Device.objects.all(),
        write_only=True,
        source='device'
    )

    class Meta:
        model = Log
        fields = ['log_id', 'device', 'device_id', 'temperature', 'humidity', 
                  'current_load', 'power_load', 'current_solar', 'power_solar', 'timestamp']
        read_only_fields = ['log_id']

class PermissionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    device = DeviceSerializer(read_only=True)
    
    class Meta:
        model = Permission
        fields = ['permission_id', 'user', 'device', 'can_control']
        read_only_fields = ['permission_id']

class AlertSerializer(serializers.ModelSerializer):
    device = DeviceSerializer(read_only=True)
    
    class Meta:
        model = Alert
        fields = ['alert_id', 'device', 'alert_message', 'resolved', 'timestamp']
        read_only_fields = ['alert_id']

class LedControlSerializer(serializers.ModelSerializer):
    class Meta:
        model = LedControl
        fields = '__all__'
        read_only_fields = ['id', 'updated_at']

class SensorDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = SensorData
        fields = '__all__'
        read_only_fields = ['sensor_id', 'timestamp']
