import { View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal'; // 🛠 Important: using RN Modal
import RenderHTML from 'react-native-render-html';

interface TourDescriptionProps {
  description: string;
}

export default function TourDescription({ description }: TourDescriptionProps) {
  const [isModalVisible, setModalVisible] = useState(false);

  const previewLength = 150;
  const isLong = description.length > previewLength;
  const previewText = isLong ? description.slice(0, previewLength) + '...' : description;
  const { width } = useWindowDimensions();

  return (
    <View>
      {/* Preview */}
      {/* <Text className="text-base text-gray-700">{previewText}</Text> */}
      <RenderHTML 
                  contentWidth={width} 
                  source={{ html: previewText }} 
                />

      {/* Show More Button */}
      {isLong && (
        <TouchableOpacity onPress={() => setModalVisible(true)} className="mt-2">
          <Text className="font-semibold underline">Xem thêm</Text>
        </TouchableOpacity>
      )}

      {/* True Bottom Sheet */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        onSwipeComplete={() => setModalVisible(false)}
        swipeDirection="down"
        style={{
          justifyContent: 'flex-end',
          margin: 0,
        }}
      >
        <View className="bg-white rounded-t-3xl px-4 pt-4 pb-6" style={{ height: '55%' }}>
          {/* Top bar */}
          <View className="flex-row items-center justify-between mb-4 mt-2 py-5 px-1 bg-gray-50 rounded-3xl">
            <Text className="text-xl font-bold pt-2 pl-2 flex-1 text-center" numberOfLines={1} ellipsizeMode="tail">Điểm nổi bật</Text>

            <TouchableOpacity onPress={() => setModalVisible(false)} className="rounded-full p-1 bg-gray-200">
              <Ionicons name="close" size={22} color="black" />
            </TouchableOpacity>
          </View>

          {/* Scroll content */}
          <ScrollView showsVerticalScrollIndicator={false}>
          <RenderHTML 
                  contentWidth={width} 
                  source={{ html: description }} 
                />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
