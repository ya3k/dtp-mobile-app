import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { TourResType } from '@/schemaValidation/tour.schema';
import { tourApiRequest } from '@/services/tourService';
import TourTable from '@/components/tours/tour-table';

export default function Index() {
  const [tours, setTours] = useState<TourResType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchTours = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) {
        setIsLoading(true);
      }
      // Add timestamp to query to prevent caching
      const timestamp = new Date().getTime();
      const query = `?_t=${timestamp}`;
      const toursData = await tourApiRequest.getOdataTour(query);
      setTours(toursData);
      setError(null);
    } catch (err) {
      setError('Failed to load tours. Please try again later.');
      console.error('Error fetching tours:', err);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTours(true);
  }, [fetchTours]);

  useEffect(() => {
    fetchTours();
  }, [fetchTours]);

  const handleTourPress = (tour: TourResType) => {
    // Navigate to tour details page
    router.push({
      pathname: "/tours/[id]",
      params: { id: tour.id }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="py-4 px-8 bg-sky-600 rounded-b-2xl mb-2 shadow-md">
        <Text className="text-xl font-bold text-white leading-relaxed" numberOfLines={1} ellipsizeMode="tail">Discover Tours</Text>
      </View>
      
      {error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center">{error}</Text>
        </View>
      ) : (
        <TourTable 
          tours={tours} 
          isLoading={isLoading}
          onTourPress={handleTourPress}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#0ea5e9"]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
