import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const adminName = "Admin";

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
        <TouchableOpacity
          style={styles.notificationIcon}
          onPress={() => alert("No new notifications")}
        >
          <Ionicons name="notifications-outline" size={24} color="#FFD700" />
          <View style={styles.dot} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeRow}>
          <Text style={styles.welcomeTitle}>Welcome, </Text>
          <Text style={styles.userNameText}>{adminName}</Text>
        </View>

        <View style={styles.divider} />

        {/* ROW 1: Counters */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="people-outline" size={28} color="#FFD700" />
            <Text style={styles.statNumber}>04</Text>
            <Text style={styles.statLabel}>TOTAL USERS</Text>
          </View>

          <View style={styles.statBox}>
            <Ionicons name="business-outline" size={28} color="#FFD700" />
            <Text style={styles.statNumber}>06</Text>
            <Text style={styles.statLabel}>ROOMS ADDED</Text>
          </View>
        </View>

        {/* ROW 2: Management Boxes */}
        <View style={styles.statsRow}>
          <View style={styles.statBoxLarge}>
            <View style={styles.boxHeader}>
              <Text style={styles.boxTitle}>USERS</Text>
              <TouchableOpacity onPress={() => alert("Add User Clicked")}>
                <Ionicons name="add-circle" size={20} color="#FFD700" />
              </TouchableOpacity>
            </View>
            <Ionicons
              name="person-add-outline"
              size={24}
              color="rgba(255, 215, 0, 0.4)"
              style={{ marginTop: 10 }}
            />
            <Text style={styles.statLabel}>MANAGE LIST</Text>
          </View>

          <View style={styles.statBoxLarge}>
            <View style={styles.boxHeader}>
              <Text style={styles.boxTitle}>DEVICES</Text>
              <TouchableOpacity onPress={() => alert("Add Device Clicked")}>
                <Ionicons name="add-circle" size={20} color="#FFD700" />
              </TouchableOpacity>
            </View>
            <Ionicons
              name="hardware-chip-outline"
              size={24}
              color="rgba(255, 215, 0, 0.4)"
              style={{ marginTop: 10 }}
            />
            <Text style={styles.statLabel}>ADD DEVICE</Text>
          </View>
        </View>

        {/* Wide Empty System Logs */}
        <TouchableOpacity style={styles.wideBox} activeOpacity={0.7}>
          <View style={styles.boxHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="list-outline"
                size={18}
                color="#FFD700"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.boxTitle}>SYSTEM LOGS & ALERTS</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#555" />
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recent logs or alerts</Text>
          </View>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => alert("Admin Logged Out")}
        >
          <Text style={styles.logoutText}>LOGOUT</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FIXED NAVIGATION BAR */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/" as any)}
        >
          <Ionicons name="grid-outline" size={24} color="#555" />
          <Text style={[styles.navText, { color: "#555" }]}>DASHBOARD</Text>
        </TouchableOpacity>

        {/* added ROOMS button */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/rooms" as any)}
        >
          <Ionicons name="business-outline" size={24} color="#555" />
          <Text style={[styles.navText, { color: "#555" }]}>ROOMS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} disabled={true}>
          <Ionicons name="settings" size={24} color="#FFD700" />
          <Text style={[styles.navText, { color: "#FFD700" }]}>SETTINGS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#001f3f" },
  header: {
    height: Platform.OS === "ios" ? 110 : 90,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  brandText: {
    fontSize: 22,
    color: "#FFD700",
    letterSpacing: 8,
    fontWeight: "400",
  },
  notificationIcon: {
    position: "absolute",
    right: 25,
    top: Platform.OS === "ios" ? 55 : 35,
  },
  dot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    backgroundColor: "#ff4444",
    borderRadius: 4,
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
  wideBox: {
    width: "100%",
    backgroundColor: "rgba(255, 215, 0, 0.05)",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
    padding: 15,
    marginTop: 5,
  },
  emptyContainer: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { color: "#555", fontSize: 12, fontStyle: "italic" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statBox: {
    width: "48%",
    height: 110,
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.05)",
  },
  statBoxLarge: {
    width: "48%",
    height: 110,
    borderWidth: 1,
    borderColor: "#FFD700",
    borderRadius: 15,
    padding: 12,
    alignItems: "center",
    backgroundColor: "rgba(255, 215, 0, 0.05)",
  },
  boxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  boxTitle: {
    color: "#FFD700",
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "bold",
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 2,
  },
  statLabel: {
    color: "#FFD700",
    fontSize: 8,
    letterSpacing: 1.5,
    marginTop: 5,
  },
  logoutButton: {
    marginTop: 40,
    borderWidth: 1,
    borderColor: "#FFD700",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: { color: "#FFD700", fontWeight: "600", letterSpacing: 2 },
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
    zIndex: 1000,
  },
  navItem: { alignItems: "center", flex: 1 },
  navText: { fontSize: 10, marginTop: 4, fontWeight: "500" },
});
