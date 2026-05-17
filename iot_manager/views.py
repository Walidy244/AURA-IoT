from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import User, Device, Log, Permission, Alert
from .serializers import UserSerializer, DeviceSerializer, LogSerializer, PermissionSerializer, AlertSerializer
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
