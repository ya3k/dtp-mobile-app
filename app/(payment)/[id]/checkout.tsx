import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/libs/utils';
import { Ionicons } from '@expo/vector-icons';
import { orderApiRequest } from '@/services/orderService';
import { OrderRequestType } from '@/schemaValidation/order.schema';
import useAuth from '@/hooks/useAuth';
import * as Linking from 'expo-linking';
import { PaymentRequestType } from '@/schemaValidation/payment.schema';
import Constants from 'expo-constants';

export default function Checkout() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    //   const { user } = useAuth();
    const { directCheckoutItem, setDirectCheckoutItem } = useCartStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        voucherCode: '',
    });

    useEffect(() => {
        // Redirect if no ID matches or no direct checkout item
        if (!id || !directCheckoutItem || directCheckoutItem.scheduleId !== id) {
            router.back();
        }

        // Set up a URL listener for handling the return from payment gateway
        const subscription = Linking.addEventListener('url', handleDeepLink);

        return () => {
            subscription.remove();
        };
    }, [id, directCheckoutItem]);

    const handleDeepLink = (event: { url: string }) => {
        // Extract the path from the URL
        const { path, queryParams } = Linking.parse(event.url);

        console.log('Deep link received:', event.url, path, queryParams);

        // Handle the return from payment gateway
        if (path?.includes('success')) {
            router.replace({
                pathname: "/payment/success",
                params: { orderId: queryParams?.orderId }
            });
        } else if (path?.includes('cancel')) {
            router.replace({
                pathname: "/payment/cancel",
                params: { orderId: queryParams?.orderId }
            });
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            setError('');

            // Validate form
            if (!form.name || !form.email || !form.phoneNumber) {
                throw new Error('Vui lòng điền đầy đủ thông tin');
            }

            if (!directCheckoutItem) {
                throw new Error('Không tìm thấy thông tin đặt hàng');
            }

            // Prepare order request
            const orderRequest: OrderRequestType = {
                tourScheduleId: directCheckoutItem.scheduleId,
                name: form.name,
                email: form.email,
                phoneNumber: form.phoneNumber,
                voucherCode: form.voucherCode || '', // Ensure it's never undefined
                tickets: directCheckoutItem.tickets
                    .filter(ticket => ticket.quantity > 0)
                    .map(ticket => ({
                        ticketTypeId: ticket.id,
                        quantity: ticket.quantity
                    }))
            };

            // Submit order
            const response = await orderApiRequest.postOrder(orderRequest);
            setOrderId(response.id);
            console.log(`Order created with ID: ${response.id}`);

            // Handle successful order
            setSuccess(true);

            // Generate success and cancel URLs for payment
            // Lấy scheme từ app.json hoặc sử dụng giá trị mặc định là 'dtpmobile'
            const scheme = Constants.manifest?.scheme || 'dtpmobile';
            
            // Use simple URL format for server compatibility
            const returnUrl = `${scheme}://payment/success`;
            const cancelUrl = `${scheme}://payment/cancel?orderId=${response.id}`;
            
            console.log('Return URL:', returnUrl);
            console.log('Cancel URL:', cancelUrl);

            // Proceed to payment
            setTimeout(() => {
                // Prepare payment request
                const paymentRequest: PaymentRequestType = {
                    bookingId: response.id,
                    responseUrl: {
                        returnUrl,
                        cancelUrl
                    }
                };

                // Call payment API
                processPayment(paymentRequest);

                // Clear direct checkout item after successful order
                setDirectCheckoutItem(null);
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi khi thanh toán');
        } finally {
            setIsLoading(false);
        }
    };

    const processPayment = async (paymentRequest: PaymentRequestType) => {
        try {
            const response = await orderApiRequest.payment(paymentRequest);

            if (response && typeof response === 'string') {
                // Chuyển đến WebView với URL thanh toán và ID đơn hàng
                router.push({
                    pathname: "/payment/webview",
                    params: { 
                        url: response,
                        orderId: paymentRequest.bookingId // Truyền orderId sang WebView để theo dõi
                    }
                });
            } else if (response && typeof response === 'object' && 'url' in response) {
                // Trường hợp response trả về là object có thuộc tính url
                router.push({
                    pathname: "/payment/webview",
                    params: { 
                        url: response.url as string,
                        orderId: paymentRequest.bookingId
                    }
                });
            } else {
                throw new Error('Không nhận được đường dẫn thanh toán');
            }
        } catch (err: any) {
            console.error('Payment error:', err);
            Alert.alert(
                'Lỗi thanh toán',
                'Không thể tiến hành thanh toán. Vui lòng thử lại sau.',
                [{ text: 'OK' }]
            );
        }
    };


    const handleProceedToPayment = () => {
        // This would be the function to navigate to payment page after form validation
        // For now, we'll just call submit which will handle the order creation
        handleSubmit();
    };

    // Loading state when processing order
    if (isLoading) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="mt-4 text-lg text-gray-700 font-medium">Đang xử lý đơn hàng...</Text>
                </View>
            </SafeAreaView>
        );
    }

    // Success state
    if (success) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <View className="flex-1 justify-center items-center px-4">
                    <Ionicons name="checkmark-circle" size={80} color="#10b981" />
                    <Text className="mt-4 text-2xl font-bold text-gray-800">Đặt hàng thành công!</Text>
                    <Text className="mt-2 text-center text-gray-600">Đơn hàng của bạn đã được xác nhận.</Text>
                    <Text className="mt-1 text-center text-gray-600">Chuyển đến trang thanh toán...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!directCheckoutItem) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <View className="flex-1 justify-center items-center px-4">
                    <Text className="text-lg text-red-500">Không tìm thấy thông tin đặt hàng</Text>
                    <TouchableOpacity
                        className="mt-4 bg-blue-500 px-6 py-3 rounded-lg"
                        onPress={() => router.back()}
                    >
                        <Text className="text-white font-semibold">Quay lại</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            <ScrollView className="flex-1">
                <View className="flex-row justify-between items-center px-4 py-4 bg-white border-b border-gray-200">
                    <TouchableOpacity onPress={() => router.back()} className="p-2">
                        <Ionicons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-800">Xác nhận đơn hàng</Text>
                    <View className="w-8" />
                </View>

                <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm overflow-hidden">
                    <View className="p-4 border-b border-gray-100">
                        <Text className="text-lg font-bold text-gray-800">Tóm tắt đơn hàng</Text>
                    </View>

                    <View className="p-4">
                        <Text className="font-bold text-gray-800 text-lg">{directCheckoutItem.tourTitle}</Text>
                        <Text className="text-gray-600 mt-1">
                            Ngày: {new Date(directCheckoutItem.day).toLocaleDateString('vi-VN')}
                        </Text>

                        {directCheckoutItem.tickets
                            .filter(ticket => ticket.quantity > 0)
                            .map(ticket => (
                                <View key={ticket.id} className="flex-row justify-between items-center py-2 border-b border-gray-100">
                                    <Text className="text-gray-700">{ticket.kind} x {ticket.quantity}</Text>
                                    <Text className="font-semibold">{formatPrice(ticket.price * ticket.quantity)}</Text>
                                </View>
                            ))}

                        <View className="flex-row justify-between items-center pt-3 mt-2">
                            <Text className="text-lg font-bold text-gray-800">Tổng cộng:</Text>
                            <Text className="text-xl font-bold text-orange-500">{formatPrice(directCheckoutItem.totalPrice)}</Text>
                        </View>
                    </View>
                </View>

                <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm overflow-hidden">
                    <View className="p-4 border-b border-gray-100">
                        <Text className="text-lg font-bold text-gray-800">Thông tin khách hàng</Text>
                    </View>

                    {error ? (
                        <View className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <Text className="text-red-600">{error}</Text>
                        </View>
                    ) : null}

                    <View className="p-4">
                        <View className="mb-4">
                            <Text className="text-gray-700 mb-1">Họ và tên</Text>
                            <TextInput
                                className="border border-gray-300 rounded-lg p-3 bg-white"
                                value={form.name}
                                onChangeText={(text) => handleInputChange('name', text)}
                                placeholder="Nhập họ và tên"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 mb-1">Email</Text>
                            <TextInput
                                className="border border-gray-300 rounded-lg p-3 bg-white"
                                value={form.email}
                                onChangeText={(text) => handleInputChange('email', text)}
                                keyboardType="email-address"
                                placeholder="Nhập email"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 mb-1">Số điện thoại</Text>
                            <TextInput
                                className="border border-gray-300 rounded-lg p-3 bg-white"
                                value={form.phoneNumber}
                                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                                keyboardType="phone-pad"
                                placeholder="Nhập số điện thoại"
                            />
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 mb-1">Mã giảm giá (nếu có)</Text>
                            <TextInput
                                className="border border-gray-300 rounded-lg p-3 bg-white"
                                value={form.voucherCode}
                                onChangeText={(text) => handleInputChange('voucherCode', text)}
                                placeholder="Nhập mã giảm giá"
                            />
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    className="bg-orange-500 mx-4 mt-6 mb-8 p-4 rounded-xl"
                    onPress={handleProceedToPayment}
                    disabled={isLoading}
                >
                    <Text className="text-white text-center font-bold text-lg">Thanh toán</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}
