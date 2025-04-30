import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { useNavigation } from 'expo-router'
import { tourApiRequest } from '@/services/tourService'
import uploadApiRequest, { ImageInfo } from '@/services/uploadService'
import { RatingType, FeedBackType } from '@/schemaValidation/tour.schema'
import { getAccessToken } from '@/libs/tokenHelper'

// Constants
const MAX_PHOTOS = 6
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

type RatingFormProps = {
    tourId: string
    tourScheduleId: string
}

const RatingForm = ({ tourId, tourScheduleId }: RatingFormProps) => {
    const navigation = useNavigation()
    const [isLoading, setIsLoading] = useState(false)

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
        const checkAuthToken = async () => {
            try {
                const token = await getAccessToken()
                console.log('[DEBUG] Current authentication token:', token ? token.substring(0, 15) + '...' : 'No token')
                
                if (!token) {
                    console.error('[DEBUG] WARNING: No authentication token found. This will cause 401 errors when calling API.')
                }
            } catch (error) {
                console.error('[DEBUG] Error checking auth token:', error)
            }
        }
        
        checkAuthToken()
    }, [])

    // Show toast message
    const showToast = (message: string, type: 'success' | 'error') => {
        Alert.alert(
            type === 'success' ? 'Thành công' : 'Lỗi',
            message,
            [{ text: 'OK' }]
        )
    }

    // Pick images from gallery
    const pickImages = async () => {
        if (images.length >= MAX_PHOTOS) {
            showToast('Bạn đã đạt giới hạn ảnh tối đa', 'error')
            return
        }

        const remainingSlots = MAX_PHOTOS - images.length
        console.log('[DEBUG] Image picker - remaining slots:', remainingSlots)

        try {
            console.log('[DEBUG] Launching image library...')
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsMultipleSelection: true,
                selectionLimit: remainingSlots,
                quality: 0.8,
            })

            console.log('[DEBUG] Image picker result - canceled:', result.canceled)
            console.log('[DEBUG] Image picker result - assets count:', result.assets?.length || 0)

            if (!result.canceled) {
                // Process each selected image
                console.log('[DEBUG] Processing selected images...')
                const selectedImages: ImageInfo[] = await Promise.all(
                    result.assets.map(async (asset: ImagePicker.ImagePickerAsset) => {
                        console.log('[DEBUG] Processing asset:', asset.uri)
                        return await uploadApiRequest.getImageInfoFromUri(asset.uri)
                    })
                )

                // Validate file types and sizes
                console.log('[DEBUG] Validating images types...')
                const validImages = selectedImages.filter(img => {
                    const isTypeValid =
                        img.type === 'image/jpeg' ||
                        img.type === 'image/png' ||
                        img.type === 'image/gif' ||
                        img.type === 'image/webp'

                    console.log('[DEBUG] Image validation -', img.uri, '- type:', img.type, '- valid:', isTypeValid)
                    return isTypeValid
                })

                console.log('[DEBUG] Adding', validImages.length, 'valid images to state')
                setImages([...images, ...validImages])
            }
        } catch (error) {
            console.error('[DEBUG] Error picking images:', error)
            showToast('Không thể chọn ảnh', 'error')
        }
    }

    // Remove image
    const removeImage = (index: number) => {
        console.log('[DEBUG] Removing image at index:', index)
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

        console.log('[DEBUG] Form validation - valid:', isValid, 'errors:', newErrors)
        setErrors(newErrors)
        return isValid
    }

    // Upload images to server
    const handleImageUpload = async (): Promise<string[]> => {
        console.log('[DEBUG] handleImageUpload - images count:', images.length)

        if (images.length > 0) {
            try {
                // Check auth token before upload
                const token = await getAccessToken()
                console.log('[DEBUG] Upload using token:', token ? `${token.substring(0, 10)}...` : 'No token found')
                
                if (!token) {
                    console.error('[DEBUG] ERROR: No auth token for image upload. Will cause 401 error.')
                }
                
                console.log('[DEBUG] Starting image upload...', images.map(img => img.uri))

                // Use the upload service to upload review images
                const response = await uploadApiRequest.uploadReviewImages(images)

                console.log('[DEBUG] Upload response:', JSON.stringify(response))

                if (response.urls && response.urls.length > 0) {
                    console.log('[DEBUG] Upload successful. Received URLs:', response.urls)
                    return response.urls
                } else {
                    console.error('[DEBUG] No URL returned from review image upload')
                    return []
                }
            } catch (error) {
                console.error('[DEBUG] Error uploading review images:', error)
                if (error instanceof Error) {
                    console.error('[DEBUG] Error message:', error.message)
                    console.error('[DEBUG] Error stack:', error.stack)
                }
                showToast('Tải lên ảnh không thành công', 'error')
                return []
            }
        }
        return []
    }

    // Submit rating to server
    const handleRating = async (imageUrls: string[]) => {
        try {
            // Check auth token before rating submission
            const token = await getAccessToken()
            console.log('[DEBUG] Rating submission using token:', token ? `${token.substring(0, 10)}...` : 'No token found')
            
            if (!token) {
                console.error('[DEBUG] ERROR: No auth token for rating submission. Will cause 401 error.')
                showToast('Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn', 'error')
                return
            }
            
            const ratingData: RatingType = {
                tourId,
                star: rating, 
                comment: comment,
                images: imageUrls,
            }

            console.log('[DEBUG] Submitting rating with data:', JSON.stringify(ratingData))

            const response = await tourApiRequest.postRating(ratingData)
            console.log('[DEBUG] Rating submission response:', JSON.stringify(response))

            if (response.status === 200 || response.status === 201) {
                console.log('[DEBUG] Rating submission successful')
                showToast('Đánh giá thành công', 'success')
                navigation.goBack()
            } else {
                console.error('[DEBUG] Rating submission failed with status:', response.status)
                showToast('Đánh giá không thành công. Vui lòng thử lại.', 'error')
            }
        } catch (error: unknown) {
            console.error('[DEBUG] Error submitting rating:', error)
            
            if (error instanceof Error) {
                console.error('[DEBUG] Error message:', error.message)
                console.error('[DEBUG] Error stack:', error.stack)
                
                const errorMessage = error.message.toLowerCase();
                if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
                    showToast('Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                } else {
                    showToast('Đã xảy ra lỗi. Vui lòng thử lại sau.', 'error');
                }
            } else if (typeof error === 'object' && error !== null) {
                console.error('[DEBUG] Error details:', JSON.stringify(error))
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
            console.log('[DEBUG] Skipping feedback submission - empty feedback')
            return
        }

        try {
            // Check auth token before feedback submission
            const token = await getAccessToken()
            console.log('[DEBUG] Feedback submission using token:', token ? `${token.substring(0, 10)}...` : 'No token found')
            
            if (!token) {
                console.error('[DEBUG] ERROR: No auth token for feedback submission. Will cause 401 error.')
                return
            }
            
            const feedbackData: FeedBackType = {
                tourScheduleId: tourScheduleId,
                description: feedback,
            }

            console.log('[DEBUG] Submitting feedback with data:', JSON.stringify(feedbackData))

            const response = await tourApiRequest.postFeedback(feedbackData)
            console.log('[DEBUG] Feedback submission response:', JSON.stringify(response))
        } catch (error) {
            console.error('[DEBUG] Error submitting feedback:', error)
            if (error instanceof Error) {
                console.error('[DEBUG] Error message:', error.message)
            }
            // We don't show error for feedback as it's optional
        }
    }

    // Handle form submission
    const onSubmit = async () => {
        console.log('[DEBUG] Submitting form... Tour ID:', tourId, 'Tour Schedule ID:', tourScheduleId)
        
        // Check auth token before starting submission
        const token = await getAccessToken()
        console.log('[DEBUG] Form submission using token:', token ? `${token.substring(0, 10)}...` : 'No token found')
        
        if (!token) {
            console.error('[DEBUG] ERROR: No auth token for submission process. Will cause 401 errors.')
            showToast('Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error')
            return
        }
        
        if (!validateForm()) {
            console.log('[DEBUG] Form validation failed, aborting submission')
            return
        }
        
        setIsLoading(true)
        console.log('[DEBUG] Starting submission process...')
        
        try {
            // Submit feedback first (it's optional)
            console.log('[DEBUG] Step 1: Submitting feedback')
            await handleFeedback()
            
            // Upload images and get URLs
            console.log('[DEBUG] Step 2: Uploading images')
            const imageUrls = await handleImageUpload()
            console.log('[DEBUG] Image URLs received:', imageUrls)
            
            // Submit rating with image URLs
            console.log('[DEBUG] Step 3: Submitting rating')
            await handleRating(imageUrls)
        } catch (error: unknown) {
            console.error('[DEBUG] Error in submission process:', error)
            
            if (error instanceof Error) {
                console.error('[DEBUG] Error message:', error.message)
                console.error('[DEBUG] Error stack:', error.stack)
                
                const errorMessage = error.message.toLowerCase();
                if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
                    showToast('Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', 'error');
                } else {
                    showToast('Đã xảy ra lỗi. Vui lòng thử lại sau.', 'error');
                }
            } else if (typeof error === 'object' && error !== null) {
                console.error('[DEBUG] Error details:', JSON.stringify(error))
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
                    <Text className="text-black font-medium">Quay lại</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={onSubmit}
                    disabled={isLoading}
                    className={`flex-1 border border-core-300 py-3 rounded-lg items-center justify-center ${isLoading ? 'bg-teal-700 opacity-70' : 'bg-teal-700'
                        }`}
                >
                    {isLoading ? (
                        <View className="flex-row items-center">
                            <ActivityIndicator size="small" color="#0f766e" />
                            <Text className="text-black font-medium ml-2">Đang xử lý...</Text>
                        </View>
                    ) : (
                        <Text className="text-black font-medium">Đánh giá ngay</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
    )
}

export default RatingForm