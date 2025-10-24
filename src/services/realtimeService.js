import { supabase } from '../config/supabase'

/**
 * Enhanced Real-time Service for Complete Restaurant Workflow
 * Handles live order tracking, staff notifications, owner alerts, and customer updates
 * - Customer: Order tracking, payment confirmations, status updates
 * - Staff: New order notifications, assignment alerts, payment collection
 * - Owner: Staff availability alerts, order monitoring, system notifications
 */
class RealtimeService {
  constructor() {
    this.subscriptions = new Map()
    this.channels = new Map()
  }

  /**
   * Subscribe to order updates for a specific session
   * @param {string} sessionId - Customer session ID
   * @param {Object} handlers - Event handlers
   */
  subscribeToSession(sessionId, handlers = {}) {
    try {
      const channelName = `session-${sessionId}`
      
      // Unsubscribe from existing channel if exists
      this.unsubscribeFromChannel(channelName)

      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: true }
          }
        })
        .on('broadcast', { event: 'order_confirmed' }, (payload) => {
          console.log('Order confirmed:', payload)
          handlers.onOrderConfirmed?.(payload.payload)
        })
        .on('broadcast', { event: 'order_assigned' }, (payload) => {
          console.log('Order assigned:', payload)
          handlers.onOrderAssigned?.(payload.payload)
        })
        .on('broadcast', { event: 'order_status_update' }, (payload) => {
          console.log('Status update:', payload)
          handlers.onStatusUpdate?.(payload.payload)
        })
        .on('broadcast', { event: 'payment_confirmed' }, (payload) => {
          console.log('Payment confirmed:', payload)
          handlers.onPaymentConfirmed?.(payload.payload)
        })
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ Subscribed to session: ${sessionId}`)
            handlers.onConnected?.()
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`❌ Channel error for session: ${sessionId}`, err)
            handlers.onError?.(err)
          } else if (status === 'TIMED_OUT') {
            console.warn(`⏰ Subscription timeout for session: ${sessionId}`)
            handlers.onTimeout?.()
          } else if (status === 'CLOSED') {
            console.log(`🔒 Channel closed for session: ${sessionId}`)
            handlers.onClosed?.()
          }
        })

      this.channels.set(channelName, channel)
      return channel
    } catch (error) {
      console.error('Error subscribing to session:', error)
      handlers.onError?.(error)
      return null
    }
  }

  /**
   * Subscribe to staff notifications
   * @param {string} staffId - Staff member ID
   * @param {Object} handlers - Event handlers
   */
  subscribeToStaffNotifications(staffId, handlers = {}) {
    const channelName = `staff-${staffId}`
    
    // Unsubscribe from existing channel if exists
    this.unsubscribeFromChannel(channelName)

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'new_order' }, (payload) => {
        handlers.onNewOrder?.(payload.payload)
      })
      .on('broadcast', { event: 'order_cancelled' }, (payload) => {
        handlers.onOrderCancelled?.(payload.payload)
      })
      .on('broadcast', { event: 'tip_received' }, (payload) => {
        handlers.onTipReceived?.(payload.payload)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Staff subscribed: ${staffId}`)
        }
      })

    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Subscribe to restaurant-wide updates
   * @param {string} restaurantId - Restaurant ID
   * @param {Object} handlers - Event handlers
   */
  subscribeToRestaurant(restaurantId, handlers = {}) {
    const channelName = `restaurant-${restaurantId}`
    
    // Unsubscribe from existing channel if exists
    this.unsubscribeFromChannel(channelName)

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'new_order' }, (payload) => {
        handlers.onNewOrder?.(payload.payload)
      })
      .on('broadcast', { event: 'order_update' }, (payload) => {
        handlers.onOrderUpdate?.(payload.payload)
      })
      .on('broadcast', { event: 'staff_update' }, (payload) => {
        handlers.onStaffUpdate?.(payload.payload)
      })
      .on('broadcast', { event: 'table_update' }, (payload) => {
        handlers.onTableUpdate?.(payload.payload)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Restaurant subscribed: ${restaurantId}`)
        }
      })

    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Subscribe to database changes
   * @param {string} table - Table name
   * @param {Object} filters - Filters for subscription
   * @param {Function} callback - Callback function
   */
  subscribeToTable(table, filters = {}, callback) {
    const subscriptionKey = `${table}-${JSON.stringify(filters)}`
    
    // Remove existing subscription
    if (this.subscriptions.has(subscriptionKey)) {
      this.subscriptions.get(subscriptionKey).unsubscribe()
    }

    let channel = supabase.channel(`db-${table}`)

    // Add postgres changes listener
    const subscription = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        ...filters
      },
      (payload) => {
        callback(payload)
      }
    ).subscribe()

    this.subscriptions.set(subscriptionKey, subscription)
    return subscription
  }

  /**
   * Subscribe to order changes
   * @param {string} orderId - Order ID
   * @param {Function} callback - Callback function
   */
  subscribeToOrder(orderId, callback) {
    return this.subscribeToTable(
      'orders',
      { filter: `id=eq.${orderId}` },
      callback
    )
  }

  /**
   * Subscribe to table status changes
   * @param {string} tableId - Table ID
   * @param {Function} callback - Callback function
   */
  subscribeToTableStatus(tableId, callback) {
    return this.subscribeToTable(
      'tables',
      { filter: `id=eq.${tableId}` },
      callback
    )
  }

  /**
   * Subscribe to menu updates
   * @param {string} restaurantId - Restaurant ID
   * @param {Function} callback - Callback function
   */
  subscribeToMenuUpdates(restaurantId, callback) {
    return this.subscribeToTable(
      'menu_items',
      { filter: `restaurant_id=eq.${restaurantId}` },
      callback
    )
  }

  /**
   * Broadcast event to a channel
   * @param {string} channelName - Channel name
   * @param {string} event - Event name
   * @param {Object} payload - Event payload
   */
  async broadcast(channelName, event, payload) {
    try {
      const channel = supabase.channel(channelName)
      await channel.send({
        type: 'broadcast',
        event: event,
        payload: payload
      })
      return { success: true }
    } catch (error) {
      console.error('Broadcast error:', error)
      throw error
    }
  }

  /**
   * Send notification to customer session
   * @param {string} sessionId - Session ID
   * @param {string} event - Event type
   * @param {Object} data - Notification data
   */
  async notifyCustomer(sessionId, event, data) {
    return this.broadcast(`session-${sessionId}`, event, data)
  }

  /**
   * Send notification to staff member
   * @param {string} staffId - Staff ID
   * @param {string} event - Event type
   * @param {Object} data - Notification data
   */
  async notifyStaff(staffId, event, data) {
    return this.broadcast(`staff-${staffId}`, event, data)
  }

  /**
   * Send notification to restaurant
   * @param {string} restaurantId - Restaurant ID
   * @param {string} event - Event type
   * @param {Object} data - Notification data
   */
  async notifyRestaurant(restaurantId, event, data) {
    return this.broadcast(`restaurant-${restaurantId}`, event, data)
  }

  /**
   * Enhanced notification methods for complete workflow
   */

  /**
   * Notify customer about order status changes
   * @param {string} sessionId - Customer session ID
   * @param {Object} order - Order object
   * @param {string} status - New status
   */
  async notifyCustomerOrderUpdate(sessionId, order, status) {
    const statusMessages = {
      'pending': 'Your order has been placed and is waiting for confirmation',
      'assigned': `Your order has been assigned to our staff`,
      'preparing': 'Your order is being prepared',
      'ready': 'Your order is ready for pickup/serving',
      'served': 'Your order has been served. Enjoy your meal!',
      'completed': 'Thank you for dining with us!',
      'cancelled': 'Your order has been cancelled'
    }

    return this.notifyCustomer(sessionId, 'order_status_update', {
      orderId: order.id,
      orderNumber: order.order_number,
      status,
      message: statusMessages[status] || 'Order status updated',
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Notify staff about new order assignment
   * @param {string} staffId - Staff ID
   * @param {Object} order - Order object
   */
  async notifyStaffNewOrder(staffId, order) {
    return this.notifyStaff(staffId, 'new_order_assigned', {
      orderId: order.id,
      orderNumber: order.order_number,
      tableNumber: order.table?.table_number || 'N/A',
      totalAmount: order.total_amount,
      itemCount: order.order_items?.length || 0,
      specialInstructions: order.special_instructions,
      estimatedTime: order.estimated_preparation_time,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Notify owner about staff availability issues
   * @param {string} restaurantId - Restaurant ID
   * @param {Object} orderData - Order that couldn't be assigned
   */
  async notifyOwnerStaffUnavailable(restaurantId, orderData) {
    return this.notifyRestaurant(restaurantId, 'staff_unavailable', {
      orderId: orderData.id,
      orderNumber: orderData.order_number,
      message: 'New order received but no staff available for assignment',
      totalAmount: orderData.total_amount,
      timestamp: new Date().toISOString(),
      action: 'assign_staff_manually'
    })
  }

  /**
   * Notify staff about payment collection
   * @param {string} staffId - Staff ID
   * @param {Object} order - Order object
   * @param {string} paymentMethod - Payment method
   */
  async notifyStaffPaymentCollection(staffId, order, paymentMethod) {
    return this.notifyStaff(staffId, 'payment_collection', {
      orderId: order.id,
      orderNumber: order.order_number,
      amount: order.total_amount,
      paymentMethod,
      message: paymentMethod === 'cash' ? 'Collect cash payment from customer' : 'Process card payment',
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Subscribe to cart updates for customer
   * @param {string} sessionId - Customer session ID
   * @param {Object} handlers - Event handlers
   */
  subscribeToCartUpdates(sessionId, handlers = {}) {
    const channelName = `cart-${sessionId}`
    
    this.unsubscribeFromChannel(channelName)

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_items',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        console.log('Cart update:', payload)
        handlers.onCartUpdate?.(payload)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Cart subscribed: ${sessionId}`)
          handlers.onConnected?.()
        }
      })

    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Subscribe to staff availability changes
   * @param {string} restaurantId - Restaurant ID
   * @param {Object} handlers - Event handlers
   */
  subscribeToStaffAvailability(restaurantId, handlers = {}) {
    const channelName = `staff-availability-${restaurantId}`
    
    this.unsubscribeFromChannel(channelName)

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'staff',
        filter: `restaurant_id=eq.${restaurantId}`
      }, (payload) => {
        console.log('Staff availability update:', payload)
        handlers.onStaffAvailabilityChange?.(payload)
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Staff availability subscribed: ${restaurantId}`)
          handlers.onConnected?.()
        }
      })

    this.channels.set(channelName, channel)
    return channel
  }

  /**
   * Unsubscribe from a specific channel
   * @param {string} channelName - Channel name to unsubscribe from
   */
  unsubscribeFromChannel(channelName) {
    try {
      const channel = this.channels.get(channelName)
      if (channel) {
        channel.unsubscribe()
        this.channels.delete(channelName)
        console.log(`🔌 Unsubscribed from channel: ${channelName}`)
      }
    } catch (error) {
      console.error(`Error unsubscribing from channel ${channelName}:`, error)
    }
  }

  /**
   * Safely cleanup all channels
   */
  cleanup() {
    try {
      console.log('🧹 Cleaning up realtime service...')
      for (const [channelName, channel] of this.channels) {
        try {
          channel.unsubscribe()
          console.log(`🔌 Cleaned up channel: ${channelName}`)
        } catch (error) {
          console.error(`Error cleaning up channel ${channelName}:`, error)
        }
      }
      this.channels.clear()
      this.subscriptions.clear()
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  unsubscribeAll() {
    // Unsubscribe from all channels
    this.channels.forEach((channel, name) => {
      channel.unsubscribe()
      console.log(`🔌 Unsubscribed from channel: ${name}`)
    })
    this.channels.clear()

    // Unsubscribe from all table subscriptions
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe()
      console.log(`🔌 Unsubscribed from: ${key}`)
    })
    this.subscriptions.clear()
  }

  /**
   * Get connection status
   * @returns {Object} - Connection status
   */
  getConnectionStatus() {
    return {
      channelsCount: this.channels.size,
      subscriptionsCount: this.subscriptions.size,
      activeChannels: Array.from(this.channels.keys()),
      activeSubscriptions: Array.from(this.subscriptions.keys())
    }
  }
}

// Create singleton instance
const realtimeService = new RealtimeService()

export default realtimeService
