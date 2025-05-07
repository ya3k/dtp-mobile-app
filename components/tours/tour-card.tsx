import type React from "react"
import { View, Text, Image, TouchableOpacity, Animated } from "react-native"
import { FontAwesome } from "@expo/vector-icons"
import type { TourResType } from "../../schemaValidation/tour.schema"
import { formatPrice } from "@/libs/utils"
import { useState, useRef, useEffect } from "react"

interface TourCardProps {
  tour: TourResType
  onPress?: (tour: TourResType) => void
  style?: any
}

const TourCard: React.FC<TourCardProps> = ({ tour, onPress, style }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Animation on press
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };
  
  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  // Ensure the thumbnail URL is properly formatted
  const getImageUrl = (url: string) => {
    if (!url) return 'https://via.placeholder.com/300x200/e0e0e0/969696?text=No+Image';
    
    // Handle relative URLs
    if (url.startsWith('/')) {
      // Replace with your base URL if needed
      return `https://yourbaseurl.com${url}`;
    }
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    
    return url;
  };

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
        style
      ]}
    >
      <TouchableOpacity
        className="bg-white rounded-2xl overflow-hidden shadow-lg border border-solid border-gray-200 mb-4"
        activeOpacity={0.9}
        onPress={() => onPress && onPress(tour)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View className="relative ">
          {imageLoading && (
            <View className="w-full h-44 bg-gray-100 items-center justify-center">
              <Text className="text-gray-400 text-sm">Loading...</Text>
            </View>
          )}
          <Image
            source={{
              uri: imageError
                ? 'https://via.placeholder.com/300x200/e0e0e0/969696?text=Image+Not+Available'
                : getImageUrl(tour.thumbnailUrl)
            }}
            className="w-full h-44 bg-gray-100"
            style={{ width: '100%', height: 155 }} // Explicit dimensions as backup
            resizeMode="cover"
            onError={(e) => {
               setImageError(true);
              setImageLoading(false);
            }}
            onLoad={() => {
              setImageLoading(false);
            }}
            onLoadStart={() => setImageLoading(true)}
          />
          {/* {tour.discount > 0 && (
            <View className="absolute top-3 right-3 bg-red-500 px-2 py-1 rounded-xl">
              <Text className="text-white text-xs font-bold">{tour.discount}% OFF</Text>
            </View>
          )} */}
        </View>

        <View className="p-2">
          <Text numberOfLines={1} className="font-bold text-gray-800 text-base mb-1 leading-[22px]">
            {tour.title}
          </Text>

          <View className="flex-col justify-between items-start mb-2.5">
            <View className="flex-row items-center bg-amber-50 px-2.5 py-1.5 rounded-lg">
              <FontAwesome className="mr-2" name="star" size={14} color="#F59E0B" />
              <Text className="text-gray-800 text-sm font-semibold ml-1.5">{tour.avgStar.toFixed(1)}</Text>
              <Text className="text-gray-500 text-sm ml-0.5">({tour.totalRating})</Text>
            </View>
            
            <View>
              <Text className="text-blue-600 font-semibold text-base">{formatPrice(tour.onlyFromCost)}</Text>
            </View>
          </View>
          
          {/* {tour.location && (
            <View className="flex-row items-center mt-1">
              <FontAwesome name="map-marker" size={12} color="#6B7280" className="mr-1" />
              <Text className="text-xs text-gray-500 flex-1" numberOfLines={1}>
                {tour.location}
              </Text>
            </View>
          )} */}
        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default TourCard