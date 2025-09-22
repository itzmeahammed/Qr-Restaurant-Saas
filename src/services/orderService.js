import { supabase } from '../config/supabase'
import StaffAssignmentService from './staffAssignmentService'

/**
 * Order Management Service
 * Handles order creation, tracking, and status updates
 */
class OrderService {
  /**
   * Create a new order from customer cart
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>} - Created order
   */
  static async createOrder(orderData) {
    try {
      const {
        restaurantId,
        tableId,
        sessionId,
        customerId,
        items,
        specialInstructions,
        paymentMethod,
        tipAmount = 0
      } = orderData

      // Calculate order totals
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
      const taxRate = 0.18 // 18% GST
      const taxAmount = subtotal * taxRate
      const totalAmount = subtotal + taxAmount + tipAmount

      // Generate order number
      const orderNumber = await this.generateOrderNumber(restaurantId)

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          session_id: sessionId,
          customer_id: customerId,
          order_number: orderNumber,
          status: 'pending',
          order_type: 'dine_in',
          subtotal,
          tax_amount: taxAmount,
          tip_amount: tipAmount,
          total_amount: totalAmount,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash' ? 'pending' : 'processing',
          special_instructions: specialInstructions,
          estimated_preparation_time: await this.calculatePreparationTime(items)
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.specialInstructions
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Assign order to staff
      try {
        const assignment = await StaffAssignmentService.assignOrderToStaff(
          restaurantId,
          order.id
        )
        order.assigned_staff = assignment
      } catch (assignmentError) {
        console.error('Staff assignment error:', assignmentError)
        // Order still created, but in queue
      }

      // Process payment if online
      if (paymentMethod !== 'cash') {
        await this.processPayment(order.id, totalAmount, paymentMethod)
      }

      // Send order confirmation
      await this.sendOrderConfirmation(order)

      return order
    } catch (error) {
      console.error('Error creating order:', error)
      throw error
    }
  }

  /**
   * Generate unique order number for restaurant
   * @param {string} restaurantId - Restaurant UUID
   * @returns {Promise<string>} - Order number
   */
  static async generateOrderNumber(restaurantId) {
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    
    // Get today's order count
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .gte('created_at', new Date(date.setHours(0, 0, 0, 0)).toISOString())

    const orderSequence = String((count || 0) + 1).padStart(4, '0')
    return `ORD-${dateStr}-${orderSequence}`
  }

  /**
   * Calculate estimated preparation time based on items
   * @param {Array} items - Order items
   * @returns {Promise<number>} - Preparation time in minutes
   */
  static async calculatePreparationTime(items) {
    try {
      // Get menu items with preparation times
      const itemIds = items.map(item => item.id)
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('id, preparation_time')
        .in('id', itemIds)

      if (!menuItems) return 20 // Default 20 minutes

      // Calculate max preparation time (items prepared in parallel)
      const maxPrepTime = Math.max(...menuItems.map(item => item.preparation_time || 15))
      
      // Add buffer time based on quantity
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
      const bufferTime = Math.min(totalQuantity * 2, 15) // Max 15 minutes buffer

      return maxPrepTime + bufferTime
    } catch (error) {
      console.error('Error calculating preparation time:', error)
      return 20 // Default fallback
    }
  }

  /**
   * Update order status
   * @param {string} orderId - Order UUID
   * @param {string} status - New status
   * @param {Object} additionalData - Additional update data
   */
  static async updateOrderStatus(orderId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        ...additionalData
      }

      // Add timestamp based on status
      switch (status) {
        case 'confirmed':
          updateData.confirmed_at = new Date().toISOString()
          break
        case 'preparing':
          updateData.prepared_at = new Date().toISOString()
          break
        case 'ready':
          updateData.prepared_at = new Date().toISOString()
          break
        case 'served':
          updateData.served_at = new Date().toISOString()
          break
        case 'completed':
          updateData.completed_at = new Date().toISOString()
          break
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString()
          break
      }

      const { data: order, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      // Send status update notification
      await this.sendStatusNotification(order)

      // If completed or cancelled, release from staff
      if (['completed', 'cancelled'].includes(status) && order.assigned_staff_id) {
        await StaffAssignmentService.releaseOrderFromStaff(orderId, order.assigned_staff_id)
      }

      return order
    } catch (error) {
      console.error('Error updating order status:', error)
      throw error
    }
  }

  /**
   * Get order details with items
   * @param {string} orderId - Order UUID
   * @returns {Promise<Object>} - Order with items
   */
  static async getOrderDetails(orderId) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            menu_item:menu_items(*)
          ),
          restaurant:restaurants(*),
          table:restaurant_tables(*),
          staff:staff(*),
          customer:auth.users(*)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error

      return order
    } catch (error) {
      console.error('Error getting order details:', error)
      throw error
    }
  }

  /**
   * Get orders for a restaurant
   * @param {string} restaurantId - Restaurant UUID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - List of orders
   */
  static async getRestaurantOrders(restaurantId, filters = {}) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(count),
          table:restaurant_tables(table_number),
          staff:staff(name)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.date) {
        const startDate = new Date(filters.date)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(filters.date)
        endDate.setHours(23, 59, 59, 999)

        query = query
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
      }

      if (filters.tableId) {
        query = query.eq('table_id', filters.tableId)
      }

      if (filters.staffId) {
        query = query.eq('assigned_staff_id', filters.staffId)
      }

      const { data: orders, error } = await query

      if (error) throw error

      return orders
    } catch (error) {
      console.error('Error getting restaurant orders:', error)
      throw error
    }
  }

  /**
   * Track order in real-time
   * @param {string} orderId - Order UUID
   * @param {Function} onUpdate - Callback for updates
   * @returns {Object} - Subscription object
   */
  static trackOrder(orderId, onUpdate) {
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`
        },
        (payload) => {
          onUpdate(payload.new)
        }
      )
      .subscribe()

    return subscription
  }

  /**
   * Process payment for order
   * @param {string} orderId - Order UUID
   * @param {number} amount - Payment amount
   * @param {string} method - Payment method
   */
  static async processPayment(orderId, amount, method) {
    try {
      // Create payment record
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          order_id: orderId,
          amount,
          payment_method: method,
          status: 'processing'
        })
        .select()
        .single()

      if (error) throw error

      // TODO: Integrate with actual payment gateway
      // For now, simulate payment success
      setTimeout(async () => {
        await supabase
          .from('payments')
          .update({
            status: 'success',
            transaction_id: `TXN-${Date.now()}`,
            completed_at: new Date().toISOString()
          })
          .eq('id', payment.id)

        await supabase
          .from('orders')
          .update({ payment_status: 'paid' })
          .eq('id', orderId)
      }, 2000)

      return payment
    } catch (error) {
      console.error('Error processing payment:', error)
      throw error
    }
  }

  /**
   * Add tip to order
   * @param {string} orderId - Order UUID
   * @param {number} tipAmount - Tip amount
   */
  static async addTip(orderId, tipAmount) {
    try {
      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      // Update order with tip
      const newTotal = order.total_amount + tipAmount
      await supabase
        .from('orders')
        .update({
          tip_amount: tipAmount,
          total_amount: newTotal
        })
        .eq('id', orderId)

      // Create tip record for staff
      if (order.assigned_staff_id) {
        await supabase
          .from('tips')
          .insert({
            order_id: orderId,
            staff_id: order.assigned_staff_id,
            amount: tipAmount,
            payment_method: order.payment_method
          })

        // Update staff total tips
        const { data: staff } = await supabase
          .from('staff')
          .select('total_tips_received')
          .eq('id', order.assigned_staff_id)
          .single()

        await supabase
          .from('staff')
          .update({
            total_tips_received: (staff.total_tips_received || 0) + tipAmount
          })
          .eq('id', order.assigned_staff_id)
      }

      return { success: true, tipAmount }
    } catch (error) {
      console.error('Error adding tip:', error)
      throw error
    }
  }

  /**
   * Send order confirmation notification
   * @param {Object} order - Order object
   */
  static async sendOrderConfirmation(order) {
    try {
      // Send real-time notification
      if (order.session_id) {
        await supabase
          .channel(`session-${order.session_id}`)
          .send({
            type: 'broadcast',
            event: 'order_confirmed',
            payload: {
              orderId: order.id,
              orderNumber: order.order_number,
              estimatedTime: order.estimated_preparation_time,
              message: `Order #${order.order_number} confirmed! Estimated preparation time: ${order.estimated_preparation_time} minutes`
            }
          })
      }
    } catch (error) {
      console.error('Error sending order confirmation:', error)
    }
  }

  /**
   * Send order status notification
   * @param {Object} order - Order object
   */
  static async sendStatusNotification(order) {
    try {
      const statusMessages = {
        confirmed: 'Your order has been confirmed',
        preparing: 'Your order is being prepared',
        ready: 'Your order is ready',
        served: 'Your order has been served',
        completed: 'Thank you for your order!',
        cancelled: 'Your order has been cancelled'
      }

      if (order.session_id) {
        await supabase
          .channel(`session-${order.session_id}`)
          .send({
            type: 'broadcast',
            event: 'order_status_update',
            payload: {
              orderId: order.id,
              orderNumber: order.order_number,
              status: order.status,
              message: statusMessages[order.status] || 'Order status updated'
            }
          })
      }
    } catch (error) {
      console.error('Error sending status notification:', error)
    }
  }

  /**
   * Cancel order
   * @param {string} orderId - Order UUID
   * @param {string} reason - Cancellation reason
   */
  static async cancelOrder(orderId, reason) {
    try {
      const order = await this.updateOrderStatus(orderId, 'cancelled', {
        cancellation_reason: reason
      })

      // Process refund if payment was made
      if (order.payment_status === 'paid') {
        await this.processRefund(orderId)
      }

      return order
    } catch (error) {
      console.error('Error cancelling order:', error)
      throw error
    }
  }

  /**
   * Process refund for cancelled order
   * @param {string} orderId - Order UUID
   */
  static async processRefund(orderId) {
    try {
      // Update payment status
      await supabase
        .from('payments')
        .update({ status: 'refunded' })
        .eq('order_id', orderId)

      // Update order payment status
      await supabase
        .from('orders')
        .update({ payment_status: 'refunded' })
        .eq('id', orderId)

      // TODO: Integrate with payment gateway for actual refund

      return { success: true }
    } catch (error) {
      console.error('Error processing refund:', error)
      throw error
    }
  }
}

export default OrderService
