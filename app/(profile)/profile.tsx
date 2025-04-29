import React, { useEffect } from 'react'
import { Text, View, ScrollView, TouchableOpacity } from 'react-native'
import { useUserStore } from '@/store/userStore'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import useAuth from '@/hooks/useAuth'
import { useRouter } from 'expo-router'

const UserProfile = () => {
    const { userProfile, fetchUserProfile } = useUserStore()
    const { logout } = useAuth()
    const router = useRouter()

    useEffect(() => {
        // Fetch user profile if not already loaded
        if (!userProfile) {
            fetchUserProfile()
        }
    }, [])

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
                    onPress={() => router.push('/(tabs)/account')}
                    className="p-2 mr-3"
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-800">Thông tin cá nhân</Text>
            </View>
            <ScrollView>
                <View className="items-center py-6 bg-white border-b border-gray-100">
                    <View className="mb-4">
                        <View className="w-20 h-20 rounded-full bg-core-500 justify-center items-center">
                            <Text className="text-3xl font-bold text-white">
                                {userProfile.name.charAt(0)}
                            </Text>
                        </View>
                    </View>
                    <Text className="text-xl font-bold text-gray-800 mb-1">{userProfile.name}</Text>
                    <Text className="text-sm text-gray-500">{userProfile.roleName}</Text>
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
                            <Text className="flex-1 text-gray-800 font-medium">{userProfile.email}</Text>
                        </View>

                        <View className="flex-row items-center py-3 border-b border-gray-100">
                            <Ionicons name="call-outline" size={20} color="#555" />
                            <Text className="w-28 text-gray-600 ml-3">Số điện thoại:</Text>
                            <Text className="flex-1 text-gray-800 font-medium">{userProfile.phoneNumber}</Text>
                        </View>

                        <View className="flex-row items-center py-3 border-b border-gray-100">
                            <Ionicons name="location-outline" size={20} color="#555" />
                            <Text className="w-28 text-gray-600 ml-3">Địa chỉ:</Text>
                            <Text className="flex-1 text-gray-800 font-medium">{userProfile.address}</Text>
                        </View>

                        {userProfile.companyName && (
                            <View className="flex-row items-center py-3 border-b border-gray-100">
                                <Ionicons name="business-outline" size={20} color="#555" />
                                <Text className="w-28 text-gray-600 ml-3">Công ty:</Text>
                                <Text className="flex-1 text-gray-800 font-medium">{userProfile.companyName}</Text>
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