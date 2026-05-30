import { useThemeColor } from '@/hooks/use-theme-color';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { getApiPath } from '../app/api';

const SENSOR_API_BASE = getApiPath('api/sensors');

interface SensorReading {
  sensor_id: number;
  temperature: number;
  humidity: number;
  timestamp: string;
}

interface SensorAverages {
  average_temperature: number;
  average_humidity: number;
  readings_count: number;
}

export function SensorDisplay() {
  const [currentReading, setCurrentReading] = useState<SensorReading | null>(null);
  const [averages, setAverages] = useState<SensorAverages | null>(null);
  const [recentReadings, setRecentReadings] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({}, 'background');
  const tintColor = useThemeColor({}, 'tint');

  // Fetch latest sensor reading
  const fetchLatestReading = useCallback(async () => {
    try {
      const response = await fetch(`${SENSOR_API_BASE}/latest/`);
      if (response.ok) {
        const data = await response.json();
        setCurrentReading(data);
        setError(null);
      } else if (response.status !== 404) {
        setError('Failed to fetch sensor reading');
      }
    } catch (err) {
      console.error('Error fetching sensor reading:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Fetch average readings
  const fetchAverages = useCallback(async () => {
    try {
      const response = await fetch(`${SENSOR_API_BASE}/average/?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setAverages(data);
      }
    } catch (err) {
      console.error('Error fetching averages:', err);
    }
  }, []);

  // Fetch recent readings list
  const fetchRecentReadings = useCallback(async () => {
    try {
      const response = await fetch(`${SENSOR_API_BASE}/?limit=5&ordering=-timestamp`);
      if (response.ok) {
        const data = await response.json();
        // Handle both paginated and direct response
        const readings = data.results ? data.results : Array.isArray(data) ? data : [];
        setRecentReadings(readings.slice(0, 5));
      }
    } catch (err) {
      console.error('Error fetching recent readings:', err);
    }
  }, []);

  // Load all sensor data
  const loadSensorData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchLatestReading(), fetchAverages(), fetchRecentReadings()]);
    } finally {
      setLoading(false);
    }
  }, [fetchLatestReading, fetchAverages, fetchRecentReadings]);

  // Initial load and polling
  useEffect(() => {
    loadSensorData();
    // Poll for new data every 10 seconds
    const interval = setInterval(loadSensorData, 10000);
    return () => clearInterval(interval);
  }, [loadSensorData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSensorData();
    } finally {
      setRefreshing(false);
    }
  }, [loadSensorData]);

  // Format timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  // Format date
  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.title, { color: textColor }]}>DHT11 Sensor</Text>

      {error && (
        <View style={[styles.errorBox, { borderColor: '#ff6b6b' }]}>
          <Text style={[styles.errorText, { color: '#ff6b6b' }]}>{error}</Text>
        </View>
      )}

      {loading && !currentReading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tintColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading sensor data...</Text>
        </View>
      )}

      {/* Current Reading Card */}
      {currentReading && (
        <View style={[styles.card, { borderColor: tintColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Current Reading</Text>

          <View style={styles.readingGrid}>
            <View style={[styles.readingBox, { borderColor: tintColor }]}>
              <Text style={[styles.readingLabel, { color: textColor }]}>Temperature</Text>
              <Text style={[styles.readingValue, { color: '#ff6b6b' }]}>
                {currentReading.temperature?.toFixed(1)}°C
              </Text>
              <Text style={[styles.readingUnit, { color: textColor }]}>Celsius</Text>
            </View>

            <View style={[styles.readingBox, { borderColor: tintColor }]}>
              <Text style={[styles.readingLabel, { color: textColor }]}>Humidity</Text>
              <Text style={[styles.readingValue, { color: '#4dabf7' }]}>
                {currentReading.humidity?.toFixed(1)}%
              </Text>
              <Text style={[styles.readingUnit, { color: textColor }]}>RH</Text>
            </View>
          </View>

          <Text style={[styles.timestamp, { color: textColor }]}>
            Last updated: {formatDate(currentReading.timestamp)}
          </Text>
        </View>
      )}

      {/* Average Readings Card */}
      {averages && (
        <View style={[styles.card, { borderColor: tintColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>
            Average (Last {averages.readings_count} readings)
          </Text>

          <View style={styles.readingGrid}>
            <View style={[styles.readingBox, { borderColor: tintColor }]}>
              <Text style={[styles.readingLabel, { color: textColor }]}>Avg Temp</Text>
              <Text style={[styles.readingValue, { color: '#ff6b6b' }]}>
                {averages.average_temperature?.toFixed(1)}°C
              </Text>
            </View>

            <View style={[styles.readingBox, { borderColor: tintColor }]}>
              <Text style={[styles.readingLabel, { color: textColor }]}>Avg Humidity</Text>
              <Text style={[styles.readingValue, { color: '#4dabf7' }]}>
                {averages.average_humidity?.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Recent Readings List */}
      {recentReadings.length > 0 && (
        <View style={[styles.card, { borderColor: tintColor }]}>
          <Text style={[styles.cardTitle, { color: textColor }]}>Recent Readings</Text>

          {recentReadings.map((reading, index) => (
            <View
              key={reading.sensor_id}
              style={[
                styles.readingItem,
                {
                  borderBottomColor: textColor,
                  borderBottomWidth: index < recentReadings.length - 1 ? 1 : 0,
                },
              ]}
            >
              <View style={styles.readingItemTime}>
                <Text style={[styles.readingItemTimestamp, { color: textColor }]}>
                  {formatTime(reading.timestamp)}
                </Text>
              </View>

              <View style={styles.readingItemValues}>
                <Text
                  style={[
                    styles.readingItemValue,
                    { color: '#ff6b6b' },
                  ]}
                >
                  {reading.temperature?.toFixed(1)}°C
                </Text>
                <Text
                  style={[
                    styles.readingItemValue,
                    { color: '#4dabf7' },
                  ]}
                >
                  {reading.humidity?.toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* No Data Message */}
      {!loading && !currentReading && (
        <View style={styles.emptyBox}>
          <Text style={[styles.emptyText, { color: textColor }]}>
            No sensor data available yet
          </Text>
          <Text style={[styles.emptySubtext, { color: textColor }]}>
            Make sure the DHT11 sensor is connected and recording data
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: textColor }]}>
          Auto-refresh every 10 seconds
        </Text>
      </View>
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
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    marginTop: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  readingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  readingBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  readingLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  readingValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  readingUnit: {
    fontSize: 10,
  },
  timestamp: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  readingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  readingItemTime: {
    flex: 1,
  },
  readingItemTimestamp: {
    fontSize: 12,
  },
  readingItemValues: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 20,
  },
  readingItemValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
  },
});
