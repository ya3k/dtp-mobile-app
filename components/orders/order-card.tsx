import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OrderHistoryType, TicketKind, OrderStatus } from '@/schemaValidation/order.schema';
import { formatDate } from '@/libs/utils';

interface OrderCardProps {
  order: OrderHistoryType;
  onPress?: (orderId: string) => void;
}


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

const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const { label: statusLabel, color: statusColor } = getOrderStatus(order.status);

  return (
    <TouchableOpacity 
      className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden"
      onPress={() => onPress?.(order.orderId)}
      activeOpacity={0.8}
    >
      {/* Tour Image and Name */}
      <View className="flex-row">
        <Image 
          source={{ uri: order.tourThumbnail }} 
          className="h-24 w-24 rounded-tl-xl"
          resizeMode="cover"
        />
        <View className="flex-1 p-3">
          <Text className="text-lg font-bold text-gray-800" numberOfLines={2}>
            {order.tourName}
          </Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text className="text-sm text-gray-600 ml-1">{formatDate(order.tourDate)}</Text>
          </View>
          <Text className={`text-sm font-medium mt-1 ${statusColor}`}>
            {statusLabel}
          </Text>
        </View>
      </View>
      
      {/* Divider */}
      <View className="h-px bg-gray-200 mx-3" />
      
      {/* Ticket Details */}
      <View className="p-3">
        {order.orderTickets.map((ticket, index) => (
          <View key={index} className="flex-row justify-between items-center mb-1">
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
        
        {/* Total */}
        <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-200">
          <Text className="font-bold text-gray-800">Tổng cộng</Text>
          <Text className="text-lg font-bold text-core-500">
            {new Intl.NumberFormat('vi-VN', { 
              style: 'currency', 
              currency: 'VND' 
            }).format(order.finalCost)}
          </Text>
        </View>
      </View>
      
      {/* Footer */}
      <View className="flex-row justify-between bg-gray-50 p-3 border-t border-gray-200">
        <View className="flex-row items-center">
          <Ionicons name="document-text-outline" size={16} color="#666" />
          <Text className="text-gray-600 ml-1">Mã đơn: {order.orderId.substring(0, 8)}...</Text>
        </View>
        {/* {order.canRating && (
          <View className="flex-row items-center">
            <Ionicons name="star-outline" size={16} color="#F59E0B" />
            <Text className="text-yellow-500 ml-1">Đánh giá</Text>
          </View>
        )} */}
      </View>
    </TouchableOpacity>
  );
};

export default OrderCard; 