import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { getLogsApiUrl } from './api';

type TelemetryLog = {
  log_id: number;
  device: number;
  temperature: number | null;
  humidity: number | null;
  current_load: number | null;
  power_load: number | null;
  current_solar: number | null;
  power_solar: number | null;
  timestamp: string | null;
};

type HouseLog = {
  id: number;
  room: string;
  status: string;
  timestamp: string | null;
};

type DailyPowerData = {
  dateLabel: string;
  dateKey: string;
  avgPower: number;
  peakPower: number;
  readings: number;
};

type AlertItem = {
  id: string;
  title: string;
  message: string;
  severity: "warning" | "critical" | "info";
  timestamp: string | null;
};

const TEMP_HIGH_C = 30;
const HUMIDITY_LOW = 30;
const HUMIDITY_HIGH = 70;
const LOAD_POWER_HIGH_W = 1000;
const SOLAR_LOW_W = 10;

export default function HomeScreen() {
  const router = useRouter();

  const userName = "User";
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [houseLogs, setHouseLogs] = useState<HouseLog[]>([]);
  const [dailyPowerData, setDailyPowerData] = useState<DailyPowerData[]>([]);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const latestLog = telemetryLogs[0];
  const alertHistory = useMemo(() => buildAlertHistory(telemetryLogs), [telemetryLogs]);
  const activeAlerts = useMemo(() => buildAlertsForLog(latestLog), [latestLog]);
  const solarStatus = useMemo(() => getSolarStatus(latestLog), [latestLog]);
  const todayEnergy = dailyPowerData[dailyPowerData.length - 1];

  const getApiUrl = () => {
    return getLogsApiUrl();
  };

  const buildHouseLogs = (latest: TelemetryLog | undefined, logs: TelemetryLog[]): HouseLog[] => {
    if (!latest) {
      return [
        { id: 1, room: "Temperature", status: "No data", timestamp: null },
        { id: 2, room: "Load Power", status: "No data", timestamp: null },
        { id: 3, room: "Solar Power", status: "No data", timestamp: null },
        { id: 4, room: "Device Status", status: "Offline", timestamp: null },
      ];
    }

    const temp = latest.temperature;
    const powerLoad = latest.power_load ?? latest.current_load ?? null;
    const powerSolar = latest.power_solar ?? latest.current_solar ?? null;

    const tempStatus = temp === null || temp === undefined ? "No data" : `${formatValue(temp)} C`;
    const loadStatus = powerLoad === null || powerLoad === undefined ? "No data" : `${formatValue(powerLoad)} W`;
    const solarStatus = powerSolar === null || powerSolar === undefined ? "No data" : `${formatValue(powerSolar)} W`;

    let deviceStatus = "Offline";
    if (latest.timestamp) {
      const diffMs = Date.now() - new Date(latest.timestamp).getTime();
      deviceStatus = diffMs < 2 * 60 * 1000
        ? `Online (updated ${formatTimestamp(latest.timestamp)})`
        : `Offline (last ${formatTimestamp(latest.timestamp)})`;
    }

    return [
      { id: 1, room: "Temperature", status: tempStatus, timestamp: latest.timestamp },
      { id: 2, room: "Load Power", status: loadStatus, timestamp: latest.timestamp },
      { id: 3, room: "Solar Power", status: solarStatus, timestamp: latest.timestamp },
      { id: 4, room: "Device Status", status: deviceStatus, timestamp: latest.timestamp },
    ];
  };

  const computeDailyPowerData = (logs: TelemetryLog[]): DailyPowerData[] => {
    const byDate: Record<string, { sum: number; count: number; peak: number }> = {};

    logs.forEach((log) => {
      if (!log.timestamp || log.power_load === null) {
        return;
      }

      const dayKey = new Date(log.timestamp).toISOString().slice(0, 10);
      const value = Number(log.power_load);

      if (!byDate[dayKey]) {
        byDate[dayKey] = { sum: 0, count: 0, peak: 0 };
      }

      byDate[dayKey].sum += value;
      byDate[dayKey].count += 1;
      byDate[dayKey].peak = Math.max(byDate[dayKey].peak, value);
    });

    return Object.entries(byDate)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .map(([date, stats]) => ({
        dateKey: date,
        dateLabel: new Date(date).toLocaleDateString(undefined, { weekday: "short" }),
        avgPower: stats.count ? stats.sum / stats.count : 0,
        peakPower: stats.peak,
        readings: stats.count,
      }))
      .slice(-7);
  };

  function buildAlertsForLog(log: TelemetryLog | undefined): AlertItem[] {
    if (!log) {
      return [];
    }

    const alerts: AlertItem[] = [];
    const loadPower = log.power_load ?? null;

    if (log.temperature !== null && log.temperature > TEMP_HIGH_C) {
      alerts.push({
        id: `temp-${log.log_id}`,
        title: "High temperature",
        message: `${formatValue(log.temperature)} C is above the ${TEMP_HIGH_C} C limit.`,
        severity: "critical",
        timestamp: log.timestamp,
      });
    }

    if (log.humidity !== null && (log.humidity < HUMIDITY_LOW || log.humidity > HUMIDITY_HIGH)) {
      alerts.push({
        id: `humidity-${log.log_id}`,
        title: "Humidity alert",
        message: `${formatValue(log.humidity)}% is outside the ${HUMIDITY_LOW}-${HUMIDITY_HIGH}% range.`,
        severity: "warning",
        timestamp: log.timestamp,
      });
    }

    if (loadPower !== null && loadPower > LOAD_POWER_HIGH_W) {
      alerts.push({
        id: `load-${log.log_id}`,
        title: "Power load warning",
        message: `${formatValue(loadPower)} W is above the ${LOAD_POWER_HIGH_W} W limit.`,
        severity: "critical",
        timestamp: log.timestamp,
      });
    }

    return alerts;
  }

  function buildAlertHistory(logs: TelemetryLog[]): AlertItem[] {
    return logs
      .flatMap((log) => buildAlertsForLog(log))
      .slice(0, 8);
  }

  function getSolarStatus(log: TelemetryLog | undefined) {
    const powerSolar = log?.power_solar ?? null;

    if (powerSolar === null || powerSolar === undefined) {
      return {
        label: "No solar data",
        detail: "Waiting for solar readings.",
        color: "#AAA",
      };
    }

    if (powerSolar <= 0) {
      return {
        label: "Not producing",
        detail: "Solar output is currently 0 W.",
        color: "#ff6b6b",
      };
    }

    if (powerSolar < SOLAR_LOW_W) {
      return {
        label: "Low production",
        detail: `Solar output is below ${SOLAR_LOW_W} W.`,
        color: "#FFD700",
      };
    }

    return {
      label: "Producing",
      detail: `${formatValue(powerSolar)} W is being generated.`,
      color: "#4CAF50",
    };
  }

  const fetchLatestData = async () => {
    try {
      setApiError(null);
      const headers: any = { 'Accept': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(getApiUrl(), { headers });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const json = await response.json();

      if (Array.isArray(json)) {
        setTelemetryLogs(json);
      }
    } catch (error: any) {
      const message =
        error?.message ||
        "Backend connection error. Check that the Django server is running and that your device can reach the API URL.";
      setApiError(message);
      console.error(message, error);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }
      setAuthToken(token);
      await fetchLatestData();
      const interval = setInterval(fetchLatestData, 10000);
      return () => clearInterval(interval);
    };

    init();
  }, []);

  useEffect(() => {
    setHouseLogs(buildHouseLogs(latestLog, telemetryLogs));
    setDailyPowerData(computeDailyPowerData(telemetryLogs));
  }, [telemetryLogs, latestLog]);

  function formatValue(value: number | null | undefined, fallback = "--") {
    return value === null || value === undefined ? fallback : Number(value).toFixed(2);
  }

  function formatTimestamp(timestamp: string | null | undefined) {
    if (!timestamp) {
      return "--";
    }

    return new Date(timestamp).toLocaleString();
  }

  const SensorBox = ({ title, icon, value, unit }: any) => (
    <TouchableOpacity
      style={styles.gridBox}
      onPress={() => setSelectedSensor({ title, value, unit })}
    >
      <Ionicons name={icon} size={32} color="#FFD700" />
      <Text style={styles.gridText}>{title.toUpperCase()}</Text>
      <Text style={styles.liveValue}>{value}{unit}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.header}>
        <Text style={styles.brandText}>AURA</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.welcomeRow}>
          <Text style={styles.welcomeTitle}>Welcome, </Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>

        <View style={styles.divider} />

        <View style={[
          styles.statusBanner,
          { borderColor: activeAlerts.length > 0 ? "#ff6b6b" : "#4CAF50" },
        ]}>
          <Ionicons
            name={activeAlerts.length > 0 ? "warning-outline" : "checkmark-circle-outline"}
            size={22}
            color={activeAlerts.length > 0 ? "#ff6b6b" : "#4CAF50"}
          />
          <View style={styles.statusBannerText}>
            <Text style={styles.statusBannerTitle}>
              {activeAlerts.length > 0 ? `${activeAlerts.length} warning${activeAlerts.length > 1 ? "s" : ""} detected` : "All readings normal"}
            </Text>
            <Text style={styles.statusBannerDetail}>
              {activeAlerts[0]?.message ?? "Latest sensor readings are within the normal range."}
            </Text>
          </View>
        </View>

        <View style={styles.grid}>
          <SensorBox
            title="Temperature"
            icon="thermometer-outline"
            value={formatValue(latestLog?.temperature)}
            unit=" C"
          />

          <SensorBox
            title="Humidity"
            icon="water-outline"
            value={formatValue(latestLog?.humidity)}
            unit="%"
          />

          <SensorBox
            title="Load Power"
            icon="flash-outline"
            value={formatValue(latestLog?.power_load)}
            unit=" W"
          />

          <SensorBox
            title="Solar Power"
            icon="sunny-outline"
            value={formatValue(latestLog?.power_solar)}
            unit=" W"
          />
        </View>

        <Text style={styles.sectionTitle}>SOLAR STATUS</Text>
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsLabel}>SOLAR PRODUCTION</Text>
            <Text style={[styles.statsValue, { color: solarStatus.color }]}>{solarStatus.label}</Text>
          </View>
          <Text style={styles.updatedText}>{solarStatus.detail}</Text>
        </View>

        <Text style={styles.sectionTitle}>ALERT HISTORY</Text>
        <View style={styles.statsCard}>
          {alertHistory.length > 0 ? (
            alertHistory.map((alert) => (
              <View key={alert.id} style={styles.alertItem}>
                <Ionicons
                  name={alert.severity === "critical" ? "alert-circle-outline" : "warning-outline"}
                  size={20}
                  color={alert.severity === "critical" ? "#ff6b6b" : "#FFD700"}
                />
                <View style={styles.alertText}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.activityTime}>{formatTimestamp(alert.timestamp)}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No alerts detected.</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>LATEST CURRENTS</Text>
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsLabel}>LOAD CURRENT</Text>
            <Text style={styles.statsValue}>{formatValue(latestLog?.current_load)} A</Text>
          </View>
          <View style={styles.statsHeader}>
            <Text style={styles.statsLabel}>SOLAR CURRENT</Text>
            <Text style={styles.statsValue}>{formatValue(latestLog?.current_solar)} A</Text>
          </View>
          <Text style={styles.updatedText}>Last update: {formatTimestamp(latestLog?.timestamp)}</Text>
        </View>

        <Text style={styles.sectionTitle}>HOUSE ACTIVITY</Text>
        <View style={styles.statsCard}>
          {houseLogs.length > 0 ? (
            houseLogs.map((log) => (
              <View key={log.id} style={styles.activityItem}>
                <View>
                  <Text style={styles.activityRoom}>{log.room}</Text>
                  <Text style={styles.activityStatus}>{log.status}</Text>
                </View>
                <Text style={styles.activityTime}>{formatTimestamp(log.timestamp)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Waiting for house activity logs...</Text>
          )}
        </View>

        <Text style={styles.sectionTitle}>DAILY POWER USAGE</Text>
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={[styles.statsLabel, { color: "#FFF" }]}>Average daily load usage</Text>
            <Text style={styles.statsValue}>{dailyPowerData.length} days</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.statsLabel}>TODAY AVG</Text>
              <Text style={styles.statsValue}>{formatValue(todayEnergy?.avgPower)} W</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.statsLabel}>TODAY PEAK</Text>
              <Text style={styles.statsValue}>{formatValue(todayEnergy?.peakPower)} W</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.statsLabel}>READINGS</Text>
              <Text style={styles.statsValue}>{todayEnergy?.readings ?? 0}</Text>
            </View>
          </View>

          <View style={styles.powerChartContainer}>
            {dailyPowerData.length > 0 ? (
              dailyPowerData.map((day) => {
                const height = Math.max(15, (day.avgPower / Math.max(...dailyPowerData.map((item) => item.avgPower), 1)) * 100);

                return (
                  <View key={day.dateLabel} style={styles.powerBarColumn}>
                    <View style={[styles.powerBar, { height }]} />
                    <Text style={styles.barLabel}>{day.dateLabel}</Text>
                    <Text style={styles.usageValue}>{Number(day.avgPower).toFixed(0)} W</Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.emptyText}>No power usage data available yet.</Text>
            )}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={selectedSensor !== null}
        onRequestClose={() => setSelectedSensor(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedSensor(null)}
            >
              <Ionicons name="close" size={30} color="#FFD700" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{selectedSensor?.title}</Text>
            <View style={styles.modalValueContainer}>
              <Text style={styles.modalValue}>{selectedSensor?.value}</Text>
              <Text style={styles.modalUnit}>{selectedSensor?.unit}</Text>
            </View>
            <Text style={styles.modalStatus}>Live data</Text>

            <View style={styles.modalDivider} />
            <Text style={styles.modalDescription}>
              Latest reading being transmitted.
            </Text>
          </View>
        </View>
      </Modal>

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Dashboard")}>
          <Ionicons name="grid" size={24} color={activeTab === "Dashboard" ? "#FFD700" : "#555"} />
          <Text style={[styles.navText, { color: activeTab === "Dashboard" ? "#FFD700" : "#555" }]}>DASHBOARD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/iot-control")}
        >
          <Ionicons name="bulb-outline" size={24} color="#555" />
          <Text style={[styles.navText, { color: "#555" }]}>Led</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/rooms")}
        >
          <Ionicons name="business-outline" size={24} color="#555" />
          <Text style={[styles.navText, { color: "#555" }]}>ROOMS</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/settings")}
        >
          <Ionicons name="settings-outline" size={24} color="#555" />
          <Text style={[styles.navText, { color: "#555" }]}>SETTINGS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001f3f" },
  header: { paddingTop: Platform.OS === "ios" ? 60 : 40, alignItems: "center", paddingBottom: 10 },
  brandText: { fontSize: 22, color: "#FFD700", letterSpacing: 8, fontWeight: "400" },
  content: { paddingTop: 20, paddingHorizontal: 25 },
  welcomeRow: { flexDirection: "row", alignItems: "baseline" },
  welcomeTitle: { fontSize: 28, color: "#FFFFFF", fontWeight: "300" },
  userNameText: { fontSize: 28, color: "#FFD700", fontWeight: "300" },
  divider: { height: 1, backgroundColor: "#FFD700", width: 40, marginVertical: 20 },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
    backgroundColor: "rgba(255, 215, 0, 0.04)",
  },
  statusBannerText: { flex: 1 },
  statusBannerTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  statusBannerDetail: {
    color: "#AAA",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 20 },
  gridBox: {
    width: "48%",
    height: 120,
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "rgba(255, 215, 0, 0.02)",
  },
  gridText: { color: "#FFD700", fontSize: 10, marginTop: 8, letterSpacing: 1.5, fontWeight: "bold" },
  liveValue: { color: "#FFF", fontSize: 16, marginTop: 5, fontWeight: "300" },
  sectionTitle: { color: "#FFFFFF", fontSize: 12, letterSpacing: 3, marginBottom: 15, marginTop: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 31, 63, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#001f3f",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFD700",
    padding: 30,
    alignItems: "center",
  },
  closeButton: { alignSelf: "flex-end", marginBottom: 10 },
  modalTitle: { color: "#FFD700", fontSize: 20, letterSpacing: 4, marginBottom: 20 },
  modalValueContainer: { flexDirection: "row", alignItems: "baseline", marginVertical: 20 },
  modalValue: { color: "#FFF", fontSize: 60, fontWeight: "bold" },
  modalUnit: { color: "#FFD700", fontSize: 24, marginLeft: 5 },
  modalStatus: { color: "#4CAF50", fontSize: 12, letterSpacing: 1 },
  modalDivider: { height: 1, backgroundColor: "rgba(255, 215, 0, 0.3)", width: "100%", marginVertical: 20 },
  modalDescription: { color: "#AAA", textAlign: "center", fontSize: 14, lineHeight: 20 },
  statsCard: {
    width: "100%",
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    padding: 20,
    marginBottom: 18,
  },
  statsHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  statsFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  statsLabel: { color: "#888", fontSize: 10 },
  statsValue: { color: "#FFD700", fontSize: 16, fontWeight: "bold" },
  updatedText: { color: "#AAA", fontSize: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    gap: 10,
  },
  summaryItem: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.18)",
    borderRadius: 10,
    padding: 10,
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 215, 0, 0.1)",
  },
  alertText: { flex: 1 },
  alertTitle: {
    color: "#FFD700",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  alertMessage: {
    color: "#FFFFFF",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "rgba(255, 215, 0, 0.12)" },
  tableCell: { width: 98, color: "#FFF", fontSize: 11, paddingVertical: 10, paddingRight: 10 },
  tableHeaderCell: { color: "#FFD700", fontWeight: "bold" },
  emptyRow: { paddingVertical: 18 },
  emptyText: { color: "#AAA", fontSize: 12 },
  powerChartContainer: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", minHeight: 130 },
  powerBarColumn: { alignItems: "center", flex: 1, marginHorizontal: 4 },
  powerBar: { width: 16, backgroundColor: "#FFD700", borderRadius: 6 },
  usageValue: { color: "#FFF", fontSize: 10, marginTop: 6 },
  activityItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255, 215, 0, 0.1)" },
  activityRoom: { color: "#FFD700", fontSize: 14, letterSpacing: 1.2, fontWeight: "700" },
  activityStatus: { color: "#FFF", fontSize: 12, marginTop: 4 },
  activityTime: { color: "#AAA", fontSize: 10, marginTop: 2 },
  barLabel: { color: "#555", fontSize: 9, marginTop: 8 },
  navBar: {
    flexDirection: "row",
    backgroundColor: "#001a35",
    height: 90,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 215, 0, 0.3)",
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 25 : 10,
  },
  navItem: { alignItems: "center", flex: 1 },
  navText: { fontSize: 10, marginTop: 4, letterSpacing: 1, fontWeight: "500" },
});
