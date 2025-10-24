import { supabase } from '../config/supabase'
import StaffAssignmentService from './staffAssignmentService'
import CartService from './cartService'
import realtimeService from './realtimeService'

/**
 * Enhanced Order Management Service for Complete Restaurant Workflow
 * Handles end-to-end order processing with real-time notifications
 * 
 * COMPLETE WORKFLOW:
 * 1. Customer adds items to cart (stored in database)
 * 2. Customer places order from cart
 * 3. System checks staff availability
 * 4. If staff available: Auto-assign + notify staff
 * 5. If no staff: Notify restaurant owner
 * 6. Real-time updates for all parties
 * 7. Payment handling (pay now or pay later)
 * 8. Order completion and feedback
 */
class OrderService {
  /**
   * Create order from customer cart with complete workflow
   * @param {Object} orderData - Order details
   * @returns {Promise<Object>} - Created order with workflow status
   */
  static async createOrder(orderData) {
    try {
      const {
        restaurantId,
        tableId,
        sessionId,
        specialInstructions,
        paymentMethod = 'cash',
        tipAmount = 0
      } = orderData

      console.log('🛒 Starting order creation from cart...')

      // Step 1: Get cart items from database
      const cartSummary = await CartService.getCartSummary(sessionId)
      if (cartSummary.isEmpty) {
        throw new Error('Cart is empty. Please add items before placing order.')
      }

      // Step 2: Validate cart items availability
      const validation = await CartService.validateCart(sessionId)
      if (!validation.isValid) {
        throw new Error(`Some items are no longer available: ${validation.unavailableItems.map(item => item.name).join(', ')}`)
      }

      console.log('✅ Cart validated:', cartSummary.itemCount, 'items')

      // Step 3: Calculate order totals
      const subtotal = cartSummary.subtotal
      const taxAmount = cartSummary.taxAmount
      const totalAmount = subtotal + taxAmount + tipAmount

      // Step 4: Generate order number
      const orderNumber = await this.generateOrderNumber(restaurantId)

      // Step 5: Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          session_id: sessionId,
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
          estimated_preparation_time: await this.calculatePreparationTime(cartSummary.items)
        })
        .select()
        .single()

      if (orderError) throw orderError

      console.log('✅ Order created:', order.order_number)

      // Step 6: Create order items from cart
      const orderItems = cartSummary.items.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        item_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.totalPrice,
        special_instructions: item.specialInstructions
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Step 7: Clear cart after successful order creation
      await CartService.clearCart(sessionId)
      console.log('✅ Cart cleared after order creation')

      // Step 8: Check staff availability and assign
      let staffAssignment = null
      let workflowStatus = 'pending'

      try {
        staffAssignment = await StaffAssignmentService.assignOrderToStaff(
          restaurantId,
          order.id
        )

        if (staffAssignment) {
          workflowStatus = 'assigned'
          order.assigned_staff_id = staffAssignment.staffId
          console.log('✅ Order assigned to staff:', staffAssignment.staffName)

          // Notify staff about new order
          await realtimeService.notifyStaffNewOrder(staffAssignment.staffId, {
            ...order,
            order_items: orderItems
          })

          // Notify customer about assignment
          await realtimeService.notifyCustomerOrderUpdate(sessionId, order, 'assigned')

        } else {
          // No staff available - notify restaurant owner
          console.warn('⚠️ No staff available for order assignment')
          await realtimeService.notifyOwnerStaffUnavailable(restaurantId, order)
          workflowStatus = 'awaiting_staff'
        }
      } catch (assignmentError) {
        console.warn('Staff assignment failed:', assignmentError)
        // Notify owner about the issue
        await realtimeService.notifyOwnerStaffUnavailable(restaurantId, order)
        workflowStatus = 'assignment_failed'
      }

      // Step 9: Process payment if online
      if (paymentMethod !== 'cash') {
        try {
          await this.processPayment(order.id, totalAmount, paymentMethod)
          console.log('✅ Online payment processed')
        } catch (paymentError) {
          console.error('Payment processing failed:', paymentError)
          // Order still created, payment can be retried
        }
      } else {
        // Notify staff about cash payment collection
        if (staffAssignment) {
          await realtimeService.notifyStaffPaymentCollection(
            staffAssignment.staffId, 
            order, 
            'cash'
          )
        }
      }

      // Step 10: Send order confirmation to customer
      await this.sendOrderConfirmation(order)
      await realtimeService.notifyCustomerOrderUpdate(sessionId, order, 'pending')

      // Return order with workflow information
      return {
        ...order,
        order_items: orderItems,
        workflow_status: workflowStatus,
        staff_assignment: staffAssignment,
        cart_cleared: true,
        notifications_sent: true
      }

    } catch (error) {
      console.error('❌ Error creating order:', error)
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

      // Update the updated_at timestamp for all status changes
      updateData.updated_at = new Date().toISOString()
      
      // Note: Using updated_at for all status changes since specific timestamp columns
      // (confirmed_at, prepared_at, served_at, etc.) don't exist in the actual database schema
      switch (status) {
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
          table:tables(*),
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
      // First, get orders with basic relationships (avoiding problematic joins)
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(*,menu_items(name,price,image_url)),
          tables(table_number,location),
          payments(amount,payment_method,status,transaction_id)
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

      // Apply limit for performance
      if (filters.limit) {
        query = query.limit(filters.limit)
      } else {
        query = query.limit(50) // Default limit
      }

      const { data: orders, error } = await query

      if (error) throw error

      // Separately fetch staff and customer information to avoid foreign key issues
      const ordersWithEnrichedData = await Promise.all(
        orders.map(async (order) => {
          let enrichedOrder = { ...order }

          // Fetch staff information if assigned
          if (order.assigned_staff_id) {
            try {
              const { data: staffData } = await supabase
                .from('staff')
                .select('id, position, user_id')
                .eq('id', order.assigned_staff_id)
                .single()

              if (staffData) {
                let staffName = 'Staff Member'
                if (staffData.user_id) {
                  try {
                    const { data: userData } = await supabase.auth.admin.getUserById(staffData.user_id)
                    staffName = userData?.user?.user_metadata?.full_name || userData?.user?.email || 'Staff Member'
                  } catch (authError) {
                    console.warn('Could not fetch staff user data:', authError)
                  }
                }

                enrichedOrder.staff = {
                  id: staffData.id,
                  name: staffName,
                  position: staffData.position
                }
              }
            } catch (staffError) {
              console.warn('Could not fetch staff data for order:', order.id, staffError)
            }
          }

          // Fetch customer session information if session_id exists
          if (order.session_id) {
            try {
              const { data: sessionData } = await supabase
                .from('customer_sessions')
                .select('customer_name, customer_phone, customer_email')
                .eq('session_id', order.session_id)
                .single()

              if (sessionData) {
                enrichedOrder.customer_sessions = [{
                  customer_name: sessionData.customer_name,
                  customer_phone: sessionData.customer_phone,
                  customer_email: sessionData.customer_email
                }]
              }
            } catch (sessionError) {
              console.warn('Could not fetch customer session data for order:', order.id, sessionError)
            }
          }
          
          return enrichedOrder
        })
      )

      return ordersWithEnrichedData
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

  // ==================== CUSTOMER-SPECIFIC METHODS ====================

  /**
   * Create customer session for QR ordering
   * @param {Object} sessionData - Session information
   * @returns {Promise<Object>} - Created session
   */
  static async createCustomerSession(sessionData) {
    try {
      const { sessionId, restaurantId, tableId, customerName, customerPhone } = sessionData

      const { data: session, error } = await supabase
        .from('customer_sessions')
        .insert({
          session_id: sessionId,
          restaurant_id: restaurantId,
          table_id: tableId,
          customer_name: customerName,
          customer_phone: customerPhone,
          status: 'active'
        })
        .select()
        .single()

      if (error) throw error
      return session

    } catch (error) {
      console.error('Error creating customer session:', error)
      throw error
    }
  }

  /**
   * Get customer order history by session
   * @param {string} sessionId - Customer session ID
   * @returns {Promise<Array>} - Customer orders
   */
  static async getCustomerOrders(sessionId) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (name, price, image_url)
          ),
          restaurants (name, phone),
          staff!orders_assigned_staff_id_fkey (
            id,
            user_id,
            users!staff_user_id_fkey (full_name)
          )
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []

    } catch (error) {
      console.error('Error fetching customer orders:', error)
      throw error
    }
  }

  // ==================== STAFF-SPECIFIC METHODS ====================

  /**
   * Get orders assigned to specific staff member
   * @param {string} staffId - Staff UUID
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} - Staff orders
   */
  static async getStaffOrders(staffId, filters = {}) {
    try {
      // First, get basic order data without problematic joins
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (name, price, image_url, preparation_time)
          ),
          tables (table_number, location)
        `)
        .eq('assigned_staff_id', staffId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      // Limit results for better performance
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      const { data: orders, error } = await query

      if (error) throw error

      // Enrich orders with additional data separately
      const enrichedOrders = await Promise.all(
        orders.map(async (order) => {
          try {
            // Get customer session info if session_id exists
            let customerInfo = null
            if (order.session_id) {
              const { data: sessionData } = await supabase
                .from('customer_sessions')
                .select('customer_name, customer_phone')
                .eq('id', order.session_id)
                .single()
              
              if (sessionData) {
                customerInfo = {
                  customer_name: sessionData.customer_name,
                  customer_phone: sessionData.customer_phone
                }
              }
            }

            // Get restaurant info by finding the restaurant that owns this staff member
            const { data: staffData } = await supabase
              .from('staff')
              .select('restaurant_id')
              .eq('user_id', staffId)
              .single()

            let restaurantInfo = null
            if (staffData?.restaurant_id) {
              const { data: restaurant } = await supabase
                .from('restaurants')
                .select('name')
                .eq('id', staffData.restaurant_id)
                .single()

              if (restaurant) {
                restaurantInfo = { name: restaurant.name }
              }
            }

            return {
              ...order,
              customer_sessions: customerInfo,
              restaurants: restaurantInfo
            }
          } catch (err) {
            console.warn('Error enriching order data for order:', order.id, err)
            return {
              ...order,
              customer_sessions: null,
              restaurants: null
            }
          }
        })
      )

      return enrichedOrders
    } catch (error) {
      console.error('Error fetching staff orders:', error)
      throw error
    }
  }
  static async updateOrderStatusByStaff(orderId, status, staffId) {
    try {
      // Validate staff has access to this order
      const { data: order } = await supabase
        .from('orders')
        .select('assigned_staff_id, restaurant_id, status as current_status')
        .eq('id', orderId)
        .single()

      if (!order || order.assigned_staff_id !== staffId) {
        throw new Error('Unauthorized: Staff not assigned to this order')
      }

      // Validate status transition
      const validTransitions = {
        'pending': ['assigned', 'cancelled'],
        'assigned': ['preparing', 'cancelled'],
        'preparing': ['ready', 'cancelled'],
        'ready': ['served', 'cancelled'],
        'served': ['completed'],
        'completed': [],
        'cancelled': []
      }

      if (!validTransitions[order.current_status]?.includes(status)) {
        throw new Error(`Invalid status transition from ${order.current_status} to ${status}`)
      }

      // Update order with timestamp
      const updates = { 
        status,
        updated_at: new Date().toISOString()
      }

      // Note: Status-specific timestamp columns don't exist in actual database schema
      // Only using updated_at for all status changes
      if (status === 'completed') {
        // Update staff statistics
        await supabase.rpc('increment_staff_orders', { 
          staff_id: staffId 
        })
      }

      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      // Send notifications
      await this.sendStatusNotification(updatedOrder)

      return updatedOrder

    } catch (error) {
      console.error('Error updating order status by staff:', error)
      throw error
    }
  }

  /**
   * Get staff earnings and performance
   * @param {string} staffId - Staff UUID
   * @param {Object} filters - Date filters
   * @returns {Promise<Object>} - Staff earnings data
   */
  static async getStaffEarnings(staffId, filters = {}) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          total_amount,
          tip_amount,
          status,
          created_at,
          completed_at,
          tips (amount)
        `)
        .eq('assigned_staff_id', staffId)

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data: orders, error } = await query

      if (error) throw error

      // Calculate earnings
      const completedOrders = orders.filter(order => order.status === 'completed')
      const totalOrders = orders.length
      const totalEarnings = completedOrders.reduce((sum, order) => sum + (order.tip_amount || 0), 0)
      const totalTips = orders.reduce((sum, order) => {
        return sum + (order.tips?.reduce((tipSum, tip) => tipSum + tip.amount, 0) || 0)
      }, 0)

      return {
        totalOrders,
        completedOrders: completedOrders.length,
        totalEarnings,
        totalTips,
        averageOrderValue: completedOrders.length > 0 ? 
          completedOrders.reduce((sum, order) => sum + order.total_amount, 0) / completedOrders.length : 0,
        completionRate: totalOrders > 0 ? (completedOrders.length / totalOrders) * 100 : 0
      }

    } catch (error) {
      console.error('Error fetching staff earnings:', error)
      throw error
    }
  }

  // ==================== RESTAURANT OWNER METHODS ====================

  /**
   * Get comprehensive restaurant orders with analytics
   * @param {string} restaurantId - Restaurant UUID
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Orders and analytics
   */
  static async getRestaurantOrdersWithAnalytics(restaurantId, filters = {}) {
    try {
      // Use the fixed getRestaurantOrders method to avoid foreign key issues
      const orders = await this.getRestaurantOrders(restaurantId, filters)

      // Calculate analytics
      const analytics = this.calculateOrderAnalytics(orders || [])

      return {
        orders: orders || [],
        analytics
      }

    } catch (error) {
      console.error('Error fetching restaurant orders with analytics:', error)
      
      // Fallback: return empty data structure
      return {
        orders: [],
        analytics: {
          totalOrders: 0,
          todaysOrders: 0,
          totalRevenue: 0,
          todaysRevenue: 0,
          averageOrderValue: 0,
          ordersByStatus: {},
          completionRate: 0
        }
      }
    }
  }

  /**
   * Manually assign order to staff (owner override)
   * @param {string} orderId - Order UUID
   * @param {string} staffId - Staff UUID
   * @param {string} ownerId - Owner UUID for authorization
   * @returns {Promise<Object>} - Updated order
   */
  static async assignOrderToStaffByOwner(orderId, staffId, ownerId) {
    try {
      // Validate owner has access to this order
      const { data: order } = await supabase
        .from('orders')
        .select('restaurant_id')
        .eq('id', orderId)
        .single()

      if (!order) {
        throw new Error('Order not found')
      }

      // Validate restaurant ownership separately
      const { data: restaurant } = await supabase
        .from('restaurants')
        .select('owner_id')
        .eq('id', order.restaurant_id)
        .single()

      if (!restaurant || restaurant.owner_id !== ownerId) {
        throw new Error('Unauthorized: Not restaurant owner')
      }

      // Validate staff belongs to restaurant
      const { data: staff } = await supabase
        .from('staff')
        .select('id, is_available')
        .eq('id', staffId)
        .eq('restaurant_id', order.restaurant_id)
        .single()

      if (!staff) {
        throw new Error('Staff not found or not part of restaurant')
      }

      // Update order assignment
      const { data: updatedOrder, error } = await supabase
        .from('orders')
        .update({
          assigned_staff_id: staffId,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      // Send notification to staff
      await this.sendStaffNotification(staffId, {
        type: 'order_assigned',
        title: `New Order Assigned`,
        message: `Order #${updatedOrder.order_number} has been assigned to you`,
        data: { orderId: updatedOrder.id }
      })

      return updatedOrder

    } catch (error) {
      console.error('Error assigning order to staff:', error)
      throw error
    }
  }

  // ==================== SUPER ADMIN METHODS ====================

  /**
   * Get platform-wide order analytics for super admin
   * @param {Object} filters - Filter options
   * @returns {Promise<Object>} - Platform analytics
   */
  static async getPlatformOrderAnalytics(filters = {}) {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (quantity, total_price)
        `)

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from)
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to)
      }

      const { data: orders, error } = await query

      if (error) throw error

      // Calculate platform-wide analytics
      const analytics = {
        totalOrders: orders.length,
        totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
        averageOrderValue: orders.length > 0 ? 
          orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length : 0,
        ordersByStatus: {},
        ordersByRestaurant: {},
        revenueByRestaurant: {},
        ordersTrend: this.calculateOrdersTrend(orders),
        topRestaurants: await this.getTopRestaurants(orders)
      }

      // Group by status
      orders.forEach(order => {
        analytics.ordersByStatus[order.status] = 
          (analytics.ordersByStatus[order.status] || 0) + 1
      })

      // Get restaurant names separately to avoid foreign key issues
      const restaurantIds = [...new Set(orders.map(order => order.restaurant_id))]
      const { data: restaurants } = await supabase
        .from('restaurants')
        .select('id, name')
        .in('id', restaurantIds)

      const restaurantMap = restaurants?.reduce((acc, restaurant) => {
        acc[restaurant.id] = restaurant.name
        return acc
      }, {}) || {}

      // Group by restaurant
      orders.forEach(order => {
        const restaurantName = restaurantMap[order.restaurant_id] || 'Unknown'
        analytics.ordersByRestaurant[restaurantName] = 
          (analytics.ordersByRestaurant[restaurantName] || 0) + 1
        analytics.revenueByRestaurant[restaurantName] = 
          (analytics.revenueByRestaurant[restaurantName] || 0) + order.total_amount
      })

      return analytics

    } catch (error) {
      console.error('Error fetching platform analytics:', error)
      throw error
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * Subscribe to order updates for customers
   * @param {string} sessionId - Customer session ID
   * @param {Function} callback - Update callback
   * @returns {Object} - Subscription object
   */
  static subscribeToCustomerOrders(sessionId, callback) {
    try {
      console.log('🔄 Setting up customer order subscription for session:', sessionId)
      
      const subscription = supabase
        .channel(`customer-orders-${sessionId}`, {
          config: {
            broadcast: { self: true },
            presence: { key: sessionId }
          }
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `session_id=eq.${sessionId}`
          },
          async (payload) => {
            console.log('📨 Customer order update received:', payload)
            
            // Transform the payload to match expected format
            const orderUpdate = payload.new || payload.old
            if (orderUpdate && callback) {
              let staffName = null
              
              // If order has assigned staff, fetch staff name
              if (orderUpdate.assigned_staff_id) {
                try {
                  const { data: staffData } = await supabase
                    .from('staff')
                    .select(`
                      id,
                      staff_name,
                      users!staff_user_id_fkey (
                        user_metadata
                      )
                    `)
                    .eq('id', orderUpdate.assigned_staff_id)
                    .single()
                  
                  if (staffData) {
                    // Try to get name from staff_name field first, then from user metadata
                    staffName = staffData.staff_name || 
                               staffData.users?.user_metadata?.full_name || 
                               'Staff Member'
                  }
                } catch (error) {
                  console.warn('Could not fetch staff name:', error)
                  staffName = 'Staff Member'
                }
              }
              
              callback({
                ...orderUpdate,
                assigned_staff_name: staffName
              })
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Customer orders subscription status:', status)
          if (err) {
            console.error('❌ Customer orders subscription error:', err)
          }
          if (status === 'SUBSCRIBED') {
            console.log('✅ Customer orders subscription active')
          }
        })

      return subscription
    } catch (error) {
      console.error('Error subscribing to customer orders:', error)
      // Return a mock subscription object for compatibility
      return {
        unsubscribe: () => console.log('Mock unsubscribe called')
      }
    }
  }

  /**
   * Subscribe to order updates for staff
   * @param {string} staffId - Staff UUID
   * @param {Function} callback - Update callback
   * @returns {Object} - Subscription object
   */
  static subscribeToStaffOrders(staffId, callback) {
    try {
      console.log('🔄 Setting up staff order subscription for staff:', staffId)
      
      const subscription = supabase
        .channel(`staff-orders-${staffId}`, {
          config: {
            broadcast: { self: true },
            presence: { key: staffId }
          }
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `assigned_staff_id=eq.${staffId}`
          },
          (payload) => {
            console.log('📨 Staff order update received:', payload)
            if (callback) {
              const orderData = payload.new || payload.old
              callback({
                ...payload,
                order_number: orderData?.order_number,
                status: orderData?.status
              })
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Staff orders subscription status:', status)
          if (err) {
            console.error('❌ Staff orders subscription error:', err)
          }
          if (status === 'SUBSCRIBED') {
            console.log('✅ Staff orders subscription active')
          }
        })

      return subscription
    } catch (error) {
      console.error('Error subscribing to staff orders:', error)
      // Return a mock subscription object for compatibility
      return {
        unsubscribe: () => console.log('Mock unsubscribe called')
      }
    }
  }

  /**
   * Subscribe to order updates for restaurant
   * @param {string} restaurantId - Restaurant UUID
   * @param {Function} callback - Update callback
   * @returns {Object} - Subscription object
   */
  static subscribeToRestaurantOrders(restaurantId, callback) {
    return supabase
      .from('orders')
      .on('*', { filter: `restaurant_id=eq.${restaurantId}` }, callback)
      .subscribe()
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Calculate order analytics
   * @param {Array} orders - Orders array
   * @returns {Object} - Analytics data
   */
  static calculateOrderAnalytics(orders) {
    const today = new Date().toISOString().split('T')[0]
    const todaysOrders = orders.filter(order => order.created_at.startsWith(today))
    
    return {
      totalOrders: orders.length,
      todaysOrders: todaysOrders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
      todaysRevenue: todaysOrders.reduce((sum, order) => sum + order.total_amount, 0),
      averageOrderValue: orders.length > 0 ? 
        orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length : 0,
      ordersByStatus: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1
        return acc
      }, {}),
      completionRate: orders.length > 0 ? 
        (orders.filter(order => order.status === 'completed').length / orders.length) * 100 : 0
    }
  }

  /**
   * Calculate orders trend for analytics
   * @param {Array} orders - Orders array
   * @returns {Array} - Trend data
   */
  static calculateOrdersTrend(orders) {
    const last7Days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayOrders = orders.filter(order => 
        order.created_at.startsWith(dateStr)
      )
      
      last7Days.push({
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + order.total_amount, 0)
      })
    }
    
    return last7Days
  }

  /**
   * Get top performing restaurants
   * @param {Array} orders - Orders array
   * @returns {Promise<Array>} - Top restaurants
   */
  static async getTopRestaurants(orders) {
    const restaurantStats = {}
    
    // Get restaurant names for the orders
    const restaurantIds = [...new Set(orders.map(order => order.restaurant_id))]
    const { data: restaurants } = await supabase
      .from('restaurants')
      .select('id, name')
      .in('id', restaurantIds)

    const restaurantMap = restaurants?.reduce((acc, restaurant) => {
      acc[restaurant.id] = restaurant.name
      return acc
    }, {}) || {}

    orders.forEach(order => {
      const restaurantName = restaurantMap[order.restaurant_id] || 'Unknown'
      if (!restaurantStats[restaurantName]) {
        restaurantStats[restaurantName] = {
          name: restaurantName,
          orders: 0,
          revenue: 0
        }
      }
      
      restaurantStats[restaurantName].orders++
      restaurantStats[restaurantName].revenue += order.total_amount
    })
    
    return Object.values(restaurantStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }

  /**
   * Send notification to staff
   * @param {string} staffId - Staff UUID
   * @param {Object} notification - Notification data
   */
  static async sendStaffNotification(staffId, notification) {
    try {
      await supabase
        .from('notifications')
        .insert({
          recipient_id: staffId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data
        })
    } catch (error) {
      console.error('Error sending staff notification:', error)
    }
  }
}

export default OrderService
