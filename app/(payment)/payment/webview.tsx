import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, View, Text, TouchableOpacity, SafeAreaView, StatusBar, BackHandler, Alert, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore } from '@/store/cartStore';

export default function PaymentScreen() {
  const { url, orderId } = useLocalSearchParams();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'success' | 'cancelled'>('pending');
  const { clearCart } = useCartStore();

  console.log(`Webview: ` + orderId);
  
  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        "Rời khỏi trang thanh toán?",
        "Bạn có chắc chắn muốn rời khỏi trang thanh toán này không?",
        [
          {
            text: "Ở lại",
            style: "cancel"
          },
          {
            text: "Rời khỏi",
            style: "destructive",
            onPress: () => router.back()
          }
        ]
      );
      return true;
    });

    return () => backHandler.remove();
  }, []);

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
      // Log full PayOS success URL for debugging
      console.log('PAYMENT SUCCESS DETECTED - FULL URL:', currentUrl);
      
      // Additional PayOS specific logging
      if (currentUrl.includes('payos.vn')) {
        console.log('PayOS Success Details:', {
          fullUrl: currentUrl,
          urlPath: currentUrl.split('?')[0],
          queryParams: currentUrl.includes('?') ? currentUrl.split('?')[1] : 'none'
        });
        
        // Try to parse any query parameters
        try {
          const urlObj = new URL(currentUrl);
          const params = Object.fromEntries(urlObj.searchParams);
          console.log('PayOS URL Query Parameters:', params);
        } catch (err) {
          console.error('Failed to parse PayOS URL:', err);
        }
      }
      
      // Just update payment status, don't navigate
      setPaymentStatus('success');
      console.log("clear cart")
      clearCart(); // Clear the cart on successful payment
      
    } else if (
      currentUrl.includes('cancel') ||
      currentUrl.includes('error') ||
      currentUrl.includes('paymentStatus=CANCELLED') ||
      currentUrl.includes('paymentStatus=FAILED') ||
      currentUrl.includes('vnp_ResponseCode=24') ||
      currentUrl.includes('status=false') ||
      currentUrl.includes('status=CANCELLED') ||
      currentUrl.includes('cancel=true')
    ) {
      console.log('Payment cancelled or failed:', currentUrl);
      setPaymentStatus('cancelled');
    }
  };

  // Custom JavaScript to inject for better payment gateway integration
  const injectedJavaScript = `
    // Log things to console but don't change navigation
    function checkPaymentStatus() {
      console.log('Current WebView URL:', window.location.href);
      
      if (
        window.location.href.includes('success') || 
        window.location.href.includes('return') ||
        window.location.href.includes('paymentStatus=PAID') ||
        window.location.href.includes('vnp_ResponseCode=00') ||
        window.location.href.includes('status=true') ||
        document.body.textContent.includes('thanh toán thành công')
      ) {
        console.log('Payment success detected in webview:', window.location.href);
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
        console.log('Payment cancelled or failed in webview:', window.location.href);
      }
    }
    
    // Run check immediately and set interval
    checkPaymentStatus();
    setInterval(checkPaymentStatus, 1000);
    true;
  `;

  if (!url || typeof url !== 'string') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <View className="flex-row items-center px-4 py-2 border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="ml-2 text-lg font-bold">Thanh toán</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <Text>URL thanh toán không hợp lệ</Text>
          <TouchableOpacity
            className="mt-4 bg-core-400 px-6 py-3 rounded-lg"
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
      <View className="flex-row items-center justify-between py-2 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              "Rời khỏi trang thanh toán?",
              "Bạn có chắc chắn muốn rời khỏi trang thanh toán này không?",
              [
                {
                  text: "Ở lại",
                  style: "cancel"
                },
                {
                  text: "Rời khỏi",
                  style: "destructive",
                  onPress: () => router.back()
                }
              ]
            );
          }}
          className="p-2"
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text className="text-sm font-medium">Thanh toán</Text>
        
        {/* Thêm nút hiển thị theo trạng thái */}
        {paymentStatus === 'success' && (
          <TouchableOpacity 
            onPress={() => router.replace({
              pathname: '/(payment)/payment/success',
              params: { orderId }
            })}
            className="bg-green-500 px-3 py-1 rounded-lg"
          >
            <Text className="text-white font-medium">Xem đơn hàng</Text>
          </TouchableOpacity>
        )}
        
        {paymentStatus === 'pending' && (
          <View className="w-24" /> 
        )}
      </View>
      
      {/* Status indicator */}
      {paymentStatus === 'success' && (
        <View className="px-4 py-2 bg-green-50 border-b border-green-200">
          <Text className="text-green-700 font-medium">
            Thanh toán đã được xác nhận thành công! Bạn có thể tiếp tục xem trang hiện tại hoặc xem thông tin đơn hàng.
          </Text>
        </View>
      )}
      
      {paymentStatus === 'cancelled' && (
        <View className="px-4 py-2 bg-red-50 border-b border-red-200">
          <Text className="text-red-700 font-medium">
            Thanh toán đã bị hủy hoặc thất bại. Bạn có thể thử lại sau.
          </Text>
        </View>
      )}
      
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onNavigationStateChange={handleNavigationStateChange}
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
      
      {/* Bottom Action Bar */}
      {paymentStatus !== 'pending' && (
        <View className="p-4 border-t border-gray-200 bg-white">
          <View className="flex-row justify-between">
            {paymentStatus === 'success' && (
              <TouchableOpacity
                className="bg-core-400 py-3 rounded-xl flex-1"
                onPress={() => router.replace({
                  pathname: '/(payment)/payment/success',
                  params: { orderId }
                })}
              >
                <Text className="text-white font-bold text-lg text-center">Xem chi tiết đơn hàng</Text>
              </TouchableOpacity>
            )}
            
            {paymentStatus === 'cancelled' && (
              <TouchableOpacity
                className="bg-gray-500 py-3 rounded-xl flex-1"
                onPress={() => router.back()}
              >
                <Text className="text-white font-bold text-lg text-center">Quay lại</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
