import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

/**
 * 📱 NOTIFICATION SERVICE
 * Handles real-time notifications for orders, staff assignments, and system events
 */
class NotificationService {
  static subscriptions = new Map()

  /**
   * 🔔 Subscribe to real-time notifications for a user
   */
  static subscribeToNotifications(userId, userType, callback) {
    try {
      const subscription = supabase
        .channel(`notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'workflow_notifications',
            filter: `recipient_id=eq.${userId}`
          },
          (payload) => {
            console.log('🔔 New notification received:', payload.new)
            
            // Show toast notification
            this.showToastNotification(payload.new)
            
            // Call callback if provided
            if (callback) {
              callback(payload.new)
            }
          }
        )
        .subscribe()

      this.subscriptions.set(`notifications-${userId}`, subscription)
      console.log(`✅ Subscribed to notifications for ${userType}:`, userId)
      
      return subscription
    } catch (error) {
      console.error('❌ Error subscribing to notifications:', error)
      return null
    }
  }

  /**
   * 🍞 Show toast notification based on type
   */
  static showToastNotification(notification) {
    const { notification_type, title, message, priority } = notification

    switch (notification_type) {
      case 'new_order':
        toast.success(`🛒 ${title}\n${message}`, {
          duration: 6000,
          position: 'top-right'
        })
        break

      case 'order_assigned':
        toast(`👨‍💼 ${title}\n${message}`, {
          duration: 8000,
          position: 'top-right',
          icon: '📋'
        })
        break

      case 'staff_assigned':
        toast.success(`✅ ${title}\n${message}`, {
          duration: 5000,
          position: 'top-right'
        })
        break

      case 'order_accepted':
        toast.success(`🎉 ${title}\n${message}`, {
          duration: 5000,
          position: 'top-right'
        })
        break

      case 'order_rejected':
        toast.error(`❌ ${title}\n${message}`, {
          duration: 7000,
          position: 'top-right'
        })
        break

      case 'no_staff_available':
        toast.error(`⚠️ ${title}\n${message}`, {
          duration: 10000,
          position: 'top-right'
        })
        break

      default:
        if (priority === 'urgent') {
          toast.error(`🚨 ${title}\n${message}`, {
            duration: 8000,
            position: 'top-right'
          })
        } else {
          toast(`📢 ${title}\n${message}`, {
            duration: 5000,
            position: 'top-right'
          })
        }
    }
  }

  /**
   * 📊 Get unread notification count
   */
  static async getUnreadCount(userId, userType) {
    try {
      const { count, error } = await supabase
        .from('workflow_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('recipient_type', userType)
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('❌ Error getting unread count:', error)
      return 0
    }
  }

  /**
   * 📱 Get recent notifications
   */
  static async getRecentNotifications(userId, userType, limit = 20) {
    try {
      const { data: notifications, error } = await supabase
        .from('workflow_notifications')
        .select('*')
        .eq('recipient_id', userId)
        .eq('recipient_type', userType)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return notifications || []
    } catch (error) {
      console.error('❌ Error getting recent notifications:', error)
      return []
    }
  }

  /**
   * ✅ Mark notification as read
   */
  static async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('workflow_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
    } catch (error) {
      console.error('❌ Error marking notification as read:', error)
    }
  }

  /**
   * ✅ Mark all notifications as read
   */
  static async markAllAsRead(userId, userType) {
    try {
      const { error } = await supabase
        .from('workflow_notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('recipient_type', userType)
        .eq('is_read', false)

      if (error) throw error
    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error)
    }
  }

  /**
   * 🔕 Unsubscribe from notifications
   */
  static unsubscribeFromNotifications(userId) {
    const subscriptionKey = `notifications-${userId}`
    const subscription = this.subscriptions.get(subscriptionKey)
    
    if (subscription) {
      subscription.unsubscribe()
      this.subscriptions.delete(subscriptionKey)
      console.log(`✅ Unsubscribed from notifications for user:`, userId)
    }
  }

  /**
   * 🧹 Clean up all subscriptions
   */
  static cleanup() {
    this.subscriptions.forEach((subscription, key) => {
      subscription.unsubscribe()
      console.log(`✅ Cleaned up subscription:`, key)
    })
    this.subscriptions.clear()
  }

  /**
   * 📢 Send custom notification
   */
  static async sendNotification({
    recipientId,
    recipientType,
    notificationType,
    title,
    message,
    data = {},
    priority = 'normal'
  }) {
    try {
      const { error } = await supabase
        .from('workflow_notifications')
        .insert({
          recipient_id: recipientId,
          recipient_type: recipientType,
          notification_type: notificationType,
          title,
          message,
          data,
          priority
        })

      if (error) throw error
      console.log('✅ Custom notification sent')
    } catch (error) {
      console.error('❌ Error sending notification:', error)
      throw error
    }
  }

  /**
   * 👥 Subscribe to staff order updates
   */
  static subscribeToStaffOrders(staffId, restaurantId, callback) {
    try {
      const subscription = supabase
        .channel(`staff-orders-${staffId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`
          },
          (payload) => {
            console.log('📋 Staff order update received:', payload);
            
            // Call callback if provided
            if (callback) {
              callback(payload);
            }
          }
        )
        .subscribe();

      this.subscriptions.set(`staff-orders-${staffId}`, subscription);
      console.log(`✅ Subscribed to staff orders for:`, staffId);
      
      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to staff orders:', error);
      return null;
    }
  }

  /**
   * 🏪 Subscribe to restaurant order updates
   */
  static subscribeToRestaurantOrders(restaurantId, callback) {
    try {
      const subscription = supabase
        .channel(`restaurant-orders-${restaurantId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `restaurant_id=eq.${restaurantId}`
          },
          (payload) => {
            console.log('🏪 Restaurant order update received:', payload);
            
            // Call callback if provided
            if (callback) {
              callback(payload);
            }
          }
        )
        .subscribe();

      this.subscriptions.set(`restaurant-orders-${restaurantId}`, subscription);
      console.log(`✅ Subscribed to restaurant orders for:`, restaurantId);
      
      return subscription;
    } catch (error) {
      console.error('❌ Error subscribing to restaurant orders:', error);
      return null;
    }
  }
}

export default NotificationService
