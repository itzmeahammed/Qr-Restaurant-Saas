// Enhanced Authentication Service for Role-Based Architecture
import { supabase } from '../config/supabase'
import bcrypt from 'bcryptjs'

class EnhancedAuthService {
  // =============================================
  // USER MANAGEMENT
  // =============================================

  async signUp({ email, password, full_name, phone, role, restaurantData = null, staffData = null }) {
    try {
      // Hash password
      const password_hash = await bcrypt.hash(password, 12)

      // Create user in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email,
          password_hash,
          full_name,
          phone,
          role,
          email_verified: true // Auto-verify for simplicity
        })
        .select()
        .single()

      if (userError) throw userError

      // Create role-specific data
      let roleSpecificData = null

      if (role === 'restaurant_owner' && restaurantData) {
        roleSpecificData = await this.createRestaurant(userData.id, restaurantData)
      } else if (role === 'staff' && staffData) {
        roleSpecificData = await this.createStaffRecord(userData.id, staffData)
      }

      return {
        success: true,
        user: userData,
        roleData: roleSpecificData,
        message: 'Account created successfully'
      }

    } catch (error) {
      console.error('Signup error:', error)
      return {
        success: false,
        error: error.message || 'Failed to create account'
      }
    }
  }

  async signIn({ email, password }) {
    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (userError || !userData) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, userData.password_hash)
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id)

      // Get role-specific data
      const roleData = await this.getRoleSpecificData(userData)

      // Store session
      localStorage.setItem('user', JSON.stringify({
        ...userData,
        roleData
      }))

      return {
        success: true,
        user: userData,
        roleData,
        message: 'Login successful'
      }

    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: error.message || 'Login failed'
      }
    }
  }

  async signOut() {
    try {
      localStorage.removeItem('user')
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, error: error.message }
    }
  }

  // =============================================
  // RESTAURANT MANAGEMENT
  // =============================================

  async createRestaurant(ownerId, restaurantData) {
    try {
      // Generate unique staff signup key
      const staff_signup_key = this.generateStaffSignupKey()

      // Update the user record with restaurant data (simplified approach)
      const { data, error } = await supabase
        .from('users')
        .update({
          restaurant_name: restaurantData.name,
          restaurant_description: restaurantData.description,
          restaurant_address: restaurantData.address,
          restaurant_phone: restaurantData.phone,
          restaurant_email: restaurantData.email,
          cuisine_type: restaurantData.cuisine_type,
          logo_url: restaurantData.logo_url,
          banner_url: restaurantData.banner_url,
          opening_hours: restaurantData.opening_hours,
          staff_signup_key,
          is_open: true
        })
        .eq('id', ownerId)
        .select()
        .single()

      if (error) throw error

      return data

    } catch (error) {
      console.error('Restaurant creation error:', error)
      throw error
    }
  }

  async updateRestaurant(userId, updates) {
    try {
      // Map restaurant updates to users table fields
      const userUpdates = {}
      if (updates.name) userUpdates.restaurant_name = updates.name
      if (updates.description) userUpdates.restaurant_description = updates.description
      if (updates.address) userUpdates.restaurant_address = updates.address
      if (updates.phone) userUpdates.restaurant_phone = updates.phone
      if (updates.email) userUpdates.restaurant_email = updates.email
      if (updates.cuisine_type) userUpdates.cuisine_type = updates.cuisine_type
      if (updates.logo_url) userUpdates.logo_url = updates.logo_url
      if (updates.banner_url) userUpdates.banner_url = updates.banner_url
      if (updates.opening_hours) userUpdates.opening_hours = updates.opening_hours
      if (updates.is_open !== undefined) userUpdates.is_open = updates.is_open

      const { data, error } = await supabase
        .from('users')
        .update(userUpdates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data

    } catch (error) {
      console.error('Restaurant update error:', error)
      throw error
    }
  }

  async getRestaurantByOwner(ownerId) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          restaurant_name,
          restaurant_description,
          restaurant_address,
          restaurant_phone,
          restaurant_email,
          cuisine_type,
          logo_url,
          banner_url,
          opening_hours,
          staff_signup_key,
          is_open
        `)
        .eq('id', ownerId)
        .eq('role', 'restaurant_owner')
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data

    } catch (error) {
      console.error('Get restaurant error:', error)
      return null
    }
  }

  // =============================================
  // STAFF MANAGEMENT
  // =============================================

  async createStaffRecord(userId, staffData) {
    try {
      // In simplified approach, staff data is stored in users table
      const { data, error } = await supabase
        .from('users')
        .update({
          restaurant_id: staffData.restaurant_id, // Reference to restaurant owner's user ID
          position: staffData.position,
          hourly_rate: staffData.hourly_rate || 0,
          is_available: true,
          approved_at: new Date().toISOString(),
          approved_by: staffData.approved_by
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data

    } catch (error) {
      console.error('Staff creation error:', error)
      throw error
    }
  }

  async getStaffByUser(userId) {
    try {
      // Get staff user data and their restaurant owner info
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          phone,
          restaurant_id,
          position,
          hourly_rate,
          is_available,
          approved_at,
          approved_by
        `)
        .eq('id', userId)
        .eq('role', 'staff')
        .single()

      if (staffError && staffError.code !== 'PGRST116') throw staffError
      if (!staffData) return null

      // Get restaurant owner info if staff has restaurant_id
      let restaurantData = null
      if (staffData.restaurant_id) {
        const { data: ownerData, error: ownerError } = await supabase
          .from('users')
          .select(`
            id,
            restaurant_name,
            restaurant_address,
            restaurant_phone,
            restaurant_email
          `)
          .eq('id', staffData.restaurant_id)
          .eq('role', 'restaurant_owner')
          .single()

        if (!ownerError) {
          restaurantData = {
            id: ownerData.id,
            name: ownerData.restaurant_name,
            address: ownerData.restaurant_address,
            phone: ownerData.restaurant_phone,
            email: ownerData.restaurant_email
          }
        }
      }

      return {
        ...staffData,
        restaurant: restaurantData
      }

    } catch (error) {
      console.error('Get staff error:', error)
      return null
    }
  }

  // =============================================
  // ROLE-SPECIFIC DATA RETRIEVAL
  // =============================================

  async getRoleSpecificData(user) {
    try {
      switch (user.role) {
        case 'restaurant_owner':
          return await this.getRestaurantByOwner(user.id)
        
        case 'staff':
          return await this.getStaffByUser(user.id)
        
        case 'super_admin':
          return { role: 'super_admin', permissions: ['all'] }
        
        default:
          return null
      }
    } catch (error) {
      console.error('Get role data error:', error)
      return null
    }
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  generateStaffSignupKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 12; i++) {
      if (i > 0 && i % 4 === 0) result += '-'
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  getCurrentUser() {
    try {
      const userData = localStorage.getItem('user')
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  isAuthenticated() {
    return this.getCurrentUser() !== null
  }

  hasRole(requiredRole) {
    const user = this.getCurrentUser()
    return user && user.role === requiredRole
  }

  // =============================================
  // RESTAURANT DISCOVERY (PUBLIC)
  // =============================================

  async getPublicRestaurants(filters = {}) {
    try {
      let query = supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          phone,
          restaurant_name,
          restaurant_description,
          restaurant_address,
          restaurant_phone,
          restaurant_email,
          cuisine_type,
          logo_url,
          banner_url,
          opening_hours,
          is_open,
          created_at
        `)
        .eq('role', 'restaurant_owner')
        .not('restaurant_name', 'is', null)

      // Apply filters
      if (filters.cuisine_type) {
        query = query.eq('cuisine_type', filters.cuisine_type)
      }

      if (filters.search) {
        query = query.or(`restaurant_name.ilike.%${filters.search}%,restaurant_description.ilike.%${filters.search}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Enrich with additional data
      const enrichedRestaurants = await Promise.all(
        data.map(async (restaurant) => {
          try {
            // Get menu items count
            const { count: menuCount } = await supabase
              .from('menu_items')
              .select('*', { count: 'exact', head: true })
              .eq('restaurant_id', restaurant.id)
              .eq('is_available', true)

            // Get categories count
            const { count: categoryCount } = await supabase
              .from('categories')
              .select('*', { count: 'exact', head: true })
              .eq('restaurant_id', restaurant.id)
              .eq('is_active', true)

            // Get average rating
            const { data: reviews } = await supabase
              .from('reviews')
              .select('overall_rating')
              .eq('restaurant_id', restaurant.id)

            const avgRating = reviews && reviews.length > 0
              ? reviews.reduce((sum, review) => sum + review.overall_rating, 0) / reviews.length
              : 4.2

            return {
              id: restaurant.id,
              name: restaurant.restaurant_name,
              description: restaurant.restaurant_description,
              address: restaurant.restaurant_address,
              phone: restaurant.restaurant_phone,
              email: restaurant.restaurant_email,
              cuisine_type: restaurant.cuisine_type,
              logo_url: restaurant.logo_url,
              banner_url: restaurant.banner_url,
              opening_hours: restaurant.opening_hours,
              is_open: restaurant.is_open,
              owner: {
                full_name: restaurant.full_name,
                email: restaurant.email,
                phone: restaurant.phone
              },
              menu_items_count: menuCount || 0,
              categories_count: categoryCount || 0,
              average_rating: Number(avgRating.toFixed(1)),
              total_reviews: reviews ? reviews.length : 0,
              created_at: restaurant.created_at
            }
          } catch (error) {
            console.warn(`Error enriching restaurant ${restaurant.id}:`, error)
            return {
              id: restaurant.id,
              name: restaurant.restaurant_name,
              description: restaurant.restaurant_description,
              address: restaurant.restaurant_address,
              phone: restaurant.restaurant_phone,
              email: restaurant.restaurant_email,
              cuisine_type: restaurant.cuisine_type,
              logo_url: restaurant.logo_url,
              banner_url: restaurant.banner_url,
              opening_hours: restaurant.opening_hours,
              is_open: restaurant.is_open,
              owner: {
                full_name: restaurant.full_name,
                email: restaurant.email,
                phone: restaurant.phone
              },
              menu_items_count: 0,
              categories_count: 0,
              average_rating: 4.2,
              total_reviews: 0,
              created_at: restaurant.created_at
            }
          }
        })
      )

      return enrichedRestaurants

    } catch (error) {
      console.error('Get public restaurants error:', error)
      throw error
    }
  }

  // =============================================
  // STAFF APPLICATION MANAGEMENT
  // =============================================

  async applyToRestaurant({ restaurantKey, position, hourlyRate, message }) {
    try {
      const user = this.getCurrentUser()
      if (!user || user.role !== 'staff') {
        throw new Error('Only staff users can apply to restaurants')
      }

      // Find restaurant by signup key (in simplified approach, restaurant data is in users table)
      const { data: restaurant, error: restaurantError } = await supabase
        .from('users')
        .select('id, restaurant_name')
        .eq('staff_signup_key', restaurantKey)
        .eq('role', 'restaurant_owner')
        .single()

      if (restaurantError || !restaurant) {
        throw new Error('Invalid restaurant signup key')
      }

      // Check for existing application
      const { data: existingApp } = await supabase
        .from('staff_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurant.id)
        .single()

      if (existingApp) {
        throw new Error(`You already have a ${existingApp.status} application for this restaurant`)
      }

      // Create application
      const { data, error } = await supabase
        .from('staff_applications')
        .insert({
          restaurant_id: restaurant.id,
          user_id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          position,
          hourly_rate: hourlyRate,
          message,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      return {
        success: true,
        application: data,
        restaurant: restaurant
      }

    } catch (error) {
      console.error('Staff application error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export default new EnhancedAuthService()
