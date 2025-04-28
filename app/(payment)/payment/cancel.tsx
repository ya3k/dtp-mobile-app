import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentCancel() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-1 justify-center items-center px-4">
        <Ionicons name="close-circle" size={100} color="#ef4444" />
        <Text className="mt-6 text-2xl font-bold text-gray-800">Thanh toán bị hủy</Text>
        <Text className="mt-2 text-center text-gray-600">
          Đơn hàng #{orderId} của bạn chưa được thanh toán.
        </Text>
        <Text className="mt-1 text-center text-gray-600">
          Bạn có thể thử lại sau hoặc quay lại trang chủ.
        </Text>
        
        <View className="flex-row mt-8 space-x-4">
          <TouchableOpacity
            className="bg-gray-200 px-6 py-4 rounded-xl"
            onPress={() => router.push('/')}
          >
            <Text className="font-bold text-gray-800">Về trang chủ</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="bg-orange-500 px-6 py-4 rounded-xl"
            onPress={() => router.push(`/(payment)/${orderId}/checkout`)}
          >
            <Text className="text-white font-bold">Thử lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
} 