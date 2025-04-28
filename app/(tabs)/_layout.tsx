import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons';
import COLORS from '../../constants/color';

const _Layout = () => {

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.tabBarInactive,
                tabBarItemStyle: {
                    width: '100%',
                    height: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: COLORS.divider,
                    height: 60,
                    backgroundColor: COLORS.background,
                    paddingBottom: 5,
                    paddingTop: 5,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 10,
                    marginBottom: 3,
                    marginTop: 1
                }
            }}
        >
            <Tabs.Screen name="index" options={{
                title: 'Trang chủ',
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="home" size={size} color={color} />
                ),
                tabBarLabel: 'Trang chủ'
            }} />
            <Tabs.Screen name="basket" options={{
                title: 'Giỏ Hàng',
                headerShown: false,
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="cart-outline" size={size} color={color} />
                ),
                tabBarLabel: 'Giỏ Hàng'
            }} />
            <Tabs.Screen name="profile" options={{
                title: 'Tài khoản',
                headerShown: true,
                tabBarIcon: ({ color, size }) => (
                    <Ionicons name="person-outline" size={size} color={color} />
                ),
                tabBarLabel: 'Tài khoản'
            }} />
            
        </Tabs>
    )
}

export default _Layout