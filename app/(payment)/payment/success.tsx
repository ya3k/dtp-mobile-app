import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { orderApiRequest } from '@/services/orderService';
import { OrderDetailType } from '@/schemaValidation/order.schema';
import { formatPrice } from '@/libs/utils';

// Order status enum
enum OrderStatus {
  SUBMITTED = 0,
  AWAITING_PAYMENT = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  PAID = 4,
}

// Payment status enum
enum PaymentStatus {
  PENDING = 0,
  PROCESSING = 1,
  PAID = 2,
  CANCELED = 3,
}

// Order status mapping to friendly text
const getOrderStatusText = (status: number): { text: string; color: string } => {
  switch (status) {
    case OrderStatus.PAID:
      return { text: 'Đã thanh toán', color: 'text-green-800' };
    case OrderStatus.COMPLETED:
      return { text: 'Hoàn thành', color: 'text-green-800' };
    case OrderStatus.AWAITING_PAYMENT:
      return { text: 'Chờ thanh toán', color: 'text-yellow-800' };
    case OrderStatus.SUBMITTED:
      return { text: 'Đã xác nhận', color: 'text-blue-800' };
    case OrderStatus.CANCELLED:
      return { text: 'Đã hủy', color: 'text-red-800' };
    default:
      return { text: 'Không xác định', color: 'text-gray-800' };
  }
};

// Payment status mapping to friendly text
const getPaymentStatusText = (status: number): { text: string; color: string } => {
  switch (status) {
    case PaymentStatus.PAID:
      return { text: 'Đã thanh toán', color: 'text-green-800' };
    case PaymentStatus.PROCESSING:
      return { text: 'Đang xử lý', color: 'text-blue-800' };
    case PaymentStatus.PENDING:
      return { text: 'Chờ thanh toán', color: 'text-yellow-800' };
    case PaymentStatus.CANCELED:
      return { text: 'Đã hủy', color: 'text-red-800' };
    default:
      return { text: 'Không xác định', color: 'text-gray-800' };
  }
};

// Ticket kind mapping
const getTicketKindText = (kind: number): string => {
  switch (kind) {
    case 1: return 'Người lớn';
    case 2: return 'Trẻ em';
    case 3: return 'Trẻ nhỏ';
    default: return 'Vé';
  }
};

export default function PaymentSuccess() {
  const [orderDetail, setOrderDetail] = useState<OrderDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { orderId } = useLocalSearchParams();

  const fetchDetailOrder = useCallback(async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await orderApiRequest.getOrderDetail(orderId as string);
      console.log('Order detail response:', JSON.stringify(response));
      setOrderDetail(response);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchDetailOrder();
  }, [fetchDetailOrder]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#FF8C00" />
          <Text className="mt-4 text-gray-600">Đang tải thông tin đơn hàng...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Get the status display info
  const orderStatusInfo = orderDetail ? getOrderStatusText(orderDetail.status) : { text: '', color: '' };
  const paymentStatusInfo = orderDetail ? getPaymentStatusText(orderDetail.paymentStatus) : { text: '', color: '' };
  
  const orderStatusBgColor = orderDetail?.status === OrderStatus.PAID || orderDetail?.status === OrderStatus.COMPLETED
    ? 'bg-green-100'
    : orderDetail?.status === OrderStatus.CANCELLED
    ? 'bg-red-100'
    : 'bg-yellow-100';
    
  const paymentStatusBgColor = orderDetail?.paymentStatus === PaymentStatus.PAID
    ? 'bg-green-100'
    : orderDetail?.paymentStatus === PaymentStatus.CANCELED
    ? 'bg-red-100'
    : orderDetail?.paymentStatus === PaymentStatus.PROCESSING
    ? 'bg-blue-100'
    : 'bg-yellow-100';

  const showSuccessIcon = orderDetail?.status !== OrderStatus.CANCELLED && 
                         orderDetail?.paymentStatus !== PaymentStatus.CANCELED;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <ScrollView className="flex-1">
        <View className="px-4 py-6 items-center">
          {showSuccessIcon ? (
            <Ionicons name="checkmark-circle" size={100} color="#10b981" />
          ) : (
            <Ionicons name="close-circle" size={100} color="#ef4444" />
          )}
          
          <Text className="mt-6 text-2xl font-bold text-gray-800">
            {showSuccessIcon 
              ? 'Thanh toán thành công!' 
              : 'Đơn hàng đã bị hủy!'}
          </Text>
          
          {error ? (
            <Text className="mt-2 text-center text-red-500">{error}</Text>
          ) : orderDetail ? (
            <View className="w-full mt-8">
              {/* Order Card */}
              <View className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
                <View className="bg-orange-50 px-4 py-3 border-b border-orange-100">
                  <Text className="font-bold text-gray-800">Thông tin đơn hàng</Text>
                </View>
                
                <View className="px-4 py-4">
                  {/* Order ID */}
                  <View className="flex-row justify-between items-center mb-3">
                    <Text className="text-gray-500">Mã đơn hàng:</Text>
                    <Text className="font-medium">{orderDetail.code || orderId}</Text>
                  </View>
                  
                  {/* Customer Info */}
                  <View className="mb-4">
                    <Text className="font-medium text-gray-800 mb-2">Thông tin khách hàng</Text>
                    <View className="bg-gray-50 rounded-lg p-3">
                      <Text className="text-gray-700">{orderDetail.name || 'N/A'}</Text>
                      <Text className="text-gray-700">{orderDetail.email || 'N/A'}</Text>
                      <Text className="text-gray-700">{orderDetail.phoneNumber || 'N/A'}</Text>
                    </View>
                  </View>
                  
                  {/* Tour Info */}
                  <View className="mb-4">
                    <Text className="font-medium text-gray-800 mb-2">Tour</Text>
                    <View className="bg-gray-50 rounded-lg p-3">
                      <Text className="font-medium text-gray-800">{orderDetail.tourName}</Text>
                      <Text className="text-gray-600 mt-1">
                        Ngày: {new Date(orderDetail.tourDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                  
                  {/* Tickets */}
                  {orderDetail.orderTickets && orderDetail.orderTickets.length > 0 && (
                    <View className="mb-4">
                      <Text className="font-medium text-gray-800 mb-2">Vé</Text>
                      {orderDetail.orderTickets.map((ticket, index) => (
                        <View 
                          key={index} 
                          className="flex-row justify-between items-center py-2 border-b border-gray-100"
                        >
                          <Text className="text-gray-700">
                            {getTicketKindText(ticket.ticketKind)} x {ticket.quantity}
                          </Text>
                          <Text className="font-medium">
                            {formatPrice(ticket.grossCost)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  {/* Payment Info */}
                  <View className="mt-4 pt-3 border-t border-gray-200">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600">Phương thức thanh toán:</Text>
                      <Text className="font-medium">Online Payment</Text>
                    </View>
                    
                    {/* Order Status */}
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600">Trạng thái đơn hàng:</Text>
                      <View className={`px-2 py-1 rounded ${orderStatusBgColor}`}>
                        <Text className={orderStatusInfo.color + " font-medium"}>
                          {orderStatusInfo.text}
                        </Text>
                      </View>
                    </View>
                    
                    {/* Payment Status */}
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-gray-600">Trạng thái thanh toán:</Text>
                      <View className={`px-2 py-1 rounded ${paymentStatusBgColor}`}>
                        <Text className={paymentStatusInfo.color + " font-medium"}>
                          {paymentStatusInfo.text}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row justify-between items-center mt-3 pt-3 border-t border-gray-200">
                      <Text className="text-lg font-bold text-gray-800">Tổng cộng:</Text>
                      <Text className="text-xl font-bold text-orange-500">
                        {formatPrice(orderDetail.netCost || 0)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            <Text className="mt-2 text-center text-gray-600">
              {orderId
                ? `Đơn hàng ${orderId} của bạn đã được thanh toán thành công.`
                : 'Đơn hàng của bạn đã được thanh toán thành công.'}
            </Text>
          )}

          <TouchableOpacity
            className="mt-8 bg-core-500 px-8 py-4 rounded-xl w-full"
            onPress={() => router.push('/')}
          >
            <Text className="text-white font-bold text-lg text-center">Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 