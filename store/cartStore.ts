import { create } from 'zustand'
import { TicketKind } from '@/types/ticketKind'

export type CartItem = {
  tourId: string
  tourTitle: string
  scheduleId: string
  day: string
  tickets: {
    id: string
    kind: TicketKind
    quantity: number
    price: number
  }[]
  totalPrice: number
}

interface CartState {
  items: CartItem[]
  directCheckoutItem: CartItem | null
  addItem: (item: CartItem) => void
  removeItem: (scheduleId: string) => void
  updateQuantity: (scheduleId: string, ticketId: string, quantity: number) => void
  clearCart: () => void
  setDirectCheckoutItem: (item: CartItem | null) => void
  getTotalPrice: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  directCheckoutItem: null,
  
  addItem: (item) => {
    set((state) => {
      // Check if item already exists in cart
      const existingItemIndex = state.items.findIndex(i => i.scheduleId === item.scheduleId)
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const updatedItems = [...state.items]
        updatedItems[existingItemIndex] = item
        return { items: updatedItems }
      } else {
        // Add new item
        return { items: [...state.items, item] }
      }
    })
  },
  
  removeItem: (scheduleId) => {
    set((state) => ({
      items: state.items.filter(item => item.scheduleId !== scheduleId)
    }))
  },
  
  updateQuantity: (scheduleId, ticketId, quantity) => {
    set((state) => {
      const itemIndex = state.items.findIndex(item => item.scheduleId === scheduleId)
      
      if (itemIndex >= 0) {
        const updatedItems = [...state.items]
        const item = {...updatedItems[itemIndex]}
        
        // Find and update the specific ticket
        const ticketIndex = item.tickets.findIndex(t => t.id === ticketId)
        
        if (ticketIndex >= 0) {
          const updatedTickets = [...item.tickets]
          updatedTickets[ticketIndex] = {
            ...updatedTickets[ticketIndex],
            quantity: Math.max(0, quantity)
          }
          
          // All ticket types can now be zero
          item.tickets = updatedTickets
          
          // Recalculate total price
          item.totalPrice = updatedTickets.reduce(
            (total, ticket) => total + ticket.price * ticket.quantity, 
            0
          )
          
          // If all ticket quantities are 0, remove the item from the cart
          const hasTickets = updatedTickets.some(ticket => ticket.quantity > 0)
          if (!hasTickets) {
            return { items: state.items.filter(i => i.scheduleId !== scheduleId) }
          }
          
          updatedItems[itemIndex] = item
          return { items: updatedItems }
        }
      }
      
      return state
    })
  },
  
  setDirectCheckoutItem: (item) => {
    set({ directCheckoutItem: item })
  },
  
  clearCart: () => set({ items: [] }),
  
  getTotalPrice: () => {
    return get().items.reduce((total, item) => total + item.totalPrice, 0)
  },
  
  getItemCount: () => {
    return get().items.length
  }
}))
