import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import React, { useCallback, useEffect, useState } from 'react'
import { OrderHistoryType, OrderStatus } from '@/schemaValidation/order.schema'
import { orderApiRequest } from '@/services/orderService';
import { router, useNavigation } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { formatDate, formatPrice } from '@/libs/utils';

const ReviewList = () => {
    const [orders, setOrders] = useState<OrderHistoryType[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState(false)
    const navigation = useNavigation();

    const sortOrdersByDate = (orders: OrderHistoryType[]) => {
        return [...orders].sort((a, b) => {
            // Parse dates from DD-MM-YYYY format
            const parseDate = (dateStr: string) => {
                if (!dateStr) return new Date(0); // Handle undefined/null dates
                const [day, month, year] = dateStr.split("-").map(Number);
                return new Date(year, month - 1, day);
            };

            const dateA = parseDate(a.tourDate);
            const dateB = parseDate(b.tourDate);

            // Sort in descending order (newest first)
            return dateB.getTime() - dateA.getTime();
        });
    };

    const fetchOrders = useCallback(async (forceRefresh = false) => {
        try {
            if (!forceRefresh) {
                setIsLoading(true)
            }
            const ordersData = await orderApiRequest.getOrderHistory();
            const validOrders = ordersData.filter(
                (order: OrderHistoryType) =>
                    order.tourDate && order.status === OrderStatus.COMPLETED
            );
            console.log(JSON.stringify(validOrders))
            console.log(JSON.stringify(validOrders))
            const sortOrder = sortOrdersByDate(validOrders)
            setOrders(sortOrder)

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

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    const handleFbAndRatingPush = (orderId: string) => {
        router.push({
            pathname: '/my-review/rating/[id]',
            params: { id: orderId }
        })
    }

    const renderItem = ({ item: order }: { item: OrderHistoryType }) => (
        <View key={order.orderId} className="mb-4 rounded-lg border border-gray-200 bg-white overflow-hidden">
            <View className="p-4 flex-row">
                <View className="flex-1">
                    <Text className="text-base font-medium text-gray-900 mb-1">
                        {order.tourName}
                    </Text>
                    <Text className="text-sm text-gray-500 mb-2">
                        Ngày: {formatDate(order.tourDate)}
                    </Text>

                    {order.orderTickets.map((ticket) => (
                        <Text key={ticket.code} className="text-xs text-gray-600 mb-1">
                            Vé {ticket.ticketKind === 0 ? 'Người lớn' : 'Trẻ em'} × {ticket.quantity}
                        </Text>
                    ))}

                    <Text className="text-sm text-gray-700 mt-2">
                        Tổng: {formatPrice(order.finalCost)}</Text>

                    {order.canRating && (
                    <TouchableOpacity
                        className="mt-3 bg-teal-600 py-2 px-4 rounded-md self-start flex-row items-center"
                        onPress={() => {
                            handleFbAndRatingPush(order.orderId)
                        }}
                    >
                        <Feather name="edit" size={14} color="#ffffff" />
                        <Text className="text-white text-xs ml-2">Gửi đánh giá</Text>
                    </TouchableOpacity>
                     )}
                </View>

                <View className="ml-3 w-24 h-24 rounded-md overflow-hidden">
                    <Image
                        source={{ uri: order.tourThumbnail || "https://placehold.co/96x96/png" }}
                        className="w-full h-full"
                        resizeMode="cover"
                    />
                </View>
            </View>
        </View>
    );

    const EmptyComponent = () => (
        <View className="flex-1 items-center justify-center py-8">
            <Text className="text-base font-medium text-gray-700 mb-1">Chưa có tour đã hoàn thành</Text>
            <Text className="text-sm text-gray-500 text-center px-8">
                Sẵn sàng cho chuyến đi sắp tới? Hãy trải nghiệm và viết đánh giá
            </Text>
        </View>
    );

    if (isLoading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#0d9488" />
                <Text className="mt-2 text-gray-600">Đang tải dữ liệu...</Text>
            </View>
        )
    }

    if (error) {
        return (
            <View className="items-center">
                <View className="flex-row items-center p-4 bg-white">
                    <TouchableOpacity
                        onPress={handleBack}
                        className="p-2 mr-3"
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text className="text-2xl font-bold text-gray-800">Danh sách tour đã hoàn thành</Text>
                </View>
                <View className='align-middle'>
                    <Text className="text-red-500 mb-4">{error}</Text>
                    <TouchableOpacity
                        className="bg-teal-600 py-2 px-4 rounded-md"
                        onPress={() => fetchOrders()}
                    >
                        <Text className="text-white">Thử lại</Text>
                    </TouchableOpacity>
                </View>

            </View>
        )
    }

    return (
        <View className="flex-1 bg-gray-50">
            <View className="flex-row items-center p-4 bg-white">
                <TouchableOpacity
                    onPress={handleBack}
                    className="p-2 mr-3"
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-800">Danh sách tour đã hoàn thành</Text>
            </View>
            <FlatList
                data={orders}
                renderItem={renderItem}
                keyExtractor={(item) => item.orderId}
                contentContainerStyle={{ padding: 16 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#0d9488"]}
                    />
                }
                ListEmptyComponent={<EmptyComponent />}
            />
        </View>
    )
}

export default ReviewList