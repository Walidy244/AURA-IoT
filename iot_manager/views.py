from rest_framework import viewsets
from .models import Device, Telemetry
from .serializers import DeviceSerializer, TelemetrySerializer

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer

class TelemetryViewSet(viewsets.ModelViewSet):
    queryset = Telemetry.objects.all().order_by('-timestamp')
    serializer_class = TelemetrySerializer