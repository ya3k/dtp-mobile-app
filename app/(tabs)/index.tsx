import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, SafeAreaView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { TourResType } from '@/schemaValidation/tour.schema';
import { tourApiRequest } from '@/services/tourService';
import TourTable from '@/components/tours/tour-table';
import SearchInput from '@/components/tours/search-input';

export default function Index() {
  const [tours, setTours] = useState<TourResType[]>([]);
  const [filteredTours, setFilteredTours] = useState<TourResType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
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
      setFilteredTours(toursData);
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

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredTours(tours);
      return;
    }
    
    const lowercasedQuery = text.toLowerCase();
    const filtered = tours.filter(tour => 
      tour.title.toLowerCase().includes(lowercasedQuery) || 
      (tour.description && tour.description.toLowerCase().includes(lowercasedQuery)) ||
      (tour.companyName && tour.companyName.toLowerCase().includes(lowercasedQuery))
    );
    setFilteredTours(filtered);
  }, [tours]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setFilteredTours(tours);
  }, [tours]);

  const handleTourPress = (tour: TourResType) => {
    // Navigate to tour details page
    router.push({
      pathname: "/tours/[id]",
      params: { id: tour.id }
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <SearchInput 
        value={searchQuery}
        onChangeText={handleSearch}
        onClear={clearSearch}
      />
      
      {error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-red-500 text-center">{error}</Text>
        </View>
      ) : (
        <TourTable 
          tours={filteredTours} 
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
