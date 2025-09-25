import { supabase } from '../config/supabase'

/**
 * Real-time Service for WebSocket connections
 * Handles live order tracking, notifications, and updates
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
