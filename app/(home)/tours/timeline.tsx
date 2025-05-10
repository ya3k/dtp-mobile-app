import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, Image, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import React, { useMemo, useState, useRef, ReactNode, useEffect } from 'react';
import { useNavigation, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TourDetailDestinationResType } from '@/schemaValidation/tour.schema';
import { useTourStore } from '@/store/tourStore';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

// Define section keys type
type SectionKey = 'includes' | 'otherInfo' | 'notes' | 'cancellation';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// Bullet point text component
const BulletPoint = ({ text }: { text: string }) => (
  <View style={{ paddingLeft: 8, marginBottom: 12, flexDirection: 'row' }}>
    <Text style={{ width: 16, color: '#4B5563' }}>•</Text>
    <Text style={{ flex: 1, color: '#4B5563' }}>{text}</Text>
  </View>
);

const Timeline = () => {
  const navigation = useNavigation();
  const { title, tourDestinations, include, pickinfor, otherInfo } = useTourStore();
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' or 'otherInfo'
  
  // Set initial expanded state for includes to true
  const [expandedSections, setExpandedSections] = useState<Record<SectionKey, boolean>>({
    includes: false,
    otherInfo: false,
    notes: false,
    cancellation: false
  });
  
  const { width } = useWindowDimensions();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const toggleSection = (section: SectionKey) => {
    // Configure the animation
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // Toggle the expanded state
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Group destinations by day (sortOrderByDate)
  const groupedDestinations = useMemo(() => {
    const result: Record<number, TourDetailDestinationResType[]> = {};
    
    tourDestinations.forEach(destination => {
      const day = destination.sortOrderByDate;
      if (!result[day]) {
        result[day] = [];
      }
      result[day].push(destination);
    });
    
    // Sort destinations within each day by sortOrder
    Object.keys(result).forEach((day) => {
      result[Number(day)].sort((a, b) => a.sortOrder - b.sortOrder);
    });
    
    return result;
  }, [tourDestinations]);

  // Get sorted day numbers
  const sortedDays = useMemo(() => {
    return Object.keys(groupedDestinations)
      .map(Number)
      .sort((a, b) => a - b);
  }, [groupedDestinations]);

  // Collapsible section component
  const CollapsibleSection = ({ 
    title, 
    section, 
    children
  }: { 
    title: string; 
    section: SectionKey; 
    children: ReactNode; 
  }) => (
    <View className="border-b border-gray-200">
      <TouchableOpacity 
        onPress={() => toggleSection(section)}
        className="flex-row justify-between items-center p-4 bg-white active:bg-gray-100"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center">
          <Text className="font-semibold text-lg">{title}</Text>
          <View className="ml-2 px-2 py-1 bg-gray-100 rounded-full">
            <Text className="text-xs text-gray-500">
              {expandedSections[section] ? "Thu gọn" : "Xem chi tiết"}
            </Text>
          </View>
        </View>
        <Ionicons 
          name={expandedSections[section] ? "chevron-up" : "chevron-down"} 
          size={24} 
          color="#333" 
        />
      </TouchableOpacity>

      {expandedSections[section] && (
        <View className="p-4 bg-gray-50">
          {children}
        </View>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'Chi tiết gói', headerShown: false }} />
      <SafeAreaView className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center bg-white p-4 border-b border-gray-200">
          <TouchableOpacity onPress={handleBack} className="p-2 mr-3">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-xl font-bold">Chi tiết gói</Text>
        </View>

        {/* Tab navigation */}
        <View className="flex-row border-b border-gray-200">
          <TouchableOpacity 
            className={`flex-1 py-4 ${activeTab === 'timeline' ? 'border-b-2 border-orange-500' : ''}`}
            onPress={() => setActiveTab('timeline')}
          >
            <Text className={`text-center font-semibold ${activeTab === 'timeline' ? 'text-orange-500' : 'text-gray-600'}`}>
              Lịch trình
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className={`flex-1 py-4 ${activeTab === 'otherInfo' ? 'border-b-2 border-orange-500' : ''}`}
            onPress={() => setActiveTab('otherInfo')}
          >
            <Text className={`text-center font-semibold ${activeTab === 'otherInfo' ? 'text-orange-500' : 'text-gray-600'}`}>
              Thông tin khác
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'timeline' ? (
          sortedDays.length === 0 ? (
            <View className="flex-1 justify-center items-center bg-white p-5">
              <Text className="text-red-500 text-center text-base">Không tìm thấy lịch trình chi tiết</Text>
            </View>
          ) : (
            <ScrollView className="flex-1 bg-gray-50">
              {sortedDays.map((day) => (
                <View key={`day-${day}`} className="mt-4">
                  {/* Day header - shown only once per day */}
                  <View className="mx-4 bg-sky-500 rounded-lg p-2 mb-3">
                    <Text className="text-base font-bold text-white text-center">Ngày {day}</Text>
                  </View>
                  
                  {/* All destinations for this day */}
                  {groupedDestinations[day].map((destination, destIndex) => (
                    <View key={`${destination.name}-${destIndex}`} className="mx-4 my-2">
                      {/* Destination card */}
                      <View className="bg-white rounded-xl mb-2 overflow-hidden shadow">
                        {destination.imageUrls && destination.imageUrls.length > 0 && (
                          <View className="h-36">
                            <Image 
                              source={{ uri: destination.imageUrls[0] }} 
                              className="w-full h-full"
                              resizeMode="cover"
                            />
                          </View>
                        )}
                        <View className="p-3">
                          <View className="flex-row items-center mb-1">
                            <Ionicons name="location" size={18} color="#0ea5e9" />
                            <Text className="ml-1 text-lg font-bold">{destination.name}</Text>
                          </View>
                          <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={16} color="#0ea5e9" />
                            <Text className="ml-1 text-gray-500">
                              {destination.startTime} - {destination.endTime}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Activities timeline */}
                      {destination.activities.length > 0 && (
                        <View className="ml-4 mt-2 mb-4">
                          {destination.activities
                            .sort((a, b) => a.sortOrder - b.sortOrder)
                            .map((activity, actIndex) => (
                              <View key={`${activity.name}-${actIndex}`} className="flex-row mb-3">
                                <View className="w-6 items-center">
                                  <View className="w-3 h-3 rounded-full bg-sky-500" />
                                  {actIndex < destination.activities.length - 1 && (
                                    <View className="w-0.5 flex-1 bg-sky-500 mt-1" />
                                  )}
                                </View>
                                <View className="flex-1 bg-white rounded-lg p-3 ml-2 shadow">
                                  <Text className="text-base font-semibold">{activity.name}</Text>
                                  <Text className="text-sm text-gray-500">
                                    {activity.startTime} - {activity.endTime}
                                  </Text>
                                </View>
                              </View>
                            ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          )
        ) : (
          <ScrollView className="flex-1 bg-white">
            {/* Bao gồm section */}
            <CollapsibleSection title="Dịch vụ bao gồm" section="includes">
              {include && (
                <RenderHtml 
                  contentWidth={width} 
                  source={{ html: include }} 
                />
              )}
            </CollapsibleSection>
            
            {/* Thông tin khác section */}
            <CollapsibleSection title="Thông đưa/ đón khách" section="otherInfo">
              {pickinfor && (
                <RenderHtml 
                  contentWidth={width} 
                  source={{ html: pickinfor }} 
                />
              )}
            </CollapsibleSection>
            
            {/* Notes section - only shown if there's structured data */}
            {otherInfo.notes.length > 0 && (
              <CollapsibleSection title="Lưu ý" section="notes">
                {otherInfo.notes.map((note, index) => (
                  <BulletPoint key={`note-${index}`} text={note} />
                ))}
              </CollapsibleSection>
            )}
            
            {/* Cancellation policy section - only shown if there's structured data */}
            {otherInfo.cancellationPolicy.length > 0 && (
              <CollapsibleSection title="Chính sách huỷ tour" section="cancellation">
                {otherInfo.cancellationPolicy.map((policy, index) => (
                  <BulletPoint key={`policy-${index}`} text={policy} />
                ))}
              </CollapsibleSection>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
};

export default Timeline; 