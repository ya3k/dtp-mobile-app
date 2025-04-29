import { StyleSheet, Text, View, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import { useCartStore, CartItem } from '@/store/cartStore'
import { formatPrice } from '@/libs/utils'
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import useAuth from '@/hooks/useAuth'
import { TicketKind } from '@/types/ticketKind'

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

const Basket = () => {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart, setDirectCheckoutItem } = useCartStore()
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  // Function to handle item quantity updates
  const handleUpdateQuantity = (scheduleId: string, ticketId: string, currentQuantity: number, change: number) => {
    const newQuantity = currentQuantity + change
    if (newQuantity >= 0) {
      updateQuantity(scheduleId, ticketId, newQuantity)
    }
  }
  
  // Function to remove a specific ticket type from a tour
  const handleRemoveTicket = (scheduleId: string, ticketId: string, ticketName: string) => {
    Alert.alert(
      'Xóa vé',
      `Bạn có chắc muốn xóa vé "${ticketName}" khỏi đơn hàng này?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => updateQuantity(scheduleId, ticketId, 0),
        },
      ]
    )
  }

  // Function to handle item removal
  const handleRemoveItem = (scheduleId: string, tourTitle: string) => {
    Alert.alert(
      'Xóa khỏi giỏ hàng',
      `Bạn có chắc muốn xóa "${tourTitle}" khỏi giỏ hàng?`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => removeItem(scheduleId),
        },
      ]
    )
  }

  // Function to clear the entire cart
  const handleClearCart = () => {
    if (items.length === 0) return
    
    Alert.alert(
      'Xóa giỏ hàng',
      'Bạn có chắc muốn xóa tất cả các tour trong giỏ hàng?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: () => clearCart(),
        },
      ]
    )
  }

  // Function to handle checkout for a specific item
  const handleCheckoutItem = (item: CartItem) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để tiếp tục thanh toán',
        [
          { 
            text: 'Đăng nhập', 
            onPress: () => router.push('/(auth)/login'),
            style: 'default'
          },
          {
            text: 'Hủy',
            style: 'cancel'
          }
        ]
      )
      return
    }

    setIsProcessing(true)
    // Process for a short time to show loading state
    setTimeout(() => {
      setIsProcessing(false)
      // Set the direct checkout item
      setDirectCheckoutItem(item)
      // Navigate to the checkout page with the ID parameter
      router.push({
        pathname: "/(payment)/[id]/checkout",
        params: { id: item.scheduleId }
      })
    }, 300)
  }

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color="#cccccc" />
      <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
      <TouchableOpacity 
        style={styles.browseButton}
        onPress={() => router.push('/')}
      >
        <Text style={styles.browseButtonText}>Khám phá tour</Text>
      </TouchableOpacity>
    </View>
  )

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemHeader}>
        <Text style={styles.tourTitle} numberOfLines={1}>{item.tourTitle}</Text>
        <TouchableOpacity 
          onPress={() => handleRemoveItem(item.scheduleId, item.tourTitle)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Feather name="trash-2" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.dateLabel}>Ngày: {new Date(item.day).toLocaleDateString('vi-VN')}</Text>
      
      {item.tickets.map((ticket) => (
        ticket.quantity > 0 && (
          <View key={ticket.id} style={styles.ticketItem}>
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketName}>{getTicketKindLabel(ticket.kind)}</Text>
              <Text style={styles.ticketPrice}>{formatPrice(ticket.price)} × {ticket.quantity}</Text>
            </View>
            
            <View style={styles.ticketActions}>
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => handleUpdateQuantity(
                    item.scheduleId, 
                    ticket.id, 
                    ticket.quantity, 
                    -1
                  )}
                  disabled={ticket.quantity <= 0}
                >
                  <AntDesign 
                    name="minus" 
                    size={14} 
                    color={ticket.quantity <= 0 ? "#ccc" : "#333"} 
                  />
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{ticket.quantity}</Text>
                
                <TouchableOpacity 
                  style={styles.quantityButton}
                  onPress={() => handleUpdateQuantity(
                    item.scheduleId, 
                    ticket.id, 
                    ticket.quantity, 
                    1
                  )}
                >
                  <AntDesign name="plus" size={14} color="#333" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.removeTicketButton}
                onPress={() => handleRemoveTicket(
                  item.scheduleId,
                  ticket.id,
                  getTicketKindLabel(ticket.kind)
                )}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )
      ))}
      
      <View style={styles.itemFooter}>
        <View style={styles.itemTotal}>
          <Text style={styles.itemTotalLabel}>Tổng cộng:</Text>
          <Text style={styles.itemTotalPrice}>{formatPrice(item.totalPrice)}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.checkoutItemButton}
          onPress={() => handleCheckoutItem(item)}
          disabled={isProcessing}
        >
          <Text style={styles.checkoutItemButtonText}>Thanh toán</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Giỏ hàng</Text>
        {items.length > 0 && (
          <TouchableOpacity 
            onPress={handleClearCart}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.clearButton}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? renderEmptyCart() : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.scheduleId}
          renderItem={renderCartItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

export default Basket

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  clearButton: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  cartItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cartItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tourTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 2,
  },
  ticketPrice: {
    fontSize: 13,
    color: '#6b7280',
  },
  ticketActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  removeTicketButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  quantityButtonDisabled: {
    borderColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
  },
  quantityText: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 8,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
  },
  itemTotal: {
    flex: 1,
  },
  itemTotalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4b5563',
  },
  itemTotalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  checkoutItemButton: {
    backgroundColor: 'rgba(28,150,140,1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutItemButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4b5563',
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  checkoutButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkoutButtonDisabled: {
    backgroundColor: '#FCD34D',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
})