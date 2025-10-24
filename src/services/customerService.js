import { supabase } from '../config/supabase'
import CartService from './cartService'
import realtimeService from './realtimeService'

/**
 * Enhanced Customer Service for Complete Restaurant Workflow
 * Handles customer sessions, cart management, and order tracking
 * 
 * COMPLETE WORKFLOW:
 * 1. Customer scans QR code → Create session
 * 2. Customer browses menu → Add items to cart (stored in DB)
 * 3. Customer places order → Order creation with staff assignment
 * 4. Real-time order tracking → WebSocket updates
 * 5. Payment handling → Pay now or pay later
 * 6. Order completion → Feedback and review
 */
export const customerService = {
  // ==================== SESSION MANAGEMENT ====================
  
  /**
   * Create customer session for QR code ordering
   * @param {Object} sessionData - Session information
   * @returns {Promise<Object>} - Created session
   */
  async createCustomerSession(sessionData) {
    try {
      const { restaurantId, tableId, customerName, customerPhone, customerEmail } = sessionData
      
      console.log('🔗 Creating customer session for QR ordering...')
      
      const { data: session, error } = await supabase
        .from('customer_sessions')
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          session_status: 'active'
        })
        .select(`
          *,
          restaurants (
            id,
            name,
            logo_url,
            cuisine_type
          ),
          tables (
            id,
            table_number,
            capacity
          )
        `)
        .single()

      if (error) throw error

      console.log('✅ Customer session created:', session.session_id)
      
      // Subscribe to real-time updates for this session
      realtimeService.subscribeToSession(session.session_id, {
        onOrderConfirmed: (data) => console.log('Order confirmed:', data),
        onOrderAssigned: (data) => console.log('Order assigned:', data),
        onStatusUpdate: (data) => console.log('Status update:', data)
      })

      return { success: true, data: session }
    } catch (error) {
      console.error('❌ Error creating customer session:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Get customer session details
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Session details
   */
  async getCustomerSession(sessionId) {
    try {
      const { data: session, error } = await supabase
        .from('customer_sessions')
        .select(`
          *,
          restaurants (
            id,
            name,
            logo_url,
            cuisine_type,
            opening_hours
          ),
          tables (
            id,
            table_number,
            capacity,
            location
          )
        `)
        .eq('session_id', sessionId)
        .single()

      if (error) throw error
      return { success: true, data: session }
    } catch (error) {
      console.error('❌ Error getting customer session:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Update customer session
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} - Updated session
   */
  async updateCustomerSession(sessionId, updates) {
    try {
      const { data: session, error } = await supabase
        .from('customer_sessions')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single()

      if (error) throw error
      return { success: true, data: session }
    } catch (error) {
      console.error('❌ Error updating customer session:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Complete customer session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Completion status
   */
  async completeCustomerSession(sessionId) {
    try {
      // Update session status
      await this.updateCustomerSession(sessionId, {
        session_status: 'completed'
      })

      // Clear any remaining cart items
      await CartService.clearCart(sessionId)

      // Cleanup real-time subscriptions
      realtimeService.unsubscribeFromChannel(`session-${sessionId}`)

      console.log('✅ Customer session completed:', sessionId)
      return { success: true }
    } catch (error) {
      console.error('❌ Error completing customer session:', error)
      return { success: false, error: error.message }
    }
  },

  // ==================== CART INTEGRATION ====================

  /**
   * Get customer cart with session context
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Cart with session details
   */
  async getSessionCart(sessionId) {
    try {
      const [sessionResult, cartSummary] = await Promise.all([
        this.getCustomerSession(sessionId),
        CartService.getCartSummary(sessionId)
      ])

      if (!sessionResult.success) {
        throw new Error('Invalid session')
      }

      return {
        success: true,
        data: {
          session: sessionResult.data,
          cart: cartSummary
        }
      }
    } catch (error) {
      console.error('❌ Error getting session cart:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Add item to session cart
   * @param {string} sessionId - Session ID
   * @param {Object} item - Menu item to add
   * @returns {Promise<Object>} - Updated cart
   */
  async addToSessionCart(sessionId, item) {
    try {
      // Verify session is active
      const sessionResult = await this.getCustomerSession(sessionId)
      if (!sessionResult.success || sessionResult.data.session_status !== 'active') {
        throw new Error('Session is not active')
      }

      // Add item to cart
      const cartResult = await CartService.addToCart(sessionId, item)
      
      // Get updated cart summary
      const cartSummary = await CartService.getCartSummary(sessionId)

      // Notify via real-time if needed
      realtimeService.notifyCustomer(sessionId, 'cart_updated', {
        action: 'item_added',
        item: item,
        cartSummary: cartSummary
      })

      return {
        success: true,
        data: {
          cartItem: cartResult,
          cartSummary: cartSummary
        }
      }
    } catch (error) {
      console.error('❌ Error adding to session cart:', error)
      return { success: false, error: error.message }
    }
  },

  // ==================== ORDER TRACKING ====================

  /**
   * Get customer orders by session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} - Customer orders
   */
  async getSessionOrders(sessionId) {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (
              name,
              price,
              image_url
            )
          ),
          staff:assigned_staff_id (
            id,
            position,
            users (
              full_name
            )
          ),
          tables (
            table_number
          )
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: orders || [] }
    } catch (error) {
      console.error('❌ Error getting session orders:', error)
      return { success: false, error: error.message }
    }
  },

  /**
   * Track order in real-time
   * @param {string} sessionId - Session ID
   * @param {string} orderId - Order ID
   * @param {Object} handlers - Event handlers
   * @returns {Object} - Subscription object
   */
  async trackSessionOrder(sessionId, orderId, handlers = {}) {
    try {
      // Subscribe to session updates
      const subscription = realtimeService.subscribeToSession(sessionId, {
        onOrderAssigned: (data) => {
          if (data.orderId === orderId) {
            handlers.onOrderAssigned?.(data)
          }
        },
        onStatusUpdate: (data) => {
          if (data.orderId === orderId) {
            handlers.onStatusUpdate?.(data)
          }
        },
        onPaymentConfirmed: (data) => {
          if (data.orderId === orderId) {
            handlers.onPaymentConfirmed?.(data)
          }
        }
      })

      return { success: true, data: subscription }
    } catch (error) {
      console.error('❌ Error tracking session order:', error)
      return { success: false, error: error.message }
    }
  },

  // ==================== LEGACY METHODS (Updated) ====================

  // Create customer profile (separate from auth users)
  async createCustomerProfile(customerData) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          email: customerData.email,
          full_name: customerData.fullName,
          phone: customerData.phone,
          preferences: customerData.preferences || {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error creating customer profile:', error)
      return { success: false, error: error.message }
    }
  },

  // Get customer by email
  async getCustomerByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching customer:', error)
      return { success: false, error: error.message }
    }
  },

  // Update customer profile
  async updateCustomerProfile(customerId, updates) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId)
        .select()
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error updating customer profile:', error)
      return { success: false, error: error.message }
    }
  },

  // Get customer order history
  async getCustomerOrders(customerId) {
    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .select(`
          *,
          restaurants:restaurant_id (
            name,
            logo_url
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching customer orders:', error)
      return { success: false, error: error.message }
    }
  },

  // Create customer order (separate from restaurant orders)
  async createCustomerOrder(orderData) {
    try {
      const { data, error } = await supabase
        .from('customer_orders')
        .insert([{
          customer_id: orderData.customerId,
          restaurant_id: orderData.restaurantId,
          table_id: orderData.tableId,
          items: orderData.items,
          total_amount: orderData.totalAmount,
          status: 'pending',
          order_type: 'qr_scan', // qr_scan, browse, delivery
          customer_notes: orderData.notes || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error creating customer order:', error)
      return { success: false, error: error.message }
    }
  },

  // Get customer favorites
  async getCustomerFavorites(customerId) {
    try {
      const { data, error } = await supabase
        .from('customer_favorites')
        .select(`
          *,
          restaurants:restaurant_id (
            name,
            logo_url,
            cuisine_type,
            rating
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching customer favorites:', error)
      return { success: false, error: error.message }
    }
  },

  // Add restaurant to favorites
  async addToFavorites(customerId, restaurantId) {
    try {
      const { data, error } = await supabase
        .from('customer_favorites')
        .insert([{
          customer_id: customerId,
          restaurant_id: restaurantId,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error adding to favorites:', error)
      return { success: false, error: error.message }
    }
  },

  // Remove from favorites
  async removeFromFavorites(customerId, restaurantId) {
    try {
      const { error } = await supabase
        .from('customer_favorites')
        .delete()
        .eq('customer_id', customerId)
        .eq('restaurant_id', restaurantId)
      
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error removing from favorites:', error)
      return { success: false, error: error.message }
    }
  },

  // Get customer reviews
  async getCustomerReviews(customerId) {
    try {
      const { data, error } = await supabase
        .from('customer_reviews')
        .select(`
          *,
          restaurants:restaurant_id (
            name,
            logo_url
          )
        `)
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching customer reviews:', error)
      return { success: false, error: error.message }
    }
  },

  // Create customer review
  async createCustomerReview(reviewData) {
    try {
      const { data, error } = await supabase
        .from('customer_reviews')
        .insert([{
          customer_id: reviewData.customerId,
          restaurant_id: reviewData.restaurantId,
          order_id: reviewData.orderId,
          rating: reviewData.rating,
          review_text: reviewData.reviewText,
          food_rating: reviewData.foodRating,
          service_rating: reviewData.serviceRating,
          ambiance_rating: reviewData.ambianceRating,
          created_at: new Date().toISOString()
        }])
        .select()
        .single()
      
      if (error) throw error
      return { success: true, data }
    } catch (error) {
      console.error('Error creating customer review:', error)
      return { success: false, error: error.message }
    }
  }
}

export default customerService
