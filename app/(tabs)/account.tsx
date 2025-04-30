import React, { useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useAuth from '@/hooks/useAuth';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';

const Profile = () => {
  const { logout, isAuthenticated, role, accessToken, debugTokenInfo } = useAuth();
  const { userProfile } = useUserStore();
  const router = useRouter();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Check if user is admin
  const isAdmin = role === 'Admin';

  // Handle logout with confirmation
  const handleLogout = () => {
    // Start animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // After animation completes, show the confirmation dialog
      Alert.alert(
        'Đăng xuất',
        'Bạn có chắc muốn đăng xuất khỏi tài khoản?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Đăng xuất',
            onPress: async () => {
              try {
                // Start a fade out animation
                Animated.timing(opacityAnim, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: true,
                }).start(async () => {
                  // When animation completes, logout
                  await logout();
                });
              } catch (error) {
                // Reset opacity in case of error
                opacityAnim.setValue(1);
                console.error('Logout error:', error);
                Alert.alert('Lỗi', 'Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại sau.');
              }
            },
            style: 'destructive',
          },
        ]
      );
    });
  };

  // Handle debug button press
  const handleDebugToken = () => {
    debugTokenInfo();
    Alert.alert(
      'Debug Info',
      'Token debug information has been logged to the console.',
      [{ text: 'OK' }]
    );
  };
  const handleUserProfile = () => {
    router.push('/(profile)/profile');
  }

  const handleWalletPush = () => {
    router.push('/(profile)/wallet-view');
  }
  const handleOrderHisPush = () => {
    router.push('/(profile)/my-booking/order-history');
  }

  const handleRviewPush = () => {
    router.push('/(profile)/my-review/review-list');
  }


  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginTitle}>Bạn chưa đăng nhập</Text>
          <Text style={styles.loginSubtitle}>
            Vui lòng đăng nhập để xem thông tin tài khoản và quản lý đơn hàng của bạn
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Info Card */}
        <View style={styles.profileHeader}>
          <View style={styles.userInfo}>
            <View className="w-20 h-20 rounded-full bg-core-500 justify-center items-center mr-3">
              <Text className="text-3xl font-bold text-white">
                {userProfile?.name ? userProfile.name.charAt(0) : userProfile?.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{userProfile?.userName}</Text>
              <Text style={styles.userRole}>{userProfile?.email}</Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuSection}>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="person-outline" size={24} color="#555" />
            <Text onPress={handleUserProfile} style={styles.menuItemText}>Thông tin cá nhân</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleWalletPush}>
            <Ionicons name="wallet-outline" size={24} color="#555" />
            <Text style={styles.menuItemText}>Ví của tôi</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleOrderHisPush}>
            <Ionicons name="cart-outline" size={24} color="#555" />
            <Text style={styles.menuItemText}>Đơn hàng của tôi</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleRviewPush}>
            <Ionicons name="star-outline" size={24} color="#555" />
            <Text style={styles.menuItemText}>Đánh giá</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>
        {isAdmin && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>Cài đặt</Text>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="globe-outline" size={24} color="#555" />
              <Text style={styles.menuItemText}>Ngôn ngữ</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <Ionicons name="notifications-outline" size={24} color="#555" />
              <Text style={styles.menuItemText}>Thông báo</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

            {/* Debug button only visible for admin users */}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDebugToken}
            >
              <Ionicons name="code-working-outline" size={24} color="#555" />
              <Text style={styles.menuItemText}>Debug Token</Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>

          </View>
        )}

        {/* Log Out Button */}
        <Animated.View style={{
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          marginHorizontal: 15,
          marginTop: 5,
          marginBottom: 15,
        }}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  profileHeader: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 15,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: '#666',
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
  },
  loginPrompt: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  loginSubtitle: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#15B6CB',
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 40,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});