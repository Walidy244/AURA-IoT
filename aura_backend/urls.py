"""
URL configuration for aura_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from iot_manager.views import (
    UserViewSet,
    DeviceViewSet,
    LogViewSet,
    PermissionViewSet,
    AlertViewSet,
    LedControlViewSet,
    SensorDataViewSet,
    register_api,
    login_api,
    set_color,
    get_color,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'devices', DeviceViewSet)
router.register(r'logs', LogViewSet)
router.register(r'permissions', PermissionViewSet)
router.register(r'alerts', AlertViewSet)
router.register(r'led', LedControlViewSet, basename='led')
router.register(r'sensors', SensorDataViewSet, basename='sensor')

urlpatterns = [
    path('admin/', admin.site.urls),
    # LED RGB endpoints (must come BEFORE router to take priority)
    path('api/led/color', set_color),
    path('api/led/state', get_color),
    # Auth endpoints
    path('api/register/', register_api),
    path('api/login/', login_api),
    # All other API routes (ViewSets)
    path('api/', include(router.urls)),
]
