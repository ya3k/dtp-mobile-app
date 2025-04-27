import React, { useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface GalleryThumbnailProps {
  images: string[];
  onImagePress?: (index: number) => void;
}

const GalleryThumbnailImg: React.FC<GalleryThumbnailProps> = ({ 
  images, 
  onImagePress 
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});
  const { width } = Dimensions.get('window');
  const imageWidth = width;

  // Function to handle main image scroll
  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
    setActiveIndex(index);
  };

  // Handle image error
  const handleImageError = (uri: string, index: number) => {
    // console.log(`Image loading error at index ${index}: ${uri}`);
    setImageErrors(prev => ({...prev, [uri]: true}));
  };

  // Render main image item
  const renderItem = ({ item, index }: { item: string; index: number }) => {
    const hasError = imageErrors[item] || false;
    
    return (
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={() => onImagePress && onImagePress(index)}
        className="relative"
        style={{ width: imageWidth }}
      >
        <Image
          source={{ 
            uri: hasError 
              ? 'https://via.placeholder.com/800x500/e0e0e0/969696?text=Image+Not+Available' 
              : item
          }}
          className="w-full h-64"
          style={{
            width: imageWidth,
            height: 256,
            backgroundColor: '#f3f4f6'
          }}
          resizeMode="cover"
          onError={() => handleImageError(item, index)}
        />
        
        {/* Image counter overlay */}
        <View className="absolute bottom-2 right-2 bg-black/60 rounded-full px-2.5 py-1 flex-row items-center">
          <FontAwesome name="image" size={12} color="white" />
          <Text className="text-white text-xs ml-1.5">
            {index + 1}/{images.length}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Create ref for main list
  const mainListRef = React.useRef<FlatList>(null);

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <View className="w-full h-64 bg-gray-200 items-center justify-center">
        <FontAwesome name="image" size={30} color="#9ca3af" />
        <Text className="text-gray-500 mt-2">No images available</Text>
      </View>
    );
  }

  // Navigate to specific image
  const navigateToImage = (index: number) => {
    if (mainListRef.current) {
      mainListRef.current.scrollToOffset({
        offset: index * imageWidth,
        animated: true,
      });
    }
    setActiveIndex(index);
  };

  return (
    <View className="mb-4">
      {/* Main image carousel */}
      <FlatList
        ref={mainListRef}
        data={images}
        renderItem={renderItem}
        keyExtractor={(_, index) => `main_${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
      />

      {/* Pagination bar */}
      <View className="mt-3 px-4 flex-row justify-center">
        {images.length > 1 ? (
          // Dots for small number of images
          images.length <= 10 ? (
            <View className="flex-row items-center justify-center">
              {images.map((_, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => navigateToImage(index)}
                  className={`mx-1 rounded-full ${activeIndex === index ? 'bg-blue-500' : 'bg-gray-300'}`}
                  style={{ width: 8, height: 8 }}
                />
              ))}
            </View>
          ) : (
            // Numbered bar for many images
            <View className="bg-gray-100 rounded-full px-4 py-2 flex-row items-center">
              <TouchableOpacity 
                onPress={() => navigateToImage(Math.max(0, activeIndex - 1))}
                disabled={activeIndex === 0}
                className={`mr-3 ${activeIndex === 0 ? 'opacity-30' : ''}`}
              >
                <FontAwesome name="chevron-left" size={14} color="#555" />
              </TouchableOpacity>
              
              <Text className="text-gray-800 font-medium">
                {activeIndex + 1} / {images.length}
              </Text>
              
              <TouchableOpacity 
                onPress={() => navigateToImage(Math.min(images.length - 1, activeIndex + 1))}
                disabled={activeIndex === images.length - 1}
                className={`ml-3 ${activeIndex === images.length - 1 ? 'opacity-30' : ''}`}
              >
                <FontAwesome name="chevron-right" size={14} color="#555" />
              </TouchableOpacity>
            </View>
          )
        ) : null}
      </View>
    </View>
  );
};

export default GalleryThumbnailImg;