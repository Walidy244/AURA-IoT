import { ThemeProvider } from "@/hooks/theme-context";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack initialRouteName="login">
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="rooms" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="iot-control" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}