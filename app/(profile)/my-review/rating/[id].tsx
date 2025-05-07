import { View, Text, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useLocalSearchParams } from 'expo-router/build/hooks'
import { orderApiRequest } from '@/services/orderService'
import { useNavigation } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { OrderDetailType, TicketKind } from '@/schemaValidation/order.schema'
import { formatDate, formatPrice } from '@/libs/utils'
import RatingForm from '@/components/rating/rating-form'

const getTicketKindLabel = (kind: number): string => {
    switch (kind) {
        case TicketKind.Adult:
            return 'Vé người lớn'
        case TicketKind.Child:
            return 'Vé trẻ em'
        case TicketKind.PerGroupOfThree:
            return 'Nhóm 3 người'
        case TicketKind.PerGroupOfFive:
            return 'Nhóm 5 người'
        case TicketKind.PerGroupOfSeven:
            return 'Nhóm 7 người'
        case TicketKind.PerGroupOfTen:
            return 'Nhóm 10 người'
        default:
            return 'Vé tham quan'
    }
}

const RatingAndFeedBack = () => {
    const { id } = useLocalSearchParams()
    const navigation = useNavigation()
    const [orderDetail, setOrderDetail] = useState<OrderDetailType>()
    const [isLoading, setIsLoading] = useState(true)

    // console.log(id)
    const fetchOrderDetail = async (orderId: string) => {
        try {
            setIsLoading(true)
            const orderDetail = await orderApiRequest.getOrderDetail(orderId)
            setOrderDetail(orderDetail)
            console.log(JSON.stringify(orderDetail))
        } catch (err) {
            console.error("Error fetching order details:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            fetchOrderDetail(id as string)
        }
    }, [id])

    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack()
        }
    }

    const formatTourDate = (date: string) => {
        try {
            return formatDate(date)
        } catch {
            return date
        }
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header with shadow */}
            <View className="flex-row items-center p-4 bg-white shadow-sm">
                <TouchableOpacity
                    onPress={handleBack}
                    className="p-2 mr-3 rounded-full"
                >
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold">Đánh giá tour</Text>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                {isLoading ? (
                    <View className="flex-1 items-center justify-center h-60">
                        <ActivityIndicator size="large" color="#0f766e" />
                        <Text className="mt-2 text-gray-600">Đang tải thông tin...</Text>
                    </View>
                ) : (
                    <View className="w-full p-4">
                        {/* Tour Card - teal background style */}
                        <View className="overflow-hidden rounded-lg bg-teal-50 border border-teal-100 mb-5">
                            <View className="flex-row p-4 items-center">
                                <View className="h-12 w-12 bg-teal-100 items-center justify-center rounded-full mr-3">
                                    <Ionicons name="map-outline" size={24} color="#0f766e" />
                                </View>
                                <View className="flex-1 mr-2">
                                    <Text className="text-black text-lg font-bold" numberOfLines={2}>{orderDetail?.tourName}</Text>
                                    <View className="flex-row mt-1">
                                        <Text className="text-black text-sm">
                                            {orderDetail?.tourDate ? formatTourDate(orderDetail.tourDate) : ''}
                                        </Text>
                                    </View>
                                </View>
                                <Image
                                    source={{ uri: orderDetail?.tourThumbnail || 'https://yourdomain.com/images/quynhonbanner.jpg' }}
                                    className="h-16 w-16 rounded-lg"
                                />
                            </View>
                        </View>

                        {/* Tickets Section - Simplified */}
                        {orderDetail?.orderTickets && orderDetail.orderTickets.length > 0 && (
                            <View className="bg-white rounded-lg shadow-sm mb-5">
                                <Text className="text-base font-bold mx-4 my-3">Vé</Text>
                                {orderDetail.orderTickets.map((ticket, index) => (
                                    <View 
                                        key={index} 
                                        className="flex-row justify-between items-center py-2 px-4 border-t border-gray-100"
                                    >
                                        <Text className="text-gray-700">
                                            {getTicketKindLabel(ticket.ticketKind)} x{ticket.quantity}
                                        </Text>
                                        <Text className="text-gray-700 font-semibold">
                                            {formatPrice(ticket.grossCost)}
                                        </Text>
                                    </View>
                                ))}
                                 <View className="flex-row justify-between mt-2 py-3 px-4 border-t border-gray-200">
                                    <Text>Giảm giá: </Text>
                                    <Text className="font-semibold text-green-500">
                                        {formatPrice(orderDetail.discountAmount)}
                                    </Text>
                                </View>
                                <View className="flex-row justify-between mt-2 py-3 px-4 border-t border-gray-200">
                                    <Text className="font-bold">Tổng tiền</Text>
                                    <Text className="font-semibold text-teal-600">
                                        {formatPrice(orderDetail.netCost)}
                                    </Text>
                                </View>
                            </View>
                        )}
                        
                        {/* Rating Form */}
                        {orderDetail && (
                            <RatingForm 
                                tourId={orderDetail.tourId} 
                                tourScheduleId={orderDetail.tourScheduleId}
                                bookingId={id as string}
                            />
                        )}
                    </View>
                )}
            </ScrollView>
        </View>
    )
}

export default RatingAndFeedBack