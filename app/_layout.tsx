import { Stack } from "expo-router";
import './globals.css';
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";


export default function RootLayout() {
  return <Stack>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="(home)/tours/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
  </Stack>;
}
