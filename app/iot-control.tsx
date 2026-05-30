import { LedControl } from '@/components/led-control';
import { SensorHistoryCharts } from '@/components/sensor-history-charts';
import { SolarBatteryMonitoring } from '@/components/solar-battery-monitor';
import { colorSchemes } from '@/constants/colors';
import { useTheme } from '@/hooks/theme-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

type TabType = 'led' | 'solar' | 'charts';

export default function IotControlScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const colors = colorSchemes[theme];
  const [activeTab, setActiveTab] = useState<TabType>('led');

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'led', label: 'Light', icon: 'bulb-outline' },
    { id: 'solar', label: 'Solar', icon: 'sunny-outline' },
    { id: 'charts', label: 'Charts', icon: 'pulse-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} 
        translucent 
        backgroundColor="transparent" 
      />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.tint }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.tint} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.tint }]}>IoT Monitor</Text>
        <View style={styles.placeholders} />
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.cardBorder }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && [styles.activeTab, { borderBottomColor: colors.tint }]
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Ionicons 
              name={tab.icon as any} 
              size={18} 
              color={activeTab === tab.id ? colors.tint : colors.icon}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.id 
                  ? [styles.activeTabText, { color: colors.tint }]
                  : { color: colors.icon }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'led' && <LedControl />}
        {activeTab === 'solar' && <SolarBatteryMonitoring />}
        {activeTab === 'charts' && <SensorHistoryCharts />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  placeholders: {
    width: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 4,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});
