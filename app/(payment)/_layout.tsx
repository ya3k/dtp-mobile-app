import { Stack } from "expo-router";

export default function PaymentLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false // Disable gesture navigation to prevent accidental back during payment
      }}
    >
      <Stack.Screen name="payment/success" options={{ gestureEnabled: true }} />
      <Stack.Screen name="payment/cancel" options={{ gestureEnabled: true }} />
      <Stack.Screen name="payment/webview" options={{ gestureEnabled: false }} />
      <Stack.Screen name="checkout/[id]" options={{ gestureEnabled: true }} />
    </Stack>
  );
} 