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
   
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="my-booking/order-history" options={{ headerShown: false }} />

      <Stack.Screen name="my-booking/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="wallet-view" options={{ headerShown: false }} />
      <Stack.Screen name="my-review/review-list" options={{ headerShown: false }} />
      <Stack.Screen name="my-review/rating/[id]" options={{ headerShown: false }} />
    </Stack>
  );
} 