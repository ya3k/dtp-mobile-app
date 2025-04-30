import React, { useEffect, useState } from 'react'
import { Text, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native'
import { useUserStore } from '@/store/userStore'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import useAuth from '@/hooks/useAuth'
import { useRouter, useNavigation } from 'expo-router'
import { PUTUserType } from '@/schemaValidation/user.schema'
import { userApiRequest } from '@/services/userService'

const UserProfile = () => {
    const { userProfile, fetchUserProfile } = useUserStore()
    const { logout } = useAuth()
    const router = useRouter()
    const navigation = useNavigation()
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<PUTUserType | null>(null)

    useEffect(() => {
        // Fetch user profile if not already loaded
        if (!userProfile) {
            fetchUserProfile()
        } else if (!formData) {
            // Initialize form data when userProfile is available
            setFormData({
                id: userProfile.id,
                userName: userProfile.userName,
                name: userProfile.name,
                email: userProfile.email,
                phoneNumber: userProfile.phoneNumber,
                address: userProfile.address,
                roleName: 'Tourist',
            })
        }
    }, [userProfile])

    // Handle back navigation
    const handleBack = () => {
        if (navigation.canGoBack()) {
            navigation.goBack()
        } else {
            router.replace('/(tabs)/account')
        }
    }

    const handleEdit = () => {
        setIsEditing(true)
    }

    const handleCancel = () => {
        // Reset form data to original values
        if (userProfile) {
            setFormData({
                id: userProfile.id,
                userName: userProfile.userName,
                name: userProfile.name,
                email: userProfile.email,
                phoneNumber: userProfile.phoneNumber,
                address: userProfile.address,
                roleName: 'Tourist',
            })
        }
        setIsEditing(false)
    }

    const handleUpdate = async () => {
        if (!formData) return
        
        // Ensure roleName is 'Tourist'
        const dataToSubmit = {
            ...formData,
            roleName: 'Tourist' // Explicitly set roleName to 'Tourist'
        }
        
        setIsLoading(true)
        try {
            await userApiRequest.putUserProfile(dataToSubmit)
            setIsEditing(false)
            fetchUserProfile() // Refresh user data
            Alert.alert('Success', 'Cập nhật thành công')
        } catch (error) {
            console.error('Error updating profile:', error)
            Alert.alert('Error', 'Failed to update profile. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleChange = (field: keyof PUTUserType, value: string) => {
        if (formData) {
            setFormData({ ...formData, [field]: value })
        }
    }

    if (!userProfile) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50">
                <View className="flex-1 justify-center items-center">
                    <Text className="text-gray-500 text-base">Loading profile...</Text>
                </View>
            </SafeAreaView>
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
                <Text className="text-2xl font-bold text-gray-800">Thông tin cá nhân</Text>
                {!isEditing && (
                    <TouchableOpacity 
                        onPress={handleEdit}
                        className="ml-auto p-2"
                    >
                        <Ionicons name="create-outline" size={24} color="#333" />
                    </TouchableOpacity>
                )}
            </View>
            <ScrollView>
                <View className="items-center py-6 bg-white border-b border-gray-100">
                    <View className="mb-4">
                        <View className="w-20 h-20 rounded-full bg-core-500 justify-center items-center">
                            <Text className="text-3xl font-bold text-white">
                                {formData?.name ? formData.name.charAt(0) : userProfile.name.charAt(0)}
                            </Text>
                        </View>
                    </View>
                    {isEditing ? (
                        <View className="w-3/4 mb-1">
                            <TextInput 
                                value={formData?.name}
                                onChangeText={(text) => handleChange('name', text)}
                                className="text-xl font-bold text-gray-800 text-center border-b border-gray-300 py-1"
                            />
                        </View>
                    ) : (
                        <View className="px-4 mb-1 items-center">
                            <Text 
                                className="text-xl font-bold text-gray-800 text-center" 
                                numberOfLines={3} 
                                style={{ width: 200 }}
                            >
                                {userProfile.name}
                            </Text>
                        </View>
                    )}
                    {/* <Text className="text-sm text-gray-500">{userProfile.roleName || 'Tourist'}</Text> */}
                </View>

                <View className="p-4">
                    {/* Balance Card */}
                    <View className="bg-core-500 rounded-xl p-4 mb-4">
                        <Text className="text-white/80 text-sm mb-2">Số dư tài khoản</Text>
                        <Text className="text-white text-2xl font-bold">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                                .format(userProfile.balance)}
                        </Text>
                    </View>

                    {/* User Info Section */}
                    <View className="bg-white rounded-xl p-4 mb-4">
                        <Text className="text-lg font-bold text-gray-800 mb-4">Chi tiết tài khoản</Text>
                        
                        <View className="flex-row items-center py-3 border-b border-gray-100">
                            <Ionicons name="person-outline" size={20} color="#555" />
                            <Text className="w-28 text-gray-600 ml-3">Tên đăng nhập:</Text>
                            <Text className="flex-1 text-gray-800 font-medium">{userProfile.userName}</Text>
                        </View>

                        <View className="flex-row items-center py-3 border-b border-gray-100">
                            <Ionicons name="mail-outline" size={20} color="#555" />
                            <Text className="w-28 text-gray-600 ml-3">Email:</Text>
                            {isEditing ? (
                                <TextInput 
                                    value={formData?.email}
                                    onChangeText={(text) => handleChange('email', text)}
                                    className="flex-1 text-gray-800 font-medium border-b border-gray-300 py-1"
                                    keyboardType="email-address"
                                />
                            ) : (
                                <Text className="flex-1 text-gray-800 font-medium">{userProfile.email}</Text>
                            )}
                        </View>

                        <View className="flex-row items-center py-3 border-b border-gray-100">
                            <Ionicons name="call-outline" size={20} color="#555" />
                            <Text className="w-28 text-gray-600 ml-3">Số điện thoại:</Text>
                            {isEditing ? (
                                <TextInput 
                                    value={formData?.phoneNumber}
                                    onChangeText={(text) => handleChange('phoneNumber', text)}
                                    className="flex-1 text-gray-800 font-medium border-b border-gray-300 py-1"
                                    keyboardType="phone-pad"
                                />
                            ) : (
                                <Text className="flex-1 text-gray-800 font-medium">{userProfile.phoneNumber}</Text>
                            )}
                        </View>

                        <View className="flex-row items-center py-3 border-b border-gray-100">
                            <Ionicons name="location-outline" size={20} color="#555" />
                            <Text className="w-28 text-gray-600 ml-3">Địa chỉ:</Text>
                            {isEditing ? (
                                <TextInput 
                                    value={formData?.address}
                                    onChangeText={(text) => handleChange('address', text)}
                                    className="flex-1 text-gray-800 font-medium border-b border-gray-300 py-1"
                                />
                            ) : (
                                <Text className="flex-1 text-gray-800 font-medium">{userProfile.address}</Text>
                            )}
                        </View>

                        {userProfile.companyName && (
                            <View className="flex-row items-center py-3 border-b border-gray-100">
                                <Ionicons name="business-outline" size={20} color="#555" />
                                <Text className="w-28 text-gray-600 ml-3">Công ty:</Text>
                                <Text className="flex-1 text-gray-800 font-medium">{userProfile.companyName}</Text>
                            </View>
                        )}

                        {isEditing && (
                            <View className="flex-row justify-end mt-4 space-x-2">
                                <TouchableOpacity 
                                    onPress={handleCancel}
                                    className="px-4 py-2 bg-gray-200 rounded-lg"
                                    disabled={isLoading}
                                >
                                    <Text className="text-gray-800">Hủy</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={handleUpdate}
                                    className="px-4 py-2 bg-core-500 rounded-lg flex-row items-center"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text className="text-white">Cập nhật</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                <TouchableOpacity 
                    className="flex-row items-center justify-center bg-white rounded-xl px-4 py-3 mx-4 my-2"
                    onPress={logout}
                    activeOpacity={0.8}
                >
                    <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
                    <Text className="ml-2 text-base font-medium text-[#FF3B30]">Đăng xuất</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    )
}

export default UserProfile