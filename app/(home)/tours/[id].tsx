import { ActivityIndicator, Button, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TouchableHighlight, TouchableOpacity, View, Alert, useWindowDimensions, LogBox } from 'react-native'
import React, { useEffect, useState, useMemo } from 'react'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { tourApiRequest } from '@/services/tourService';
import { useTourStore } from '@/store/tourStore';

import { TourDetailDataResType } from '@/schemaValidation/tour.schema';
import GalleryThumbnailImg from '@/components/tours/tour-detail/gallery-thumnail-img';
import { Ionicons } from '@expo/vector-icons';
import TourDescription from '@/components/tours/tour-detail/tour-description-modal';
import { formatPrice } from '@/libs/utils';
import RenderHtml from 'react-native-render-html';
import useAuth from '@/hooks/useAuth';
import TourScheduleTicket from '@/components/tours/tour-detail/tour-schedule-ticket';
import { FullTicketScheduleType } from '@/schemaValidation/ticket-schedule.schema';

// Tắt cảnh báo về defaultProps
LogBox.ignoreLogs([
  'Support for defaultProps will be removed from function components in a future major release. Use JavaScript default parameters instead.',
]);

// Component tùy chỉnh bọc RenderHtml để xử lý trước các props
const SafeRenderHtml = ({ html, ...props }: { html: string; contentWidth?: number; tagsStyles?: any; systemFonts?: string[]; renderersProps?: any }) => {
  const { width } = useWindowDimensions();

  // Memoize các props để tránh re-render không cần thiết
  const memoizedProps = useMemo(() => ({
    contentWidth: props.contentWidth || width,
    source: { html },
    tagsStyles: props.tagsStyles,
    systemFonts: props.systemFonts,
    renderersProps: props.renderersProps,
  }), [html, width, props.tagsStyles, props.systemFonts, props.renderersProps, props.contentWidth]);

  return <RenderHtml {...memoizedProps} />;
};

const TourDetails = () => {
  const [tourDetail, setTourDetail] = useState<TourDetailDataResType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { id } = useLocalSearchParams();
  const { isAuthenticated, accessToken } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const setTourInfo = useTourStore(state => state.setTourInfo);

  // Schedule modal state
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [scheduleData, setScheduleData] = useState<FullTicketScheduleType | undefined>(undefined);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [bookingMode, setBookingMode] = useState<'cart' | 'book'>('cart');

  const navigation = useNavigation();

  // Memoize render configurations to reduce rerenders
  const renderersProps = useMemo(() => ({
    img: {
      enableExperimentalPercentWidth: true
    }
  }), []);

  const tagsStyles = useMemo(() => ({
    body: {
      fontFamily: 'System',
      fontSize: 16,
      lineHeight: 22,
      color: '#374151'
    },
    ul: {
      marginLeft: 6,
      paddingLeft: 0
    },
    li: {
      marginBottom: 8,
      marginLeft: 0
    },
    p: {
      marginVertical: 2
    }
  }), []);

  const systemFonts = useMemo(() => ['System'], []);

  // Handler for auth-protected actions
  const handleAuthAction = (action: () => void) => {
    if (isAuthenticated) {
      action();
    } else {
      // Show login prompt
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để thực hiện chức năng này',
        [
          {
            text: 'Đăng nhập',
            onPress: () => router.push('/(auth)/login'),
            style: 'default'
          },
          {
            text: 'Hủy',
            style: 'cancel'
          }
        ]
      );
    }
  };

  // Fetch schedule data
  const fetchScheduleData = async () => {
    if (!id) return;

    try {
      setIsScheduleLoading(true);
      const response = await tourApiRequest.getTicketSchedule(id);
      // console.log(JSON.stringify(response.data))

      // Handle the API response structure
      if (response.success && response.data) {
        setScheduleData(response.data);
      } else {
        throw new Error(response.message || 'Failed to load schedule data');
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch trình và vé. Vui lòng thử lại sau.');
    } finally {
      setIsScheduleLoading(false);
    }
  };

  // Cart and booking handlers
  const handleAddToCart = () => {
    handleAuthAction(() => {
      setBookingMode('cart');
      setScheduleModalVisible(true);
    });
  };

  const handleBookNow = () => {
    handleAuthAction(() => {
      setBookingMode('book');
      setScheduleModalVisible(true);
    });
  };

  const handleDetailTimeline = () => {
    if (tourDetail) {
      // Store tour destinations in Zustand store
      setTourInfo(
        tourDetail.tour.title, 
        tourDetail.tourDestinations,
        tourDetail.tour.include,
        tourDetail.tour.pickinfor,
      );
      // Navigate to timeline without params
      router.push('/tours/timeline');
    }
  }

  useEffect(() => {
    let isMounted = true;
    const fetchTourDetail = async () => {
      try {
        setIsLoading(true);
        // Use the existing tourApiRequest service
        const data = await tourApiRequest.getTourDetail(id as string);
        if (isMounted) {
          // Store tour info in Zustand store with include and pickinfor
          setTourInfo(
            data.tour.title, 
            data.tourDestinations,
            data.tour.include,
            data.tour.pickinfor,
           
          );
          
          setTourDetail(data);
          setError(null);

          // Fetch schedule data after delay
          setTimeout(() => {
            fetchScheduleData();
          }, 2000);
        }
      } catch (err) {
        console.error('Error fetching tour details:', err);
        if (isMounted) {
          setError('Failed to load tour details. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTourDetail();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [id, setTourInfo]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <Text className="mt-2 text-gray-600">Đang tải thông tin tour...</Text>
      </SafeAreaView>
    );
  }

  if (error || !tourDetail) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text className="mt-2 text-red-500 text-center">{error || 'Tour not found'}</Text>
        <TouchableOpacity 
          className="mt-4 bg-sky-500 py-2 px-4 rounded-lg"
          onPress={handleBack}
        >
          <Text className="text-white font-semibold">Quay lại</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View className="flex-row items-center">
        <TouchableOpacity onPress={handleBack} className="p-2 mr-3">
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.container}>

        <SafeAreaView>
          <GalleryThumbnailImg images={tourDetail.tour.imageUrls} />
          <View className="mt-2">
            <View className='mx-4'>
              <Text className="font-extrabold text-2xl">{tourDetail.tour.title}</Text>

              <View className="flex flex-row items-center mt-2 ">
                <Ionicons name="star" color="#FBC02D" size={23} />
                <Text className="ml-2 text-xl font-medium text-yellow-500">{tourDetail.tour.avgStar.toFixed(1)}</Text>
                <Text className="ml-2 text-xl font-medium text-black">({tourDetail.tour.totalRating} Đánh giá)</Text>
              </View>
            </View>

            {/* description */}
            <View className="mt-4 p-3 mx-4 bg-teal-50 border border-gray-200 rounded-2xl">
              <TourDescription description={tourDetail.tour.description} />
            </View>

            {/* service */}
            <View className="mt-6">
              <View className='mx-5'>
                <View className="flex-row items-center py-3 mb-1 rounded-t-2xl">
                  <Text className='bg-teal-500 text-teal-500 font-bold mr-2'>|</Text>
                  <Text className="text-xl font-extrabold">Các gói dịch vụ</Text>
                </View>
                <Text className='text-gray-500'>Loại gói dịch vụ</Text>
              </View>
              <View className='rounded-b-2xl m-4'>
                <View className='p-4 mt-2 border-2 border-teal-600  rounded-xl bg-teal-50'>
                  <Text className='pb-2 font-bold text-lg'>Tour ghép</Text>
                  <Text className='font-extrabold text-lg'>{formatPrice(tourDetail.tour.onlyFromCost)}</Text>
                </View>
              </View>
              {/* Time line */}
              <View className="rounded-b-2xl mt-4 bg-teal-50">
                <View className='m-6'>
                  <TouchableOpacity
                    onPress={handleDetailTimeline}
                    className='mt-4 p-4 rounded-md border border-black flex flex-row items-center justify-center bg-gray-50'
                  >
                    <Ionicons name='map-outline' size={24} color={'black'} />
                    <Text className='ml-2 text-center font-semibold'>Xem lịch trình chi tiết</Text>
                  </TouchableOpacity>

                  <View className='mt-6'>
                    <Text className='font-extrabold text-xl'>Dịch vụ bao gồm</Text>
                    <SafeRenderHtml
                      html={tourDetail.tour.include}
                      tagsStyles={tagsStyles}
                      systemFonts={systemFonts}
                      renderersProps={renderersProps}
                    />
                  </View>
                </View>
              </View>

              {/* Authentication notice */}
              {/* {!isAuthenticated && (
                <View className="mx-4 my-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="information-circle-outline" size={24} color="#3b82f6" />
                    <Text className="ml-2 font-bold text-blue-600">Chức năng đầy đủ</Text>
                  </View>
                  <Text className="text-blue-700 mb-3">
                    Đăng nhập để đặt tour.
                  </Text>
                  <TouchableOpacity
                    className="bg-blue-500 py-2 rounded-lg"
                    onPress={() => router.push('/(auth)/login')}
                  >
                    <Text className="text-white font-bold text-center">Đăng nhập ngay</Text>
                  </TouchableOpacity>
                </View>
              )} */}

              {/* about */}
              <View className='mt-3'>
                <View className='mx-5'>
                  <View className="flex-row items-center py-3 mb-1 rounded-t-2xl">
                    <Text className='bg-teal-500 text-teal-500 font-bold mr-2'>|</Text>
                    <Text className="text-xl font-extrabold">Về dịch vụ này</Text>
                  </View>
                  <SafeRenderHtml
                    html={tourDetail.tour.about}
                    tagsStyles={tagsStyles}
                    systemFonts={systemFonts}
                    renderersProps={renderersProps}
                  />
                </View>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>

      {/* Tour Schedule Modal */}
      <TourScheduleTicket
        visible={scheduleModalVisible}
        onClose={() => setScheduleModalVisible(false)}
        tourId={id as string}
        scheduleData={scheduleData}
        isLoading={isScheduleLoading}
        mode={bookingMode}
        tourTitle={tourDetail.tour.title}
      />

      {/* Fixed bottom bar */}
      <View className="border-t border-gray-200 bg-white px-4 p-3 mx-2">
        {/* Price row with badge */}
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-extrabold text-xl text-gray-800">{formatPrice(tourDetail.tour.onlyFromCost)}</Text>
        </View>

        {/* Buttons row */}
        <View className="flex-row gap-4">
          {/* <TouchableOpacity
            className="bg-amber-400 flex-1 py-4 rounded-2xl font-semibold"
            onPress={handleAddToCart}
          >
            <Text className="font-[800] text-center text-gray-800 text-lg">Thêm vào giỏ hàng</Text>
          </TouchableOpacity> */}
          <TouchableOpacity
            className="bg-orange-500 flex-1 py-4 rounded-2xl font-semibold"
            onPress={handleBookNow}
          >
            <Text className="font-[800] text-lg text-white text-center">Đặt ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default TourDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 16,
  }
});