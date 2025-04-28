import { Stack } from "expo-router";
import './globals.css';
import { useEffect } from "react";
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { Platform, ToastAndroid } from 'react-native';

export default function RootLayout() {
  const router = useRouter();

  // Simple deep link handler for payment URLs
  useEffect(() => {
    const handleURL = (url: string) => {
      if (!url) return;
      console.log('Deep link received:', url);
      
      try {
        // Extract order ID from URL
        const { path, queryParams } = Linking.parse(url);
        const orderId = queryParams?.orderId || '';
        
        // Log all parsed parameters for debugging
        console.log('Parsed deep link:', { 
          path, 
          orderId,
          status: queryParams?.status,
          cancel: queryParams?.cancel,
          code: queryParams?.code,
          allParams: queryParams
        });
        
        // Show toast on Android for debugging
        if (Platform.OS === 'android') {
          ToastAndroid.show(`Deep link received: ${url.substring(0, 50)}...`, ToastAndroid.LONG);
        }
        
        // More comprehensive check for cancellation patterns
        const lowerUrl = url.toLowerCase();
        if (
          lowerUrl.includes('payment/cancel') || 
          lowerUrl.includes('status=cancelled') || 
          lowerUrl.includes('cancel=true')
        ) {
          console.log('Redirecting to cancel page with orderId:', orderId);
          router.replace({
            pathname: "/(payment)/payment/cancel",
            params: { orderId }
          });
        } else if (lowerUrl.includes('payment/success')) {
          console.log('Redirecting to success page with orderId:', orderId);
          router.replace({
            pathname: "/(payment)/payment/success",
            params: { orderId }
          });
        }
      } catch (error: any) {
        console.error('Error handling deep link:', error);
        if (Platform.OS === 'android') {
          ToastAndroid.show(`Error handling deep link: ${error?.message || 'Unknown error'}`, ToastAndroid.LONG);
        }
      }
    };
    
    // Handle URLs that open the app
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('URL event received:', event.url);
      handleURL(event.url);
    });
    
    // Handle initial URL (app opened from a link)
    Linking.getInitialURL().then((url) => {
      console.log('Initial URL checked:', url || 'none');
      if (url) handleURL(url);
    }).catch(error => {
      console.error('Error getting initial URL:', error);
    });
    
    // For Android debugging - log supported URL scheme
    if (Platform.OS === 'android') {
      console.log('App running on Android with URL scheme:', 'dtpmobile');
    }
    
    return () => {
      subscription.remove();
    };
  }, [router]);

  return <Stack>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="(home)/tours/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
    <Stack.Screen name="(payment)" options={{ headerShown: false }} />
  </Stack>;
}
