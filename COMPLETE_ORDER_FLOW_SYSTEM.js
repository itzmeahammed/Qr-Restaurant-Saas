// ========================================
// COMPLETE ORDER FLOW SYSTEM
// Replace methods in unifiedOrderService.js
// ========================================

import { supabase } from '../config/supabase'

/**
 * 🎯 COMPLETE ORDER MANAGEMENT SYSTEM
 * Handles entire flow: Customer → Staff → Restaurant → Completion
 */
class CompleteOrderFlowService {
  
  // ==================== CUSTOMER ORDER TRACKING (NO LOGIN) ====================
  
  /**
   * 📱 Get customer orders by session/IP (no login required)
   */
  static async getCustomerOrdersBySession(sessionId, tableId = null, customerPhone = null) {
    try {
      console.log('🔍 Fetching customer orders:', { sessionId, tableId, customerPhone });
      
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
          ),
          users!assigned_staff_id (
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      // Multiple ways to find customer orders
      if (sessionId) {
        query = query.eq('session_id', sessionId);
      } else if (tableId && customerPhone) {
        // Find by table and phone for customers without session
        query = query.eq('table_id', tableId);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      // Filter by phone if provided
      let filteredOrders = orders || [];
      if (customerPhone && !sessionId) {
        filteredOrders = orders?.filter(order => 
          order.customers?.phone === customerPhone
        ) || [];
      }

      console.log('✅ Customer orders found:', filteredOrders.length);
      return filteredOrders;
    } catch (error) {
      console.error('❌ Error fetching customer orders:', error);
      throw error;
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
   * 👨‍🍳 Get assigned orders for staff (focused view)
   */
  static async getStaffAssignedOrders(staffId, restaurantId) {
    try {
      const restaurantIdString = typeof restaurantId === 'object' ? 
        restaurantId.id || restaurantId.restaurant_id || restaurantId.toString() : 
        restaurantId;

      console.log('🔍 Fetching staff assigned orders:', { staffId, restaurantId: restaurantIdString });
      
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
        .eq('assigned_staff_id', staffId)
        .in('status', ['assigned', 'accepted', 'preparing', 'ready'])
        .order('created_at', { ascending: true }); // Oldest first for staff workflow

      if (error) throw error;

      console.log('✅ Staff assigned orders:', orders?.length || 0);
      return orders || [];
    } catch (error) {
      console.error('❌ Error fetching staff assigned orders:', error);
      throw error;
    }
  }

  /**
   * ✅ Staff accepts assigned order
   */
  static async acceptOrder(orderId, staffId) {
    try {
      console.log('🔄 Staff accepting order:', { orderId, staffId });
      
      const { data: order, error } = await supabase
        .from('orders')
        .update({
          status: 'accepted',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('assigned_staff_id', staffId)
        .select(`
          *,
          tables (table_number),
          customers (full_name)
        `)
        .single();

      if (error) throw error;

      // Create notification for restaurant owner
      await this.createNotification({
        recipient_id: order.restaurant_id,
        type: 'order_accepted',
        title: `Order Accepted`,
        message: `Staff accepted order #${order.order_number} for Table ${order.tables?.table_number}`,
        data: { order_id: orderId, order_number: order.order_number }
      });

      console.log('✅ Order accepted by staff');
      return order;
    } catch (error) {
      console.error('❌ Error accepting order:', error);
      throw error;
    }
  }

  /**
   * 🔄 Update order status (staff workflow)
   */
  static async updateOrderStatus(orderId, newStatus, staffId = null) {
    try {
      console.log('🔄 Updating order status:', { orderId, newStatus, staffId });

      const updateData = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Add status-specific timestamps
      switch (newStatus) {
        case 'preparing':
          updateData.started_at = new Date().toISOString();
          break;
        case 'ready':
          updateData.ready_at = new Date().toISOString();
          break;
        case 'delivered':
          updateData.delivered_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_at = new Date().toISOString();
          break;
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

      if (error) throw error;

      // Create notifications
      await this.createNotification({
        recipient_id: order.restaurant_id,
        type: 'order_status_update',
        title: `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: `Order #${order.order_number} - Table ${order.tables?.table_number} is now ${newStatus}`,
        data: { order_id: orderId, status: newStatus }
      });

      console.log('✅ Order status updated successfully');
      return order;
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      throw error;
    }
  }

  // ==================== RESTAURANT OWNER DASHBOARD ====================

  /**
   * 🏪 Get all restaurant orders for owner dashboard
   */
  static async getRestaurantOrders(restaurantId, filters = []) {
    try {
      const restaurantIdString = typeof restaurantId === 'object' ? 
        restaurantId.id || restaurantId.restaurant_id || restaurantId.toString() : 
        restaurantId;
        
      console.log('🔍 Fetching restaurant orders:', { restaurantId: restaurantIdString, filters });
      
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
            phone,
            email
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

      const { data: orders, error } = await query;

      if (error) throw error;

      console.log('✅ Restaurant orders fetched:', orders?.length || 0);
      return orders || [];
    } catch (error) {
      console.error('❌ Error fetching restaurant orders:', error);
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

  // ==================== UTILITY METHODS ====================

  /**
   * 📊 Get order statistics for restaurant
   */
  static async getOrderStatistics(restaurantId, dateRange = 'today') {
    try {
      const restaurantIdString = typeof restaurantId === 'object' ? 
        restaurantId.id || restaurantId.restaurant_id || restaurantId.toString() : 
        restaurantId;

      let dateFilter = '';
      const now = new Date();
      
      switch (dateRange) {
        case 'today':
          dateFilter = now.toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = weekAgo.toISOString().split('T')[0];
          break;
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select('status, total_amount, created_at')
        .eq('restaurant_id', restaurantIdString)
        .gte('created_at', `${dateFilter}T00:00:00.000Z`);

      if (error) throw error;

      const stats = {
        total_orders: orders?.length || 0,
        pending_orders: orders?.filter(o => o.status === 'pending').length || 0,
        preparing_orders: orders?.filter(o => o.status === 'preparing').length || 0,
        completed_orders: orders?.filter(o => o.status === 'completed').length || 0,
        total_revenue: orders?.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0) || 0
      };

      return stats;
    } catch (error) {
      console.error('❌ Error fetching order statistics:', error);
      return {
        total_orders: 0,
        pending_orders: 0,
        preparing_orders: 0,
        completed_orders: 0,
        total_revenue: 0
      };
    }
  }
}

export default CompleteOrderFlowService;
