import { Stack } from "expo-router";

export default function HomeLayout() {
  return <Stack>
    <Stack.Screen name="tours/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="tours/timeline" options={{ headerShown: false }} />
  </Stack>;
}
