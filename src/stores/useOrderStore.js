import { create } from 'zustand'
import { supabase } from '../config/supabase'
import OrderService from '../services/orderService'
import toast from 'react-hot-toast'

const useOrderStore = create((set, get) => ({
  // ==================== STATE ====================
  orders: [],
  currentOrder: null,
  cart: [],
  loading: false,
  error: null,
  
  // Analytics data (for owners and super admin)
  analytics: {
    totalOrders: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    ordersByStatus: {},
    ordersTrend: [],
    topRestaurants: []
  },
  
  // Real-time subscriptions
  subscriptions: new Map(),
  
  // Filters and pagination
  filters: {
    status: null,
    staffId: null,
    dateFrom: null,
    dateTo: null,
    restaurantId: null
  },

  // Cart management
  addToCart: (item, quantity = 1) => {
    const cart = get().cart
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    
    if (existingItem) {
      set({
        cart: cart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        )
      })
    } else {
      set({ cart: [...cart, { ...item, quantity }] })
    }
    toast.success(`${item.name} added to cart`)
  },

  removeFromCart: (itemId) => {
    set({ cart: get().cart.filter(item => item.id !== itemId) })
    toast.success('Item removed from cart')
  },

  updateCartQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(itemId)
      return
    }
    
    set({
      cart: get().cart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    })
  },

  clearCart: () => {
    set({ cart: [] })
  },

  getCartTotal: () => {
    return get().cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  },

  // ==================== CUSTOMER ORDER OPERATIONS ====================

  /**
   * Create order from cart (enhanced with OrderService)
   */
  createOrder: async (orderData) => {
    set({ loading: true, error: null })
    try {
      const cart = get().cart
      if (cart.length === 0) {
        throw new Error('Cart is empty')
      }

      // Use enhanced OrderService
      const order = await OrderService.createOrder({
        ...orderData,
        items: cart
      })
      
      set({ currentOrder: order })
      get().clearCart()
      toast.success(`Order #${order.order_number} placed successfully!`)
      
      return { data: order, error: null }
    } catch (error) {
      set({ error: error.message })
      toast.error(error.message)
      return { data: null, error }
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Create customer session for QR ordering
   */
  createCustomerSession: async (sessionData) => {
    set({ loading: true, error: null })
    try {
      const session = await OrderService.createCustomerSession(sessionData)
      toast.success('Session created successfully!')
      return session
    } catch (error) {
      set({ error: error.message })
      toast.error(error.message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Track customer order in real-time
   */
  trackCustomerOrder: (sessionId, callback) => {
    const subscription = OrderService.subscribeToCustomerOrders(sessionId, (payload) => {
      // Update current order if it matches
      const currentOrder = get().currentOrder
      if (currentOrder && currentOrder.id === payload.orderId) {
        set({ 
          currentOrder: { 
            ...currentOrder, 
            status: payload.status 
          }
        })
      }
      
      if (callback) callback(payload)
    })
    
    get().subscriptions.set(`customer-${sessionId}`, subscription)
    return subscription
  },

  /**
   * Subscribe to customer order updates (direct access to OrderService method)
   */
  subscribeToCustomerOrders: (sessionId, callback) => {
    try {
      const subscription = OrderService.subscribeToCustomerOrders(sessionId, callback)
      get().subscriptions.set(`customer-orders-${sessionId}`, subscription)
      return subscription
    } catch (error) {
      console.error('Error subscribing to customer orders:', error)
      // Return a mock subscription for compatibility
      return {
        unsubscribe: () => console.log('Mock unsubscribe called')
      }
    }
  },

  /**
   * Get customer orders by session ID
   */
  getCustomerOrders: async (sessionId) => {
    set({ loading: true, error: null })
    try {
      const orders = await OrderService.getCustomerOrders(sessionId)
      set({ orders: orders || [] })
      return { data: orders, error: null }
    } catch (error) {
      set({ error: error.message })
      console.error('Error fetching customer orders:', error)
      return { data: null, error }
    } finally {
      set({ loading: false })
    }
  },

  // ==================== STAFF ORDER OPERATIONS ====================

  /**
   * Fetch orders for staff
   */
  fetchStaffOrders: async (staffId, filters = {}) => {
    set({ loading: true, error: null })
    try {
      const orders = await OrderService.getStaffOrders(staffId, filters)
      set({ orders, filters })
      return orders
    } catch (error) {
      set({ error: error.message })
      toast.error(error.message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Update order status by staff
   */
  updateOrderStatusByStaff: async (orderId, status, staffId) => {
    set({ loading: true, error: null })
    try {
      const updatedOrder = await OrderService.updateOrderStatusByStaff(orderId, status, staffId)
      
      // Update orders list
      const orders = get().orders.map(order =>
        order.id === orderId ? updatedOrder : order
      )
      
      set({ orders })
      toast.success(`Order status updated to ${status}`)
      return updatedOrder
    } catch (error) {
      set({ error: error.message })
      toast.error(error.message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Get staff earnings and performance
   */
  fetchStaffEarnings: async (staffId, filters = {}) => {
    set({ loading: true, error: null })
    try {
      const earnings = await OrderService.getStaffEarnings(staffId, filters)
      return earnings
    } catch (error) {
      set({ error: error.message })
      toast.error(error.message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Subscribe to staff order updates
   */
  subscribeToStaffOrders: (staffId, callback) => {
    const subscription = OrderService.subscribeToStaffOrders(staffId, (payload) => {
      // Refresh orders list
      get().fetchStaffOrders(staffId, get().filters)
      
      if (callback) callback(payload)
    })
    
    get().subscriptions.set(`staff-${staffId}`, subscription)
    return subscription
  },

  // ==================== RESTAURANT OWNER OPERATIONS ====================

  /**
   * Fetch restaurant orders with analytics
   */
  fetchRestaurantOrders: async (restaurantId, filters = {}) => {
    set({ loading: true, error: null })
    try {
      const result = await OrderService.getRestaurantOrdersWithAnalytics(restaurantId, filters)
      set({ 
        orders: result.orders, 
        analytics: result.analytics,
        filters 
      })
      return result
    } catch (error) {
      set({ error: error.message })
      toast.error(error.message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Assign order to staff (owner override)
   */
  assignOrderToStaff: async (orderId, staffId, ownerId) => {
    set({ loading: true, error: null })
    try {
      const updatedOrder = await OrderService.assignOrderToStaffByOwner(orderId, staffId, ownerId)
      
      // Update orders list
      const orders = get().orders.map(order =>
        order.id === orderId ? updatedOrder : order
      )
      
      set({ orders })
      toast.success('Order assigned to staff successfully')
      return updatedOrder
    } catch (error) {
      set({ error: error.message })
      toast.error(error.message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Subscribe to restaurant order updates
   */
  subscribeToRestaurantOrders: (restaurantId, callback) => {
    const subscription = OrderService.subscribeToRestaurantOrders(restaurantId, (payload) => {
      // Refresh orders list
      get().fetchRestaurantOrders(restaurantId, get().filters)
      
      if (callback) callback(payload)
    })
    
    get().subscriptions.set(`restaurant-${restaurantId}`, subscription)
    return subscription
  },

  // ==================== SUPER ADMIN OPERATIONS ====================

  /**
   * Fetch platform analytics (super admin)
   */
  fetchPlatformAnalytics: async (filters = {}) => {
    set({ loading: true, error: null })
    try {
      const analytics = await OrderService.getPlatformOrderAnalytics(filters)
      set({ analytics })
      return analytics
    } catch (error) {
      set({ error: error.message })
      toast.error(error.message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  // ==================== LEGACY METHODS (Updated) ====================

  fetchOrders: async (restaurantId, filters = {}) => {
    // Use enhanced method for backward compatibility
    return get().fetchRestaurantOrders(restaurantId, filters)
  },

  updateOrderStatus: async (orderId, status, staffId = null) => {
    try {
      const updates = { status }
      
      if (status === 'assigned' && staffId) {
        updates.assigned_staff_id = staffId
      }
      
      // Update the updated_at timestamp for all status changes
      updates.updated_at = new Date().toISOString()

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      set({
        orders: get().orders.map(order =>
          order.id === orderId ? { ...order, ...updates } : order
        )
      })

      toast.success(`Order ${status}`)
      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  },

  fetchOrderById: async (orderId) => {
    try {
      const orderDetails = await OrderService.getOrderDetails(orderId)
      set({ currentOrder: orderDetails })
      return { data: orderDetails, error: null }
    } catch (error) {
      set({ error: error.message })
      toast.error(error.message)
      return { data: null, error }
    }
  },

  // ==================== SHARED OPERATIONS ====================

  /**
   * Get order details (enhanced)
   */
  fetchOrderDetails: async (orderId) => {
    set({ loading: true, error: null })
    try {
      const orderDetails = await OrderService.getOrderDetails(orderId)
      set({ currentOrder: orderDetails })
      return orderDetails
    } catch (error) {
      set({ error: error.message })
      toast.error(error.message)
      throw error
    } finally {
      set({ loading: false })
    }
  },

  /**
   * Set filters
   */
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }))
  },

  /**
   * Reset filters
   */
  resetFilters: () => {
    set({
      filters: {
        status: null,
        staffId: null,
        dateFrom: null,
        dateTo: null,
        restaurantId: null
      }
    })
  },

  /**
   * Clear error
   */
  clearError: () => {
    set({ error: null })
  },

  /**
   * Set loading state
   */
  setLoading: (loading) => {
    set({ loading })
  },

  // ==================== REAL-TIME SUBSCRIPTIONS MANAGEMENT ====================

  /**
   * Unsubscribe from all real-time updates
   */
  unsubscribeAll: () => {
    const subscriptions = get().subscriptions
    subscriptions.forEach(subscription => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    })
    subscriptions.clear()
  },

  /**
   * Unsubscribe from specific subscription
   */
  unsubscribe: (key) => {
    const subscriptions = get().subscriptions
    const subscription = subscriptions.get(key)
    
    if (subscription && typeof subscription.unsubscribe === 'function') {
      subscription.unsubscribe()
      subscriptions.delete(key)
    }
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    get().unsubscribeAll()
    
    set({
      orders: [],
      currentOrder: null,
      cart: [],
      loading: false,
      error: null,
      analytics: {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        ordersByStatus: {},
        ordersTrend: [],
        topRestaurants: []
      },
      filters: {
        status: null,
        staffId: null,
        dateFrom: null,
        dateTo: null,
        restaurantId: null
      }
    })
  },

  // ==================== COMPUTED VALUES ====================

  /**
   * Get orders by status
   */
  getOrdersByStatus: (status) => {
    return get().orders.filter(order => order.status === status)
  },

  /**
   * Get pending orders count
   */
  getPendingOrdersCount: () => {
    return get().orders.filter(order => 
      ['pending', 'assigned'].includes(order.status)
    ).length
  },

  /**
   * Get active orders (for staff)
   */
  getActiveOrders: () => {
    return get().orders.filter(order => 
      !['completed', 'cancelled'].includes(order.status)
    )
  },

  /**
   * Get today's orders
   */
  getTodaysOrders: () => {
    const today = new Date().toISOString().split('T')[0]
    return get().orders.filter(order => 
      order.created_at.startsWith(today)
    )
  },

  /**
   * Calculate today's revenue
   */
  getTodaysRevenue: () => {
    const todaysOrders = get().getTodaysOrders()
    return todaysOrders.reduce((sum, order) => sum + order.total_amount, 0)
  },

  /**
   * Get cart summary with tax calculation
   */
  getCartSummary: () => {
    const cart = get().cart
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const taxRate = 0.18 // 18% GST
    const taxAmount = Math.round(subtotal * taxRate * 100) / 100
    
    return {
      items: cart,
      itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      taxAmount,
      total: subtotal + taxAmount
    }
  }
}))

export default useOrderStore
