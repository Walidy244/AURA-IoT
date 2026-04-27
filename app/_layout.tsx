import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack initialRouteName="index">
            <Stack.Screen name="rooms" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}