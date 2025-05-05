import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { voucherApiRequest } from '@/services/voucherService';
import { VoucherResType } from '@/schemaValidation/voucher.schema';
import { formatPrice } from '@/libs/utils';

interface VoucherModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectVoucher: (voucher: VoucherResType | null) => void;
  totalAmount: number;
}

const VoucherModal: React.FC<VoucherModalProps> = ({ 
  isVisible, 
  onClose, 
  onSelectVoucher,
  totalAmount 
}) => {
  const [vouchers, setVouchers] = useState<VoucherResType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isVisible) {
      loadVouchers();
    }
  }, [isVisible]);

  const loadVouchers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await voucherApiRequest.getOdata();
      setVouchers(data);
    } catch (err) {
      setError('Không thể tải mã giảm giá. Vui lòng thử lại sau.');
      console.error('Error loading vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVoucher = (voucher: VoucherResType) => {
    onSelectVoucher(voucher);
    onClose();
  };

  const handleClearVoucher = () => {
    onSelectVoucher(null);
    onClose();
  };

  const calculateDiscount = (voucher: VoucherResType) => {
    const discountAmount = totalAmount * voucher.percent;
    return Math.min(discountAmount, voucher.maxDiscountAmount);
  };

  const renderVoucherItem = ({ item }: { item: VoucherResType }) => {
    const discountAmount = calculateDiscount(item);
    const discountPercent = item.percent * 100;
    
    return (
      <TouchableOpacity 
        className="bg-white mb-3 rounded-lg p-4 border border-gray-200"
        onPress={() => handleSelectVoucher(item)}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="bg-core-100 rounded-full p-2 mr-3">
              <Ionicons name="ticket-outline" size={24} color="#FF6B35" />
            </View>
            <View className="flex-shrink">
              <Text className="font-bold text-gray-800">{item.code}</Text>
              <Text className="text-sm text-gray-600">
                Giảm {discountPercent}% tối đa {formatPrice(item.maxDiscountAmount)}
              </Text>
              <Text className="text-sm text-gray-500">
                HSD: {new Date(item.expiryDate).toLocaleDateString('vi-VN')}
              </Text>
            </View>
          </View>
          <Text className="font-bold text-core-500 flex-shrink-0 ml-2">-{formatPrice(discountAmount)} </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-gray-50 rounded-t-3xl h-3/4 px-4 pt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Chọn mã giảm giá</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#FF6B35" />
              <Text className="mt-3 text-gray-600">Đang tải mã giảm giá...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center">
              <Text className="text-red-500">{error}</Text>
              <TouchableOpacity 
                className="mt-4 bg-core-500 px-4 py-2 rounded-lg"
                onPress={loadVouchers}
              >
                <Text className="text-white font-medium">Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : vouchers.length === 0 ? (
            <View className="flex-1 justify-center items-center">
              <Ionicons name="ticket-outline" size={60} color="#9CA3AF" />
              <Text className="mt-4 text-lg text-gray-600 font-medium">Bạn chưa có mã giảm giá nào</Text>
            </View>
          ) : (
            <FlatList
              data={vouchers}
              renderItem={renderVoucherItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <TouchableOpacity 
                  className="bg-white mb-3 rounded-lg p-4 border border-gray-200"
                  onPress={handleClearVoucher}
                >
                  <View className="flex-row items-center">
                    <View className="bg-gray-100 rounded-full p-2 mr-3">
                      <Ionicons name="close-circle-outline" size={24} color="#6B7280" />
                    </View>
                    <Text className="font-medium text-gray-700">Không sử dụng mã giảm giá</Text>
                  </View>
                </TouchableOpacity>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default VoucherModal; 