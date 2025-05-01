import React, { useEffect, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { AntDesign } from '@expo/vector-icons';
import type { FullTicketScheduleType } from "@/schemaValidation/ticket-schedule.schema";

// Cấu hình ngôn ngữ tiếng Việt cho lịch
LocaleConfig.locales['vi'] = {
  monthNames: [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ],
  monthNamesShort: ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'],
  dayNames: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
  dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  today: 'Hôm nay'
};
LocaleConfig.defaultLocale = 'vi';

interface CalendarModalProps {
  visible: boolean;
  onClose: () => void;
  scheduleData?: FullTicketScheduleType;
  selectedDay: string;
  onDaySelect: (day: string) => void;
}

const CalendarModal: React.FC<CalendarModalProps> = ({
  visible,
  onClose,
  scheduleData,
  selectedDay,
  onDaySelect
}) => {
  // Tạo danh sách ngày có tour
  const getMarkedDates = () => {
    if (!scheduleData) return {};

    const markedDates: any = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextSixMonths = new Date();
    nextSixMonths.setMonth(today.getMonth() + 6);
    
    // Tạo một đối tượng chứa tất cả các ngày trong khoảng 6 tháng tới
    // Mặc định tất cả các ngày sẽ có màu xám (disabledDates)
    let currentDate = new Date(today);
    while (currentDate <= nextSixMonths) {
      const dateString = currentDate.toISOString().split('T')[0];
      markedDates[dateString] = {
        disabled: true,
        disableTouchEvent: true,
        textColor: '#d9e1e8'
      };
      
      // Chuyển đến ngày tiếp theo
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Thêm tất cả các ngày có lịch với màu đen và chấm xanh
    scheduleData?.forEach(daySchedule => {
      const availableTickets = daySchedule.ticketSchedules.some(ticket => ticket.availableTicket > 0);
      
      if (availableTickets) {
        // Ngày có tour sẽ được bật và có chấm xanh
        markedDates[daySchedule.day] = {
          disabled: false,
          disableTouchEvent: false,
          textColor: '#333333',
          marked: true,
          dotColor: '#00adf5'
        };
      }
    });
    
    // Nếu đã chọn một ngày, đánh dấu ngày đó là selected
    if (selectedDay && markedDates[selectedDay]) {
      markedDates[selectedDay] = {
        ...markedDates[selectedDay],
        selected: true,
        selectedColor: '#FF6D00'
      };
    }
    
    return markedDates;
  };

  // Xử lý khi người dùng chọn ngày từ lịch
  const handleCalendarDayPress = (day: any) => {
    const selectedDate = day.dateString;
    
    // Kiểm tra nếu ngày này đã bị vô hiệu hóa (không có tour), không xử lý gì cả
    // Lưu ý: Mặc dù đã thiết lập disableAllTouchEventsForDisabledDays, 
    // chúng ta vẫn kiểm tra để đảm bảo
    const markedDates = getMarkedDates();
    if (markedDates[selectedDate]?.disabled) {
      return;
    }
    
    // Nếu ngày có tour, xử lý chọn ngày và đóng modal
    onDaySelect(selectedDate);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <AntDesign name="close" size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>Xem trạng thái dịch vụ</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Calendar using react-native-calendars */}
            <Calendar
              // Cài đặt giao diện
              theme={{
                backgroundColor: '#ffffff',
                calendarBackground: '#ffffff',
                textSectionTitleColor: '#333',
                selectedDayBackgroundColor: '#FF6D00',
                selectedDayTextColor: '#ffffff',
                todayTextColor: '#00adf5',
                dayTextColor: '#333',
                textDisabledColor: '#d9e1e8',
                dotColor: '#00adf5',
                selectedDotColor: '#ffffff',
                arrowColor: '#FF6D00',
                monthTextColor: '#333',
                textMonthFontWeight: 'bold',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 14
              }}
              // Hiển thị từ tháng hiện tại
              current={new Date().toISOString().split('T')[0]}
              minDate={new Date().toISOString().split('T')[0]}
              maxDate={new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0]}
              onDayPress={handleCalendarDayPress}
              markedDates={getMarkedDates()}
              markingType={'dot'}
              hideExtraDays={true}
              enableSwipeMonths={true}
              // Hiển thị nhiều tháng
              pastScrollRange={0}
              futureScrollRange={3}
              scrollEnabled={true}
              showScrollIndicator={false}
              disableAllTouchEventsForDisabledDays={true}
            />

            {/* Legend */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={styles.legendDot} />
                <Text style={styles.legendText}>Có tour</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={styles.legendGrayCircle} />
                <Text style={styles.legendText}>Không có tour</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: 'auto',
    width: '100%',
    position: 'absolute',
    bottom: 0,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 15,
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 10,
    paddingTop: 15,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00adf5',
  },
  legendGrayCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#d9e1e8',
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  }
});

export default CalendarModal; 