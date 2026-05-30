import { colorSchemes } from "@/constants/colors";
import { useTheme } from "@/hooks/theme-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const { theme, toggleTheme } = useTheme();
  const colors = colorSchemes[theme];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
        translucent
        backgroundColor="transparent"
      />

      {/* Brand Header */}
      <View style={[styles.header, { borderBottomColor: colors.tint }]}>
        <Text style={[styles.brandText, { color: colors.tint }]}>AURA</Text>
        <TouchableOpacity
          style={styles.notificationIcon}
          onPress={toggleTheme}
        >
          <Ionicons 
            name={theme === 'dark' ? 'sunny-outline' : 'moon-outline'} 
            size={24} 
            color={colors.tint} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} bounces={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeRow}>
          <Text style={[styles.welcomeTitle, { color: colors.text }]}>Welcome, </Text>
          <Text style={[styles.userNameText, { color: colors.tint }]}>{adminName}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.tint }]} />

        {/* ROW 1: Counters */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderColor: colors.tint, backgroundColor: `${colors.tint}0d` }]}>
            <Ionicons name="people-outline" size={28} color={colors.tint} />
            <Text style={[styles.statNumber, { color: colors.text }]}>04</Text>
            <Text style={[styles.statLabel, { color: colors.tint }]}>TOTAL USERS</Text>
          </View>

          <View style={[styles.statBox, { borderColor: colors.tint, backgroundColor: `${colors.tint}0d` }]}>
            <Ionicons name="business-outline" size={28} color={colors.tint} />
            <Text style={[styles.statNumber, { color: colors.text }]}>06</Text>
            <Text style={[styles.statLabel, { color: colors.tint }]}>ROOMS ADDED</Text>
          </View>
        </View>

        {/* ROW 2: Management Boxes */}
        <View style={styles.statsRow}>
          <View style={[styles.statBoxLarge, { borderColor: colors.tint, backgroundColor: `${colors.tint}0d` }]}>
            <View style={styles.boxHeader}>
              <Text style={[styles.boxTitle, { color: colors.tint }]}>USERS</Text>
              <TouchableOpacity onPress={() => alert("Add User Clicked")}>
                <Ionicons name="add-circle" size={20} color={colors.tint} />
              </TouchableOpacity>
            </View>
            <Ionicons
              name="person-add-outline"
              size={24}
              color={`${colors.tint}66`}
              style={{ marginTop: 10 }}
            />
            <Text style={[styles.statLabel, { color: colors.tint }]}>MANAGE LIST</Text>
          </View>

          <View style={[styles.statBoxLarge, { borderColor: colors.tint, backgroundColor: `${colors.tint}0d` }]}>
            <View style={styles.boxHeader}>
              <Text style={[styles.boxTitle, { color: colors.tint }]}>DEVICES</Text>
              <TouchableOpacity onPress={() => alert("Add Device Clicked")}>
                <Ionicons name="add-circle" size={20} color={colors.tint} />
              </TouchableOpacity>
            </View>
            <Ionicons
              name="hardware-chip-outline"
              size={24}
              color={`${colors.tint}66`}
              style={{ marginTop: 10 }}
            />
            <Text style={[styles.statLabel, { color: colors.tint }]}>ADD DEVICE</Text>
          </View>
        </View>

        {/* Wide Empty System Logs */}
        <TouchableOpacity style={[styles.wideBox, { borderColor: colors.tint, backgroundColor: `${colors.tint}0d` }]} activeOpacity={0.7}>
          <View style={styles.boxHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Ionicons
                name="list-outline"
                size={18}
                color={colors.tint}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.boxTitle, { color: colors.tint }]}>SYSTEM LOGS & ALERTS</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.icon} />
          </View>
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.icon }]}>No recent logs or alerts</Text>
          </View>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.tint }]}
          onPress={async () => {
            await AsyncStorage.removeItem('authToken');
            router.replace('/login');
          }}
        >
          <Text style={[styles.logoutText, { color: colors.tint }]}>LOGOUT</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FIXED NAVIGATION BAR */}
      <View style={[styles.navBar, { backgroundColor: colors.background, borderTopColor: `${colors.tint}4d` }]}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/" as any)}
        >
          <Ionicons name="grid-outline" size={24} color={colors.icon} />
          <Text style={[styles.navText, { color: colors.icon }]}>DASHBOARD</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/iot-control" as any)}
        >
          <Ionicons name="bulb-outline" size={24} color={colors.icon} />
          <Text style={[styles.navText, { color: colors.icon }]}>LED</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/rooms" as any)}
        >
          <Ionicons name="business-outline" size={24} color={colors.icon} />
          <Text style={[styles.navText, { color: colors.icon }]}>ROOMS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} disabled={true}>
          <Ionicons name="settings" size={24} color={colors.tint} />
          <Text style={[styles.navText, { color: colors.tint }]}>SETTINGS</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: Platform.OS === "ios" ? 110 : 90,
    paddingTop: Platform.OS === "ios" ? 55 : 35,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 25,
    borderBottomWidth: 1,
  },
  brandText: {
    fontSize: 22,
    letterSpacing: 8,
    fontWeight: "400",
  },
  notificationIcon: {
    padding: 8,
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
  welcomeTitle: { fontSize: 28, fontWeight: "300" },
  userNameText: { fontSize: 28, fontWeight: "300" },
  divider: {
    height: 1,
    width: 40,
    marginVertical: 20,
  },
  wideBox: {
    width: "100%",
    borderRadius: 15,
    borderWidth: 1,
    padding: 15,
    marginTop: 5,
  },
  emptyContainer: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { fontSize: 12, fontStyle: "italic" },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  statBox: {
    width: "48%",
    height: 110,
    borderWidth: 1,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  statBoxLarge: {
    width: "48%",
    height: 110,
    borderWidth: 1,
    borderRadius: 15,
    padding: 12,
    alignItems: "center",
  },
  boxHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  boxTitle: {
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: "bold",
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 2,
  },
  statLabel: {
    fontSize: 8,
    letterSpacing: 1.5,
    marginTop: 5,
  },
  logoutButton: {
    marginTop: 40,
    borderWidth: 1,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutText: { fontWeight: "600", letterSpacing: 2 },
  navBar: {
    flexDirection: "row",
    height: 90,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    justifyContent: "space-around",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 25 : 10,
    zIndex: 1000,
  },
  navItem: { alignItems: "center", flex: 1 },
  navText: { fontSize: 10, marginTop: 4, fontWeight: "500" },
});
