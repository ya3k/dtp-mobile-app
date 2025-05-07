import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, ToastAndroid } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useNavigation } from 'expo-router'
import { tourApiRequest } from '@/services/tourService'
import uploadApiRequest, { ImageInfo } from '@/services/uploadService'
import { RatingType, FeedBackType } from '@/schemaValidation/tour.schema'
import { useAuthStore } from '@/store/authStore'

// Constants
const MAX_PHOTOS = 6
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

type RatingFormProps = {
    tourId: string
    tourScheduleId: string
    bookingId: string
}

const RatingForm = ({ tourId, tourScheduleId, bookingId }: RatingFormProps) => {
    const navigation = useNavigation()
    const [isLoading, setIsLoading] = useState(false)
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)

    // Form states
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [feedback, setFeedback] = useState('')
    const [images, setImages] = useState<ImageInfo[]>([])

    // Form validation errors
    const [errors, setErrors] = useState({
        rating: '',
        comment: '',
    })

    // Debug authentication token on mount
    useEffect(() => {
        const checkAuth = () => {
            const isAuth = isAuthenticated()
            if (!isAuth) {
                // User is not authenticated
            }
        }

        checkAuth()
    }, [isAuthenticated])

    // Show toast message
    const showToast = (message: string, type: 'success' | 'error') => {
        ToastAndroid.showWithGravityAndOffset(
            message,
            ToastAndroid.SHORT,
            ToastAndroid.BOTTOM,
            0,    // xOffset
            100   // yOffset
          );
    }

    // Pick images from gallery
    const pickImages = async () => {
        if (images.length >= MAX_PHOTOS) {
            showToast('Bạn đã đạt giới hạn ảnh tối đa', 'error')
            return
        }

        const remainingSlots = MAX_PHOTOS - images.length

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: remainingSlots,
                quality: 0.8,
            })

            if (!result.canceled) {
                // Process each selected image
                const selectedImages: ImageInfo[] = await Promise.all(
                    result.assets.map(async (asset: ImagePicker.ImagePickerAsset) => {
                        return await uploadApiRequest.getImageInfoFromUri(asset.uri)
                    })
                )

                // Validate file types and sizes
                const validImages = selectedImages.filter(img => {
                    const isTypeValid =
                        img.type === 'image/jpeg' ||
                        img.type === 'image/png' ||
                        img.type === 'image/gif' ||
                        img.type === 'image/webp'
                    return isTypeValid
                })

                setImages([...images, ...validImages])
            }
        } catch (error) {
            showToast('Không thể chọn ảnh', 'error')
        }
    }

    // Remove image
    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index))
    }

    // Validate form
    const validateForm = () => {
        const newErrors = {
            rating: '',
            comment: '',
        }

        let isValid = true

        if (rating === 0) {
            newErrors.rating = 'Hãy chọn đánh giá sao'
            isValid = false
        }

        if (!comment.trim()) {
            newErrors.comment = 'Đánh giá không được để trống'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    // Upload images to server
    const handleImageUpload = async (): Promise<string[]> => {
        if (images.length > 0) {
            try {
                // Check auth status before upload
                if (!isAuthenticated()) {
                    showToast('Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn', 'error')
                    return []
                }

                // Use the upload service to upload review images
                const response = await uploadApiRequest.uploadReviewImages(images)

                if (response.urls && response.urls.length > 0) {
                    return response.urls
                } else {
                    return []
                }
            } catch (error) {
                showToast('Tải lên ảnh không thành công', 'error')
                return []
            }
        }
        return []
    }

    // Submit rating to server
    const handleRating = async (imageUrls: string[]) => {
        try {
            // Check auth status before rating submission
            if (!isAuthenticated()) {
                showToast('Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn', 'error')
                return
            }

            const ratingData: RatingType = {
                tourId,
                bookingId,
                star: rating,
                comment: comment,
                images: imageUrls,
            }

            const response = await tourApiRequest.postRating(ratingData)

            if (response.status === 200 || response.status === 201) {
                showToast('Đánh giá thành công', 'success')
                navigation.goBack()
            } else {
                showToast('Đánh giá không thành công. Vui lòng thử lại.', 'error')
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase();
                if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
                    showToast('Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                } else {
                    showToast('Đã xảy ra lỗi. Vui lòng thử lại sau.', 'error');
                }
            } else if (typeof error === 'object' && error !== null) {
                showToast('Đã xảy ra lỗi. Vui lòng thử lại sau.', 'error');
            } else {
                showToast('Đã xảy ra lỗi. Vui lòng thử lại sau.', 'error');
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Submit feedback to server
    const handleFeedback = async () => {
        if (!feedback.trim()) {
            return
        }

        try {
            // Check auth status before feedback submission
            if (!isAuthenticated()) {
                return
            }

            const feedbackData: FeedBackType = {
                tourScheduleId: tourScheduleId,
                description: feedback,
            }

            const response = await tourApiRequest.postFeedback(feedbackData)
        } catch (error) {
            // We don't show error for feedback as it's optional
        }
    }

    // Handle form submission
    const onSubmit = async () => {
        // Check auth status before starting submission
        if (!isAuthenticated()) {
            showToast('Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error')
            return
        }

        if (!validateForm()) {
            return
        }

        setIsLoading(true)

        try {
            // Submit feedback first (it's optional)
            await handleFeedback()

            // Upload images and get URLs
            const imageUrls = await handleImageUpload()

            // Submit rating with image URLs
            await handleRating(imageUrls)
        } catch (error: unknown) {
            if (error instanceof Error) {
                const errorMessage = error.message.toLowerCase();
                if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
                    showToast('Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                } else {
                    showToast('Đã xảy ra lỗi. Vui lòng thử lại sau.', 'error');
                }
            } else if (typeof error === 'object' && error !== null) {
                showToast('Đã xảy ra lỗi. Vui lòng thử lại sau.', 'error');
            } else {
                showToast('Đã xảy ra lỗi. Vui lòng thử lại sau.', 'error');
            }

            setIsLoading(false)
        }
    }

    return (
        <ScrollView className="flex-1 p-4 bg-white">
            {/* Star Rating */}
            <View className="items-center mb-6">
                <Text className="text-lg font-medium mb-2">Trải nghiệm của bạn với tour này?</Text>
                <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <TouchableOpacity
                            key={star}
                            onPress={() => setRating(star)}
                            className="p-1"
                        >
                            <Ionicons
                                name={star <= rating ? "star" : "star-outline"}
                                size={36}
                                color={star <= rating ? "#f97316" : "#d1d5db"}
                            />
                        </TouchableOpacity>
                    ))}
                </View>
                {errors.rating ? (
                    <Text className="text-red-500 text-xs mt-1">{errors.rating}</Text>
                ) : null}
            </View>

            {/* Comment */}
            <View className="mb-6">
                <Text className="text-base font-medium mb-2">Đánh giá của bạn</Text>
                <TextInput
                    value={comment}
                    onChangeText={setComment}
                    placeholder="Chia sẻ cảm nhận của bạn về tour này..."
                    multiline
                    className="border border-gray-300 rounded-lg p-3 min-h-[120px] text-base"
                    textAlignVertical="top"
                />
                {errors.comment ? (
                    <Text className="text-red-500 text-xs mt-1">{errors.comment}</Text>
                ) : null}
            </View>

            {/* Feedback (Optional) */}
            <View className="mb-6">
                <Text className="text-base font-medium mb-2">Góp ý thêm về tour (Tùy chọn)</Text>
                <TextInput
                    value={feedback}
                    onChangeText={setFeedback}
                    placeholder="Góp ý..."
                    multiline
                    className="border border-gray-300 rounded-lg p-3 min-h-[120px] text-base"
                    textAlignVertical="top"
                />
            </View>

            {/* Image Upload */}
            <View className="mb-6">
                <Text className="text-base font-medium mb-2">Thêm ảnh (Tùy chọn)</Text>
                <View className="flex-row flex-wrap">
                    {images.map((image, index) => (
                        <View key={index} className="relative h-24 w-24 m-1 rounded-md overflow-hidden border border-gray-300">
                            <Image
                                source={{ uri: image.uri }}
                                className="h-full w-full"
                            />
                            <TouchableOpacity
                                onPress={() => removeImage(index)}
                                className="absolute right-1 top-1 bg-black bg-opacity-50 rounded-full p-1"
                            >
                                <Ionicons name="close" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    ))}

                    {images.length < MAX_PHOTOS && (
                        <TouchableOpacity
                            onPress={pickImages}
                            className="h-24 w-24 m-1 border border-dashed border-gray-300 rounded-md items-center justify-center"
                        >
                            <Ionicons name="cloud-upload-outline" size={24} color="#9ca3af" />
                            <Text className="text-xs text-gray-500 mt-1">Thêm ảnh</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {images.length > 0 && (
                    <Text className="text-sm text-gray-500 mt-2">
                        {images.length} / {MAX_PHOTOS} ảnh đã chọn
                    </Text>
                )}
            </View>

            {/* Buttons */}
            <View className="flex-row justify-between gap-4 mt-4">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="flex-1 py-3 rounded-lg border border-gray-300 items-center justify-center"
                >
                    <Text className="text-black text-lg font-medium">Quay lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onSubmit}
                    disabled={isLoading}
                    className={`flex-1 border border-core-300 py-3 rounded-lg items-center justify-center ${isLoading ? 'bg-teal-700 opacity-70' : 'bg-teal-600'
                        }`}
                >
                    {isLoading ? (
                        <View className="flex-row items-center">
                            <ActivityIndicator size="small" color="#0f766e" />
                            <Text className="text-black font-medium ml-2">Đang xử lý...</Text>
                        </View>
                    ) : (
                        <Text className="text-black text-lg font-medium">Đánh giá ngay</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

export default RatingForm