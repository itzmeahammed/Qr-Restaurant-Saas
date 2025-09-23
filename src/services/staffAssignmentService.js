import { supabase } from '../config/supabase'

/**
 * Smart Staff Assignment Service
 * Implements FIFO algorithm with load balancing
 */
class StaffAssignmentService {
  /**
   * Assign an order to the most suitable available staff member
   * @param {string} restaurantId - Restaurant UUID
   * @param {string} orderId - Order UUID
   * @returns {Promise<{staffId: string, staffName: string}>}
   */
  static async assignOrderToStaff(restaurantId, orderId) {
    try {
      // Get all active and logged-in staff members
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .eq('is_available', true)
        .not('last_login_at', 'is', null)
        .order('current_orders_count', { ascending: true })
        .order('last_login_at', { ascending: true })

      if (staffError) throw staffError

      if (!staffMembers || staffMembers.length === 0) {
        // No available staff, add to queue
        await this.addOrderToQueue(orderId, restaurantId)
        throw new Error('No available staff members. Order added to queue.')
      }

      // Find the best staff member (least busy)
      const selectedStaff = await this.selectBestStaff(staffMembers)

      // Assign the order to the selected staff
      const { error: assignError } = await supabase
        .from('orders')
        .update({
          assigned_staff_id: selectedStaff.id,
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (assignError) throw assignError

      // Update staff's current order count
      await supabase
        .from('staff')
        .update({
          current_orders_count: selectedStaff.current_orders_count + 1
        })
        .eq('id', selectedStaff.id)

      // Send notification to staff
      await this.notifyStaff(selectedStaff.id, orderId)

      // Send notification to customer
      await this.notifyCustomer(orderId, selectedStaff.name)

      return {
        staffId: selectedStaff.id,
        staffName: selectedStaff.name
      }
    } catch (error) {
      console.error('Error assigning order to staff:', error)
      throw error
    }
  }

  /**
   * Select the best available staff member based on multiple criteria
   * @param {Array} staffMembers - Array of available staff
   * @returns {Object} - Selected staff member
   */
  static async selectBestStaff(staffMembers) {
    // Calculate scores for each staff member
    const staffWithScores = staffMembers.map(staff => {
      let score = 0

      // Fewer current orders = higher score
      score += (10 - staff.current_orders_count) * 10

      // Higher rating = higher score
      score += (staff.average_rating || 3) * 5

      // More experience (total orders) = slight bonus
      score += Math.min(staff.total_orders_served / 100, 5)

      return {
        ...staff,
        assignmentScore: score
      }
    })

    // Sort by score (highest first)
    staffWithScores.sort((a, b) => b.assignmentScore - a.assignmentScore)

    return staffWithScores[0]
  }

  /**
   * Add order to queue when no staff is available
   * @param {string} orderId - Order UUID
   * @param {string} restaurantId - Restaurant UUID
   */
  static async addOrderToQueue(orderId, restaurantId) {
    try {
      // Store in a queue table or update order status
      await supabase
        .from('orders')
        .update({
          status: 'queued',
          queue_position: await this.getQueuePosition(restaurantId)
        })
        .eq('id', orderId)
    } catch (error) {
      console.error('Error adding order to queue:', error)
    }
  }

  /**
   * Get current queue position for restaurant
   * @param {string} restaurantId - Restaurant UUID
   * @returns {Promise<number>} - Queue position
   */
  static async getQueuePosition(restaurantId) {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('restaurant_id', restaurantId)
      .eq('status', 'queued')

    return (count || 0) + 1
  }

  /**
   * Process queued orders when staff becomes available
   * @param {string} staffId - Staff UUID
   * @param {string} restaurantId - Restaurant UUID
   */
  static async processQueuedOrders(staffId, restaurantId) {
    try {
      // Get oldest queued order
      const { data: queuedOrder, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (error || !queuedOrder) return

      // Assign the queued order to the available staff
      await this.assignSpecificStaff(queuedOrder.id, staffId)
    } catch (error) {
      console.error('Error processing queued orders:', error)
    }
  }

  /**
   * Assign a specific staff member to an order
   * @param {string} orderId - Order UUID
   * @param {string} staffId - Staff UUID
   */
  static async assignSpecificStaff(orderId, staffId) {
    try {
      // Get staff details
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .single()

      if (staffError) throw staffError

      // Update order
      await supabase
        .from('orders')
        .update({
          assigned_staff_id: staffId,
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', orderId)

      // Update staff order count
      await supabase
        .from('staff')
        .update({
          current_orders_count: staff.current_orders_count + 1
        })
        .eq('id', staffId)

      // Send notifications
      await this.notifyStaff(staffId, orderId)
    } catch (error) {
      console.error('Error assigning specific staff:', error)
    }
  }

  /**
   * Release order from staff (when completed or cancelled)
   * @param {string} orderId - Order UUID
   * @param {string} staffId - Staff UUID
   */
  static async releaseOrderFromStaff(orderId, staffId) {
    try {
      // Get staff details
      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .single()

      if (staff) {
        // Update staff order count
        await supabase
          .from('staff')
          .update({
            current_orders_count: Math.max(0, staff.current_orders_count - 1),
            total_orders_served: staff.total_orders_served + 1
          })
          .eq('id', staffId)

        // Process any queued orders
        await this.processQueuedOrders(staffId, staff.restaurant_id)
      }
    } catch (error) {
      console.error('Error releasing order from staff:', error)
    }
  }

  /**
   * Update staff availability status
   * @param {string} staffId - Staff UUID
   * @param {boolean} isAvailable - Availability status
   */
  static async updateStaffAvailability(staffId, isAvailable) {
    try {
      const { data: staff } = await supabase
        .from('staff')
        .update({
          is_available: isAvailable,
          last_login_at: isAvailable ? new Date().toISOString() : undefined,
          last_logout_at: !isAvailable ? new Date().toISOString() : undefined
        })
        .eq('id', staffId)
        .select()
        .single()

      // If staff becomes available, process queued orders
      if (isAvailable && staff) {
        await this.processQueuedOrders(staffId, staff.restaurant_id)
      }

      return staff
    } catch (error) {
      console.error('Error updating staff availability:', error)
      throw error
    }
  }

  /**
   * Get staff workload statistics
   * @param {string} restaurantId - Restaurant UUID
   * @returns {Promise<Array>} - Staff workload data
   */
  static async getStaffWorkload(restaurantId) {
    try {
      const { data: staff, error } = await supabase
        .from('staff')
        .select(`
          *,
          orders:orders(count)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)

      if (error) throw error

      return staff.map(s => ({
        ...s,
        workloadPercentage: (s.current_orders_count / 5) * 100 // Assuming max 5 concurrent orders
      }))
    } catch (error) {
      console.error('Error getting staff workload:', error)
      throw error
    }
  }

  /**
   * Send notification to staff about new order
   * @param {string} staffId - Staff UUID
   * @param {string} orderId - Order UUID
   */
  static async notifyStaff(staffId, orderId) {
    try {
      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select(`
          *,
          tables(table_number)
        `)
        .eq('id', orderId)
        .single()

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          recipient_id: staffId,
          type: 'order_assigned',
          title: 'New Order Assigned',
          message: `You have been assigned order #${order.order_number} for Table ${order.tables?.table_number}`,
          data: { orderId, tableNumber: order.tables?.table_number }
        })

      // Send real-time notification via WebSocket
      await supabase
        .channel(`staff-${staffId}`)
        .send({
          type: 'broadcast',
          event: 'new_order',
          payload: { orderId, orderNumber: order.order_number }
        })
    } catch (error) {
      console.error('Error notifying staff:', error)
    }
  }

  /**
   * Send notification to customer about staff assignment
   * @param {string} orderId - Order UUID
   * @param {string} staffName - Assigned staff name
   */
  static async notifyCustomer(orderId, staffName) {
    try {
      // Get order details
      const { data: order } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (order.session_id) {
        // Send real-time notification to customer
        await supabase
          .channel(`session-${order.session_id}`)
          .send({
            type: 'broadcast',
            event: 'order_assigned',
            payload: {
              orderId,
              staffName,
              message: `Your order has been assigned to ${staffName}`
            }
          })
      }
    } catch (error) {
      console.error('Error notifying customer:', error)
    }
  }

  /**
   * Get optimal staff distribution for a restaurant
   * @param {string} restaurantId - Restaurant UUID
   * @returns {Promise<Object>} - Staff distribution recommendations
   */
  static async getStaffDistribution(restaurantId) {
    try {
      // Get current hour's order volume
      const currentHour = new Date().getHours()
      
      // Get historical data for this hour
      const { data: historicalOrders } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .filter('extract(hour from created_at)', 'eq', currentHour)

      const avgOrdersPerHour = historicalOrders ? historicalOrders.length / 30 : 10
      const recommendedStaff = Math.ceil(avgOrdersPerHour / 5) // 5 orders per staff per hour

      // Get current active staff
      const { data: activeStaff } = await supabase
        .from('staff')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)

      return {
        currentHour,
        averageOrdersPerHour: avgOrdersPerHour,
        currentActiveStaff: activeStaff?.length || 0,
        recommendedStaff,
        staffShortage: Math.max(0, recommendedStaff - (activeStaff?.length || 0))
      }
    } catch (error) {
      console.error('Error getting staff distribution:', error)
      throw error
    }
  }
}

export default StaffAssignmentService
