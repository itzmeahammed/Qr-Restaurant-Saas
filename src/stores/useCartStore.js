import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      sessionId: null,
      tableId: null,
      restaurantId: null,

      // Initialize cart session
      initializeSession: (restaurantId, tableId) => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        set({ sessionId, tableId, restaurantId, cart: [] })
        return sessionId
      },

      // Add item to cart
      addToCart: (item) => {
        set((state) => {
          const existingItem = state.cart.find(cartItem => cartItem.id === item.id)
          if (existingItem) {
            return {
              cart: state.cart.map(cartItem =>
                cartItem.id === item.id
                  ? { ...cartItem, quantity: cartItem.quantity + 1 }
                  : cartItem
              )
            }
          }
          return { cart: [...state.cart, { ...item, quantity: 1 }] }
        })
      },

      // Update item quantity
      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(itemId)
          return
        }
        set((state) => ({
          cart: state.cart.map(item =>
            item.id === itemId ? { ...item, quantity } : item
          )
        }))
      },

      // Remove item from cart
      removeFromCart: (itemId) => {
        set((state) => ({
          cart: state.cart.filter(item => item.id !== itemId)
        }))
      },

      // Clear cart
      clearCart: () => {
        set({ cart: [] })
      },

      // Get cart total
      getCartTotal: () => {
        const { cart } = get()
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
      },

      // Get cart count
      getCartCount: () => {
        const { cart } = get()
        return cart.reduce((count, item) => count + item.quantity, 0)
      },

      // Get cart with tax
      getCartWithTax: (taxRate = 0.18) => {
        const subtotal = get().getCartTotal()
        const tax = subtotal * taxRate
        const total = subtotal + tax
        return { subtotal, tax, total }
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ cart: state.cart, sessionId: state.sessionId })
    }
  )
)

export default useCartStore
