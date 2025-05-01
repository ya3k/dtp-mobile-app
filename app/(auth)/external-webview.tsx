import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, View, Text, TouchableOpacity, StatusBar, BackHandler, Alert, Platform } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExternalWebView() {
  const { url, title } = useLocalSearchParams();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);
  
  // Handle hardware back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, []);

  // If no URL is provided, show an error
  if (!url || typeof url !== 'string') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <StatusBar barStyle="dark-content" backgroundColor="white" />
        {/* <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: 'bold' }}>WebView</Text>
        </View> */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 16, marginBottom: 20, textAlign: 'center' }}>URL không hợp lệ hoặc không được cung cấp</Text>
          <TouchableOpacity
            style={{ backgroundColor: '#15B6CB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
            onPress={() => router.back()}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ marginLeft: 8, fontSize: 18, fontWeight: 'bold' }}>
          {typeof title === 'string' ? title : 'External Website'}
        </Text>
      </View>
      
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        startInLoadingState
        renderLoading={() => (
          <View style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: 'white'
          }}>
            <ActivityIndicator size="large" color="#15B6CB" />
            <Text style={{ marginTop: 16, color: '#666' }}>Đang tải trang...</Text>
          </View>
        )}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.error('WebView error:', nativeEvent);
        }}
      />
    </SafeAreaView>
  );
} 