"use client"

import { View, Text, Modal, TouchableOpacity, ScrollView, Dimensions, StyleSheet } from "react-native"
import { useState, useEffect } from "react"
import type { FullTicketScheduleType } from "@/schemaValidation/ticket-schedule.schema"
import { formatPrice } from "@/libs/utils"
import { AntDesign, Feather } from "@expo/vector-icons"
import { useCartStore, CartItem } from "@/store/cartStore"

export enum TicketKind {
  Adult = 0,
  Child = 1,
  PerGroupOfThree = 2,
  PerGroupOfFive = 3,
  PerGroupOfSeven = 4,
  PerGroupOfTen = 5,
}

const getTicketKindLabel = (kind: TicketKind): string => {
  switch (kind) {
    case TicketKind.Adult:
      return "Người lớn"
    case TicketKind.Child:
      return "Trẻ em(<5 tuổi)"
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
  onConfirm: (selection: TicketSelectionType) => void
  scheduleData?: FullTicketScheduleType
  isLoading: boolean
  mode: "cart" | "book"
  tourTitle?: string
}

const TourScheduleTicket = ({
  visible,
  onClose,
  tourId,
  onConfirm,
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
  const addToCart = useCartStore((state) => state.addItem)

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
              quantity: ticket.ticketKind === TicketKind.Adult ? 1 : 0, // Set adult tickets to 1 by default
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

  const handleConfirm = () => {
    // For cart mode, add item to cart store
    if (mode === 'cart') {
      const cartItem: CartItem = {
        tourId,
        tourTitle,
        scheduleId: ticketSelection.scheduleId,
        day: ticketSelection.day,
        tickets: ticketSelection.tickets,
        totalPrice: getTotalPrice()
      }
      addToCart(cartItem)
    }
    
    onConfirm(ticketSelection)
    onClose()
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
                <Text style={styles.tourSubtitle}>Huỷ miễn phí 24 giờ · Xác nhận trong 24 giờ</Text>
              </View>
              <TouchableOpacity style={styles.detailsButton}>
                <Text style={styles.detailsButtonText}>Chi tiết</Text>
              </TouchableOpacity>
            </View>

            {/* Date Selection Section */}
            {scheduleData && scheduleData.length > 0 && (
              <View style={styles.dateSection}>
                <Text style={styles.sectionTitle}>Xin chọn ngày đi tour</Text>

                {/* Date range display */}
                <TouchableOpacity style={styles.dateRangeButton}>
                  <Text style={styles.dateRangeLabel}>Xem trang thời điểm vụ</Text>
                  <View style={styles.dateRangeValue}>
                    <Text>{selectedDateRange}</Text>
                    <AntDesign name="right" size={16} color="#333" style={{ marginLeft: 4 }} />
                  </View>
                </TouchableOpacity>

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

                        {/* Availability indicator dot */}
                        <View style={styles.indicatorContainer}>
                          <View
                            style={[
                              styles.availabilityDot,
                              availability === "high"
                                ? styles.highAvailability
                                : availability === "medium"
                                  ? styles.mediumAvailability
                                  : styles.lowAvailability,
                            ]}
                          />
                        </View>
                      </TouchableOpacity>
                    )
                  })}
                </ScrollView>

                {/* Availability legend */}
                <View style={styles.legendContainer}>
                  <View style={[styles.availabilityDot, styles.highAvailability]} />
                  <Text style={styles.legendText}>Sẵn sàng khởi hành</Text>
                  <TouchableOpacity style={styles.infoButton}>
                    <Feather name="info" size={14} color="gray" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Ticket selection */}
            {selectedScheduleId && ticketSelection.tickets.length > 0 && (
              <View style={styles.ticketSection}>
                {ticketSelection.tickets.map((ticket) => (
                  <View key={ticket.id} style={styles.ticketItem}>
                    <View style={styles.ticketHeader}>
                      <Text style={styles.ticketTypeText}>{getTicketKindLabel(ticket.kind)}</Text>
                      <Text style={styles.ticketPriceText}>{formatPrice(ticket.price)}</Text>
                    </View>
                    <View style={styles.ticketControls}>
                      {ticket.kind === TicketKind.Adult && <Text style={styles.requiredText}>Phải ít nhất 1 vé</Text>}
                      <View style={styles.quantityControls}>
                        <TouchableOpacity
                          style={[
                            styles.quantityButton,
                            ticket.kind === TicketKind.Adult && ticket.quantity <= 1 && styles.quantityButtonDisabled,
                          ]}
                          onPress={() =>
                            updateTicketQuantity(
                              ticket.id,
                              ticket.kind === TicketKind.Adult
                                ? Math.max(1, ticket.quantity - 1) // Keep min 1 for adults
                                : ticket.quantity - 1,
                            )
                          }
                          disabled={ticket.kind === TicketKind.Adult && ticket.quantity <= 1}
                        >
                          <AntDesign
                            name="minus"
                            size={16}
                            color={ticket.kind === TicketKind.Adult && ticket.quantity <= 1 ? "#ccc" : "#333"}
                          />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>{ticket.quantity}</Text>
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
              <Text style={styles.totalPriceText}>đ {formatPrice(getTotalPrice())}</Text>
            </View>
            <TouchableOpacity
              style={[styles.confirmButton, !hasTicketsSelected() && styles.confirmButtonDisabled]}
              disabled={!hasTicketsSelected()}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{mode === "cart" ? "Thêm vào giỏ hàng" : "Đặt ngay"}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 8,
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
    marginTop: 12,
  },
  datePickerContent: {
    paddingVertical: 8,
  },
  dateButton: {
    marginRight: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "white",
  },
  dateButtonSelected: {
    backgroundColor: "#FFF3E0",
    borderColor: "#FF8C00",
  },
  dateButtonText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
  },
  dateButtonTextSelected: {
    color: "#FF8C00",
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 4,
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
    alignItems: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  legendText: {
    fontSize: 12,
    color: "#777",
    marginLeft: 4,
    marginRight: 16,
  },
  infoButton: {
    marginLeft: "auto",
    padding: 4,
  },
  ticketSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
    marginBottom: 8,
  },
  ticketTypeText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333",
  },
  ticketPriceText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
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
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
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
  quantityText: {
    minWidth: 30,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    marginHorizontal: 12,
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
  totalPriceText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  confirmButton: {
    backgroundColor: "#FF8C00",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#E0E0E0",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
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

export default TourScheduleTicket
