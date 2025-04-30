import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Linking
} from 'react-native';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletType } from '@/schemaValidation/wallet.schema';
import { walletApiRequest } from '@/services/walletService';

const WalletScreen = () => {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setIsLoading(true);
        const walletData = await walletApiRequest.getWallet();
        setWallet(walletData);
        setError(null);
      } catch (err) {
        console.error('Error fetching wallet data:', err);
        setError('Không thể tải thông tin ví.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };
  
  const handleWebsiteAccess = () => {
    // Replace with your actual website URL
    Linking.openURL('https://dtp-frontend-three.vercel.app/my-wallet');
    
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white shadow-md">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={handleBack} className="p-2 mr-3rounded-full">
            <Ionicons name="arrow-back" size={22} color="#333" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-gray-800">Ví của tôi</Text>
        </View>
      </View>
      
      {/* Nội dung */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text className="mt-3 text-gray-500">Đang tải thông tin...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center px-6">
          <View className="bg-red-50 p-4 rounded-xl mb-4">
            <Text className="text-red-500 text-center text-base font-medium">
              {error}
            </Text>
          </View>
          <TouchableOpacity
            className="mt-3 bg-gradient-to-r from-sky-600 to-sky-500 px-8 py-3 rounded-full shadow-md"
            onPress={() => setIsLoading(true)}
          >
            <Text className="text-white font-semibold text-base">Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-1 justify-center items-center px-6">
          <View className="w-full rounded-2xl bg-gradient-to-r from-sky-700 to-sky-500 p-8 shadow-lg elevation-5">
            <Text className="text-black text-center text-base opacity-90 font-medium">Số dư ví</Text>
            <Text className="text-black text-4xl font-bold text-center mt-3 tracking-wide">
              {wallet ? new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(wallet.balance) : '0 ₫'}
            </Text>
            <Text className="text-black text-center text-sm mt-4 opacity-80">Số dư trong ví chỉ dùng để rút</Text>
          </View>
          
          <View className="mt-8 bg-white p-5 rounded-xl shadow-md w-full">
            <Text className="text-gray-600 text-center font-medium mb-4">
              Truy cập website của chúng tôi để thực hiện rút tiền.
            </Text>
            
            <TouchableOpacity
              onPress={handleWebsiteAccess}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 py-3 px-6 rounded-lg shadow-sm flex-row items-center justify-center mt-2"
            >
              <Ionicons name="globe-outline" size={18} color="white" />
              <Text className="text-black font-semibold text-base ml-2">
                Truy cập website
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default WalletScreen;