#!/usr/bin/env python
"""
Test script to verify LED API is working and database updates correctly
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aura_backend.settings')
sys.path.insert(0, os.path.dirname(__file__))
django.setup()

from iot_manager.models import LEDState
import json

print("\n" + "="*60)
print("LED API TEST SCRIPT")
print("="*60)

# Test 1: Check current database state
print("\n[TEST 1] Current LED State in Database:")
state, created = LEDState.objects.get_or_create(id=1)
print(f"  R: {state.r}, G: {state.g}, B: {state.b}")
print(f"  Created: {created}")

# Test 2: Set RED
print("\n[TEST 2] Setting RED (255, 0, 0)...")
state.r = 255
state.g = 0
state.b = 0
state.save()
state.refresh_from_db()
print(f"  Database now: R={state.r}, G={state.g}, B={state.b}")

# Test 3: Set GREEN
print("\n[TEST 3] Setting GREEN (0, 255, 0)...")
state.r = 0
state.g = 255
state.b = 0
state.save()
state.refresh_from_db()
print(f"  Database now: R={state.r}, G={state.g}, B={state.b}")

# Test 4: Set BLUE
print("\n[TEST 4] Setting BLUE (0, 0, 255)...")
state.r = 0
state.g = 0
state.b = 255
state.save()
state.refresh_from_db()
print(f"  Database now: R={state.r}, G={state.g}, B={state.b}")

# Test 5: Set OFF
print("\n[TEST 5] Setting OFF (0, 0, 0)...")
state.r = 0
state.g = 0
state.b = 0
state.save()
state.refresh_from_db()
print(f"  Database now: R={state.r}, G={state.g}, B={state.b}")

# Test 6: Try via API using curl
print("\n[TEST 6] Testing via HTTP API...")
import requests

API_URL = "http://192.168.0.106:8080/api/led/color"
STATE_URL = "http://192.168.0.106:8080/api/led/state"

test_colors = [
    {"name": "RED", "rgb": {"r": 255, "g": 0, "b": 0}},
    {"name": "GREEN", "rgb": {"r": 0, "g": 255, "b": 0}},
    {"name": "BLUE", "rgb": {"r": 0, "g": 0, "b": 255}},
    {"name": "WHITE", "rgb": {"r": 255, "g": 255, "b": 255}},
]

for color in test_colors:
    try:
        # POST to set color
        response = requests.post(API_URL, json=color["rgb"], timeout=5)
        print(f"  {color['name']:6} POST: {response.status_code} - {response.json()}")
        
        # GET to verify
        response = requests.get(STATE_URL, timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"           GET:  {data}")
        
    except Exception as e:
        print(f"  {color['name']:6} ERROR: {e}")

print("\n" + "="*60)
print("TEST COMPLETE")
print("="*60 + "\n")
