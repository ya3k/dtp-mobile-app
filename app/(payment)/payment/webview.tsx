import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, View, Text, TouchableOpacity, SafeAreaView, StatusBar, BackHandler, Alert, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cartStore';

export default function PaymentScreen() {
  const { url } = useLocalSearchParams();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const { clearCart } = useCartStore();

  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (paymentComplete) {
        goToSuccess();
        return true;
      }

      Alert.alert(
        "Hủy thanh toán?",
        "Bạn có chắc chắn muốn hủy thanh toán này không?",
        [
          {
            text: "Tiếp tục thanh toán",
            style: "cancel",
            onPress: () => {}
          },
          {
            text: "Hủy thanh toán",
            style: "destructive",
            onPress: () => {
              // Extract the order ID if possible
              let orderId = '';
              if (typeof url === 'string') {
                const match = url.match(/orderId=([^&]*)/);
                if (match && match[1]) {
                  orderId = match[1];
                }
              }
              
              router.replace({
                pathname: '/(payment)/payment/cancel',
                params: { orderId }
              });
            }
          }
        ]
      );
      return true;
    });

    return () => backHandler.remove();
  }, [paymentComplete, url]);

  const goToSuccess = () => {
    // Extract the order ID if possible
    let orderId = '';
    if (typeof url === 'string') {
      const match = url.match(/orderId=([^&]*)/);
      if (match && match[1]) {
        orderId = match[1];
      }
    }
    
    // Clear cart after successful payment
    clearCart();
    
    // Navigate to success screen
    router.replace({
      pathname: '/(payment)/payment/success',
      params: { orderId }
    });
  };

  const handleNavigationStateChange = (navState: any) => {
    const { url: currentUrl } = navState;
    if (!currentUrl) return;

    console.log('WebView navigating to:', currentUrl);
    
    // Special Android debugging
    if (Platform.OS === 'android') {
      console.log('Android WebView navigation state change:', {
        url: currentUrl,
        title: navState.title,
        loading: navState.loading,
        canGoBack: navState.canGoBack,
        canGoForward: navState.canGoForward
      });
    }

    // Check for success patterns in URL - PayOS specific patterns
    if (
      currentUrl.includes('success') || 
      currentUrl.includes('return') || 
      currentUrl.includes('paymentStatus=PAID') ||
      currentUrl.includes('vnp_ResponseCode=00') ||
      currentUrl.includes('status=true')
    ) {
      // Mark payment as complete
      setPaymentComplete(true);
      
      // Extract orderId from URL if present
      const parsed = Linking.parse(currentUrl);
      const orderId = parsed.queryParams?.orderId || 
                     currentUrl.match(/orderId=([^&]*)/)?.[1] || 
                     '';
      
      console.log('Success detected, orderId:', orderId);
      
      // Navigate to success page
      router.replace({
        pathname: '/(payment)/payment/success',
        params: { orderId }
      });
    } 
    // Check for cancellation or failure patterns
    else if (
      currentUrl.includes('cancel') || 
      currentUrl.includes('error') ||
      currentUrl.includes('paymentStatus=CANCELLED') ||
      currentUrl.includes('paymentStatus=FAILED') ||
      currentUrl.includes('vnp_ResponseCode=24') ||
      currentUrl.includes('status=false') ||
      currentUrl.includes('status=CANCELLED') ||
      currentUrl.includes('cancel=true')
    ) {
      // Extract orderId from URL if present
      const parsed = Linking.parse(currentUrl);
      const orderId = parsed.queryParams?.orderId || 
                     currentUrl.match(/orderId=([^&]*)/)?.[1] || 
                     '';
      
      console.log('Cancel/Error detected, orderId:', orderId);
      
      // Navigate to cancel page
      router.replace({
        pathname: '/(payment)/payment/cancel',
        params: { orderId }
      });
    }
  };

  // Custom JavaScript to inject for better payment gateway integration
  const injectedJavaScript = `
    // Send message when payment might be complete
    function checkPaymentCompletion() {
      if (
        window.location.href.includes('success') || 
        window.location.href.includes('return') ||
        window.location.href.includes('paymentStatus=PAID') ||
        window.location.href.includes('vnp_ResponseCode=00') ||
        window.location.href.includes('status=true') ||
        document.body.textContent.includes('thanh toán thành công')
      ) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAYMENT_SUCCESS',
          url: window.location.href
        }));
      }
      else if (
        window.location.href.includes('cancel') || 
        window.location.href.includes('error') ||
        window.location.href.includes('paymentStatus=CANCELLED') ||
        window.location.href.includes('paymentStatus=FAILED') ||
        window.location.href.includes('vnp_ResponseCode=24') ||
        window.location.href.includes('status=false') ||
        window.location.href.includes('status=CANCELLED') ||
        window.location.href.includes('cancel=true') ||
        document.body.textContent.includes('thanh toán thất bại') ||
        document.body.textContent.includes('đã hủy')
      ) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'PAYMENT_CANCELLED',
          url: window.location.href
        }));
      }
    }
    
    // Run check immediately and set an interval
    checkPaymentCompletion();
    setInterval(checkPaymentCompletion, 1000);
    true;
  `;

  // Handle messages from WebView
  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);
      
      if (data.type === 'PAYMENT_SUCCESS') {
        setPaymentComplete(true);
        goToSuccess();
      } else if (data.type === 'PAYMENT_CANCELLED') {
        // Extract the order ID if possible
        let orderId = '';
        if (data.url) {
          const match = data.url.match(/orderId=([^&]*)/);
          if (match && match[1]) {
            orderId = match[1];
          }
        }
        
        router.replace({
          pathname: '/(payment)/payment/cancel',
          params: { orderId }
        });
      }
    } catch (error) {
      console.error('Failed to parse WebView message:', error);
    }
  };

  if (!url || typeof url !== 'string') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <View className="flex-row items-center px-4 py-2 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-medium">Thanh toán</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text>URL thanh toán không hợp lệ</Text>
          <TouchableOpacity 
            className="mt-4 bg-orange-500 px-6 py-3 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-white font-semibold">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-row items-center px-4 py-2 border-b border-gray-200">
        <TouchableOpacity 
          onPress={() => {
            Alert.alert(
              "Hủy thanh toán?",
              "Bạn có chắc chắn muốn hủy thanh toán này không?",
              [
                {
                  text: "Tiếp tục thanh toán",
                  style: "cancel"
                },
                {
                  text: "Hủy thanh toán",
                  style: "destructive",
                  onPress: () => {
                    // Extract the order ID if possible
                    let orderId = '';
                    if (typeof url === 'string') {
                      const match = url.match(/orderId=([^&]*)/);
                      if (match && match[1]) {
                        orderId = match[1];
                      }
                    }
                    
                    router.replace({
                      pathname: '/(payment)/payment/cancel',
                      params: { orderId }
                    });
                  }
                }
              ]
            );
          }} 
          className="p-2"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="ml-2 text-lg font-medium">Thanh toán</Text>
      </View>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        startInLoadingState
        renderLoading={() => (
          <View className="absolute top-0 left-0 right-0 bottom-0 flex-1 justify-center items-center bg-white">
            <ActivityIndicator size="large" color="#FF8C00" />
            <Text className="mt-4 text-gray-600">Đang tải trang thanh toán...</Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
        onHttpError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView HTTP error:', nativeEvent);
        }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scalesPageToFit={true}
        scrollEnabled={true}
        allowsFullscreenVideo={true}
      />
    </SafeAreaView>
  );
}
