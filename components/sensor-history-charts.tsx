import { colorSchemes } from '@/constants/colors';
import { useTheme } from '@/hooks/theme-context';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { getApiPath } from '../app/api';

const LOGS_API_BASE = getApiPath('api/logs');
const SCREEN_WIDTH = Dimensions.get('window').width;

interface LogEntry {
  log_id: number;
  temperature: number | null;
  humidity: number | null;
  timestamp: string;
}

type TimeRange = 'day' | 'week' | 'month';

interface ChartStats {
  avgTemp: number;
  maxTemp: number;
  minTemp: number;
  avgHumidity: number;
  maxHumidity: number;
  minHumidity: number;
}

export function SensorHistoryCharts() {
  const { theme } = useTheme();
  const colors = colorSchemes[theme];
  
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [readings, setReadings] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<ChartStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get hours to fetch based on time range
  const getHoursForRange = (range: TimeRange): number => {
    switch (range) {
      case 'day':
        return 24;
      case 'week':
        return 24 * 7;
      case 'month':
        return 24 * 30;
      default:
        return 24;
    }
  };

  // Fetch readings for selected time range
  const fetchReadings = useCallback(async (range: TimeRange) => {
    try {
      setLoading(true);
      setError(null);
      
      const hours = getHoursForRange(range);
      const limit = range === 'day' ? 48 : range === 'week' ? 168 : 360;
      
      const response = await fetch(`${LOGS_API_BASE}/?limit=${limit}&ordering=-timestamp`);
      
      if (response.ok) {
        const data = await response.json();
        const allReadings = data.results ? data.results : Array.isArray(data) ? data : [];
        
        // Filter for the selected time range
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
        
        const filteredReadings = allReadings.filter((r: LogEntry) => {
          const readingTime = new Date(r.timestamp);
          return readingTime >= cutoffTime;
        }).reverse(); // Reverse to get chronological order
        
        setReadings(filteredReadings);
        calculateStats(filteredReadings);
      } else {
        setError('Failed to fetch sensor data');
        setReadings([]);
      }
    } catch (err) {
      console.error('Error fetching readings:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate statistics
  const calculateStats = useCallback((data: LogEntry[]) => {
    const validTempReadings = data.filter(r => r.temperature !== null && r.temperature !== undefined);
    const validHumidityReadings = data.filter(r => r.humidity !== null && r.humidity !== undefined);
    
    if (validTempReadings.length === 0 || validHumidityReadings.length === 0) {
      setStats(null);
      return;
    }

    const temps = validTempReadings.map(r => r.temperature as number);
    const humidities = validHumidityReadings.map(r => r.humidity as number);

    setStats({
      avgTemp: temps.reduce((a, b) => a + b, 0) / temps.length,
      maxTemp: Math.max(...temps),
      minTemp: Math.min(...temps),
      avgHumidity: humidities.reduce((a, b) => a + b, 0) / humidities.length,
      maxHumidity: Math.max(...humidities),
      minHumidity: Math.min(...humidities),
    });
  }, []);

  // Load data when time range changes
  useEffect(() => {
    fetchReadings(timeRange);
  }, [timeRange, fetchReadings]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchReadings(timeRange);
    } finally {
      setRefreshing(false);
    }
  }, [fetchReadings, timeRange]);

  // Format time for display
  const formatTime = (timestamp: string, range: TimeRange): string => {
    try {
      const date = new Date(timestamp);
      if (range === 'day') {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      } else if (range === 'week') {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch {
      return timestamp;
    }
  };

  // Find min and max for scaling
  const tempMinValue = readings.length > 0 
    ? Math.min(...readings.filter(r => r.temperature !== null).map(r => r.temperature as number))
    : 0;
  const tempMaxValue = readings.length > 0
    ? Math.max(...readings.filter(r => r.temperature !== null).map(r => r.temperature as number))
    : 100;
  const humidityMinValue = 0;
  const humidityMaxValue = 100;

  const tempRange = tempMaxValue - tempMinValue || 1;
  const humidityRange = humidityMaxValue - humidityMinValue || 1;

  // Generate SVG-like chart
  const generateLinePoints = (data: number[], minVal: number, maxVal: number): string => {
    if (data.length === 0) return '';
    
    const range = maxVal - minVal;
    const chartWidth = SCREEN_WIDTH - 64;
    const chartHeight = 150;
    const padding = 20;
    
    let path = '';
    data.forEach((value, index) => {
      const x = (index / (data.length - 1 || 1)) * (chartWidth - 2 * padding) + padding;
      const normalizedValue = (value - minVal) / (range || 1);
      const y = chartHeight - (normalizedValue * (chartHeight - 2 * padding)) - padding;
      
      if (index === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    return path;
  };

  // Custom chart rendering
  const Chart = ({ 
    data, 
    label, 
    color, 
    minVal, 
    maxVal, 
    unit 
  }: {
    data: number[];
    label: string;
    color: string;
    minVal: number;
    maxVal: number;
    unit: string;
  }) => {
    return (
      <View style={[styles.chartContainer, { borderColor: colors.cardBorder }]}>
        <Text style={[styles.chartLabel, { color: colors.tint }]}>{label}</Text>
        <View style={styles.chartWrapper}>
          <View style={styles.yAxisLabels}>
            <Text style={[styles.yLabel, { color: colors.icon }]}>{maxVal.toFixed(1)}°</Text>
            <Text style={[styles.yLabel, { color: colors.icon }]}>{((minVal + maxVal) / 2).toFixed(1)}°</Text>
            <Text style={[styles.yLabel, { color: colors.icon }]}>{minVal.toFixed(1)}°</Text>
          </View>
          <View style={[styles.chartArea, { backgroundColor: `${color}08` }]}>
            <View style={styles.gridLines}>
              {[0, 1, 2].map((i) => (
                <View 
                  key={i}
                  style={[
                    styles.gridLine,
                    { borderColor: colors.chartGridColor }
                  ]}
                />
              ))}
            </View>
            
            {/* Simple line chart representation */}
            {data.length > 0 && (
              <View style={styles.dataPoints}>
                {data.map((value, index) => {
                  const range = maxVal - minVal || 1;
                  const normalizedValue = (value - minVal) / range;
                  const heightPercent = normalizedValue * 100;
                  
                  return (
                    <View
                      key={index}
                      style={[
                        styles.dataBar,
                        {
                          height: `${Math.max(heightPercent, 5)}%`,
                          backgroundColor: color,
                          opacity: 0.7,
                        }
                      ]}
                    />
                  );
                })}
              </View>
            )}
          </View>
        </View>

        {/* Time labels */}
        <View style={styles.xAxisLabels}>
          {data.length > 0 && (
            <>
              <Text style={[styles.xLabel, { color: colors.icon }]}>
                {formatTime(readings[0]?.timestamp || '', timeRange)}
              </Text>
              <Text style={[styles.xLabel, { color: colors.icon }]}>
                {formatTime(readings[Math.floor(readings.length / 2)]?.timestamp || '', timeRange)}
              </Text>
              <Text style={[styles.xLabel, { color: colors.icon }]}>
                {formatTime(readings[readings.length - 1]?.timestamp || '', timeRange)}
              </Text>
            </>
          )}
        </View>
      </View>
    );
  };

  const tempData = readings
    .filter(r => r.temperature !== null)
    .map(r => r.temperature as number);
  
  const humidityData = readings
    .filter(r => r.humidity !== null)
    .map(r => r.humidity as number);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.title, { color: colors.text }]}>📊 Sensor History Charts</Text>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        {(['day', 'week', 'month'] as const).map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              {
                backgroundColor: timeRange === range ? colors.tint : colors.card,
                borderColor: colors.cardBorder,
              }
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text
              style={[
                styles.timeRangeText,
                { color: timeRange === range ? colors.background : colors.text }
              ]}
            >
              {range === 'day' ? '24H' : range === 'week' ? '7D' : '30D'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && (
        <View style={[styles.errorBox, { borderColor: colors.error }]}>
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Loading charts...</Text>
        </View>
      ) : readings.length === 0 ? (
        <View style={[styles.emptyContainer, { borderColor: colors.cardBorder }]}>
          <Ionicons name="pulse-outline" size={48} color={colors.icon} />
          <Text style={[styles.emptyText, { color: colors.text }]}>No sensor data available</Text>
          <Text style={[styles.emptySubtext, { color: colors.icon }]}>
            Data will appear once your sensors start recording
          </Text>
        </View>
      ) : (
        <>
          {/* Temperature Chart */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Chart
              data={tempData}
              label="Temperature Trend"
              color="#FF6B6B"
              minVal={Math.max(tempMinValue - 2, 0)}
              maxVal={Math.min(tempMaxValue + 2, 60)}
              unit="°C"
            />
          </View>

          {/* Humidity Chart */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Chart
              data={humidityData}
              label="Humidity Trend"
              color="#4ECDC4"
              minVal={0}
              maxVal={100}
              unit="%"
            />
          </View>

          {/* Statistics */}
          {stats && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.tint, marginBottom: 16 }]}>Statistics</Text>
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Ionicons name="thermometer-outline" size={20} color="#FF6B6B" />
                  <Text style={[styles.statLabel, { color: colors.text, marginTop: 8 }]}>Temperature</Text>
                  <Text style={[styles.statValue, { color: '#FF6B6B' }]}>
                    {stats.avgTemp.toFixed(1)}°C
                  </Text>
                  <Text style={[styles.statRange, { color: colors.icon, fontSize: 10 }]}>
                    {stats.minTemp.toFixed(1)}° - {stats.maxTemp.toFixed(1)}°
                  </Text>
                </View>

                <View style={styles.statBox}>
                  <Ionicons name="water-outline" size={20} color="#4ECDC4" />
                  <Text style={[styles.statLabel, { color: colors.text, marginTop: 8 }]}>Humidity</Text>
                  <Text style={[styles.statValue, { color: '#4ECDC4' }]}>
                    {stats.avgHumidity.toFixed(1)}%
                  </Text>
                  <Text style={[styles.statRange, { color: colors.icon, fontSize: 10 }]}>
                    {stats.minHumidity.toFixed(1)}% - {stats.maxHumidity.toFixed(1)}%
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Recent Data Table */}
          {readings.length > 0 && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.tint, marginBottom: 12 }]}>Recent Data</Text>
              
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { color: colors.icon, flex: 1 }]}>Time</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.icon, flex: 1 }]}>Temp</Text>
                <Text style={[styles.tableHeaderCell, { color: colors.icon, flex: 1 }]}>Humidity</Text>
              </View>

              {readings.slice(-8).reverse().map((reading, index) => (
                <View
                  key={reading.log_id || index}
                  style={[
                    styles.tableRow,
                    { borderColor: colors.cardBorder }
                  ]}
                >
                  <Text style={[styles.tableCell, { color: colors.text, flex: 1 }]}>
                    {formatTime(reading.timestamp, timeRange)}
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.text, flex: 1 }]}>
                    {reading.temperature?.toFixed(1) ?? 'N/A'}°C
                  </Text>
                  <Text style={[styles.tableCell, { color: colors.text, flex: 1 }]}>
                    {reading.humidity?.toFixed(1) ?? 'N/A'}%
                  </Text>
                </View>
              ))}
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
  timeRangeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
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
  emptyContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginVertical: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  chartContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  chartLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  chartWrapper: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingRight: 8,
    width: 40,
  },
  yLabel: {
    fontSize: 10,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    height: 150,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLines: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    borderTopWidth: 1,
    opacity: 0.3,
  },
  dataPoints: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  dataBar: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 2,
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  xLabel: {
    fontSize: 10,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  statRange: {
    marginTop: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCell: {
    fontSize: 11,
    fontWeight: '600',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 12,
  },
});
