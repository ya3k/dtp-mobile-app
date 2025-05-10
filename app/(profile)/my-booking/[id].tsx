import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ToastAndroid
} from 'react-native';
import { useRouter, useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OrderDetailType, OrderStatus, TicketKind } from '@/schemaValidation/order.schema';
import { orderApiRequest } from '@/services/orderService';
import { formatDateTime } from '@/libs/utils';
import { useSettingStore } from '@/store/settingStore';

// Function to format date string to DD-MM-YYYY
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString; // Return original string if invalid date
    }

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  } catch (error) {
    return dateString; // Return original string if any error occurs
  }
};

// Function to get ticket kind label
const getTicketKindLabel = (kind: number): string => {
  switch (kind) {
    case TicketKind.Adult:
      return 'Vé người lớn';
    case TicketKind.Child:
      return 'Vé trẻ em';
    case TicketKind.PerGroupOfThree:
      return 'Nhóm 3 người';
    case TicketKind.PerGroupOfFive:
      return 'Nhóm 5 người';
    case TicketKind.PerGroupOfSeven:
      return 'Nhóm 7 người';
    case TicketKind.PerGroupOfTen:
      return 'Nhóm 10 người';
    default:
      return 'Vé tham quan';
  }
};

// Function to get order status label and color
const getOrderStatus = (status: number): { label: string; color: string } => {
  switch (status) {
    case OrderStatus.SUBMITTED:
      return { label: 'Đã đặt', color: 'text-blue-500' };
    case OrderStatus.AWAITING_PAYMENT:
      return { label: 'Chờ thanh toán', color: 'text-yellow-500' };
    case OrderStatus.COMPLETED:
      return { label: 'Hoàn thành', color: 'text-green-600' };
    case OrderStatus.CANCELLED:
      return { label: 'Đã hủy', color: 'text-red-500' };
    case OrderStatus.PAID:
      return { label: 'Đã thanh toán', color: 'text-green-500' };
    default:
      return { label: 'Không xác định', color: 'text-gray-500' };
  }
};

const OrderDetail = () => {
  const { id } = useLocalSearchParams();
  const [orderDetail, setOrderDetail] = useState<OrderDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();
  const { getSettingValueByKey } = useSettingStore();

  const fetchOrderDetail = async () => {
    if (!id) {
      setError('Không tìm thấy mã đơn hàng');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await orderApiRequest.getOrderDetail(id as string);
      console.log(JSON.stringify(data))

      setOrderDetail(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Không thể tải thông tin đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  // Handle initial payment
  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      // Logic for initial payment
      // Add implementation here
    } catch (err) {
      console.error('Error processing payment:', err);
      setError('Không thể xử lý thanh toán. Vui lòng thử lại sau.');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Cancel order
  const handleCancelPaymentByOrderId = async () => {
    try {
      setPaymentLoading(true);
      const response = await orderApiRequest.cancelPaymentByOrderId(id as string);
     
      console.log(JSON.stringify(response))
      // alert('Hủy đơn hàng thành công');
      ToastAndroid.show('Hủy đơn hàng thành công', ToastAndroid.SHORT);
      fetchOrderDetail();
      
      // router.replace('/(profile)/my-booking/order-history');
    } catch (err) {
      console.error('Error canceling order:', err);
      setError('Không thể hủy đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleContinuePayment = () => {
    setPaymentLoading(true);
    //open web view with url https://pay.payos.vn/web/${orderDetail?.paymentLinkId}
    const paymentUrl = `https://pay.payos.vn/web/${orderDetail?.paymentLinkId}`;
    router.push({
      pathname: "/(payment)/payment/webview",
      params: {
        url: paymentUrl,
        orderId: orderDetail?.code // Truyền orderId sang WebView để theo dõi
      }
    });
  };

  // Handle back navigation
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      router.replace('/(profile)/my-booking/order-history');
    }
  };

  // Get cancellation policy settings
  const getCancellationPolicy = () => {
    const noRefundDays = getSettingValueByKey('Thời gian(date) không hoàn tiền(truớc ngày bắt đầu tour)') || 4;
    const freeRefundDays = getSettingValueByKey('Thời gian(date) miễn phí hoàn tiền') || 1;
    const partialRefundPercentage = getSettingValueByKey('Phần trăm hoàn tiền chịu phí') || 70;

    return {
      noRefundDays,
      freeRefundDays,
      partialRefundPercentage
    };
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center p-4 bg-white">
          <TouchableOpacity onPress={handleBack} className="p-2 mr-3">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</Text>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !orderDetail) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center p-4 bg-white">
          <TouchableOpacity onPress={handleBack} className="p-2 mr-3">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</Text>
        </View>
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center">{error || 'Không tìm thấy thông tin đơn hàng'}</Text>
          <TouchableOpacity
            className="mt-4 bg-sky-500 px-6 py-2 rounded-full"
            onPress={handleBack}
          >
            <Text className="text-white">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { label: statusLabel, color: statusColor } = getOrderStatus(orderDetail.status);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center p-4 bg-white">
        <TouchableOpacity onPress={handleBack} className="p-2 mr-3">
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800">Chi tiết đơn hàng</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Order Header */}
        <View className="bg-white p-4 mt-2">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600">Mã đơn hàng: </Text>
            <Text className="font-medium">{orderDetail.code}</Text>
          </View>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-gray-600">Ngày đặt: </Text>
            <Text className="font-medium">{formatDateTime(orderDetail.orderDate)}</Text>
          </View>
          <View className="flex-row justify-between items-center mt-2">
            <Text className="text-gray-600">Trạng thái: </Text>
            <Text className={`font-medium ${statusColor}`}>{statusLabel}</Text>
          </View>
        </View>

        {/* Tour Information */}
        <View className="bg-white p-4 mt-2">
          <Text className="text-lg font-bold mb-3">Thông tin tour</Text>
          <Image
            source={{ uri: orderDetail.tourThumbnail }}
            className="h-40 w-full rounded-lg mb-3"
            resizeMode="cover"
          />
          <Text className="text-lg font-bold text-gray-800">{orderDetail.tourName}</Text>
          <View className="flex-row items-center mt-2">
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text className="text-gray-600 ml-2">Ngày đi: {formatDate(orderDetail.tourDate)}</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View className="bg-white p-4 mt-2">
          <Text className="text-lg font-bold mb-3">Thông tin khách hàng</Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text className="text-gray-600 ml-2">Họ tên: {orderDetail.name}</Text>
          </View>
          <View className="flex-row items-center mt-2">
            <Ionicons name="call-outline" size={16} color="#666" />
            <Text className="text-gray-600 ml-2">Số điện thoại: {orderDetail.phoneNumber}</Text>
          </View>
          <View className="flex-row items-center mt-2">
            <Ionicons name="mail-outline" size={16} color="#666" />
            <Text className="text-gray-600 ml-2">Email: {orderDetail.email}</Text>
          </View>
        </View>

        {/* Ticket Details */}
        <View className="bg-white p-4 mt-2">
          <Text className="text-lg font-bold mb-3">Vé tham quan</Text>
          {orderDetail.orderTickets.map((ticket, index) => (
            <View key={index} className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700">
                {getTicketKindLabel(ticket.ticketKind)} x{ticket.quantity}
              </Text>
              <Text className="text-gray-700 font-medium">
                {new Intl.NumberFormat('vi-VN', {
                  style: 'currency',
                  currency: 'VND'
                }).format(ticket.grossCost)}
              </Text>
            </View>
          ))}
        </View>

        {/* Payment Information */}
        <View className="bg-white p-4 mt-2 mb-4">
          <Text className="text-lg font-bold mb-3">Thông tin thanh toán</Text>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Tổng tiền: </Text>
            <Text className="font-medium">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(orderDetail.grossCost)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-600">Giảm giá: </Text>
            <Text className="font-medium text-green-600">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(orderDetail.discountAmount)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center pt-2 border-t border-gray-200">
            <Text className="font-bold text-gray-800">Thành tiền: </Text>
            <Text className="text-lg font-bold text-core-500">
              {new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
              }).format(orderDetail.netCost)} </Text>
          </View>
        </View>

        {/* Payment Action Buttons based on status - FIXED VERSION */}
        {(orderDetail.status === OrderStatus.SUBMITTED || 
           orderDetail.status === OrderStatus.AWAITING_PAYMENT) && (
          <View className="bg-white p-4 rounded-lg mx-2 mb-6 shadow-sm">
            {orderDetail.status === OrderStatus.SUBMITTED && (
              <View className="flex-col mt-2 mb-2">
                {/* Payment Button - FIXED */}
                <View className="py-1">
                  <TouchableOpacity
                    disabled={paymentLoading}
                    className="bg-core-500 py-3 px-4 rounded-lg"
                    style={{ width: '100%' }}
                    onPress={handlePayment}
                  >
                    {paymentLoading ? (
                      <View className="flex-row justify-center items-center">
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold">Đang xử lý...</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-bold text-center text-base">
                        Thanh toán
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                
                {/* Cancel Button - FIXED */}
                <View className="py-1">
                  <TouchableOpacity
                    disabled={paymentLoading}
                    className="bg-red-500 py-3 px-4 rounded-lg"
                    style={{ width: '100%' }}
                    onPress={handleCancelPaymentByOrderId}
                  >
                    {paymentLoading ? (
                      <View className="flex-row justify-center items-center">
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold">Đang xử lý...</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-bold text-center text-base">
                        Hủy thanh toán
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            
            {orderDetail.status === OrderStatus.AWAITING_PAYMENT && (
              <View className="flex-col mt-2 mb-2">
                {/* Payment Button - FIXED */}
                <View className="py-1">
                  <TouchableOpacity
                    disabled={paymentLoading}
                    className="bg-core-500 py-3 px-4 rounded-lg"
                    style={{ width: '100%' }}
                    onPress={handleContinuePayment}
                  >
                    {paymentLoading ? (
                      <View className="flex-row justify-center items-center">
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold">Đang xử lý...</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-bold text-center text-base">
                        Thanh toán
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
                
                {/* Cancel Button - FIXED */}
                <View className="py-1">
                  <TouchableOpacity
                    disabled={paymentLoading}
                    className="bg-red-500 py-3 px-4 rounded-lg"
                    style={{ width: '100%' }}
                    onPress={handleCancelPaymentByOrderId}
                  >
                    {paymentLoading ? (
                      <View className="flex-row justify-center items-center">
                        <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                        <Text className="text-white font-bold">Đang xử lý...</Text>
                      </View>
                    ) : (
                      <Text className="text-white font-bold text-center text-base">
                        Hủy thanh toán
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        
        {orderDetail.status === OrderStatus.PAID && (
          <View className="bg-white p-4 rounded-lg mx-2 mb-6 shadow-sm">
            <View className="flex-row flex-wrap items-start gap-3">
              <View className="mb-2 w-full">
                <TouchableOpacity
                  disabled={paymentLoading}
                  className="bg-red-500 py-3 px-4 rounded-lg"
                  style={{ width: '100%' }}
                  onPress={handleCancelPaymentByOrderId}
                >
                  {paymentLoading ? (
                    <View className="flex-row justify-center items-center">
                      <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                      <Text className="text-white font-bold">Đang xử lý...</Text>
                    </View>
                  ) : (
                    <Text className="text-white font-bold text-center text-base">
                      Hủy tour
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
              
              <View className="flex-1">
                <View>
                  {(() => {
                    const { noRefundDays, freeRefundDays, partialRefundPercentage } = getCancellationPolicy();
                    return (
                      <>
                        <Text className="text-sm text-gray-600 mb-2">
                          • Tour đã thanh toán sẽ không được hoàn tiền nếu hủy trong vòng {noRefundDays} ngày trước khi tour bắt đầu.
                        </Text>
                        <Text className="text-sm text-gray-600 mb-2">
                          • Nếu hủy tour trong vòng {freeRefundDays} ngày sau khi thanh toán, bạn sẽ được hoàn tiền 100% và {partialRefundPercentage}% cho thời gian sau đó..
                        </Text>
                       
                      </>
                    );
                  })()}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default OrderDetail;