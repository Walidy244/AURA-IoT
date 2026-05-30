from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import User, Device, Log, Permission, Alert, LedControl, SensorData, LEDState
from .serializers import (UserSerializer, DeviceSerializer, LogSerializer, 
                          PermissionSerializer, AlertSerializer, LedControlSerializer, 
                          SensorDataSerializer)
from rest_framework.decorators import api_view
from rest_framework import status
from django.contrib.auth.hashers import make_password, check_password
from django.core import signing
from django.core.signing import BadSignature, SignatureExpired


@api_view(['POST'])
def register_api(request):
    """Register a new user. Expects JSON: { username, password }"""
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'detail': 'username and password required'}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'detail': 'username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    hashed = make_password(password)
    user = User(username=username, password=hashed)
    user.save()

    token = signing.dumps({'username': username})
    return Response({'detail': 'user created', 'token': token}, status=status.HTTP_201_CREATED)


@api_view(['POST'])
def login_api(request):
    """Authenticate user. Expects JSON: { username, password }"""
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'detail': 'username and password required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'detail': 'invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    if not check_password(password, user.password):
        return Response({'detail': 'invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    # simple success response; token/session management can be added later
    token = signing.dumps({'username': user.username})
    return Response({'detail': 'ok', 'username': user.username, 'token': token}, status=status.HTTP_200_OK)


@api_view(['POST'])
def set_color(request):
    """Set RGB color. Expects JSON: { r, g, b }"""
    try:
        r = int(request.data.get('r', 0))
        g = int(request.data.get('g', 0))
        b = int(request.data.get('b', 0))
    except (TypeError, ValueError):
        return Response({'error': 'r,g,b must be integers'}, status=status.HTTP_400_BAD_REQUEST)

    state, _ = LEDState.objects.get_or_create(id=1)
    state.r, state.g, state.b = r, g, b
    state.save()
    return Response({'status': 'ok', 'r': state.r, 'g': state.g, 'b': state.b})


@api_view(['GET'])
def get_color(request):
    """Return current RGB color."""
    state, _ = LEDState.objects.get_or_create(id=1)
    return Response({'r': state.r, 'g': state.g, 'b': state.b})

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

class DeviceViewSet(viewsets.ModelViewSet):
    queryset = Device.objects.all()
    serializer_class = DeviceSerializer
    
    @action(detail=True, methods=['get'])
    def latest_logs(self, request, pk=None):
        """Get the latest 10 logs for a specific device"""
        device = self.get_object()
        logs = Log.objects.filter(device=device).order_by('-timestamp')[:10]
        serializer = LogSerializer(logs, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def latest_reading(self, request, pk=None):
        """Get the latest reading for a specific device"""
        device = self.get_object()
        latest_log = Log.objects.filter(device=device).order_by('-timestamp').first()
        if latest_log:
            serializer = LogSerializer(latest_log)
            return Response(serializer.data)
        return Response({})

class LogViewSet(viewsets.ModelViewSet):
    queryset = Log.objects.select_related('device').all().order_by('-timestamp')
    serializer_class = LogSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp', 'temperature', 'humidity', 'power_load', 'power_solar']
    ordering = ['-timestamp']
    
    def get_queryset(self):
        queryset = Log.objects.select_related('device').all().order_by('-timestamp')
        
        # Filter by device_id if provided
        device_id = self.request.query_params.get('device_id', None)
        if device_id is not None:
            queryset = queryset.filter(device_id=device_id)
        
        # Filter by temperature range if provided
        temp_min = self.request.query_params.get('temp_min', None)
        temp_max = self.request.query_params.get('temp_max', None)
        if temp_min is not None:
            queryset = queryset.filter(temperature__gte=float(temp_min))
        if temp_max is not None:
            queryset = queryset.filter(temperature__lte=float(temp_max))
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the latest log entry"""
        latest_log = self.get_queryset().first()
        if latest_log:
            serializer = self.get_serializer(latest_log)
            return Response(serializer.data)
        return Response({})

class PermissionViewSet(viewsets.ModelViewSet):
    queryset = Permission.objects.select_related('user', 'device').all()
    serializer_class = PermissionSerializer

class AlertViewSet(viewsets.ModelViewSet):
    queryset = Alert.objects.select_related('device').all().order_by('-timestamp')
    serializer_class = AlertSerializer
    
    @action(detail=False, methods=['get'])
    def unresolved(self, request):
        """Get all unresolved alerts"""
        alerts = Alert.objects.filter(resolved=False).order_by('-timestamp')
        serializer = self.get_serializer(alerts, many=True)
        return Response(serializer.data)

class LedControlViewSet(viewsets.ModelViewSet):
    queryset = LedControl.objects.all()
    serializer_class = LedControlSerializer
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current LED status"""
        led, created = LedControl.objects.get_or_create(id=1)
        serializer = self.get_serializer(led)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """Toggle LED on/off"""
        led, created = LedControl.objects.get_or_create(id=1)
        led.is_on = not led.is_on
        led.save()
        serializer = self.get_serializer(led)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def set_color(self, request):
        """Set LED color"""
        color = request.data.get('color', 'off')
        # brightness is accepted for compatibility but ignored if not stored in DB
        _brightness = request.data.get('brightness', None)

        led, created = LedControl.objects.get_or_create(id=1)
        led.color = color
        led.is_on = (color != 'off')
        led.save()

        serializer = self.get_serializer(led)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def set_timer(self, request):
        """Set LED timer"""
        turn_on_at = request.data.get('turn_on_at')
        turn_off_at = request.data.get('turn_off_at')
        color = request.data.get('color', 'white')
        led, created = LedControl.objects.get_or_create(id=1)
        led.turn_on_at = turn_on_at
        led.turn_off_at = turn_off_at
        led.color = color
        # Timer enabled is inferred from presence of both times
        led.save()

        serializer = self.get_serializer(led)
        return Response({'status': 'timer set', 'led': serializer.data})

class SensorDataViewSet(viewsets.ModelViewSet):
    queryset = SensorData.objects.all().order_by('-timestamp')
    serializer_class = SensorDataSerializer
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['timestamp', 'temperature', 'humidity']
    ordering = ['-timestamp']
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get the latest sensor reading"""
        latest_reading = SensorData.objects.order_by('-timestamp').first()
        if latest_reading:
            serializer = self.get_serializer(latest_reading)
            return Response(serializer.data)
        return Response({})
    
    @action(detail=False, methods=['post'])
    def record(self, request):
        """Record a new sensor reading from DHT11"""
        temperature = request.data.get('temperature')
        humidity = request.data.get('humidity')
        
        if temperature is None or humidity is None:
            return Response({'error': 'temperature and humidity required'}, status=status.HTTP_400_BAD_REQUEST)
        
        sensor_data = SensorData.objects.create(
            temperature=temperature,
            humidity=humidity
        )
        serializer = self.get_serializer(sensor_data)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def average(self, request):
        """Get average temperature and humidity for last N readings"""
        limit = request.query_params.get('limit', 10)
        readings = SensorData.objects.order_by('-timestamp')[:int(limit)]
        
        if not readings:
            return Response({'error': 'No readings available'}, status=status.HTTP_404_NOT_FOUND)
        
        avg_temp = sum(r.temperature for r in readings if r.temperature) / len(readings)
        avg_humidity = sum(r.humidity for r in readings if r.humidity) / len(readings)
        
        return Response({
            'average_temperature': avg_temp,
            'average_humidity': avg_humidity,
            'readings_count': len(readings)
        })
