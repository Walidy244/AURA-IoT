import { Colors } from '@/constants/theme';

export type ColorKey = keyof typeof Colors.light;

export function getColors(theme: 'light' | 'dark') {
  return Colors[theme];
}

export const colorSchemes = {
  light: {
    ...Colors.light,
    card: '#f5f5f5',
    cardBorder: '#e0e0e0',
    success: '#4CAF50',
    warning: '#FFC107',
    error: '#F44336',
    errorLight: '#FFEBEE',
    warningLight: '#FFF3E0',
    successLight: '#E8F5E9',
    solar: '#FF9800',
    battery: '#2196F3',
    chartGridColor: '#e0e0e0',
    chartLabelColor: '#666',
  },
  dark: {
    ...Colors.dark,
    card: '#2a2a2a',
    cardBorder: '#444',
    success: '#81C784',
    warning: '#FFB74D',
    error: '#EF5350',
    errorLight: '#B71C1C',
    warningLight: '#E65100',
    successLight: '#1B5E20',
    solar: '#FF9800',
    battery: '#2196F3',
    chartGridColor: '#444',
    chartLabelColor: '#aaa',
  },
};

export type ColorScheme = typeof colorSchemes.light;
