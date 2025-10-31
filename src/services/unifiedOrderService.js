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
    tipAmount = 0,
    discountAmount = 0,
    coinsRedeemed = 0, // Ordyrr Coins redeemed for this order
    firstOrderDiscountApplied = false
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
      
      const platformFeeRate = 0.015 // 1.5% platform fee (same as cart)
      const platformFee = subtotal * platformFeeRate
      const totalAmount = subtotal + platformFee + tipAmount - discountAmount
      
      console.log('📋 Order totals:', {
        subtotal: subtotal,
        platformFee: platformFee,
        tipAmount: tipAmount,
        discountAmount: discountAmount,
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

      // Step 6: Create or get customer record for order
      let customerId = null
      
      // If customerId is provided (for logged-in users), use it directly
      if (customerInfo?.customerId) {
        customerId = customerInfo.customerId
        console.log('✅ Using provided customer ID (logged-in user):', customerId)
      } else if (customerInfo?.email || customerInfo?.phone || customerInfo?.name) {
        // For guest customers, create or find customer record
        try {
          console.log('📋 Step 4: Creating guest customer record...');
          // Use Supabase function to get or create guest customer
          const { data: customerUuid, error: customerError } = await supabase
            .rpc('get_or_create_guest_customer', {
              p_email: customerInfo.email,
              p_phone: customerInfo.phone,
              p_full_name: customerInfo.name
            });
          
          if (customerError) {
            console.error('❌ Customer creation RPC error:', customerError);
            throw customerError;
          }
          
          customerId = customerUuid;
          console.log('✅ Guest customer record created/found:', customerId);
        } catch (customerError) {
          console.warn('⚠️ Customer creation failed, continuing without customer_id:', customerError);
          // Continue without customer_id - order can still be created
        }
      }

      // Step 7: Create the order
      const orderData = {
        restaurant_id: restaurantId,
        table_id: tableId,
        session_id: sessionId,
        order_number: orderNumber,
        status: assignedStaffId ? 'assigned' : 'pending',
        order_type: source === 'staff' ? 'staff_assisted' : 'dine_in',
        subtotal: subtotal,
        tax_amount: platformFee, // Store platform fee in tax_amount field for backward compatibility
        tip_amount: tipAmount,
        discount_amount: discountAmount,
        coins_redeemed: coinsRedeemed, // Track Ordyrr Coins used for this order
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: 'pending',
        special_instructions: specialInstructions,
        assigned_staff_id: assignedStaffId,
        assigned_at: assignedStaffId ? new Date().toISOString() : null,
        estimated_preparation_time: this.calculatePreparationTime(cartItems)
        // Note: Offer usage is tracked in customer_offers table, not in orders table
      };

      // Only add customer_id if we successfully created/found a customer
      if (customerId) {
        orderData.customer_id = customerId;
        console.log('✅ Adding customer_id to order:', customerId);
      } else {
        console.log('⚠️ No customer_id available, creating order without customer link');
      }

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
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

      // Step 8.5: Track offer usage if discount was applied
      if (discountAmount > 0 && firstOrderDiscountApplied && customerId) {
        console.log('💰 Recording offer usage:', {
          discountAmount,
          firstOrderDiscountApplied,
          customerId,
          orderId: order.id
        })
        
        try {
          // Get the first order offer
          const { data: offer, error: offerError } = await supabase
            .from('offers')
            .select('id, offer_code')
            .eq('offer_code', 'FIRST_ORDER_10')
            .eq('is_active', true)
            .single()
          
          if (offerError) {
            console.error('❌ Failed to fetch offer:', offerError)
            throw offerError
          }
          
          if (!offer) {
            console.error('❌ Offer not found: FIRST_ORDER_10')
            throw new Error('Offer not found')
          }
          
          console.log('✅ Found offer to record:', offer.offer_code, 'ID:', offer.id)
          
          // Record offer usage
          const { data: insertedData, error: offerUsageError } = await supabase
            .from('customer_offers')
            .insert({
              customer_id: customerId,
              offer_id: offer.id,
              order_id: order.id,
              discount_amount: discountAmount
            })
            .select()
          
          if (offerUsageError) {
            console.error('❌ Failed to track offer usage:', offerUsageError)
            throw offerUsageError
          }
          
          console.log('✅ Offer usage tracked successfully:', insertedData)
        } catch (offerError) {
          console.error('❌ CRITICAL: Error tracking offer usage:', offerError)
          // This is critical - we should not silently fail
          // The discount was applied but not tracked, which allows reuse
          throw new Error(`Failed to track offer usage: ${offerError.message}`)
        }
      } else {
        console.log('ℹ️ Skipping offer usage tracking:', {
          discountAmount,
          firstOrderDiscountApplied,
          customerId: customerId || 'missing'
        })
      }

      // Step 9: Reserve table NOW (only after successful order creation)
      try {
        console.log('🪑 Reserving table after successful order creation...')
        
        // Import tableService dynamically to avoid circular imports
        const { default: tableService } = await import('./tableService')
        
        if (source === 'customer') {
          await tableService.reserveTableByCustomer(
            tableId,
            restaurantId,
            sessionId,
            {
              name: customerInfo.name || 'Customer',
              phone: customerInfo.phone,
              email: customerInfo.email
            }
          )
        } else if (source === 'staff') {
          await tableService.reserveTableByStaff(
            tableId,
            {
              name: customerInfo.name,
              phone: customerInfo.phone,
              email: customerInfo.email
            },
            restaurantId,
            staffId
          )
        }
        
        console.log('✅ Table reserved successfully after order creation')
      } catch (reservationError) {
        console.warn('⚠️ Table reservation failed but order was created:', reservationError)
        // Don't fail the entire order if table reservation fails
      }

      // Step 10: Create loyalty points (if customer exists)
      if (customerId) {
        try {
          console.log('🎁 Step 10: Creating loyalty points...');
          const pointsEarned = Math.floor(totalAmount * 0.1); // 10% of total as points
          
          const { error: loyaltyError } = await supabase
            .from('loyalty_points')
            .insert({
              customer_id: customerId,
              restaurant_id: restaurantId,
              order_id: order.id,
              points_earned: pointsEarned,
              points_redeemed: 0,
              current_balance: pointsEarned, // Track current balance
              tier: 'bronze', // Default tier
              transaction_type: 'earned',
              description: `Points earned from order ${orderNumber}`
            });
          
          if (loyaltyError) {
            console.warn('⚠️ Loyalty points creation failed:', loyaltyError);
          } else {
            console.log('✅ Loyalty points created:', pointsEarned);
          }
        } catch (loyaltyErr) {
          console.warn('⚠️ Loyalty points error:', loyaltyErr);
        }
      } else {
        console.log('ℹ️ Skipping loyalty points - no customer record');
      }

      // Step 11: Add to order queue
      await this.addToOrderQueue(order.id, restaurantId)

      // Step 12: Send notifications
      await this.sendOrderNotifications(order, source, assignedStaffId)

      // Step 12: Get table info for response
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
      console.log('🔄 Staff accepting order:', { orderId, staffId });
      
      // First check if order exists and can be accepted
      const { data: existingOrder, error: checkError } = await supabase
        .from('orders')
        .select('id, status, assigned_staff_id, restaurant_id')
        .eq('id', orderId)
        .single()
      
      if (checkError) {
        console.error('❌ Order not found:', checkError);
        throw new Error('Order not found');
      }
      
      // Update the order status
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          status: 'accepted',
          assigned_staff_id: staffId,
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select(`
          *,
          tables (table_number),
          customers (full_name)
        `)
        .single()

      if (error) {
        console.error('❌ Error updating order:', error);
        throw error;
      }

      // Create notification for restaurant owner
      await this.createNotification({
        recipient_id: order.restaurant_id,
        type: 'order_accepted',
        title: `Order Accepted`,
        message: `Staff accepted order #${order.order_number} for Table ${order.tables?.table_number}`,
        data: { order_id: orderId, order_number: order.order_number }
      });

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
   * 📈 Update order status with tracking (handles missing columns gracefully)
   */
  static async updateOrderStatus(orderId, newStatus, staffId = null, updatedBy = 'staff') {
    try {
      console.log('🔄 Updating order status:', { orderId, newStatus, staffId, updatedBy });
      
      // Prepare basic update data (only columns that definitely exist)
      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Add staff assignment if provided
      if (staffId) {
        updateData.assigned_staff_id = staffId;
      }

      // Try to add timestamp fields based on status (gracefully handle missing columns)
      const currentTime = new Date().toISOString();
      
      try {
        switch (newStatus) {
          case 'assigned':
            updateData.assigned_at = currentTime;
            break;
          case 'accepted':
            updateData.started_at = currentTime;
            break;
          case 'preparing':
            // Only set if not already set
            break;
          case 'ready':
            // Skip ready_at for now if column doesn't exist
            break;
          case 'delivered':
          case 'completed':
            updateData.completed_at = currentTime;
            break;
        }
      } catch (timestampError) {
        console.warn('⚠️ Some timestamp columns may not exist:', timestampError.message);
      }

      const { data: order, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select(`
          *,
          tables (table_number),
          customers (full_name, phone)
        `)
        .single();

      if (error) {
        console.error('❌ Database error updating order:', error);
        throw error;
      }

      // Send notifications for status updates
      try {
        await this.sendStatusUpdateNotifications(order, newStatus, updatedBy, staffId);
      } catch (notificationError) {
        console.warn('⚠️ Notification failed but order updated:', notificationError.message);
      }

      console.log('✅ Order status updated successfully to:', newStatus);
      return order;
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      throw error;
    }
  }

  // ==================== CUSTOMER ORDER TRACKING (NO LOGIN) ====================
  
  /**
   * 📱 Get customer orders by session/IP (no login required)
   */
  static async getCustomerOrdersBySession(sessionId, tableId = null, customerPhone = null) {
    try {
      console.log('🔍 Fetching customer orders:', { sessionId, tableId, customerPhone });
      
      // If no sessionId provided, return empty array
      if (!sessionId && !tableId && !customerPhone) {
        console.warn('⚠️ No search criteria provided for customer orders');
        return [];
      }
      
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            item_name,
            quantity,
            unit_price,
            total_price,
            special_instructions,
            menu_items (
              name,
              image_url
            )
          ),
          tables (
            table_number,
            location
          ),
          customers (
            full_name,
            phone
          ),
          users!assigned_staff_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      // Multiple ways to find customer orders
      if (sessionId) {
        console.log('🔍 Searching by session_id:', sessionId);
        query = query.eq('session_id', sessionId);
      } else if (tableId && customerPhone) {
        // Find by table and phone for customers without session
        console.log('🔍 Searching by table_id and phone:', { tableId, customerPhone });
        query = query.eq('table_id', tableId);
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error('❌ Database error fetching customer orders:', error);
        throw error;
      }

      console.log('📦 Raw orders from database:', orders?.length || 0);
      
      // Filter by phone if provided
      let filteredOrders = orders || [];
      if (customerPhone && !sessionId) {
        filteredOrders = orders?.filter(order => 
          order.customers?.phone === customerPhone
        ) || [];
        console.log('📞 Filtered by phone:', filteredOrders.length);
      }

      console.log('✅ Customer orders found:', filteredOrders.length);
      
      // Log order details for debugging
      if (filteredOrders.length > 0) {
        console.log('📋 Order details:', filteredOrders.map(o => ({
          id: o.id,
          order_number: o.order_number,
          status: o.status,
          session_id: o.session_id,
          created_at: o.created_at
        })));
      } else {
        console.warn('⚠️ No orders found matching criteria');
      }
      
      return filteredOrders;
    } catch (error) {
      console.error('❌ Error fetching customer orders:', error);
      // Return empty array instead of throwing to prevent UI from breaking
      return [];
    }
  }

  /**
   * 📍 Track order by order number (public tracking)
   */
  static async trackOrderByNumber(orderNumber) {
    try {
      const { data: order, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            item_name,
            quantity,
            unit_price
          ),
          tables (
            table_number
          ),
          users!assigned_staff_id (
            full_name
          )
        `)
        .eq('order_number', orderNumber)
        .single();

      if (error) throw error;

      return {
        ...order,
        tracking_steps: this.getOrderTrackingSteps(order)
      };
    } catch (error) {
      console.error('❌ Error tracking order:', error);
      throw error;
    }
  }

  /**
   * 📊 Get order tracking steps for customer
   */
  static getOrderTrackingSteps(order) {
    const steps = [
      {
        id: 'placed',
        title: 'Order Placed',
        description: 'Your order has been received',
        completed: true,
        timestamp: order.created_at,
        icon: '📝'
      },
      {
        id: 'assigned',
        title: 'Assigned to Staff',
        description: order.users?.full_name ? `Assigned to ${order.users.full_name}` : 'Waiting for staff assignment',
        completed: ['assigned', 'accepted', 'preparing', 'ready', 'delivered', 'completed'].includes(order.status),
        timestamp: order.assigned_at,
        icon: '👨‍🍳'
      },
      {
        id: 'preparing',
        title: 'Preparing',
        description: 'Your order is being prepared',
        completed: ['preparing', 'ready', 'delivered', 'completed'].includes(order.status),
        timestamp: order.started_at,
        icon: '🍳'
      },
      {
        id: 'ready',
        title: 'Ready',
        description: 'Your order is ready for pickup/delivery',
        completed: ['ready', 'delivered', 'completed'].includes(order.status),
        timestamp: order.ready_at,
        icon: '🔔'
      },
      {
        id: 'completed',
        title: 'Completed',
        description: 'Order has been delivered and completed',
        completed: ['completed'].includes(order.status),
        timestamp: order.completed_at,
        icon: '✅'
      }
    ];

    return steps;
  }

  // ==================== STAFF ORDER MANAGEMENT ====================

  /**
   * 🧪 Debug method to test staff order fetching
   */
  static async debugStaffOrders(staffId, restaurantId) {
    try {
      console.log('🧪 DEBUG: Testing staff order query with:', { staffId, restaurantId });
      
      // First, let's see all orders for this restaurant
      const { data: allOrders, error: allError } = await supabase
        .from('orders')
        .select('id, order_number, status, assigned_staff_id, restaurant_id')
        .eq('restaurant_id', restaurantId);
      
      console.log('🧪 All restaurant orders:', allOrders);
      
      // Now let's see orders assigned to this staff
      const { data: staffOrders, error: staffError } = await supabase
        .from('orders')
        .select('id, order_number, status, assigned_staff_id, restaurant_id')
        .eq('restaurant_id', restaurantId)
        .eq('assigned_staff_id', staffId);
      
      console.log('🧪 Staff assigned orders:', staffOrders);
      
      return { allOrders, staffOrders };
    } catch (error) {
      console.error('🧪 Debug error:', error);
      return null;
    }
  }

  /**
   * 👨‍🍳 Get assigned orders for staff (focused view with filtering)
   */
  static async getStaffAssignedOrders(staffId, restaurantId, statusFilters = null) {
    try {
      const restaurantIdString = typeof restaurantId === 'object' ? 
        restaurantId.id || restaurantId.restaurant_id || restaurantId.toString() : 
        restaurantId;

      console.log('🔍 Fetching staff assigned orders:', { 
        staffId, 
        restaurantId: restaurantIdString,
        statusFilters,
        staffIdType: typeof staffId,
        restaurantIdType: typeof restaurantId
      });
      
      let query = supabase
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
          tables (
            table_number,
            location
          ),
          customers (
            full_name,
            phone
          )
        `)
        .eq('restaurant_id', restaurantIdString)
        .eq('assigned_staff_id', staffId);

      // Apply status filters if provided
      if (statusFilters && statusFilters.length > 0) {
        query = query.in('status', statusFilters);
      } else {
        // Default to active order statuses
        query = query.in('status', ['pending', 'assigned', 'accepted', 'preparing', 'ready']);
      }

      query = query.order('created_at', { ascending: true }); // Oldest first for staff workflow

      const { data: orders, error } = await query;

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Staff assigned orders found:', {
        count: orders?.length || 0,
        statusFilters,
        orders: orders?.map(o => ({ id: o.id, status: o.status, order_number: o.order_number }))
      });
      
      return orders || [];
    } catch (error) {
      console.error('❌ Error fetching staff assigned orders:', error);
      throw error;
    }
  }

  /**
   * 👥 Assign order to staff
   */
  static async assignOrderToStaff(orderId, staffId, restaurantId) {
    try {
      console.log('🔄 Assigning order to staff:', { orderId, staffId });

      const { data: order, error } = await supabase
        .from('orders')
        .update({
          assigned_staff_id: staffId,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select(`
          *,
          tables (table_number),
          customers (full_name)
        `)
        .single();

      if (error) throw error;

      // Notify staff about assignment
      await this.createNotification({
        recipient_id: staffId,
        type: 'order_assigned',
        title: `New Order Assigned`,
        message: `You have been assigned order #${order.order_number} for Table ${order.tables?.table_number}`,
        data: { order_id: orderId, order_number: order.order_number }
      });

      console.log('✅ Order assigned to staff');
      return order;
    } catch (error) {
      console.error('❌ Error assigning order:', error);
      throw error;
    }
  }

  // ==================== NOTIFICATION SYSTEM ====================

  /**
   * 🔔 Create notification
   */
  static async createNotification({ recipient_id, type, title, message, data = {} }) {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          recipient_id,
          type,
          title,
          message,
          data,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.log('📝 Notification table not available, logged only');
        return;
      }

      console.log('✅ Notification created:', { recipient_id, type, title });
    } catch (error) {
      console.log('📝 Notification creation failed, logged only:', error.message);
    }
  }

  /**
   * 📬 Get notifications for user
   */
  static async getNotifications(userId, limit = 20) {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return notifications || [];
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      return [];
    }
  }

  /**
   * ✅ Mark notification as read
   */
  static async markNotificationAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  }

  // ==================== REAL-TIME SUBSCRIPTIONS ====================

  /**
   * 📡 Subscribe to order updates for staff
   */
  static subscribeToStaffOrders(staffId, callback) {
    return supabase
      .channel(`staff-orders-${staffId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `assigned_staff_id=eq.${staffId}`
        }, 
        callback
      )
      .subscribe();
  }

  /**
   * 📡 Subscribe to restaurant orders
   */
  static subscribeToRestaurantOrders(restaurantId, callback) {
    return supabase
      .channel(`restaurant-orders-${restaurantId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        }, 
        callback
      )
      .subscribe();
  }

  /**
   * 📡 Subscribe to customer order updates
   */
  static subscribeToCustomerOrders(sessionId, callback) {
    return supabase
      .channel(`customer-orders-${sessionId}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `session_id=eq.${sessionId}`
        }, 
        callback
      )
      .subscribe();
  }

  /**
   * 📱 Send status update notifications
   */
  static async sendStatusUpdateNotifications(order, newStatus, updatedBy, staffId) {
    try {
      const tableNumber = order.tables?.table_number || 'Unknown'
      const customerName = order.customers?.full_name || 'Customer'

      const statusMessages = {
        'preparing': 'Order preparation started',
        'ready': 'Order is ready for pickup',
        'delivered': 'Order has been delivered',
        'cancelled': 'Order has been cancelled'
      }

      const message = statusMessages[newStatus] || `Order status updated to ${newStatus}`

      // Log status update (workflow_notifications table doesn't exist)
      console.log('✅ Order status notification:', {
        orderId: order.id,
        orderNumber: order.order_number,
        tableNumber,
        customerName,
        newStatus,
        message,
        updatedBy,
        staffId
      })

      // Use existing notifications table if it exists, otherwise just log
      try {
        await supabase
          .from('notifications')
          .insert({
            recipient_id: order.restaurant_id,
            title: `Order ${order.order_number} - ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
            message: `Table ${tableNumber}: ${message}`,
            type: 'order_update',
            data: {
              order_id: order.id,
              order_number: order.order_number,
              table_number: tableNumber,
              new_status: newStatus
            }
          })
      } catch (notificationError) {
        console.log('📝 Notification table not available, status logged only')
      }

      console.log('✅ Status update notifications processed')
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

  /**
   * 👥 Get orders for staff member
   */
  static async getStaffOrders(staffId, restaurantId, filters = []) {
    try {
      // Ensure restaurantId is a string, not an object
      const restaurantIdString = typeof restaurantId === 'object' ? 
        restaurantId.id || restaurantId.restaurant_id || restaurantId.toString() : 
        restaurantId;
        
      console.log('🔍 Fetching staff orders:', { 
        staffId, 
        restaurantId: restaurantIdString, 
        filters,
        restaurantIdType: typeof restaurantId
      });
      
      let query = supabase
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
          tables (
            table_number,
            location
          ),
          customers (
            id,
            full_name,
            email,
            phone
          ),
          users!assigned_staff_id (
            id,
            full_name,
            email
          )
        `)
        .eq('restaurant_id', restaurantIdString)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters && filters.length > 0) {
        query = query.in('status', filters);
      }

      // Filter by staff assignment
      if (staffId) {
        query = query.or(`assigned_staff_id.eq.${staffId},assigned_staff_id.is.null`);
      }

      const { data: orders, error } = await query;

      if (error) {
        console.error('❌ Error fetching staff orders:', error);
        throw error;
      }

      console.log('✅ Staff orders fetched:', orders?.length || 0);
      return orders || [];
    } catch (error) {
      console.error('❌ Error in getStaffOrders:', error);
      throw error;
    }
  }

  /**
   * 🏪 Get orders for restaurant owner
   */
  static async getRestaurantOrders(restaurantId) {
    try {
      console.log('🔄 Fetching restaurant orders for:', restaurantId)
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (
            id,
            table_number,
            location,
            capacity
          ),
          customers (
            id,
            full_name,
            phone,
            email
          ),
          order_items (
            id,
            item_name,
            quantity,
            unit_price,
            total_price,
            special_instructions
          ),
          assigned_staff:users!assigned_staff_id (
            id,
            full_name,
            position
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(100) // Limit to recent 100 orders

      if (error) {
        console.error('❌ Error fetching restaurant orders:', error)
        throw error
      }

      console.log('✅ Fetched', orders?.length || 0, 'restaurant orders')
      return orders || []
    } catch (error) {
      console.error('❌ Exception in getRestaurantOrders:', error)
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
   * 📊 Get all restaurant orders for owner dashboard
   */
  static async getRestaurantOrders(restaurantId) {
    try {
      console.log('🔄 Fetching restaurant orders for:', restaurantId)
      
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (
            id,
            table_number,
            location,
            capacity
          ),
          customers (
            id,
            full_name,
            phone,
            email
          ),
          order_items (
            id,
            item_name,
            quantity,
            unit_price,
            total_price,
            special_instructions
          ),
          assigned_staff:users!assigned_staff_id (
            id,
            full_name,
            position
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(100) // Limit to recent 100 orders

      if (error) {
        console.error('❌ Error fetching restaurant orders:', error)
        throw error
      }

      console.log('✅ Fetched', orders?.length || 0, 'restaurant orders')
      return orders || []
    } catch (error) {
      console.error('❌ Exception in getRestaurantOrders:', error)
      throw error
    }
  }
}

export default UnifiedOrderService
