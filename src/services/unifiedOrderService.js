import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'
import PerformanceMonitorService from './performanceMonitorService'

/**
 * 🎯 UNIFIED ORDER SERVICE
 * Handles all order operations with automatic staff assignment and notifications
 * 
 * COMPLETE WORKFLOW:
 * 1. Customer/Staff places order
 * 2. Auto-assign to available staff (for customer orders)
 * 3. Send notifications to staff and owner
 * 4. Handle accept/reject by staff
 * 5. Track complete order history per table
 * 6. Real-time updates across all interfaces
 */
class UnifiedOrderService {
  // Cache for performance optimization
  static cache = new Map()
  static cacheExpiry = 30000 // 30 seconds

  /**
   * 🚀 Get cached data or fetch fresh
   */
  static getCachedData(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data
    }
    return null
  }

  /**
   * 💾 Set cached data
   */
  static setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * 🔄 Retry mechanism for database operations
   */
  static async retryOperation(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message)
        
        if (attempt === maxRetries) {
          throw new Error(`Operation failed after ${maxRetries} attempts: ${error.message}`)
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
      }
    }
  }

  /**
   * 🛡️ Validate order data before processing
   */
  static validateOrderData({ cartItems, customerInfo, restaurantId, tableId }) {
    const errors = []
    
    if (!cartItems || cartItems.length === 0) {
      errors.push('Cart cannot be empty')
    }
    
    if (!customerInfo?.name?.trim()) {
      errors.push('Customer name is required')
    }
    
    if (!customerInfo?.phone?.trim()) {
      errors.push('Customer phone is required')
    }
    
    if (!restaurantId) {
      errors.push('Restaurant ID is required')
    }
    
    if (!tableId) {
      errors.push('Table ID is required')
    }
    
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`)
    }
    
    return true
  }

  /**
   * 🛒 Create order with automatic staff assignment and notifications
   */
  static async createOrder({
    source, // 'customer' | 'staff'
    restaurantId,
    tableId,
    cartItems,
    customerInfo,
    staffId = null, // For staff-assisted orders
    specialInstructions = '',
    paymentMethod = 'cash',
    tipAmount = 0
  }) {
    const operationId = `order_create_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      // Start performance tracking
      PerformanceMonitorService.startTracking(operationId, 'order_creation', {
        source,
        restaurantId,
        tableId,
        itemCount: cartItems?.length || 0,
        staffId
      })

      console.log('🎯 Creating unified order:', {
        source,
        restaurantId,
        tableId,
        cartItems: cartItems.length,
        customerInfo,
        staffId
      })

      // Step 1: Validate inputs with enhanced validation
      this.validateOrderData({ cartItems, customerInfo, restaurantId, tableId })

      // Step 2: Calculate totals with debugging
      console.log('🧮 Calculating totals for cart items:', cartItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * (item.quantity || 1)
      })))
      
      const subtotal = cartItems.reduce((sum, item) => {
        const itemPrice = parseFloat(item.price) || 0
        const itemQuantity = parseInt(item.quantity) || 1
        const itemTotal = itemPrice * itemQuantity
        console.log(`📊 Item: ${item.name}, Price: ₹${itemPrice}, Qty: ${itemQuantity}, Total: ₹${itemTotal}`)
        return sum + itemTotal
      }, 0)
      
      console.log('💰 Subtotal calculated:', subtotal)
      
      const taxRate = 0.18 // 18% GST
      const taxAmount = subtotal * taxRate
      const totalAmount = subtotal + taxAmount + tipAmount
      
      console.log('📋 Order totals:', {
        subtotal: subtotal,
        taxAmount: taxAmount,
        tipAmount: tipAmount,
        totalAmount: totalAmount
      })

      // Step 3: Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`

      // Step 4: Create customer session if needed
      let sessionId = null
      if (source === 'customer') {
        sessionId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const { error: sessionError } = await supabase
          .from('customer_sessions')
          .insert({
            session_id: sessionId,
            restaurant_id: restaurantId,
            table_id: tableId,
            customer_name: customerInfo.name || 'Customer',
            customer_phone: customerInfo.phone || null,
            customer_email: customerInfo.email || null,
            status: 'active'
          })

        if (sessionError) throw sessionError
      } else if (source === 'staff') {
        sessionId = `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        
        const { error: sessionError } = await supabase
          .from('customer_sessions')
          .insert({
            session_id: sessionId,
            restaurant_id: restaurantId,
            table_id: tableId,
            customer_name: customerInfo.name,
            customer_phone: customerInfo.phone,
            customer_email: customerInfo.email || null,
            created_by_staff: true,
            staff_id: staffId,
            status: 'active'
          })

        if (sessionError) throw sessionError
      }

      // Step 5: Auto-assign staff for customer orders
      let assignedStaffId = staffId // For staff-assisted orders
      if (source === 'customer') {
        assignedStaffId = await this.autoAssignStaff(restaurantId)
      }

      // Step 6: Generate customer_id for loyalty points
      let customerId = null
      if (customerInfo?.email) {
        // Generate a proper UUID v4 for customer_id
        customerId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
        console.log('🆔 Generated customer UUID for order:', customerId)
      }

      // Step 7: Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          session_id: sessionId,
          customer_id: customerId, // Add customer_id for loyalty points
          order_number: orderNumber,
          status: assignedStaffId ? 'assigned' : 'pending',
          order_type: source === 'staff' ? 'staff_assisted' : 'dine_in',
          subtotal: subtotal,
          tax_amount: taxAmount,
          tip_amount: tipAmount,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: 'pending',
          special_instructions: specialInstructions,
          assigned_staff_id: assignedStaffId,
          assigned_at: assignedStaffId ? new Date().toISOString() : null,
          estimated_preparation_time: this.calculatePreparationTime(cartItems)
        })
        .select()
        .single()

      if (orderError) throw orderError

      console.log('✅ Order created:', order.order_number)

      // Step 8: Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.specialInstructions || ''
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      console.log('✅ Order items created')

      // Step 9: Add to order queue
      await this.addToOrderQueue(order.id, restaurantId)

      // Step 10: Send notifications
      await this.sendOrderNotifications(order, source, assignedStaffId)

      // Step 11: Get table info for response
      const { data: tableInfo } = await supabase
        .from('tables')
        .select('table_number')
        .eq('id', tableId)
        .single()

      const result = {
        ...order,
        table_number: tableInfo?.table_number,
        items: orderItems,
        assigned_staff_id: assignedStaffId
      }

      // End performance tracking - success
      PerformanceMonitorService.endTracking(operationId, true)
      
      return result

    } catch (error) {
      console.error('❌ Error creating unified order:', error)
      
      // End performance tracking - failure
      PerformanceMonitorService.endTracking(operationId, false, error)
      
      throw error
    }
  }

  /**
   * 🤖 Auto-assign order to available staff
   */
  static async autoAssignStaff(restaurantId) {
    try {
      // Get available staff members
      const { data: availableStaff, error } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('restaurant_id', restaurantId)
        .eq('role', 'staff')
        .eq('is_available', true)
        .eq('is_active', true)
        .limit(1)

      if (error) throw error

      if (availableStaff && availableStaff.length > 0) {
        console.log('🎯 Auto-assigned to staff:', availableStaff[0].full_name)
        return availableStaff[0].id
      }

      console.log('⚠️ No available staff found')
      return null
    } catch (error) {
      console.error('❌ Error auto-assigning staff:', error)
      return null
    }
  }

  /**
   * 📱 Send order notifications to staff and owner
   */
  static async sendOrderNotifications(order, source, assignedStaffId) {
    try {
      // Get table info
      const { data: tableInfo } = await supabase
        .from('tables')
        .select('table_number')
        .eq('id', order.table_id)
        .single()

      const tableNumber = tableInfo?.table_number || 'Unknown'

      // Notification 1: Owner notification about new order
      await supabase
        .from('workflow_notifications')
        .insert({
          recipient_id: order.restaurant_id,
          recipient_type: 'owner',
          notification_type: 'new_order',
          title: `New Order - Table ${tableNumber}`,
          message: `Customer placed order #${order.order_number} at Table ${tableNumber}. Total: ₹${order.total_amount}`,
          data: {
            order_id: order.id,
            order_number: order.order_number,
            table_id: order.table_id,
            table_number: tableNumber,
            total_amount: order.total_amount,
            source: source
          },
          priority: 'high'
        })

      // Notification 2: Staff notification if assigned
      if (assignedStaffId) {
        await supabase
          .from('workflow_notifications')
          .insert({
            recipient_id: assignedStaffId,
            recipient_type: 'staff',
            notification_type: 'order_assigned',
            title: `Order Assigned - Table ${tableNumber}`,
            message: `You have been assigned order #${order.order_number} for Table ${tableNumber}. Please accept or reject.`,
            data: {
              order_id: order.id,
              order_number: order.order_number,
              table_id: order.table_id,
              table_number: tableNumber,
              total_amount: order.total_amount,
              requires_action: true
            },
            priority: 'high'
          })

        // Notification 3: Owner notification about staff assignment
        await supabase
          .from('workflow_notifications')
          .insert({
            recipient_id: order.restaurant_id,
            recipient_type: 'owner',
            notification_type: 'staff_assigned',
            title: `Staff Assigned - Table ${tableNumber}`,
            message: `Order #${order.order_number} has been assigned to staff. Waiting for acceptance.`,
            data: {
              order_id: order.id,
              order_number: order.order_number,
              table_id: order.table_id,
              table_number: tableNumber,
              assigned_staff_id: assignedStaffId
            },
            priority: 'normal'
          })
      } else {
        // Notification: No staff available
        await supabase
          .from('workflow_notifications')
          .insert({
            recipient_id: order.restaurant_id,
            recipient_type: 'owner',
            notification_type: 'no_staff_available',
            title: `No Staff Available - Table ${tableNumber}`,
            message: `Order #${order.order_number} is pending - no staff available for assignment.`,
            data: {
              order_id: order.id,
              order_number: order.order_number,
              table_id: order.table_id,
              table_number: tableNumber,
              requires_attention: true
            },
            priority: 'urgent'
          })
      }

      console.log('✅ Notifications sent')
    } catch (error) {
      console.error('❌ Error sending notifications:', error)
    }
  }

  /**
   * ✅ Staff accepts assigned order
   */
  static async acceptOrder(orderId, staffId) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          status: 'accepted',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('assigned_staff_id', staffId)
        .select()
        .single()

      if (error) throw error

      // Get table info
      const { data: tableInfo } = await supabase
        .from('tables')
        .select('table_number')
        .eq('id', order.table_id)
        .single()

      // Notify owner about acceptance
      await supabase
        .from('workflow_notifications')
        .insert({
          recipient_id: order.restaurant_id,
          recipient_type: 'owner',
          notification_type: 'order_accepted',
          title: `Order Accepted - Table ${tableInfo?.table_number}`,
          message: `Staff accepted order #${order.order_number}. Preparation started.`,
          data: {
            order_id: order.id,
            order_number: order.order_number,
            table_id: order.table_id,
            table_number: tableInfo?.table_number,
            assigned_staff_id: staffId
          },
          priority: 'normal'
        })

      console.log('✅ Order accepted by staff')
      return order
    } catch (error) {
      console.error('❌ Error accepting order:', error)
      throw error
    }
  }

  /**
   * ❌ Staff rejects assigned order
   */
  static async rejectOrder(orderId, staffId, reason = '') {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          status: 'pending',
          assigned_staff_id: null,
          assigned_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('assigned_staff_id', staffId)
        .select()
        .single()

      if (error) throw error

      // Try to reassign to another staff member
      const newStaffId = await this.autoAssignStaff(order.restaurant_id)
      
      if (newStaffId) {
        await supabase
          .from('orders')
          .update({
            assigned_staff_id: newStaffId,
            assigned_at: new Date().toISOString(),
            status: 'assigned'
          })
          .eq('id', orderId)
      }

      // Get table info
      const { data: tableInfo } = await supabase
        .from('tables')
        .select('table_number')
        .eq('id', order.table_id)
        .single()

      // Notify owner about rejection
      await supabase
        .from('workflow_notifications')
        .insert({
          recipient_id: order.restaurant_id,
          recipient_type: 'owner',
          notification_type: 'order_rejected',
          title: `Order Rejected - Table ${tableInfo?.table_number}`,
          message: `Staff rejected order #${order.order_number}. ${newStaffId ? 'Reassigned to another staff.' : 'No other staff available.'}`,
          data: {
            order_id: order.id,
            order_number: order.order_number,
            table_id: order.table_id,
            table_number: tableInfo?.table_number,
            rejected_by: staffId,
            reason: reason,
            reassigned_to: newStaffId
          },
          priority: newStaffId ? 'normal' : 'urgent'
        })

      console.log('✅ Order rejected and reassigned')
      return order
    } catch (error) {
      console.error('❌ Error rejecting order:', error)
      throw error
    }
  }

  /**
   * 📊 Get table order history
   */
  static async getTableOrderHistory(tableId, restaurantId) {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            item_name,
            quantity,
            unit_price,
            total_price
          ),
          customer_sessions (
            customer_name,
            customer_phone,
            customer_email
          )
        `)
        .eq('table_id', tableId)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return orders || []
    } catch (error) {
      console.error('❌ Error getting table order history:', error)
      return []
    }
  }

  /**
   * 📋 Add order to queue
   */
  static async addToOrderQueue(orderId, restaurantId) {
    try {
      // Get current queue position
      const { data: queueData } = await supabase
        .from('order_queue')
        .select('queue_position')
        .eq('restaurant_id', restaurantId)
        .order('queue_position', { ascending: false })
        .limit(1)

      const nextPosition = queueData && queueData.length > 0 ? queueData[0].queue_position + 1 : 1

      const { error } = await supabase
        .from('order_queue')
        .insert({
          order_id: orderId,
          restaurant_id: restaurantId,
          queue_position: nextPosition,
          priority_level: 1,
          estimated_wait_time: 20
        })

      if (error) throw error
      console.log('✅ Added to order queue at position:', nextPosition)
    } catch (error) {
      console.error('❌ Error adding to order queue:', error)
    }
  }

  /**
   * 📈 Update order status with tracking
   */
  static async updateOrderStatus(orderId, newStatus, staffId = null, updatedBy = 'staff') {
    try {
      console.log('🔄 Updating order status:', { orderId, newStatus, staffId, updatedBy })

      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // Add timestamp based on status
      switch (newStatus) {
        case 'preparing':
          updateData.started_at = new Date().toISOString()
          break
        case 'ready':
          updateData.completed_at = new Date().toISOString()
          break
        case 'served':
        case 'delivered':
          updateData.delivered_at = new Date().toISOString()
          break
      }

      const { data: order, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select(`
          *,
          tables (table_number),
          customer_sessions (customer_name)
        `)
        .single()

      if (error) throw error

      // Send notifications for status updates
      await this.sendStatusUpdateNotifications(order, newStatus, updatedBy, staffId)

      console.log('✅ Order status updated successfully')
      return order
    } catch (error) {
      console.error('❌ Error updating order status:', error)
      throw error
    }
  }

  /**
   * 📱 Send status update notifications
   */
  static async sendStatusUpdateNotifications(order, newStatus, updatedBy, staffId) {
    try {
      const tableNumber = order.tables?.table_number || 'Unknown'
      const customerName = order.customer_sessions?.customer_name || 'Customer'

      const statusMessages = {
        'preparing': 'Order preparation started',
        'ready': 'Order is ready for pickup',
        'served': 'Order has been served',
        'delivered': 'Order delivered successfully',
        'completed': 'Order completed'
      }

      const statusEmojis = {
        'preparing': '🍳',
        'ready': '🔔',
        'served': '✅',
        'delivered': '🎉',
        'completed': '🎊'
      }

      // Notify owner about status change
      await supabase
        .from('workflow_notifications')
        .insert({
          recipient_id: order.restaurant_id,
          recipient_type: 'owner',
          notification_type: 'order_status_update',
          title: `${statusEmojis[newStatus]} Order Update - Table ${tableNumber}`,
          message: `Order #${order.order_number} - ${statusMessages[newStatus]}`,
          data: {
            order_id: order.id,
            order_number: order.order_number,
            table_id: order.table_id,
            table_number: tableNumber,
            status: newStatus,
            updated_by: updatedBy,
            staff_id: staffId
          },
          priority: 'normal'
        })

      // Notify customer if session exists (for customer orders)
      if (order.session_id) {
        await supabase
          .from('workflow_notifications')
          .insert({
            recipient_id: order.session_id,
            recipient_type: 'customer',
            notification_type: 'order_status_update',
            title: `${statusEmojis[newStatus]} Order Update`,
            message: `Your order #${order.order_number} - ${statusMessages[newStatus]}`,
            data: {
              order_id: order.id,
              order_number: order.order_number,
              table_number: tableNumber,
              status: newStatus,
              estimated_time: newStatus === 'preparing' ? order.estimated_preparation_time : null
            },
            priority: 'normal'
          })
      }

      console.log('✅ Status update notifications sent')
    } catch (error) {
      console.error('❌ Error sending status notifications:', error)
    }
  }

  /**
   * 🏠 Release table and end customer session
   */
  static async releaseTable(tableId, restaurantId, releasedBy = 'owner') {
    try {
      console.log('🏠 Releasing table:', { tableId, restaurantId, releasedBy })

      // End active customer sessions for this table
      const { data: sessions, error: sessionError } = await supabase
        .from('customer_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('table_id', tableId)
        .eq('restaurant_id', restaurantId)
        .eq('status', 'active')
        .select()

      if (sessionError) throw sessionError

      // Get table info
      const { data: tableInfo } = await supabase
        .from('tables')
        .select('table_number')
        .eq('id', tableId)
        .single()

      // Notify owner about table release
      await supabase
        .from('workflow_notifications')
        .insert({
          recipient_id: restaurantId,
          recipient_type: 'owner',
          notification_type: 'table_released',
          title: `Table ${tableInfo?.table_number} Released`,
          message: `Table ${tableInfo?.table_number} is now available for new customers`,
          data: {
            table_id: tableId,
            table_number: tableInfo?.table_number,
            released_by: releasedBy,
            sessions_ended: sessions?.length || 0
          },
          priority: 'low'
        })

      console.log('✅ Table released successfully')
      return { success: true, sessions_ended: sessions?.length || 0 }
    } catch (error) {
      console.error('❌ Error releasing table:', error)
      throw error
    }
  }

  /**
   * 📊 Get comprehensive order history for table
   */
  static async getTableOrderHistory(tableId, restaurantId, limit = 50) {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            item_name,
            quantity,
            unit_price,
            total_price,
            special_instructions
          ),
          customer_sessions (
            customer_name,
            customer_phone,
            customer_email,
            started_at,
            ended_at
          ),
          users!orders_assigned_staff_id_users_fkey (
            full_name
          )
        `)
        .eq('table_id', tableId)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return orders || []
    } catch (error) {
      console.error('❌ Error getting table order history:', error)
      return []
    }
  }

  /**
   * ⏱️ Calculate preparation time
   */
  static calculatePreparationTime(cartItems) {
    // Base time + time per item
    const baseTime = 10 // minutes
    const timePerItem = 3 // minutes per item
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    return baseTime + (totalItems * timePerItem)
  }

  /**
   * 📱 Get notifications for user
   */
  static async getNotifications(userId, userType) {
    try {
      const { data: notifications, error } = await supabase
        .from('workflow_notifications')
        .select('*')
        .eq('recipient_id', userId)
        .eq('recipient_type', userType)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return notifications || []
    } catch (error) {
      console.error('❌ Error getting notifications:', error)
      return []
    }
  }

  /**
   * ✅ Mark notification as read
   */
  static async markNotificationAsRead(notificationId) {
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
}

export default UnifiedOrderService
