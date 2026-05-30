import { colorSchemes } from '@/constants/colors';
import { useTheme } from '@/hooks/theme-context';
import { Ionicons } from '@expo/vector-icons';
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

const LOGS_API_BASE = getApiPath('api/logs');

interface LogEntry {
  log_id: number;
  power_solar: number | null;
  current_solar: number | null;
  timestamp: string;
}

interface SolarStats {
  currentPower: number;
  averagePower: number;
  maxPower: number;
  minPower: number;
  totalReadings: number;
}

export function SolarBatteryMonitoring() {
  const { theme } = useTheme();
  const colors = colorSchemes[theme];
  
  const [currentReading, setCurrentReading] = useState<LogEntry | null>(null);
  const [stats, setStats] = useState<SolarStats | null>(null);
  const [recentReadings, setRecentReadings] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch latest solar reading
  const fetchLatestReading = useCallback(async () => {
    try {
      const response = await fetch(`${LOGS_API_BASE}/latest/`);
      if (response.ok) {
        const data = await response.json();
        setCurrentReading(data);
        setError(null);
      } else if (response.status !== 404) {
        setError('Failed to fetch solar reading');
      }
    } catch (err) {
      console.error('Error fetching solar reading:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  // Calculate solar statistics
  const calculateStats = useCallback((readings: LogEntry[]) => {
    const validReadings = readings.filter(r => r.power_solar !== null && r.power_solar !== undefined);
    
    if (validReadings.length === 0) {
      setStats(null);
      return;
    }

    const powers = validReadings.map(r => r.power_solar as number);
    const average = powers.reduce((a, b) => a + b, 0) / powers.length;
    const max = Math.max(...powers);
    const min = Math.min(...powers);

    setStats({
      currentPower: powers[0] || 0,
      averagePower: average,
      maxPower: max,
      minPower: min,
      totalReadings: validReadings.length,
    });
  }, []);

  // Fetch recent readings
  const fetchRecentReadings = useCallback(async () => {
    try {
      const response = await fetch(`${LOGS_API_BASE}/?limit=24&ordering=-timestamp`);
      if (response.ok) {
        const data = await response.json();
        const readings = data.results ? data.results : Array.isArray(data) ? data : [];
        setRecentReadings(readings.slice(0, 24));
        calculateStats(readings.slice(0, 24));
      }
    } catch (err) {
      console.error('Error fetching recent readings:', err);
    }
  }, [calculateStats]);

  // Load all solar data
  const loadSolarData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([fetchLatestReading(), fetchRecentReadings()]);
    } finally {
      setLoading(false);
    }
  }, [fetchLatestReading, fetchRecentReadings]);

  // Initial load and polling
  useEffect(() => {
    loadSolarData();
    const interval = setInterval(loadSolarData, 15000); // Poll every 15 seconds
    return () => clearInterval(interval);
  }, [loadSolarData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadSolarData();
    } finally {
      setRefreshing(false);
    }
  }, [loadSolarData]);

  // Format time
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
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

  const isLowPower = currentReading?.power_solar ? currentReading.power_solar < 100 : false;
  const isNoPower = currentReading?.power_solar ? currentReading.power_solar === 0 : true;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.title, { color: colors.text }]}>☀️ Solar Battery Monitor</Text>

      {error && (
        <View style={[styles.errorBox, { borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {loading && !currentReading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading solar data...</Text>
        </View>
      ) : (
        <>
          {/* Current Solar Power Reading */}
          {currentReading && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: colors.tint }]}>Current Power</Text>
                <View style={[styles.statusBadge, { 
                  backgroundColor: isNoPower ? colors.error : isLowPower ? colors.warning : colors.success 
                }]}>
                  <Text style={[styles.statusText, { color: '#fff' }]}>
                    {isNoPower ? 'OFFLINE' : isLowPower ? 'LOW' : 'ACTIVE'}
                  </Text>
                </View>
              </View>

              <View style={styles.readingSection}>
                <Text style={[styles.bigNumber, { color: colors.solar }]}>
                  {currentReading.power_solar?.toFixed(2) ?? 'N/A'} W
                </Text>
                <Text style={[styles.subText, { color: colors.text }]}>
                  Current: {currentReading.current_solar?.toFixed(3) ?? 'N/A'} A
                </Text>
                <Text style={[styles.timestamp, { color: colors.icon }]}>
                  {formatDate(currentReading.timestamp)}
                </Text>
              </View>
            </View>
          )}

          {/* Solar Statistics */}
          {stats && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.tint, marginBottom: 15 }]}>24H Statistics</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Ionicons name="arrow-up-circle-outline" size={20} color={colors.solar} />
                  <Text style={[styles.statValue, { color: colors.solar }]}>
                    {stats.maxPower.toFixed(2)} W
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Peak</Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="arrow-down-circle-outline" size={20} color={colors.error} />
                  <Text style={[styles.statValue, { color: colors.error }]}>
                    {stats.minPower.toFixed(2)} W
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Min</Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="calculator-outline" size={20} color={colors.battery} />
                  <Text style={[styles.statValue, { color: colors.battery }]}>
                    {stats.averagePower.toFixed(2)} W
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Avg</Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="layers-outline" size={20} color={colors.icon} />
                  <Text style={[styles.statValue, { color: colors.icon }]}>
                    {stats.totalReadings}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.text }]}>Readings</Text>
                </View>
              </View>
            </View>
          )}

          {/* Recent Readings List */}
          {recentReadings.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.tint, marginBottom: 15 }]}>Recent Readings</Text>
              
              <View style={styles.readingsList}>
                {recentReadings.slice(0, 8).map((reading, index) => (
                  <View 
                    key={reading.log_id || index}
                    style={[
                      styles.readingItem,
                      { borderColor: colors.cardBorder },
                      index !== recentReadings.length - 1 && styles.readingItemBorder
                    ]}
                  >
                    <View style={styles.readingTime}>
                      <Text style={[styles.readingTimestamp, { color: colors.icon }]}>
                        {formatTime(reading.timestamp)}
                      </Text>
                    </View>
                    <View style={styles.readingValue}>
                      <Text style={[styles.readingPower, { color: colors.solar }]}>
                        {reading.power_solar?.toFixed(2) ?? 'N/A'} W
                      </Text>
                      <Text style={[styles.readingCurrent, { color: colors.text }]}>
                        {reading.current_solar?.toFixed(3) ?? 'N/A'} A
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      )}

      <View style={{ height: 40 }} />
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
    letterSpacing: 1,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loaderContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  readingSection: {
    alignItems: 'flex-start',
  },
  bigNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subText: {
    fontSize: 12,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  readingsList: {
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  readingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  readingItemBorder: {
    borderBottomWidth: 1,
  },
  readingTime: {
    flex: 1,
  },
  readingTimestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  readingValue: {
    alignItems: 'flex-end',
  },
  readingPower: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  readingCurrent: {
    fontSize: 11,
    marginTop: 2,
  },
});
