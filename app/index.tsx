import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const router = useRouter();

  const userName = "User";
  const [isLROn, setIsLROn] = useState(false);
  const [currentTemp, setCurrentTemp] = useState(72);
  const [activeTab, setActiveTab] = useState("Dashboard");

  useEffect(() => {
  const cognitoUrl =
    "https://us-east-1ilot3xgz7.auth.us-east-1.amazoncognito.com/login?client_id=3pi274k5pr67284m2f2a173pai&response_type=code&scope=email+openid+phone&redirect_uri=myapp%3A%2F%2Fcallback"


  Linking.openURL(cognitoUrl);
}, []);


const exchangeCodeForToken = async (code: string) => {
  try {
    const response = await fetch(
      "https://us-east-1ilot3xgz7.auth.us-east-1.amazoncognito.com/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=authorization_code&client_id=3pi274k5pr67284m2f2a173pai&code=${code}&redirect_uri=myapp://callback`,
      }
    );

    const data = await response.json();
    console.log("Tokens:", data);
  } catch (error) {
    console.error(error);
  }
};


useEffect(() => {
  const handleDeepLink = (event: any) => {
    const url = event.url;
    const parsed = Linking.parse(url);

    const code = parsed.queryParams?.code;

    if (typeof code === "string") {
      exchangeCodeForToken(code);
    }
  };

  const subscription = Linking.addEventListener("url", handleDeepLink);

  return () => subscription.remove();
}, []);

  const energyData = [35, 60, 85, 55, 95, 45, 75];

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Brand Header */}
      <View style={styles.header}>
        <Text style={styles.brandText}>AURA</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeRow}>
          <Text style={styles.welcomeTitle}>Welcome, </Text>
          <Text style={styles.userNameText}>{userName}</Text>
        </View>

        <View style={styles.divider} />

        {/* MAIN CONTROLS GRID - All 4 boxes will show now */}
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridBox}>
            <Ionicons name="sunny-outline" size={30} color="#FFD700" />
            <Text style={styles.gridText}>LIGHTS</Text>
          </TouchableOpacity>

          <View style={styles.gridBox}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity onPress={() => setCurrentTemp(currentTemp - 1)}>
                <Ionicons
                  name="remove-circle-outline"
                  size={20}
                  color="#FFD700"
                />
              </TouchableOpacity>
              <Ionicons
                name="thermometer-outline"
                size={30}
                color="#FFD700"
                style={{ marginHorizontal: 5 }}
              />
              <TouchableOpacity onPress={() => setCurrentTemp(currentTemp + 1)}>
                <Ionicons name="add-circle-outline" size={20} color="#FFD700" />
              </TouchableOpacity>
            </View>
            <Text style={styles.gridText}>Thermostat</Text>
          </View>

          <TouchableOpacity style={styles.gridBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={30}
              color="#FFD700"
            />
            <Text style={styles.gridText}>Security</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridBox}>
            <Ionicons name="lock-closed-outline" size={30} color="#FFD700" />
            <Text style={styles.gridText}>Door Locks</Text>
          </TouchableOpacity>
        </View>

        {/* DEVICES SECTION */}
        <Text style={styles.sectionTitle}>DEVICES</Text>
        <View style={styles.deviceRow}>
          <View style={styles.deviceBox}>
            <Ionicons
              name={isLROn ? "sunny" : "sunny-outline"}
              size={20}
              color={isLROn ? "#FFD700" : "#555"}
            />
            <View style={styles.switchWrapper}>
              <Switch
                value={isLROn}
                onValueChange={setIsLROn}
                trackColor={{ false: "#1a1a1a", true: "#FFD700" }}
                thumbColor={isLROn ? "#FFFFFF" : "#888"}
                style={{ transform: [{ scale: 0.7 }] }}
              />
            </View>
            <Text style={styles.deviceText}>LIGHTS</Text>
          </View>

          <View style={styles.deviceBox}>
            <View style={styles.tempCircle}>
              <Text style={styles.tempNumber}>{currentTemp}°</Text>
            </View>
            <Text style={styles.deviceText}>THERMO</Text>
          </View>

          <TouchableOpacity style={styles.deviceBox}>
            <Ionicons name="videocam-outline" size={22} color="#FFD700" />
            <Text style={[styles.deviceText, { marginTop: 12 }]}>CAMS</Text>
          </TouchableOpacity>
        </View>

        {/* STATISTICS SECTION */}
        <Text style={styles.sectionTitle}>STATISTICS</Text>
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Text style={styles.statsLabel}>ENERGY USAGE</Text>
            <Text style={styles.statsValue}>12.4 kWh</Text>
          </View>
          <View style={styles.chartContainer}>
            {energyData.map((val, index) => (
              <View key={index} style={styles.barColumn}>
                <View style={[styles.bar, { height: val }]} />
                <Text style={styles.barLabel}>
                  {["M", "T", "W", "T", "F", "S", "S"][index]}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* BOTTOM NAVIGATION BAR - Fixed Jumping and added Rooms */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setActiveTab("Dashboard")}
        >
          <Ionicons
            name="grid"
            size={24}
            color={activeTab === "Dashboard" ? "#FFD700" : "#555"}
          />
          <Text
            style={[
              styles.navText,
              { color: activeTab === "Dashboard" ? "#FFD700" : "#555" },
            ]}
          >
            DASHBOARD
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("Rooms");
            router.replace("/rooms" as any);
          }}
        >
          <Ionicons
            name="business-outline"
            size={24}
            color={activeTab === "Rooms" ? "#FFD700" : "#555"}
          />
          <Text
            style={[
              styles.navText,
              { color: activeTab === "Rooms" ? "#FFD700" : "#555" },
            ]}
          >
            ROOMS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setActiveTab("Settings");
            router.replace("/settings" as any);
          }}
        >
          <Ionicons
            name="settings-outline"
            size={24}
            color={activeTab === "Settings" ? "#FFD700" : "#555"}
          />
          <Text
            style={[
              styles.navText,
              { color: activeTab === "Settings" ? "#FFD700" : "#555" },
            ]}
          >
            SETTINGS
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001f3f" },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    alignItems: "center",
    paddingBottom: 10,
  },
  brandText: {
    fontSize: 22,
    color: "#FFD700",
    letterSpacing: 8,
    fontWeight: "400",
  },
  content: { paddingTop: 20, paddingHorizontal: 25 },
  welcomeRow: { flexDirection: "row", alignItems: "baseline" },
  welcomeTitle: { fontSize: 28, color: "#FFFFFF", fontWeight: "300" },
  userNameText: { fontSize: 28, color: "#FFD700", fontWeight: "300" },
  divider: {
    height: 1,
    backgroundColor: "#FFD700",
    width: 40,
    marginVertical: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  gridBox: {
    width: "48%",
    height: 100,
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  gridText: { color: "#FFD700", fontSize: 11, marginTop: 10, letterSpacing: 2 },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 15,
    marginTop: 10,
  },
  deviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  deviceBox: {
    width: "31%",
    height: 100,
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tempCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  tempNumber: { color: "#FFD700", fontSize: 14 },
  switchWrapper: { marginVertical: 5 },
  deviceText: { color: "#FFD700", fontSize: 8, letterSpacing: 1 },
  statsCard: {
    width: "100%",
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255, 215, 0, 0.2)",
    padding: 20,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statsLabel: { color: "#888", fontSize: 10 },
  statsValue: { color: "#FFD700", fontSize: 16, fontWeight: "bold" },
  chartContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 100,
  },
  barColumn: { alignItems: "center", flex: 1 },
  bar: { width: 6, backgroundColor: "#FFD700", borderRadius: 3 },
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

