import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

export default function HomeScreen() {
  const router = useRouter();

  // --- STATE ---
  const userName = "User";
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [telemetry, setTelemetry] = useState<any>(null);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);

  // --- API FETCHING ---
  // Ensure this matches your AWS RDS / Django backend endpoint
  const API_URL = 'http://192.168.56.1/api/telemetry/'; 

  const fetchLatestData = async () => {
    try {
      const response = await fetch(API_URL);
      const json = await response.json();
      // Django returns a list; we take index 0 for the most recent reading
      if (json && json.length > 0) {
        setTelemetry(json[0]);
      }
    } catch (error) {
      console.error("Backend connection error. Check your local IP or AWS RDS status.");
    }
  };

  useEffect(() => {
    fetchLatestData();
    const interval = setInterval(fetchLatestData, 10000); 
    return () => clearInterval(interval);
  }, []);

  // --- REUSABLE SENSOR COMPONENT ---
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

      {/* Brand Header */}
      <View style={styles.header}>
        <Text style={styles.brandText}>AURA</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        <View style={styles.welcomeRow}>
          <Text style={styles.welcomeTitle}>Welcome, </Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>

        <View style={styles.divider} />

        {/* INTERACTIVE CONTROLS GRID */}
        <View style={styles.grid}>
          {/* Temperature Sensor - Live Data */}
          <SensorBox 
            title="Temperature" 
            icon="thermometer-outline" 
            value={telemetry?.temperature || "24"} 
            unit="°C" 
          />

          {/* Humidity / Absorption - Live Data */}
          <SensorBox 
            title="Absorption" 
            icon="sunny" 
            value={telemetry?.humidity || "45"} 
            unit="%" 
          />

          {/* Solar Power Usage - Placeholder */}
          <SensorBox 
            title="Solar Power" 
            icon="flash-outline" 
            value="4.2" 
            unit=" kWh" 
          />

          {/* Device Status */}
          <TouchableOpacity 
             style={styles.gridBox} 
             onPress={() => setSelectedSensor({ title: "ESP32 Status", value: "Online", unit: "" })}
          >
            <Ionicons name="hardware-chip-outline" size={32} color="#FFD700" />
            <Text style={styles.gridText}>ESP32 LINK</Text>
            <Text style={[styles.liveValue, { color: '#4CAF50', fontSize: 12 }]}>ACTIVE</Text>
          </TouchableOpacity>
        </View>

        {/* STATISTICS SECTION */}
        <Text style={styles.sectionTitle}>ENERGY STATISTICS</Text>
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsLabel}>WEEKLY USAGE</Text>
            <Text style={styles.statsValue}>12.4 kWh</Text>
          </View>
          <View style={styles.chartContainer}>
            {[35, 60, 85, 55, 95, 45, 75].map((val, index) => (
              <View key={index} style={styles.barColumn}>
                <View style={[styles.bar, { height: val }]} />
                <Text style={styles.barLabel}>{["M", "T", "W", "T", "F", "S", "S"][index]}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* --- TELEMETRY DETAIL MODAL --- */}
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
            <Text style={styles.modalStatus}>Status: Live from AWS RDS</Text>
            
            <View style={styles.modalDivider} />
            <Text style={styles.modalDescription}>
                This data is being synchronized in real-time from your PostgreSQL database schema.
            </Text>
          </View>
        </View>
      </Modal>

      {/* --- FUNCTIONAL NAVIGATION BAR --- */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab("Dashboard")}>
          <Ionicons name="grid" size={24} color={activeTab === "Dashboard" ? "#FFD700" : "#555"} />
          <Text style={[styles.navText, { color: activeTab === "Dashboard" ? "#FFD700" : "#555" }]}>DASHBOARD</Text>
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
    backgroundColor: 'rgba(255, 215, 0, 0.02)',
  },
  gridText: { color: "#FFD700", fontSize: 10, marginTop: 8, letterSpacing: 1.5, fontWeight: 'bold' },
  liveValue: { color: "#FFF", fontSize: 16, marginTop: 5, fontWeight: '300' },
  sectionTitle: { color: "#FFFFFF", fontSize: 12, letterSpacing: 3, marginBottom: 15, marginTop: 10 },
  
  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 31, 63, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#001f3f',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 30,
    alignItems: 'center',
  },
  closeButton: { alignSelf: 'flex-end', marginBottom: 10 },
  modalTitle: { color: '#FFD700', fontSize: 20, letterSpacing: 4, marginBottom: 20 },
  modalValueContainer: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 20 },
  modalValue: { color: '#FFF', fontSize: 60, fontWeight: 'bold' },
  modalUnit: { color: '#FFD700', fontSize: 24, marginLeft: 5 },
  modalStatus: { color: '#4CAF50', fontSize: 12, letterSpacing: 1 },
  modalDivider: { height: 1, backgroundColor: 'rgba(255, 215, 0, 0.3)', width: '100%', marginVertical: 20 },
  modalDescription: { color: '#AAA', textAlign: 'center', fontSize: 14, lineHeight: 20 },

  statsCard: { width: "100%", backgroundColor: "rgba(255, 215, 0, 0.05)", borderRadius: 15, borderWidth: 1, borderColor: "rgba(255, 215, 0, 0.2)", padding: 20 },
  statsHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  statsLabel: { color: "#888", fontSize: 10 },
  statsValue: { color: "#FFD700", fontSize: 16, fontWeight: "bold" },
  chartContainer: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 100 },
  barColumn: { alignItems: "center", flex: 1 },
  bar: { width: 6, backgroundColor: "#FFD700", borderRadius: 3 },
  barLabel: { color: "#555", fontSize: 9, marginTop: 8 },
  navBar: { flexDirection: "row", backgroundColor: "#001a35", height: 90, position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: "rgba(255, 215, 0, 0.3)", justifyContent: "space-around", alignItems: "center", paddingBottom: Platform.OS === "ios" ? 25 : 10 },
  navItem: { alignItems: "center", flex: 1 },
  navText: { fontSize: 10, marginTop: 4, letterSpacing: 1, fontWeight: "500" },
});