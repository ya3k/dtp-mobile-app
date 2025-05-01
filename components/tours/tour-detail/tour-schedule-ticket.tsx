import { View, Text, Modal, TouchableOpacity, ScrollView, Dimensions, StyleSheet, Alert } from "react-native"
import React, { useState, useEffect } from "react"
import type { FullTicketScheduleType } from "@/schemaValidation/ticket-schedule.schema"
import { formatPrice } from "@/libs/utils"
import { AntDesign, Feather } from "@expo/vector-icons"
import { useCartStore, CartItem } from "@/store/cartStore"
import { TicketKind } from "@/types/ticketKind"
import { useRouter } from "expo-router"
import CalendarModal from "./calendar-modal"

const getTicketKindLabel = (kind: TicketKind): string => {
  switch (kind) {
    case TicketKind.Adult:
      return "Người lớn"
    case TicketKind.Child:
      return "Trẻ em"
    case TicketKind.PerGroupOfThree:
      return "Nhóm 3 người"
    case TicketKind.PerGroupOfFive:
      return "Nhóm 5 người"
    case TicketKind.PerGroupOfSeven:
      return "Nhóm 7 người"
    case TicketKind.PerGroupOfTen:
      return "Nhóm 10 người"
    default:
      return "Không xác định"
  }
}

type TicketSelectionType = {
  scheduleId: string
  tickets: {
    id: string
    kind: TicketKind
    quantity: number
    price: number
  }[]
  day: string
}

interface TourScheduleTicketProps {
  visible: boolean
  onClose: () => void
  tourId: string
  scheduleData?: FullTicketScheduleType
  isLoading: boolean
  mode: "cart" | "book"
  tourTitle?: string
}

const TourScheduleTicket = ({
  visible,
  onClose,
  tourId,
  scheduleData,
  isLoading,
  mode = "cart",
  tourTitle = "Tour Ghép",
}: TourScheduleTicketProps) => {
  const [selectedDay, setSelectedDay] = useState<string>("")
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("")
  const [ticketSelection, setTicketSelection] = useState<TicketSelectionType>({
    scheduleId: "",
    tickets: [],
    day: "",
  })
  const [selectedDateRange, setSelectedDateRange] = useState<string>("")
  const [calendarModalVisible, setCalendarModalVisible] = useState(false)
  const { addItem, setDirectCheckoutItem } = useCartStore()
  const router = useRouter()

  // Get screen dimensions
  const { height } = Dimensions.get("window")
  const modalHeight = height * 0.8 // 80% of screen height

  // Reset selections when modal is opened or closed
  useEffect(() => {
    if (visible) {
      setSelectedDay("")
      setSelectedScheduleId("")
      setTicketSelection({
        scheduleId: "",
        tickets: [],
        day: "",
      })

      // Set default date range if data is available
      if (scheduleData && scheduleData.length >= 2) {
        // Sort schedule data by date
        const sortedData = [...scheduleData].sort((a, b) => new Date(a.day).getTime() - new Date(b.day).getTime())

        const firstDate = new Date(sortedData[0].day)
        const lastDate = new Date(sortedData[sortedData.length - 1].day)

        const firstDateStr = `${firstDate.getDate()}/${firstDate.getMonth() + 1}`
        const lastDateStr = `${lastDate.getDate()}/${lastDate.getMonth() + 1}`

        setSelectedDateRange(`${firstDateStr} - ${lastDateStr}`)
      }
    }
  }, [visible, scheduleData])

  // Update ticket selection when schedule is selected
  useEffect(() => {
    if (selectedScheduleId && scheduleData && selectedDay) {
      const daySchedule = scheduleData.find((day) => day.day === selectedDay)
      if (daySchedule) {
        const selectedTickets = daySchedule.ticketSchedules.filter(
          (ticket) => ticket.tourScheduleId === selectedScheduleId,
        )

        if (selectedTickets.length > 0) {
          setTicketSelection({
            scheduleId: selectedScheduleId,
            tickets: selectedTickets.map((ticket) => ({
              id: ticket.ticketTypeId,
              kind: ticket.ticketKind as TicketKind,
              quantity: 0, // Set all ticket types to 0 by default
              price: ticket.netCost,
            })),
            day: selectedDay,
          })
        }
      }
    }
  }, [selectedScheduleId, scheduleData, selectedDay])

  const handleDaySelect = (day: string) => {
    setSelectedDay(day)

    // Auto-select the first available schedule for this day
    if (scheduleData) {
      const daySchedule = scheduleData.find((d) => d.day === day)
      if (daySchedule && daySchedule.ticketSchedules.length > 0) {
        const firstScheduleId = daySchedule.ticketSchedules[0].tourScheduleId
        setSelectedScheduleId(firstScheduleId)
      }
    }
  }

  const updateTicketQuantity = (ticketId: string, quantity: number) => {
    setTicketSelection((prev) => ({
      ...prev,
      tickets: prev.tickets.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, quantity: Math.max(0, quantity) } : ticket,
      ),
    }))
  }

  const getTotalPrice = (): number => {
    return ticketSelection.tickets.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0)
  }

  const handleAddToCart = () => {
    // Create cart item
    const cartItem: CartItem = {
      tourId,
      tourTitle,
      scheduleId: ticketSelection.scheduleId,
      day: ticketSelection.day,
      tickets: ticketSelection.tickets,
      totalPrice: getTotalPrice()
    }

    // Add to cart
    addItem(cartItem)

    // Show success message
    Alert.alert(
      'Thành công',
      'Đã thêm vào giỏ hàng của bạn.',
      [{ text: 'OK', onPress: () => onClose() }]
    )
  }

  const handleOrderNow = () => {
    // Create direct checkout item
    const directItem: CartItem = {
      tourId,
      tourTitle,
      scheduleId: ticketSelection.scheduleId,
      day: ticketSelection.day,
      tickets: ticketSelection.tickets,
      totalPrice: getTotalPrice()
    }

    // Set direct checkout item in store
    setDirectCheckoutItem(directItem)

    // Close modal first to prevent UI flickering
    onClose()

    // Navigate to checkout
    setTimeout(() => {
      router.push({
        pathname: "/(payment)/checkout/[id]",
        params: { id: ticketSelection.scheduleId }
      })
    }, 300)
  }

  const handleConfirm = () => {
    // Check if at least one ticket is selected
    if (!hasTicketsSelected()) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất một vé')
      return
    }

    // Call appropriate handler based on mode
    if (mode === 'cart') {
      handleAddToCart()
    } else {
      handleOrderNow()
    }
  }

  const hasTicketsSelected = (): boolean => {
    return ticketSelection.tickets.some((ticket) => ticket.quantity > 0)
  }

  // Get availability status for a specific day
  const getAvailabilityStatus = (day: string): "high" | "medium" | "low" | "unavailable" => {
    if (!scheduleData) return "unavailable"

    const daySchedule = scheduleData.find((d) => d.day === day)
    if (!daySchedule) return "unavailable"

    const totalAvailable = daySchedule.ticketSchedules.reduce((sum, ticket) => sum + ticket.availableTicket, 0)

    if (totalAvailable > 15) return "high"
    if (totalAvailable > 5) return "medium"
    if (totalAvailable > 0) return "low"
    return "unavailable"
  }

  // Format date for display (convert from ISO string to date number only)
  const formatDateNumber = (isoDateString: string): string => {
    try {
      const date = new Date(isoDateString)
      return `${date.getDate()}/${date.getMonth() + 1}`
    } catch (error) {
      return isoDateString
    }
  }

  // Get sorted schedule data
  const getSortedScheduleData = () => {
    if (!scheduleData) return []
    return [...scheduleData].sort(
      (a, b) => new Date(a.day).getTime() - new Date(b.day).getTime()
    )
  }

  // Check if there are any available days
  const hasAvailableDays = (): boolean => {
    if (!scheduleData || scheduleData.length === 0) return false

    // Check if there's at least one day with available tickets
    return scheduleData.some(daySchedule => {
      const available = daySchedule.ticketSchedules.some(ticket => ticket.availableTicket > 0)
      return available
    })
  }

  // Function to open/close calendar modal
  const toggleCalendarModal = () => {
    setCalendarModalVisible(!calendarModalVisible)
  }

  if (isLoading) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.loadingContainer}>
          <View style={styles.loadingContent}>
            <Text style={styles.loadingText}>Đang tải lịch trình...</Text>
          </View>
        </View>
      </Modal>
    )
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>

        <View style={[styles.modalContainer, { height: modalHeight }]}>
          {/* Handle bar for better UX */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <AntDesign name="close" size={22} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tuỳ chọn đơn hàng</Text>
            <View style={{ width: 22 }}>
              {/* Empty view for balance */}
            </View>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Tour Name Section */}
            <View style={styles.tourInfoSection}>
              <View>
                <Text style={styles.tourTitle}>{tourTitle}</Text>
                <Text style={styles.tourSubtitle}>Huỷ miễn phí 24 giờ</Text>
              </View>

            </View>

            {/* Date Selection Section */}
            {scheduleData && scheduleData.length > 0 ? (
              <View style={styles.dateSection}>
                <Text style={styles.sectionTitle}>Xin chọn ngày đi tour</Text>

                {/* Date range display */}
                <TouchableOpacity style={styles.dateRangeButton} onPress={toggleCalendarModal}>
                  <Text style={styles.dateRangeLabel}>Xem trạng thái dịch vụ</Text>
                  <View style={styles.dateRangeValue}>
                    <Text>{selectedDateRange}</Text>
                    <AntDesign name="right" size={16} color="#333" style={{ marginLeft: 4 }} />
                  </View>
                </TouchableOpacity>

                {hasAvailableDays() ? (
                  <>
                    {/* Horizontal date picker */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.datePickerScroll}
                      contentContainerStyle={styles.datePickerContent}
                    >
                      {getSortedScheduleData().map((daySchedule) => {
                        const availability = getAvailabilityStatus(daySchedule.day)
                        const isSelected = selectedDay === daySchedule.day

                        // Skip unavailable dates
                        if (availability === "unavailable") return null

                        return (
                          <TouchableOpacity
                            key={daySchedule.day}
                            style={[styles.dateButton, isSelected && styles.dateButtonSelected]}
                            onPress={() => handleDaySelect(daySchedule.day)}
                          >
                            <Text style={[styles.dateButtonText, isSelected && styles.dateButtonTextSelected]}>
                              {formatDateNumber(daySchedule.day)}
                            </Text>
                          </TouchableOpacity>
                        )
                      })}
                    </ScrollView>

                    {/* Availability legend */}
                    <View style={styles.legendContainer}>
                      <Text style={styles.legendText}>Chọn ngày bạn muốn đi</Text>
                    </View>
                  </>
                ) : (
                  <View style={styles.noAvailabilityContainer}>
                    <Feather name="calendar" size={48} color="#999999" />
                    <Text style={styles.noAvailabilityText}>Không có ngày khả dụng</Text>
                    <Text style={styles.noAvailabilitySubtext}>
                      Hiện tại không có lịch khởi hành nào cho tour này. Vui lòng quay lại sau hoặc liên hệ với chúng tôi để biết thêm thông tin.
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.noAvailabilityContainer}>
                <Feather name="calendar" size={48} color="#999999" />
                <Text style={styles.noAvailabilityText}>Không có lịch trình</Text>
                <Text style={styles.noAvailabilitySubtext}>
                  Hiện tại không có lịch trình nào cho tour này. Vui lòng quay lại sau hoặc liên hệ với chúng tôi để biết thêm thông tin.
                </Text>
              </View>
            )}

            {/* Ticket selection */}
            {selectedScheduleId && ticketSelection.tickets.length > 0 && (
              <View style={styles.ticketSection}>
                <Text style={styles.sectionTitle}>Chọn loại vé</Text>
                {ticketSelection.tickets.map((ticket) => (
                  <View key={ticket.id} style={styles.ticketItem}>
                    <View style={styles.ticketHeader}>
                      <Text style={styles.ticketTypeText}>{getTicketKindLabel(ticket.kind)}</Text>
                      <Text style={styles.ticketPriceText}>{formatPrice(ticket.price)}</Text>
                    </View>
                    <View style={styles.ticketControls}>
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={[
                            styles.quantityButton,
                            ticket.quantity <= 0 && styles.quantityButtonDisabled
                          ]}
                          onPress={() => updateTicketQuantity(ticket.id, Math.max(0, ticket.quantity - 1))}
                          disabled={ticket.quantity <= 0}
                        >
                          <AntDesign
                            name="minus"
                            size={16}
                            color={ticket.quantity <= 0 ? "#ccc" : "#333"}
                          />
                        </TouchableOpacity>
                        <View style={styles.quantityTextContainer}>
                          <Text style={styles.quantityText}>{ticket.quantity}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          onPress={() => updateTicketQuantity(ticket.id, ticket.quantity + 1)}
                        >
                          <AntDesign name="plus" size={16} color="#333" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer with total price and confirm button */}
          <View style={styles.footer}>
            <View style={styles.priceContainer}>
              <Text style={styles.totalPriceLabel}>Tổng thanh toán:</Text>
              <Text style={styles.totalPriceText}>
                {getTotalPrice() > 0 ? `${formatPrice(getTotalPrice())}` : "0 đ"}
              </Text>
            </View>

            {/* Button with debuggable text */}
            <TouchableOpacity
              style={[styles.confirmButton,
              (!hasTicketsSelected() || !hasAvailableDays()) && styles.confirmButtonDisabled
              ]}
              disabled={!hasTicketsSelected() || !hasAvailableDays()}
              onPress={handleConfirm}
            >
              <Text style={[styles.confirmButtonText, { width: '100%' }]}>
                {mode === "cart" ? "Thêm vào giỏ hàng" : "Đặt ngay"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Replace the old calendar modal with new CalendarModal component */}
        <CalendarModal
          visible={calendarModalVisible}
          onClose={toggleCalendarModal}
          scheduleData={scheduleData}
          selectedDay={selectedDay}
          onDaySelect={handleDaySelect}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  scrollContent: {
    flex: 1,
  },
  tourInfoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
    maxWidth: 'auto', // Prevent too long titles from overflowing
  },
  tourSubtitle: {
    fontSize: 13,
    color: "#777",
  },
  detailsButton: {
    padding: 4,
  },
  detailsButtonText: {
    color: "#0066CC",
    fontWeight: "600",
  },
  dateSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  dateRangeButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dateRangeLabel: {
    fontSize: 14,
    color: "#333",
  },
  dateRangeValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  datePickerScroll: {
    marginTop: 16,
    marginBottom: 8,
  },
  datePickerContent: {
    paddingVertical: 8,
    paddingLeft: 4,
  },
  dateButton: {
    marginRight: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "white",
    minWidth: 80,
    alignItems: 'center',
  },
  dateButtonSelected: {
    backgroundColor: "hsl(184.62, 69.15%, 90%)",
    borderColor: "hsl(184.62, 69.15%, 30%)",
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
  },
  dateButtonTextSelected: {
    color: "black",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 6,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  highAvailability: {
    backgroundColor: "#10B981",
  },
  mediumAvailability: {
    backgroundColor: "#3B82F6",
  },
  lowAvailability: {
    backgroundColor: "#F59E0B",
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  legendText: {
    fontSize: 14,
    color: "#777",
    marginLeft: 8,
    marginRight: 16,
  },
  infoButton: {
    marginLeft: "auto",
    padding: 4,
  },
  noAvailabilityContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  noAvailabilityText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noAvailabilitySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  ticketSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  ticketItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  ticketTypeText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    flex: 1,
  },
  ticketPriceText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    minWidth: 80,
    textAlign: 'right',
  },
  ticketControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  requiredText: {
    fontSize: 13,
    color: "#FF8C00",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 100,
    justifyContent: 'flex-end',
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
  },
  quantityButtonDisabled: {
    borderColor: "#F0F0F0",
    backgroundColor: "#FAFAFA",
  },
  quantityTextContainer: {
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: "500",
    color: '#333',
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    backgroundColor: "white",
  },
  priceContainer: {
    marginBottom: 12,
  },
  totalPriceLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  totalPriceText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  confirmButton: {
    backgroundColor: "hsl(184.62, 69.15%, 36.86%)",
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
    minWidth: 200,
  },
  confirmButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    includeFontPadding: false,
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  loadingContent: {
    backgroundColor: "white",
    width: "90%",
    borderRadius: 12,
    padding: 20,
  },
  loadingText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "700",
  },
})

export default TourScheduleTicket;
