import { supabase } from '../config/supabase'

// Customer table structure for separate customer flow
export const customerService = {
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
