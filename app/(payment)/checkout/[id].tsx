import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, SafeAreaView, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/libs/utils';
import { Ionicons } from '@expo/vector-icons';
import { orderApiRequest } from '@/services/orderService';
import { OrderRequestType, orderRequestSchema, TicketKind } from '@/schemaValidation/order.schema';
import * as Linking from 'expo-linking';
import { PaymentRequestType } from '@/schemaValidation/payment.schema';
import Constants from 'expo-constants';
import { z } from 'zod';

import { VoucherResType } from '@/schemaValidation/voucher.schema';
import VoucherModal from '@/components/voucher/VoucherModal';

// Utility function to show all ticket types (for reference)
const showAllTicketTypes = () => {
    const ticketTypes = [
        { value: TicketKind.Adult, label: 'Vé người lớn' },
        { value: TicketKind.Child, label: 'Vé trẻ em' },
        { value: TicketKind.PerGroupOfThree, label: 'Nhóm 3 người' },
        { value: TicketKind.PerGroupOfFive, label: 'Nhóm 5 người' },
        { value: TicketKind.PerGroupOfSeven, label: 'Nhóm 7 người' },
        { value: TicketKind.PerGroupOfTen, label: 'Nhóm 10 người' },
    ];
    
    return ticketTypes;
};

// Function to get ticket kind label
const getTicketKindLabel = (kind: number): string => {
    switch (kind) {
        case 0: // TicketKind.Adult
            return 'Vé người lớn';
        case 1: // TicketKind.Child
            return 'Vé trẻ em';
        case 2: // TicketKind.PerGroupOfThree
            return 'Nhóm 3 người';
        case 3: // TicketKind.PerGroupOfFive
            return 'Nhóm 5 người';
        case 4: // TicketKind.PerGroupOfSeven
            return 'Nhóm 7 người';
        case 5: // TicketKind.PerGroupOfTen
            return 'Nhóm 10 người';
        default:
            return 'Vé tham quan';
    }
};

// Form validation schema based on orderRequestSchema
const checkoutFormSchema = z.object({
    name: z.string().min(1, { message: "Họ và tên không được để trống" }),
    email: z.string().email({ message: "Email không hợp lệ" }),
    phoneNumber: z.string().min(1, { message: "Số điện thoại không được để trống" })
        .regex(/^(\+84|84|0)[3|5|7|8|9]+[0-9]{8}$/, { message: "Số điện thoại không hợp lệ" }),
    voucherCode: z.string().optional(),
});

type CheckoutFormType = z.infer<typeof checkoutFormSchema>;

export default function Checkout() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    //   const { user } = useAuth();
    const { directCheckoutItem, setDirectCheckoutItem } = useCartStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof CheckoutFormType, string>>>({});
    const [success, setSuccess] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [voucherModalVisible, setVoucherModalVisible] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<VoucherResType | null>(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    // Form state
    const [form, setForm] = useState<CheckoutFormType>({
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

    useEffect(() => {
        if (selectedVoucher) {
            // Update form voucher code
            setForm(prev => ({ ...prev, voucherCode: selectedVoucher.code }));
            
            // Calculate discount amount
            if (directCheckoutItem) {
                const discountValue = directCheckoutItem.totalPrice * selectedVoucher.percent;
                const finalDiscount = Math.min(discountValue, selectedVoucher.maxDiscountAmount);
                setDiscountAmount(finalDiscount);
            }
        } else {
            setForm(prev => ({ ...prev, voucherCode: '' }));
            setDiscountAmount(0);
        }
    }, [selectedVoucher, directCheckoutItem]);

    const handleDeepLink = (event: { url: string }) => {
        // Extract the path from the URL
        const { path, queryParams } = Linking.parse(event.url);

        console.log('Deep link received:', event.url, path, queryParams);

        // Handle the return from payment gateway
        if (path?.includes('success')) {
            const successOrderId = typeof queryParams?.orderId === 'string' 
                ? queryParams.orderId 
                : (Array.isArray(queryParams?.orderId) ? queryParams.orderId[0] : (orderId || 'unknown'));
                
            router.replace({
                pathname: "/(payment)/payment/success",
                params: { orderId: successOrderId }
            });
        } else if (path?.includes('cancel')) {
            router.replace({
                pathname: "/(payment)/payment/cancel",
                params: { orderId: queryParams?.orderId }
            });
        }
    };

    const handleInputChange = (field: keyof CheckoutFormType, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear the error for this field when the user types
        if (formErrors[field]) {
            setFormErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        try {
            checkoutFormSchema.parse(form);
            setFormErrors({});
            return true;
        } catch (err) {
            if (err instanceof z.ZodError) {
                const errors: Partial<Record<keyof CheckoutFormType, string>> = {};
                err.errors.forEach((error) => {
                    if (error.path[0]) {
                        errors[error.path[0] as keyof CheckoutFormType] = error.message;
                    }
                });
                setFormErrors(errors);
            }
            return false;
        }
    };

    const handleSubmit = async () => {
        try {
            setError('');
            
            // Validate form with Zod
            if (!validateForm()) {
                return;
            }

            setIsLoading(true);

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

            // Validate order request against schema
            try {
                orderRequestSchema.parse(orderRequest);
            } catch (zodError) {
                if (zodError instanceof z.ZodError) {
                    throw new Error('Dữ liệu đặt hàng không hợp lệ: ' + zodError.errors.map(e => e.message).join(', '));
                }
                throw zodError;
            }

            // Submit order
            const response = await orderApiRequest.postOrder(orderRequest);
            setOrderId(response.id);
            console.log(`Order created with ID: ${response.id}`);

            // Handle successful order - chuyển ngay sang trạng thái "Chuyển đến trang thanh toán"
            // không tắt isLoading để tránh hiển thị lại "Đang xử lý đơn hàng"
            setSuccess(true);
            
            // Lưu dữ liệu tạm thời để dùng khi direct checkout item bị xóa
            const savedScheduleId = directCheckoutItem.scheduleId;
            
            // Generate success and cancel URLs for payment
            const scheme = Constants.manifest?.scheme || 'dtpmobile';
            const returnUrl = `${scheme}://payment/success?orderId=${response.id}`;
            const cancelUrl = `${scheme}://payment/cancel`;
            
            console.log('Return URL:', returnUrl);
            console.log('Cancel URL:', cancelUrl);

            // Chuẩn bị payment request
            const paymentRequest: PaymentRequestType = {
                bookingId: response.id,
                responseUrl: {
                    returnUrl,
                    cancelUrl
                }
            };

            // Giữ nguyên trạng thái success và không set isLoading lại
            // để tránh hiển thị lại "Đang xử lý đơn hàng"
            setTimeout(async () => {
                try {
                    // Gọi API payment và xử lý kết quả
                    const response = await orderApiRequest.payment(paymentRequest);

                    if (response && typeof response === 'string') {
                        router.replace({
                            pathname: "/(payment)/payment/webview",
                            params: { 
                                url: response,
                                orderId: paymentRequest.bookingId
                            }
                        });
                        // Chỉ xóa dữ liệu sau khi đã điều hướng thành công
                        setTimeout(() => {
                            setDirectCheckoutItem(null);
                        }, 500);
                    } else if (response && typeof response === 'object' && 'url' in response) {
                        router.replace({
                            pathname: "/(payment)/payment/webview",
                            params: { 
                                url: response.url as string,
                                orderId: paymentRequest.bookingId
                            }
                        });
                        setTimeout(() => {
                            setDirectCheckoutItem(null);
                        }, 500);
                    } else {
                        throw new Error('Không nhận được đường dẫn thanh toán');
                    }
                } catch (err) {
                    console.error('Error during payment processing:', err);
                    setIsLoading(false);
                    setSuccess(false);
                    Alert.alert(
                        'Lỗi thanh toán',
                        'Không thể tiến hành thanh toán. Vui lòng thử lại sau.',
                        [{ text: 'OK' }]
                    );
                }
            }, 1500);
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi khi thanh toán');
            setIsLoading(false);
        }
    };

    const handleProceedToPayment = () => {
        // This would be the function to navigate to payment page after form validation
        // For now, we'll just call submit which will handle the order creation
        handleSubmit();
    };

    const handleSelectVoucher = (voucher: VoucherResType | null) => {
        setSelectedVoucher(voucher);
    };

    const handleOpenVoucherModal = () => {
        setVoucherModalVisible(true);
    };

    // Gộp cả hai trạng thái vào một điều kiện hiển thị để có luồng UX mượt mà hơn
    if (isLoading || success) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <StatusBar barStyle="dark-content" backgroundColor="white" />
                <View className="flex-1 justify-center items-center px-4">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="mt-4 text-lg text-gray-700 font-medium">
                        {success ? "Chuyển đến trang thanh toán..." : "Đang xử lý ..."}
                    </Text>
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

    // Calculate final amount to pay
    const finalAmount = directCheckoutItem.totalPrice - discountAmount;

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
                                    <Text className="text-gray-700">{getTicketKindLabel(ticket.kind)} x {ticket.quantity}</Text>
                                    <Text className="font-semibold">{formatPrice(ticket.price * ticket.quantity)}</Text>
                                </View>
                            ))}

                        {/* Display discount if voucher is applied */}
                        {discountAmount > 0 && (
                            <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
                                <Text className="text-green-600">Giảm giá:</Text>
                                <Text className="font-semibold text-green-600">-{formatPrice(discountAmount)}</Text>
                            </View>
                        )}

                        <View className="flex-row justify-between items-center pt-3 mt-2">
                            <Text className="text-lg font-bold text-gray-800">Tổng cộng:</Text>
                            <Text className="text-xl font-bold text-orange-500">
                                {formatPrice(finalAmount)}
                            </Text>
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
                            <Text className="text-gray-700 mb-1 font-medium">Họ và tên</Text>
                            <TextInput
                                className={`border ${formErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 bg-white`}
                                value={form.name}
                                onChangeText={(text) => handleInputChange('name', text)}
                                placeholder="Nhập họ và tên"
                            />
                            {formErrors.name && (
                                <Text className="text-red-500 text-sm mt-1">{formErrors.name}</Text>
                            )}
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 mb-1 font-medium">Email</Text>
                            <TextInput
                                className={`border ${formErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 bg-white`}
                                value={form.email}
                                onChangeText={(text) => handleInputChange('email', text)}
                                keyboardType="email-address"
                                placeholder="Nhập email"
                            />
                            {formErrors.email && (
                                <Text className="text-red-500 text-sm mt-1">{formErrors.email}</Text>
                            )}
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 mb-1 font-medium">Số điện thoại</Text>
                            <TextInput
                                className={`border ${formErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-lg p-3 bg-white`}
                                value={form.phoneNumber}
                                onChangeText={(text) => handleInputChange('phoneNumber', text)}
                                keyboardType="phone-pad"
                                placeholder="Nhập số điện thoại"
                            />
                            {formErrors.phoneNumber && (
                                <Text className="text-red-500 text-sm mt-1">{formErrors.phoneNumber}</Text>
                            )}
                        </View>

                        <View className="mb-4">
                            <Text className="text-gray-700 mb-1 font-medium">Mã giảm giá</Text>
                            <TouchableOpacity 
                                className="border border-gray-300 rounded-lg p-3 bg-white flex-row justify-between items-center"
                                onPress={handleOpenVoucherModal}
                            >
                                <Text className={selectedVoucher ? "text-black" : "text-gray-400"}>
                                    {selectedVoucher ? selectedVoucher.code : "Chọn mã giảm giá"}
                                </Text>
                                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                            </TouchableOpacity>
                            {selectedVoucher && (
                                <Text className="text-green-600 text-sm mt-1">
                                    Giảm {selectedVoucher.percent * 100}% - Tối đa {formatPrice(selectedVoucher.maxDiscountAmount)}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    className="bg-core-500 mx-4 mt-6 mb-8 p-4 rounded-xl"
                    onPress={handleProceedToPayment}
                    disabled={isLoading}
                >
                    <Text className="text-white text-center font-bold text-lg">Thanh toán</Text>
                </TouchableOpacity>
            </ScrollView>

            <VoucherModal 
                isVisible={voucherModalVisible}
                onClose={() => setVoucherModalVisible(false)}
                onSelectVoucher={handleSelectVoucher}
                totalAmount={directCheckoutItem.totalPrice}
            />
        </SafeAreaView>
    );
}
