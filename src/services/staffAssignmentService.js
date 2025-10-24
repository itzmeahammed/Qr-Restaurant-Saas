import { supabase } from '../config/supabase'
import realtimeService from './realtimeService'

/**
 * Enhanced Staff Assignment Service for Complete Workflow
 * Handles intelligent staff assignment with real-time notifications
 * - Checks staff availability in real-time
 * - Assigns orders using FIFO and load balancing
 * - Sends notifications to staff and owners
 * - Handles staff unavailability scenarios
 */
class StaffAssignmentService {
  /**
   * Assign order to most suitable available staff with enhanced workflow
   * @param {string} restaurantId - Restaurant UUID
   * @param {string} orderId - Order UUID
   * @returns {Promise<{staffId: string, staffName: string}|null>}
   */
  static async assignOrderToStaff(restaurantId, orderId) {
    try {
      console.log('🔍 Checking staff availability for restaurant:', restaurantId)

      // Get available staff members with enhanced selection criteria
      const { data: staffMembers, error: staffError } = await supabase
        .from('staff')
        .select(`
          *,
          users!staff_user_id_fkey (
            full_name,
            email,
            phone
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('total_orders_completed', { ascending: true })
        .order('performance_rating', { ascending: false })
        .order('created_at', { ascending: true })

      if (staffError) {
        console.error('❌ Error fetching staff:', staffError)
        return null
      }

      if (!staffMembers || staffMembers.length === 0) {
        console.warn('⚠️ No available staff members for order assignment')
        
        // Get order details for notification
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single()

        if (orderData) {
          // Notify restaurant owner about staff unavailability
          await realtimeService.notifyOwnerStaffUnavailable(restaurantId, orderData)
        }
        
        return null
      }

      // Select best available staff using enhanced criteria
      const selectedStaff = await this.selectBestStaff(staffMembers)
      console.log('👨‍🍳 Selected staff:', selectedStaff.id)

      // Get staff name from users table or fallback
      const staffName = selectedStaff.users?.full_name || 
                       selectedStaff.full_name || 
                       `Staff Member #${selectedStaff.id.slice(-4)}`

      // Assign the order to the selected staff and update status
      const { data: updatedOrder, error: assignError } = await supabase
        .from('orders')
        .update({
          assigned_staff_id: selectedStaff.id,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single()

      if (assignError) {
        console.error('❌ Error assigning order:', assignError)
        return null
      }

      console.log('✅ Order assigned successfully:', updatedOrder.order_number)

      // Update staff statistics (increment current workload)
      await supabase
        .from('staff')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedStaff.id)

      // Send notification to assigned staff
      await this.notifyStaff(selectedStaff.id, orderId)

      return {
        staffId: selectedStaff.id,
        staffName: staffName,
        staffEmail: selectedStaff.users?.email || selectedStaff.email,
        orderNumber: updatedOrder.order_number
      }

    } catch (error) {
      console.error('❌ Error in staff assignment workflow:', error)
      return null
    }
  }

  /**
   * Select the best available staff member based on multiple criteria
   * @param {Array} staffMembers - Array of available staff
   * @returns {Object} - Selected staff member
   */
  static async selectBestStaff(staffMembers) {
    // Calculate scores for each staff member using actual schema columns
    const staffWithScores = staffMembers.map(staff => {
      let score = 0

      // Higher performance rating = higher score
      score += (staff.performance_rating || 3) * 10

      // More experience (total orders completed) = bonus
      score += Math.min(staff.total_orders_completed / 50, 10)

      // Higher hourly rate might indicate seniority/skill
      score += Math.min((staff.hourly_rate || 0) / 100, 5)

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

      // Update staff order count (using actual schema)
      const { data: staffData } = await supabase
        .from('staff')
        .select('total_orders_completed')
        .eq('id', staffId)
        .single()

      if (staffData) {
        await supabase
          .from('staff')
          .update({
            total_orders_completed: staffData.total_orders_completed + 1
          })
          .eq('id', staffId)
      }

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
      // Get staff details (using actual schema)
      const { data: staffRecord } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .single()

      if (staffRecord) {
        // Update order to remove staff assignment
        await supabase
          .from('orders')
          .update({
            assigned_staff_id: null,
            status: 'completed'
          })
          .eq('id', orderId)

        // Process any queued orders for this restaurant
        await this.processQueuedOrders(staffId, staffRecord.restaurant_id)
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
          is_available: isAvailable
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
      console.log('📧 Sending notification to staff:', { staffId, orderId })
      // Simplified notification - just log for now
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
      console.log('📧 Sending notification to customer:', { orderId, staffName })
      // Simplified notification - just log for now
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
