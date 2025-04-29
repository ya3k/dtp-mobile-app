import { Stack } from "expo-router";

export default function UserLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false // Disable gesture navigation to prevent accidental back during payment
      }}
    >
    </Stack>
  );
} 