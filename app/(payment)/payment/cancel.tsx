import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ToastAndroid, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderApiRequest } from '@/services/orderService';

export default function PaymentCancel() {
  const { orderId,code, id, cancel, status, orderCode } = useLocalSearchParams();
  const router = useRouter();

  //log
console.log('orderId:', orderId);
console.log('PaymentId: ', id);
console.log(`cancel:  `, true)
  const hasCanceledRef = useRef(false);

  const cancelPayment = useCallback(async (paymentId: string) => {
    if (hasCanceledRef.current) return;
    try {
      const response = await orderApiRequest.cancelPayment(paymentId);
      if (response.status !== 204) {
        ToastAndroid.show('Đã có lỗi xảy ra.', ToastAndroid.SHORT);
        return;
      }
      ToastAndroid.show('Hủy thanh toán thành công.', ToastAndroid.SHORT);
    } catch (error) {
      console.error(error);
      ToastAndroid.show('Đã có lỗi xảy ra.', ToastAndroid.SHORT);
    } finally {
      hasCanceledRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!cancel || !id) {
      router.replace('/');
      return;
    }
     cancelPayment(id as string);
    // Nếu có localStorage hoặc asyncStorage thì xóa ở đây
    // await AsyncStorage.removeItem('paymentStartTime');
  }, [cancel, id, cancelPayment, router]);

  if (!cancel || !id) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-1 justify-center items-center px-4">
        <Ionicons name="close-circle" size={100} color="#ef4444" />
        <Text className="mt-6 text-2xl font-bold text-gray-800">Thanh toán bị hủy</Text>
        <Text className="mt-2 text-center text-gray-600">
          Đơn hàng của bạn chưa được thanh toán.
        </Text>
        <Text className="mt-1 text-center text-gray-600">
          Bạn có thể thử lại sau hoặc quay lại trang chủ.
        </Text>

        <View className="flex-row mt-8 space-x-6">
          <TouchableOpacity
            className="bg-gray-200 px-6 py-4 rounded-xl"
            onPress={() => router.push('/')}
          >
            <Text className="font-bold text-gray-800">Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
} 