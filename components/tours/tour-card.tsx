import type React from "react"
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native"
import { FontAwesome } from "@expo/vector-icons"
import type { TourResType } from "../../schemaValidation/tour.schema"
import { formatPrice } from "@/libs/utils"
import { useState } from "react"

interface TourCardProps {
  tour: TourResType
  onPress?: (tour: TourResType) => void
  style?: any
}

const TourCard: React.FC<TourCardProps> = ({ tour, onPress, style }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl overflow-hidden shadow-lg mb-5 border border-gray-100"
      style={style}
      activeOpacity={0.8}
      onPress={() => onPress && onPress(tour)}
    >
      <Image 
        source={{ 
          uri: imageError 
            ? 'https://via.placeholder.com/300x200/e0e0e0/969696?text=Image+Not+Available'
            : `${tour.thumbnailUrl}` 
        }} 
        className="w-full h-48" 
        style={styles.image}
        resizeMode="cover"
        onError={() => setImageError(true)}
      />

      <View className="px-4 py-3.5">
        <Text numberOfLines={2} className="font-bold text-gray-800 text-base mb-2.5 leading-5">
          {tour.title}
        </Text>

        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center bg-amber-50 px-2.5 py-1.5 rounded-lg">
            <FontAwesome name="star" size={16} color="#F59E0B" />
            <Text className="text-gray-700 text-sm font-medium ml-1.5">{tour.avgStar.toFixed(1)}</Text>
            <Text className="text-gray-500 text-xs ml-0.5">({tour.totalRating})</Text>
          </View>
          <View>
            <Text className="text-xs text-gray-500 text-right mb-0.5">From</Text>
            <Text className="text-blue-600 font-bold text-base">{formatPrice(tour.onlyFromCost)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 155, // equivalent to h-48
    backgroundColor: '#f3f4f6', // light gray background while loading
  }
});

export default TourCard
