from rest_framework import serializers
from .models import Device, Telemetry
#This converts database records into JSON for your React Native app.
class TelemetrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Telemetry
        fields = '__all__'

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'