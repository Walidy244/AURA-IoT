import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { getApiPath, getLedStateApiUrl, postLedColor } from '../app/api';

interface LedStatus {
  led_id?: number;
  is_on: boolean;
  color: string;
  brightness: number;
  turn_on_at?: string;
  turn_off_at?: string;
  timer_enabled: boolean;
  updated_at: string;
}

const COLOR_OPTIONS = [
  { name: 'Red', value: 'red' },
  { name: 'Green', value: 'green' },
  { name: 'Blue', value: 'blue' },
  { name: 'Yellow', value: 'yellow' },
  { name: 'Cyan', value: 'cyan' },
  { name: 'Magenta', value: 'magenta' },
  { name: 'White', value: 'white' },
  { name: 'Off', value: 'off' },
];

const colorMap: Record<string, { r: number; g: number; b: number }> = {
  red: { r: 255, g: 0, b: 0 },
  green: { r: 0, g: 255, b: 0 },
  blue: { r: 0, g: 0, b: 255 },
  yellow: { r: 255, g: 255, b: 0 },
  cyan: { r: 0, g: 255, b: 255 },
  magenta: { r: 255, g: 0, b: 255 },
  white: { r: 255, g: 255, b: 255 },
  off: { r: 0, g: 0, b: 0 },
};

const getColorNameFromRgb = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const match = Object.entries(colorMap).find(
    ([, rgb]) => rgb.r === r && rgb.g === g && rgb.b === b
  );

  return match?.[0] ?? `rgb(${r},${g},${b})`;
};

export function LedControl() {
  const { width } = useWindowDimensions();
  const [ledStatus, setLedStatus] = useState<LedStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('off');
  const [brightness, setBrightness] = useState(100);
  const [timerOnTime, setTimerOnTime] = useState('08:00');
  const [timerOffTime, setTimerOffTime] = useState('18:00');
  const [timerEnabled, setTimerEnabled] = useState(false);

  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');
  const colorButtonWidth = Math.max(104, Math.min(180, (width - 72) / 4));
  const colorButtonHeight = Math.max(66, Math.min(96, colorButtonWidth * 0.62));

  // Fetch current LED status
  const fetchLedStatus = useCallback(async () => {
    try {
      const response = await fetch(getLedStateApiUrl());
      if (response.ok) {
        const data = await response.json();
        const colorName = getColorNameFromRgb(data);
        // data is expected to be { r, g, b }
        setLedStatus({
          is_on: !(data.r === 0 && data.g === 0 && data.b === 0),
          color: `rgb(${data.r},${data.g},${data.b})`,
          brightness: 100,
          updated_at: null,
        } as any);
        setSelectedColor(colorName);
        setError(null);
      } else {
        setError('Failed to fetch LED status');
      }
    } catch (err) {
      console.error('Error fetching LED status:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Load LED status on mount and setup polling
  useEffect(() => {
    fetchLedStatus();
    const interval = setInterval(fetchLedStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [fetchLedStatus]);

  // Toggle LED on/off
  const handleToggleLed = async () => {
    try {
      setLoading(true);
      const nextIsOn = !ledStatus?.is_on;
      const rgb = nextIsOn ? colorMap[selectedColor] || colorMap.white : colorMap.off;

      const data = await postLedColor(rgb);
      setLedStatus({
        is_on: !(data.r === 0 && data.g === 0 && data.b === 0),
        color: `rgb(${data.r},${data.g},${data.b})`,
        brightness: 100,
        updated_at: null,
      } as any);
      setError(null);
    } catch (err) {
      console.error('Error toggling LED:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle LED');
    } finally {
      setLoading(false);
    }
  };

  const handleSetColor = async (color: string) => {
    try {
      setLoading(true);
      setSelectedColor(color);

      const rgb = colorMap[color] || { r: 0, g: 0, b: 0 };
      const data = await postLedColor(rgb);
      setLedStatus({
        is_on: !(data.r === 0 && data.g === 0 && data.b === 0),
        color: `rgb(${data.r},${data.g},${data.b})`,
        brightness: 100,
        updated_at: null,
      } as any);
      setError(null);
    } catch (err) {
      console.error('Error setting color:', err);
      setError(err instanceof Error ? err.message : 'Failed to set color');
    } finally {
      setLoading(false);
    }
  };

  // Set LED timer
  const handleSetTimer = async () => {
    try {
      setLoading(true);

      const response = await fetch(getApiPath('api/led/set_timer/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          turn_on_at: timerOnTime,
          turn_off_at: timerOffTime,
          color: selectedColor !== 'off' ? selectedColor : 'white',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLedStatus(data.led);
        setError(null);
        alert('Timer set successfully!');
      } else {
        setError('Failed to set timer');
      }
    } catch (err) {
      console.error('Error setting timer:', err);
      setError(err instanceof Error ? err.message : 'Failed to set timer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>LED Control</Text>

      {error && (
        <View style={[styles.errorBox, { borderColor: '#ff6b6b' }]}>
          <Text style={[styles.errorText, { color: '#ff6b6b' }]}>{error}</Text>
        </View>
      )}

      {/* LED Status */}
      {ledStatus && (
        <View style={[styles.statusBox, { borderColor: tintColor }]}>
          <Text style={[styles.statusLabel, { color: textColor }]}>Current Status:</Text>
          <Text style={[styles.statusValue, { color: tintColor }]}>
            {ledStatus.is_on ? 'ON' : 'OFF'} - {ledStatus.color.toUpperCase()}
          </Text>
          <Text style={[styles.statusDetail, { color: textColor }]}>
            Brightness: {ledStatus.brightness}%
          </Text>
        </View>
      )}

      {/* Toggle Button */}
      <TouchableOpacity
        style={[
          styles.toggleButton,
          { backgroundColor: ledStatus?.is_on ? '#51cf66' : '#868e96' },
        ]}
        onPress={handleToggleLed}
        disabled={loading}
      >
        <Text style={styles.toggleButtonText}>
          {loading ? 'Loading...' : ledStatus?.is_on ? 'Turn OFF' : 'Turn ON'}
        </Text>
      </TouchableOpacity>

      {/* Color Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Color</Text>
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map((color) => (
            <TouchableOpacity
              key={color.value}
              style={[
                styles.colorButton,
                {
                  width: colorButtonWidth,
                  height: colorButtonHeight,
                  backgroundColor: color.value === 'off' ? '#f0f0f0' : color.value,
                  borderColor: selectedColor === color.value ? '#000' : '#ddd',
                  borderWidth: selectedColor === color.value ? 3 : 1,
                },
              ]}
              onPress={() => handleSetColor(color.value)}
              disabled={loading}
            >
              <Text style={styles.colorLabel}>{color.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Brightness Control */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Brightness</Text>
        <View style={styles.brightnessControl}>
          <Text style={[styles.brightnessValue, { color: textColor }]}>{brightness}%</Text>
          <View style={styles.sliderContainer}>
            {/* Simple brightness buttons since Slider might not be available */}
            <TouchableOpacity
              style={[styles.sliderButton, { backgroundColor: tintColor }]}
              onPress={() => setBrightness(Math.max(10, brightness - 10))}
            >
              <Text style={styles.sliderButtonText}>−</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sliderButton, { backgroundColor: tintColor }]}
              onPress={() => setBrightness(Math.min(255, brightness + 10))}
            >
              <Text style={styles.sliderButtonText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Timer Section */}
      <View style={styles.section}>
        <View style={styles.timerHeader}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>Timer</Text>
          <Switch
            value={timerEnabled}
            onValueChange={setTimerEnabled}
            trackColor={{ false: '#767577', true: '#81c784' }}
            thumbColor={timerEnabled ? '#4caf50' : '#f4f3f4'}
          />
        </View>

        {timerEnabled && (
          <View style={styles.timerInputs}>
            <View style={styles.timeInput}>
              <Text style={[styles.timeLabel, { color: textColor }]}>Turn On:</Text>
              <TouchableOpacity
                style={[styles.timeDisplay, { borderColor: tintColor }]}
                onPress={() => setTimerOnTime((timerOnTime === '08:00' ? '09:00' : '08:00'))}
              >
                <Text style={[styles.timeText, { color: textColor }]}>{timerOnTime}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timeInput}>
              <Text style={[styles.timeLabel, { color: textColor }]}>Turn Off:</Text>
              <TouchableOpacity
                style={[styles.timeDisplay, { borderColor: tintColor }]}
                onPress={() => setTimerOffTime((timerOffTime === '18:00' ? '19:00' : '18:00'))}
              >
                <Text style={[styles.timeText, { color: textColor }]}>{timerOffTime}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.setTimerButton, { backgroundColor: tintColor }]}
              onPress={handleSetTimer}
              disabled={loading}
            >
              <Text style={styles.setTimerButtonText}>
                {loading ? 'Setting...' : 'Set Timer'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {ledStatus?.timer_enabled && (
        <Text style={[styles.timerActiveText, { color: '#4caf50' }]}>
          ✓ Timer Active: {ledStatus.turn_on_at} - {ledStatus.turn_off_at}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
  },
  statusBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusDetail: {
    fontSize: 14,
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  colorButton: {
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorLabel: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  brightnessControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brightnessValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sliderContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sliderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  sliderButtonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerInputs: {
    marginTop: 12,
  },
  timeInput: {
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 14,
    marginBottom: 6,
  },
  timeDisplay: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  setTimerButton: {
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 12,
  },
  setTimerButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  timerActiveText: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
  },
});
