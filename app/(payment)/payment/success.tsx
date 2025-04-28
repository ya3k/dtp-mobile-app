import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PaymentSuccess() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View className="flex-1 justify-center items-center px-4">
        <Ionicons name="checkmark-circle" size={100} color="#10b981" />
        <Text className="mt-6 text-2xl font-bold text-gray-800">Thanh toán thành công!</Text>
        <Text className="mt-2 text-center text-gray-600">
          Đơn hàng của bạn đã được thanh toán thành công.
        </Text>
        <Text className="mt-1 text-center text-gray-600">
          Vé điện tử đã được gửi qua email của bạn.
        </Text>
        
        <TouchableOpacity
          className="mt-8 bg-orange-500 px-8 py-4 rounded-xl"
          onPress={() => router.push('/')}
        >
          <Text className="text-white font-bold text-lg">Về trang chủ</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
} 