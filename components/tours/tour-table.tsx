import React, { useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, Dimensions, RefreshControl } from 'react-native';
import { TourResType } from '../../schemaValidation/tour.schema';
import TourCard from './tour-card';

interface TourTableProps {
  tours: TourResType[];
  isLoading?: boolean;
  onTourPress?: (tour: TourResType) => void;
  refreshControl?: React.ReactElement;
}

const TourTable: React.FC<TourTableProps> = ({
  tours,
  isLoading = false,
  onTourPress,
  refreshControl,
}) => {
  const { width } = Dimensions.get('window');
  const cardWidth = (width - 32 - 8) / 2; // 32px for horizontal padding (16px on each side) and 8px for gap between cards
  
  // Use this key to force re-render of FlatList when numColumns changes
  const listKey = useMemo(() => "grid-2-columns", []);

  if (isLoading && !refreshControl) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (tours.length === 0 && !isLoading) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-gray-500 text-lg">No tours available</Text>
      </View>
    );
  }

  const renderTourItem = ({ item }: { item: TourResType }) => (
    <TourCard 
      tour={item} 
      onPress={onTourPress}
      style={{ width: cardWidth }}
    />
  );

  return (
    <FlatList
      key={listKey}
      data={tours}
      renderItem={renderTourItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 15, marginBottom: 10 }}
      numColumns={2}
      columnWrapperStyle={{ justifyContent: 'space-between' }}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    />
  );
};

export default TourTable;
