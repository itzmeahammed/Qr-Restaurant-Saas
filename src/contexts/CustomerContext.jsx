import React, { createContext, useContext, useState, useEffect } from 'react'
import { customerService } from '../services/customerService'
import { supabase } from '../config/supabase'

const CustomerContext = createContext()

export const useCustomer = () => {
  const context = useContext(CustomerContext)
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider')
  }
  return context
}

export const CustomerProvider = ({ children }) => {
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [orders, setOrders] = useState([])
  const [favorites, setFavorites] = useState([])
  const [notifications, setNotifications] = useState([])

  // Initialize customer session
  useEffect(() => {
    initializeCustomer()
  }, [])

  const initializeCustomer = async () => {
    try {
      setLoading(true)
      
      // Check if user is authenticated with Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // User is authenticated, get or create customer profile
        const result = await customerService.getCustomerByEmail(session.user.email)
        
        if (result.success && result.data) {
          setCustomer(result.data)
          setIsAuthenticated(true)
          await loadCustomerData(result.data.id)
        } else {
          // Create customer profile for authenticated user
          const createResult = await customerService.createCustomerProfile({
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name || '',
            phone: session.user.user_metadata?.phone || ''
          })
          
          if (createResult.success) {
            setCustomer(createResult.data)
            setIsAuthenticated(true)
          }
        }
      } else {
        // Guest user - create temporary session
        const guestCustomer = {
          id: `guest_${Date.now()}`,
          email: null,
          full_name: 'Guest User',
          isGuest: true
        }
        setCustomer(guestCustomer)
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Error initializing customer:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCustomerData = async (customerId) => {
    try {
      // Load orders
      const ordersResult = await customerService.getCustomerOrders(customerId)
      if (ordersResult.success) {
        setOrders(ordersResult.data || [])
      }

      // Load favorites
      const favoritesResult = await customerService.getCustomerFavorites(customerId)
      if (favoritesResult.success) {
        setFavorites(favoritesResult.data || [])
      }
    } catch (error) {
      console.error('Error loading customer data:', error)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      // Get customer profile
      const result = await customerService.getCustomerByEmail(email)
      if (result.success && result.data) {
        setCustomer(result.data)
        setIsAuthenticated(true)
        await loadCustomerData(result.data.id)
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email, password, fullName, phone) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
            role: 'customer'
          }
        }
      })
      
      if (error) throw error
      
      // Create customer profile
      const createResult = await customerService.createCustomerProfile({
        email,
        fullName,
        phone
      })
      
      if (createResult.success) {
        setCustomer(createResult.data)
        setIsAuthenticated(true)
      }
      
      return { success: true, data }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setCustomer(null)
      setIsAuthenticated(false)
      setOrders([])
      setFavorites([])
      setNotifications([])
      
      // Create new guest session
      const guestCustomer = {
        id: `guest_${Date.now()}`,
        email: null,
        full_name: 'Guest User',
        isGuest: true
      }
      setCustomer(guestCustomer)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!customer || customer.isGuest) return { success: false, error: 'Not authenticated' }
      
      const result = await customerService.updateCustomerProfile(customer.id, updates)
      if (result.success) {
        setCustomer({ ...customer, ...result.data })
      }
      return result
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, error: error.message }
    }
  }

  const addToFavorites = async (restaurantId) => {
    try {
      if (!customer || customer.isGuest) return { success: false, error: 'Please sign in to add favorites' }
      
      const result = await customerService.addToFavorites(customer.id, restaurantId)
      if (result.success) {
        await loadCustomerData(customer.id) // Refresh favorites
      }
      return result
    } catch (error) {
      console.error('Add to favorites error:', error)
      return { success: false, error: error.message }
    }
  }

  const removeFromFavorites = async (restaurantId) => {
    try {
      if (!customer || customer.isGuest) return { success: false, error: 'Not authenticated' }
      
      const result = await customerService.removeFromFavorites(customer.id, restaurantId)
      if (result.success) {
        await loadCustomerData(customer.id) // Refresh favorites
      }
      return result
    } catch (error) {
      console.error('Remove from favorites error:', error)
      return { success: false, error: error.message }
    }
  }

  const createOrder = async (orderData) => {
    try {
      if (!customer) return { success: false, error: 'Customer not initialized' }
      
      const result = await customerService.createCustomerOrder({
        ...orderData,
        customerId: customer.id
      })
      
      if (result.success && !customer.isGuest) {
        await loadCustomerData(customer.id) // Refresh orders
      }
      
      return result
    } catch (error) {
      console.error('Create order error:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    customer,
    loading,
    isAuthenticated,
    orders,
    favorites,
    notifications,
    signIn,
    signUp,
    signOut,
    updateProfile,
    addToFavorites,
    removeFromFavorites,
    createOrder,
    refreshData: () => customer && !customer.isGuest ? loadCustomerData(customer.id) : null
  }

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  )
}

export default CustomerContext
