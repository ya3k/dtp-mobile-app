import React, { useEffect, useState, useCallback } from 'react'
import { 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator,
  TouchableOpacity 
} from 'react-native'
import { useRouter, useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { OrderHistoryType } from '@/schemaValidation/order.schema'
import { orderApiRequest } from '@/services/orderService'
import OrderCard from '@/components/orders/order-card'

const OrderHistoryScreen = () => {
  const [orders, setOrders] = useState<OrderHistoryType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const navigation = useNavigation()

  const fetchOrders = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        setIsLoading(true)
      }
      const ordersData = await orderApiRequest.getOrderHistory()
      setOrders(ordersData)
      setError(null)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchOrders(true)
  }, [fetchOrders])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleOrderPress = (orderId: string) => {
    // Navigate to order detail using the proper path format for Expo Router
    router.push({
      pathname: "/(profile)/my-booking/[id]",
      params: { id: orderId }
    })
  }

  // Handle back navigation
  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      router.push('/(tabs)/account')
    }
  }

  const renderEmptyList = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center py-20">
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      )
    }
    
    return (
      <View className="flex-1 justify-center items-center py-20">
        <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
        <Text className="text-gray-400 text-lg mt-4">Bạn chưa có đơn hàng nào</Text>
        <TouchableOpacity 
          className="mt-6 bg-sky-500 px-6 py-3 rounded-full"
          onPress={() => router.push('/(tabs)')}
        >
          <Text className="text-white font-medium">Đặt tour ngay</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center p-4 bg-white">
        <TouchableOpacity 
          onPress={handleBack}
          className="p-2 mr-3"
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800">Lịch sử đơn hàng</Text>
      </View>

      {error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center">{error}</Text>
          <TouchableOpacity 
            className="mt-4 bg-sky-500 px-6 py-2 rounded-full"
            onPress={onRefresh}
          >
            <Text className="text-white">Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={({ item }) => (
            <OrderCard 
              order={item} 
              onPress={handleOrderPress}
            />
          )}
          keyExtractor={(item) => item.orderId}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0ea5e9"]}
            />
          }
        />
      )}
    </SafeAreaView>
  )
}

export default OrderHistoryScreen