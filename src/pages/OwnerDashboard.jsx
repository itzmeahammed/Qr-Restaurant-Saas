import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  ChartBarIcon, 
  UsersIcon, 
  CurrencyRupeeIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  QrCodeIcon,
  StarIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  ShoppingBagIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  BellIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { supabase } from '../config/supabase'
import { uploadImageToStorage, compressImage } from '../utils/storageUtils'
import useAuthStore from '../stores/useAuthStore'
import toast from 'react-hot-toast'
import OverviewTab from '../components/dashboard/OverviewTab'
import OrdersTab from '../components/dashboard/OrdersTab'
import MenuTab from '../components/dashboard/MenuTab'
import TablesTab from '../components/dashboard/TablesTab'
import StaffTab from '../components/dashboard/StaffTab'
import AnalyticsTab from '../components/dashboard/AnalyticsTab'
// import AuthDebug from '../components/AuthDebug' // Removed after database setup

const OwnerDashboard = () => {
  const { user, profile, signOut, loading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  
  // Debug auth state
  console.log('=== OwnerDashboard Render ====')
  console.log('Auth loading:', authLoading)
  console.log('User:', user)
  console.log('Profile:', profile)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileSettings, setShowProfileSettings] = useState(false)
  const [showRestaurantSettings, setShowRestaurantSettings] = useState(false)
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: ''
  })
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    cuisine_type: '',
    logo_url: '',
    banner_url: ''
  })
  const [imageFiles, setImageFiles] = useState({ logo: null, banner: null })
  const [imagePreview, setImagePreview] = useState({ logo: null, banner: null })
  const [uploadingImages, setUploadingImages] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [restaurant, setRestaurant] = useState(null)
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeStaff: 0,
    avgRating: 4.5,
    todayRevenue: 0,
    todayOrders: 0
  })
  const [revenueData, setRevenueData] = useState([])
  const [orders, setOrders] = useState([])
  const [staff, setStaff] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState([])

  // Removed artificial timeout - database should maintain persistent connection

  // Wait for auth to initialize before checking restaurant setup
  useEffect(() => {
    console.log('=== OwnerDashboard useEffect triggered =====')
    console.log('Auth loading:', authLoading)
    console.log('User:', user)
    console.log('Profile:', profile)
    
    // Don't proceed if auth is still loading
    if (authLoading) {
      console.log('Auth still loading, waiting...')
      return
    }
    
    // If auth is done but no user, redirect to login
    if (!user) {
      console.log('No user found after auth completed, redirecting to login')
      navigate('/login')
      return
    }
    
    // Prevent multiple calls if restaurant is already loaded
    if (restaurant) {
      console.log('Restaurant already loaded, skipping setup check')
      return
    }
    
    // Database is now set up - using real API calls
    
    // User is available, proceed with restaurant setup check
    console.log('User available, checking restaurant setup')
    checkRestaurantSetup()
  }, [authLoading, user, navigate]) // Removed profile and restaurant from dependencies to prevent multiple calls

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-dropdown')) {
        setShowProfileMenu(false)
      }
      if (showNotifications && !event.target.closest('.notifications-dropdown')) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu, showNotifications])

  const checkRestaurantSetup = async () => {
    console.log('=== checkRestaurantSetup called =====')
    console.log('User object:', user)
    console.log('Profile object:', profile)
    
    if (!user?.id) {
      console.log('No user ID found, redirecting to login')
      navigate('/login')
      return
    }
    
    // Check if this is first time login and restaurant needs verification
    const checkRestaurantVerification = async (restaurant) => {
      // If restaurant doesn't have logo or banner, redirect to onboarding for verification
      if (!restaurant.logo_url || !restaurant.banner_url) {
        console.log('Restaurant missing verification images, redirecting to setup')
        toast('Please complete restaurant verification by uploading logo and banner images')
        navigate('/restaurant-setup')
        return false
      }
      return true
    }
    
    // Remove aggressive timeout - let API calls complete naturally
    console.log('=== Starting restaurant setup check ===')
    
    // Enhanced Supabase connection with retry logic
    console.log('Establishing persistent database connection...')
    let retryCount = 0
    const maxRetries = 3
    
    const testConnection = async () => {
      try {
        const { data, error } = await supabase.from('restaurants').select('count').limit(1)
        console.log('Database connection test result:', { data, error })
        if (error) {
          if (retryCount < maxRetries) {
            retryCount++
            console.log(`Connection failed, retrying... (${retryCount}/${maxRetries})`)
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
            return await testConnection()
          } else {
            throw error
          }
        }
        console.log('✅ Persistent database connection established')
        return true
      } catch (connectionError) {
        if (retryCount < maxRetries) {
          retryCount++
          console.log(`Connection error, retrying... (${retryCount}/${maxRetries})`)
          await new Promise(resolve => setTimeout(resolve, 2000))
          return await testConnection()
        }
        throw connectionError
      }
    }
    
    try {
      await testConnection()
    } catch (finalError) {
      console.error('Failed to establish database connection after retries:', finalError)
      toast.error('Database connection failed after retries: ' + finalError.message)
      setLoading(false)
      return
    }
    
    try {
      // Check if user is super_admin
      const userRole = user.user_metadata?.role || profile?.role
      console.log('User role:', userRole)
      
      if (userRole === 'super_admin') {
        // Super admin can view any restaurant - get the first one for demo
        console.log('Super admin detected, fetching first restaurant')
        const { data: restaurants, error } = await supabase
          .from('restaurants')
          .select('*')
          .limit(1)

        console.log('Restaurant query result for super admin:', { restaurants, error })

        if (error) {
          console.error('Error fetching restaurants for super admin:', error)
          toast.error('Failed to load restaurant data: ' + error.message)
          setLoading(false)
          return
        }

        if (!restaurants || restaurants.length === 0) {
          console.log('No restaurants found in system')
          toast('No restaurants found. Please create a restaurant first.')
          setLoading(false)
          return
        }

        console.log('Restaurant found for super admin:', restaurants[0])
        
        // Check if restaurant needs verification (even for super admin viewing)
        const isVerified = await checkRestaurantVerification(restaurants[0])
        if (!isVerified) return
        
        setRestaurant(restaurants[0])
        await fetchDashboardData(restaurants[0].id)
        return
      }

      console.log('Checking restaurants for owner_id:', user.id)
      // Check if owner has a restaurant
      const { data: restaurants, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .limit(1)

      console.log('Restaurant query result:', { restaurants, error })

      if (error) throw error

      if (!restaurants || restaurants.length === 0) {
        console.log('No restaurant found for owner, redirecting to setup')
        toast('Please complete your restaurant setup first')
        navigate('/restaurant-setup')
        return
      }

      console.log('Restaurant found:', restaurants[0])
      
      // Check if restaurant needs verification
      const isVerified = await checkRestaurantVerification(restaurants[0])
      if (!isVerified) return
      
      setRestaurant(restaurants[0])
      await fetchDashboardData(restaurants[0].id)
    } catch (error) {
      console.error('Error in checkRestaurantSetup:', error)
      toast.error('Failed to load restaurant data: ' + error.message)
      setLoading(false)
    }
  }

  const fetchDashboardData = async (restaurantId) => {
    console.log('=== Starting fetchDashboardData for restaurant:', restaurantId)
    console.log('Using persistent database connection for data fetching')
    
    try {
      // Set loading to true
      setLoading(true)
      
      // Enhanced data fetching with persistent connection and retry logic
      const fetchWithRetry = async (fetchFunction, retries = 2) => {
        for (let i = 0; i <= retries; i++) {
          try {
            return await fetchFunction()
          } catch (error) {
            console.log(`Fetch attempt ${i + 1} failed:`, error.message)
            if (i === retries) throw error
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Progressive delay
          }
        }
      }
      
      // Fetch data with individual error handling and retry logic
      const promises = [
        fetchWithRetry(() => fetchStats(restaurantId)).catch(err => {
          console.error('Stats fetch failed after retries:', err)
          // Set default stats on failure
          setStats({
            totalRevenue: 0,
            totalOrders: 0,
            activeStaff: 0,
            avgRating: 0,
            todayRevenue: 0,
            todayOrders: 0
          })
          return null
        }),
        fetchWithRetry(() => fetchRevenueData(restaurantId)).catch(err => {
          console.error('Revenue data fetch failed after retries:', err)
          setRevenueData([])
          return null
        }),
        fetchWithRetry(() => fetchOrders(restaurantId)).catch(err => {
          console.error('Orders fetch failed after retries:', err)
          setOrders([])
          return null
        }),
        fetchWithRetry(() => fetchStaff(restaurantId)).catch(err => {
          console.error('Staff fetch failed after retries:', err)
          setStaff([])
          return null
        }),
        fetchWithRetry(() => fetchMenuItems(restaurantId)).catch(err => {
          console.error('Menu items fetch failed after retries:', err)
          setMenuItems([])
          return null
        }),
        fetchWithRetry(() => fetchCategories(restaurantId)).catch(err => {
          console.error('Categories fetch failed after retries:', err)
          setCategories([])
          return null
        }),
        fetchWithRetry(() => fetchNotifications(restaurantId)).catch(err => {
          console.error('Notifications fetch failed after retries:', err)
          setNotifications([])
          return null
        })
      ]
      
      console.log('=== Executing all dashboard data fetches ===')
      const results = await Promise.allSettled(promises)
      
      // Count successful fetches and log details
      const successCount = results.filter(result => result.status === 'fulfilled').length
      const failedCount = results.filter(result => result.status === 'rejected').length
      
      console.log(`Dashboard data fetch completed: ${successCount} successful, ${failedCount} failed`)
      
      // Log failed promises for debugging
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`Promise ${index} failed:`, result.reason)
        }
      })
      
      // Only show success toast once, not for every data fetch
      if (successCount > 0 && !restaurant?.dataLoaded) {
        toast.success(`Dashboard loaded successfully!`)
        // Mark as loaded to prevent multiple toasts
        setRestaurant(prev => ({ ...prev, dataLoaded: true }))
      } else if (successCount === 0) {
        toast.error('Failed to load dashboard data. Please check your connection.')
      }
      
    } catch (error) {
      console.error('Error in fetchDashboardData:', error)
      toast.error('Failed to load dashboard data: ' + error.message)
    } finally {
      console.log('=== fetchDashboardData completed, setting loading to false')
      setLoading(false)
    }
  }

  // Fetch real notifications from database
  const fetchNotifications = async (restaurantId) => {
    try {
      // Fetch recent orders for notifications
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at, customer_name, total_amount')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      // Fetch staff performance for notifications
      const { data: staffPerformance } = await supabase
        .from('staff')
        .select('id, total_orders_completed, user_id')
        .eq('restaurant_id', restaurantId)
        .gte('total_orders_completed', 5)
        .limit(3)
      
      const notifications = []
      
      // Add order notifications
      recentOrders?.forEach(order => {
        const timeAgo = getTimeAgo(order.created_at)
        notifications.push({
          id: `order_${order.id}`,
          message: `New order #${order.order_number} from ${order.customer_name || 'Customer'}`,
          type: order.status === 'pending' ? 'info' : 'success',
          time: timeAgo
        })
      })
      
      // Add staff performance notifications
      staffPerformance?.forEach(staff => {
        notifications.push({
          id: `staff_${staff.id}`,
          message: `Staff member completed ${staff.total_orders_completed} orders`,
          type: 'success',
          time: 'Today'
        })
      })
      
      setNotifications(notifications.slice(0, 5)) // Keep only 5 most recent
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
    }
  }
  
  // Helper function to calculate time ago
  const getTimeAgo = (dateString) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now - date) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`
    return `${Math.floor(diffInMinutes / 1440)} day ago`
  }

  // Fetch functions with real database integration
  const fetchStats = async (restaurantId) => {
        try {
          console.log('Fetching stats for restaurant:', restaurantId)
          
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('total_amount, created_at, status')
            .eq('restaurant_id', restaurantId)

          if (ordersError) {
            console.error('Orders query error:', ordersError)
          }

          const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('is_available')
        .eq('restaurant_id', restaurantId)

      if (staffError) {
        console.error('Staff query error:', staffError)
      }

      // Try to fetch reviews, but don't fail if table doesn't exist
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('overall_rating')
        .eq('restaurant_id', restaurantId)
        .limit(100) // Limit to prevent large queries

      const totalRevenue = ordersData?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0
      const totalOrders = ordersData?.length || 0
      const activeStaff = staffData?.filter(staff => staff.is_available).length || 0
      const avgRating = reviewsData?.length > 0 
        ? reviewsData.reduce((sum, review) => sum + (review.overall_rating || 0), 0) / reviewsData.length 
      : 4.5

      const today = new Date().toISOString().split('T')[0]
      const todayOrders = ordersData?.filter(order => 
        order.created_at?.startsWith(today)
      ) || []
      
      const todayRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)

      const statsData = {
        totalRevenue,
        totalOrders,
        activeStaff,
        avgRating,
        todayRevenue,
        todayOrders: todayOrders.length
      }
      
      console.log('Stats calculated:', statsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error in fetchStats:', error)
      // Set default stats to prevent loading issues
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        activeStaff: 0,
        avgRating: 4.5,
        todayRevenue: 0,
        todayOrders: 0
      })
    }
  }

  const fetchRevenueData = async (restaurantId) => {
    try {
      console.log('Fetching revenue data for restaurant:', restaurantId)
      
      const { data, error } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at')

      if (error) {
        console.error('Revenue data query error:', error)
        setRevenueData([])
        return
      }

      // Group by date
      const revenueByDate = {}
      data?.forEach(order => {
        const date = order.created_at?.split('T')[0]
        if (date) {
          if (!revenueByDate[date]) {
            revenueByDate[date] = { date, revenue: 0, orders: 0 }
          }
          revenueByDate[date].revenue += parseFloat(order.total_amount || 0)
          revenueByDate[date].orders += 1
        }
      })

      const revenueArray = Object.values(revenueByDate)
      console.log('Revenue data processed:', revenueArray)
      setRevenueData(revenueArray)
    } catch (error) {
      console.error('Error in fetchRevenueData:', error)
      setRevenueData([])
    }
  }

  const fetchOrders = async (restaurantId) => {
    try {
      console.log('Fetching orders for restaurant:', restaurantId)
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables(*),
          staff(*, users(*))
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Orders query error:', error)
        setOrders([])
        return
      }

      console.log('Orders fetched:', data?.length || 0)
      setOrders(data || [])
    } catch (error) {
      console.error('Error in fetchOrders:', error)
      setOrders([])
    }
  }

  const fetchStaff = async (restaurantId) => {
    try {
      console.log('Fetching staff for restaurant:', restaurantId)
      
      const { data, error } = await supabase
        .from('staff')
        .select(`
          *,
          users:user_id (
            full_name,
            email,
            phone
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Staff query error:', error)
        // If the users join fails, try without it
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('staff')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .order('created_at', { ascending: false })
        
        if (fallbackError) {
          console.error('Fallback staff query error:', fallbackError)
          setStaff([])
          return
        }
        
        console.log('Staff fetched (fallback):', fallbackData?.length || 0)
        setStaff(fallbackData || [])
        return
      }

      console.log('Staff fetched:', data?.length || 0)
      setStaff(data || [])
    } catch (error) {
      console.error('Error in fetchStaff:', error)
      setStaff([])
    }
  }

  const fetchMenuItems = async (restaurantId) => {
    try {
      console.log('Fetching menu items for restaurant:', restaurantId)
      
      const { data, error } = await supabase
        .from('menu_items')
        .select('*, categories(*)')
        .eq('restaurant_id', restaurantId)
        .order('name')

      if (error) {
        console.error('Menu items query error:', error)
        setMenuItems([])
        return
      }

      console.log('Menu items fetched:', data?.length || 0)
      setMenuItems(data || [])
    } catch (error) {
      console.error('Error in fetchMenuItems:', error)
      setMenuItems([])
    }
  }

  const fetchCategories = async (restaurantId) => {
    try {
      console.log('Fetching categories for restaurant:', restaurantId)
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name')

      if (error) {
        console.error('Categories query error:', error)
        setCategories([])
        return
      }

      console.log('Categories fetched:', data?.length || 0)
      setCategories(data || [])
    } catch (error) {
      console.error('Error in fetchCategories:', error)
      setCategories([])
    }
  }

  const fetchTables = async (restaurantId) => {
    try {
      console.log('Fetching tables for restaurant:', restaurantId)
      
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('table_number')

      if (error) {
        console.error('Tables query error:', error)
        setTables([])
        return
      }

      console.log('Tables fetched:', data?.length || 0)
      setTables(data || [])
    } catch (error) {
      console.error('Error in fetchTables:', error)
      setTables([])
    }
  }

  const handleAddStaff = async (staffData) => {
    try {
      console.log('Adding staff member:', staffData)
      
      // Add staff member to database with restaurant_id
      const { data: staffRecord, error: staffError } = await supabase
        .from('staff')
        .insert({
          restaurant_id: restaurant.id,
          position: staffData.position,
          hourly_rate: parseFloat(staffData.hourly_rate) || 0,
          is_available: true,
          total_orders_completed: 0,
          total_tips_received: 0,
          performance_rating: 5.0
        })
        .select('*')
        .single()

      if (staffError) throw staffError
      
      // Create display object with user data
      const newStaffMember = {
        ...staffRecord,
        users: {
          full_name: staffData.full_name,
          email: staffData.email,
          phone: staffData.phone
        }
      }
      
      setStaff([...staff, newStaffMember])
      toast.success('Staff member added successfully!')
    } catch (error) {
      console.error('Error adding staff:', error)
      toast.error('Failed to add staff member: ' + error.message)
    }
  }

  const handleUpdateStaff = async (staffId, updates) => {
    try {
      console.log('Updating staff:', staffId, updates)
      
      const { data, error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', staffId)
        .select('*, users(*)')
        .single()

      if (error) throw error
      
      setStaff(staff.map(member => member.id === staffId ? data : member))
      toast.success('Staff member updated successfully')
    } catch (error) {
      console.error('Error updating staff:', error)
      toast.error('Failed to update staff member')
    }
  }

  const handleDeleteStaff = async (staffId) => {
    try {
      console.log('Deleting staff:', staffId)
      
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId)

      if (error) throw error
      
      setStaff(staff.filter(member => member.id !== staffId))
      toast.success('Staff member removed successfully')
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast.error('Failed to remove staff member')
    }
  }

  const handleAddTable = async (tableData) => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .insert([{ ...tableData, restaurant_id: restaurant.id }])
        .select()
        .single()

      if (error) throw error
      setTables([...tables, data])
      toast.success('Table added successfully')
    } catch (error) {
      console.error('Error adding table:', error)
      toast.error('Failed to add table')
    }
  }

  const handleUpdateTable = async (tableId, updates) => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .update(updates)
        .eq('id', tableId)
        .select()
        .single()

      if (error) throw error
      setTables(tables.map(t => t.id === tableId ? data : t))
      toast.success('Table updated successfully')
    } catch (error) {
      console.error('Error updating table:', error)
      toast.error('Failed to update table')
    }
  }

  const handleDeleteTable = async (tableId) => {
    try {
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId)

      if (error) throw error
      setTables(tables.filter(t => t.id !== tableId))
      toast.success('Table deleted successfully')
    } catch (error) {
      console.error('Error deleting table:', error)
      toast.error('Failed to delete table')
    }
  }

  const handleAddMenuItem = async (itemData) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{ ...itemData, restaurant_id: restaurant.id }])
        .select('*, categories(*)')
        .single()

      if (error) throw error
      setMenuItems([...menuItems, data])
      toast.success('Menu item added successfully')
    } catch (error) {
      console.error('Error adding menu item:', error)
      toast.error('Failed to add menu item')
    }
  }

  const handleUpdateMenuItem = async (itemId, updates) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', itemId)
        .select('*, categories(*)')
        .single()

      if (error) throw error
      setMenuItems(menuItems.map(item => item.id === itemId ? data : item))
      toast.success('Menu item updated successfully')
    } catch (error) {
      console.error('Error updating menu item:', error)
      toast.error('Failed to update menu item')
    }
  }

  const handleDeleteMenuItem = async (itemId) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error
      setMenuItems(menuItems.filter(item => item.id !== itemId))
      toast.success('Menu item deleted successfully')
    } catch (error) {
      console.error('Error deleting menu item:', error)
      toast.error('Failed to delete menu item')
    }
  }

  const handleAddCategory = async (categoryData) => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...categoryData, restaurant_id: restaurant.id }])
        .select()
        .single()

      if (error) throw error
      setCategories([...categories, data])
      toast.success('Category added successfully')
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Failed to add category')
    }
  }

  const handleUpdateOrder = async (orderId, updates) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select('*, tables(*), staff(*, users(*))')
        .single()

      if (error) throw error
      setOrders(orders.map(order => order.id === orderId ? data : order))
      toast.success('Order updated successfully')
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order')
    }
  }

  // Profile and Restaurant Settings Handlers
  const handleUpdateProfile = async () => {
    try {
      console.log('Updating profile:', profileData)
      
      // Update user metadata in Supabase Auth
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: profileData.full_name,
          phone: profileData.phone,
          role: profileData.role
        }
      })

      if (error) throw error
      
      setShowProfileSettings(false)
      toast.success('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile: ' + error.message)
    }
  }

  // Handle image upload for restaurant settings
  const handleImageUpload = useCallback((type, file) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setImageFiles(prev => ({ ...prev, [type]: file }))

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(prev => ({ ...prev, [type]: e.target.result }))
    }
    reader.readAsDataURL(file)
  }, [])

  const handleUpdateRestaurant = async () => {
    try {
      setUploadingImages(true)
      console.log('Updating restaurant:', restaurantData)
      
      let updatedData = { ...restaurantData }
      
      // Upload new images if any
      if (imageFiles.logo || imageFiles.banner) {
        const uploadPromises = []
        
        if (imageFiles.logo) {
          const logoPromise = (async () => {
            try {
              const compressedLogo = await compressImage(imageFiles.logo, 400, 400, 0.8)
              const result = await uploadImageToStorage(
                compressedLogo,
                'restaurant-images',
                `restaurants/${user.id}/logos`,
                `logo_${Date.now()}.${imageFiles.logo.name.split('.').pop()}`
              )
              updatedData.logo_url = result.url
              toast.success('Logo updated successfully!')
            } catch (error) {
              console.error('Logo upload failed:', error)
              toast.error(`Logo upload failed: ${error.message}`)
            }
          })()
          uploadPromises.push(logoPromise)
        }
        
        if (imageFiles.banner) {
          const bannerPromise = (async () => {
            try {
              const compressedBanner = await compressImage(imageFiles.banner, 1200, 400, 0.8)
              const result = await uploadImageToStorage(
                compressedBanner,
                'restaurant-images',
                `restaurants/${user.id}/banners`,
                `banner_${Date.now()}.${imageFiles.banner.name.split('.').pop()}`
              )
              updatedData.banner_url = result.url
              toast.success('Banner updated successfully!')
            } catch (error) {
              console.error('Banner upload failed:', error)
              toast.error(`Banner upload failed: ${error.message}`)
            }
          })()
          uploadPromises.push(bannerPromise)
        }
        
        await Promise.all(uploadPromises)
      }
      
      const { data, error } = await supabase
        .from('restaurants')
        .update(updatedData)
        .eq('id', restaurant.id)
        .select('*')
        .single()

      if (error) throw error
      
      setRestaurant(data)
      setShowRestaurantSettings(false)
      setImageFiles({ logo: null, banner: null })
      setImagePreview({ logo: null, banner: null })
      toast.success('Restaurant settings updated successfully!')
    } catch (error) {
      console.error('Error updating restaurant:', error)
      toast.error('Failed to update restaurant: ' + error.message)
    } finally {
      setUploadingImages(false)
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'orders', name: 'Orders', icon: ShoppingBagIcon },
    { id: 'menu', name: 'Menu', icon: PlusIcon },
    { id: 'staff', name: 'Staff', icon: UsersIcon },
    { id: 'tables', name: 'Tables', icon: QrCodeIcon },
    { id: 'analytics', name: 'Analytics', icon: TrendingUpIcon }
  ]

  // Debug logging for loading states
  console.log('=== Dashboard Render State ===')
  console.log('authLoading:', authLoading)
  console.log('loading:', loading)
  console.log('user:', user)
  console.log('restaurant:', restaurant)
  
  // Show loading if auth is still loading or dashboard is loading
  if (authLoading || loading) {
    console.log('Showing loading screen because:', { authLoading, loading })
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-lg mb-2">
            {authLoading ? 'Authenticating...' : 'Loading Dashboard...'}
          </p>
          <p className="text-sm text-gray-500">
            {authLoading ? 'Verifying your credentials' : 'Setting up your restaurant data'}
          </p>
          <div className="mt-4 p-4 bg-white/50 rounded-lg">
            <p className="text-xs text-gray-600">Debug Info:</p>
            <p className="text-xs text-gray-500">Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
            <p className="text-xs text-gray-500">Dashboard Loading: {loading ? 'Yes' : 'No'}</p>
            <p className="text-xs text-gray-500">User: {user ? user.email : 'None'}</p>
            <button
              onClick={() => {
                console.log('Manual override: Forcing dashboard load')
                setLoading(false)
                if (!restaurant) {
                  setRestaurant({ 
                    id: '550e8400-e29b-41d4-a716-446655440000',
                    name: 'Demo Restaurant',
                    address: '123 Demo Street, Demo City'
                  })
                }
                toast.success('Dashboard loaded manually')
              }}
              className="mt-2 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
            >
              Force Load Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  // If not loading but no user, redirect to login
  if (!authLoading && !user) {
    console.log('No user found after auth loading completed, redirecting to login')
    navigate('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 shadow-2xl backdrop-blur-sm relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3'%3E%3Ccircle cx='20' cy='20' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 md:h-20">
            {/* Left side - Restaurant Logo and Info */}
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <div className="flex-shrink-0">
                {restaurant?.logo_url ? (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-xl shadow-lg overflow-hidden ring-2 ring-white/20">
                    <img 
                      src={restaurant.logo_url} 
                      alt={`${restaurant.name} logo`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div className="w-full h-full bg-white rounded-xl flex items-center justify-center" style={{display: 'none'}}>
                      <QrCodeIcon className="h-6 w-6 md:h-7 md:w-7 text-orange-500" />
                    </div>
                  </div>
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/20">
                    <QrCodeIcon className="h-6 w-6 md:h-7 md:w-7 text-orange-500" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white truncate">
                    {restaurant?.name || 'Restaurant Dashboard'}
                  </h1>
                  <p className="text-orange-100 text-xs sm:text-sm md:text-base font-medium">
                    {restaurant?.cuisine_type || 'Manage your restaurant operations'}
                  </p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-base font-bold text-white truncate">
                    {restaurant?.name?.length > 15 ? restaurant?.name?.substring(0, 15) + '...' : restaurant?.name || 'Dashboard'}
                  </h1>
                  <p className="text-orange-100 text-xs font-medium">
                    {restaurant?.cuisine_type || 'Dashboard'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Actions and Profile */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              {/* Quick Actions - Responsive */}
              <div className="hidden md:flex items-center space-x-2">
                <button 
                  onClick={() => setActiveTab('tables')}
                  className="flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm hover:scale-105 active:scale-95"
                >
                  <QrCodeIcon className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">QR Codes</span>
                  <span className="lg:hidden">QR</span>
                </button>
                <button 
                  onClick={() => setActiveTab('menu')}
                  className="flex items-center px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm hover:scale-105 active:scale-95"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  <span className="hidden lg:inline">Add Item</span>
                  <span className="lg:hidden">Add</span>
                </button>
              </div>
              
              {/* Mobile Quick Actions */}
              <div className="md:hidden flex items-center space-x-1">
                <button 
                  onClick={() => setActiveTab('tables')}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm hover:scale-105 active:scale-95"
                >
                  <QrCodeIcon className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => setActiveTab('menu')}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 backdrop-blur-sm hover:scale-105 active:scale-95"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Notifications */}
              <div className="relative notifications-dropdown">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <BellIcon className="h-5 w-5 md:h-6 md:w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-400 text-xs font-bold text-orange-900 rounded-full flex items-center justify-center animate-pulse">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>
                
                {/* Notifications Dropdown */}
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50 max-h-96 overflow-y-auto"
                  >
                    <div className="px-4 py-2 border-b border-neutral-200">
                      <h3 className="text-sm font-semibold text-neutral-900">Notifications</h3>
                    </div>
                    
                    {notifications.length > 0 ? (
                      <div className="py-2">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="px-4 py-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0">
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'warning' ? 'bg-yellow-500' :
                                notification.type === 'error' ? 'bg-red-500' :
                                'bg-blue-500'
                              }`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-neutral-900">{notification.message}</p>
                                <p className="text-xs text-neutral-500 mt-1">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-neutral-500">
                        <BellIcon className="h-8 w-8 mx-auto mb-2 text-neutral-300" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    )}
                    
                    <div className="px-4 py-2 border-t border-neutral-200">
                      <button className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                        Mark all as read
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Enhanced Profile Dropdown */}
              <div className="relative profile-dropdown">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 sm:space-x-3 p-1.5 sm:p-2 text-white hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center ring-2 ring-white/20 shadow-lg">
                    <UserCircleIcon className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
                  </div>
                  <div className="hidden sm:block text-left min-w-0">
                    <p className="text-sm font-medium text-white truncate max-w-24 md:max-w-none">
                      {profile?.full_name || user?.email?.split('@')[0] || 'Owner'}
                    </p>
                    <p className="text-xs text-orange-100 truncate">
                      {user?.user_metadata?.role === 'super_admin' ? 'Super Admin' : 'Owner'}
                    </p>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 text-white transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {/* Enhanced Profile Dropdown Menu */}
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 backdrop-blur-sm"
                  >
                    <div className="px-4 py-2 border-b border-neutral-200">
                      <p className="text-sm font-medium text-neutral-900">
                        {profile?.full_name || user?.email?.split('@')[0] || 'Owner'}
                      </p>
                      <p className="text-xs text-neutral-500">{user?.email}</p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setShowProfileSettings(true)
                        setShowProfileMenu(false)
                        setProfileData({
                          full_name: profile?.full_name || user?.user_metadata?.full_name || '',
                          email: user?.email || '',
                          phone: profile?.phone || user?.user_metadata?.phone || '',
                          role: user?.user_metadata?.role || 'restaurant_owner'
                        })
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center"
                    >
                      <UserCircleIcon className="h-4 w-4 mr-3" />
                      Profile Settings
                    </button>
                    
                    <button 
                      onClick={() => {
                        setShowRestaurantSettings(true)
                        setShowProfileMenu(false)
                        setRestaurantData({
                          name: restaurant?.name || '',
                          description: restaurant?.description || '',
                          address: restaurant?.address || '',
                          phone: restaurant?.phone || '',
                          email: restaurant?.email || '',
                          cuisine_type: restaurant?.cuisine_type || '',
                          logo_url: restaurant?.logo_url || '',
                          banner_url: restaurant?.banner_url || ''
                        })
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 flex items-center transition-colors duration-150"
                    >
                      <Cog6ToothIcon className="h-4 w-4 mr-3" />
                      Restaurant Settings
                    </button>
                    
                    <div className="border-t border-neutral-200 mt-2 pt-2">
                      <button
                        onClick={async () => {
                          try {
                            await signOut()
                            toast.success('Logged out successfully')
                            navigate('/login')
                          } catch (error) {
                            toast.error('Failed to logout')
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <style jsx>{`
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .hover\\:scale-102:hover {
            transform: scale(1.02);
          }
        `}</style>
        {/* Desktop Tab Navigation */}
        <div className="hidden md:block mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2">
            <div className="flex gap-2">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                      : 'text-neutral-600 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-sm">{tab.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <OverviewTab 
            stats={stats}
            revenueData={revenueData}
            orders={orders.slice(0, 10)}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersTab 
            orders={orders}
            onUpdateOrder={handleUpdateOrder}
          />
        )}

        {activeTab === 'menu' && (
          <MenuTab 
            menuItems={menuItems}
            categories={categories}
            onAddMenuItem={handleAddMenuItem}
            onUpdateMenuItem={handleUpdateMenuItem}
            onDeleteMenuItem={handleDeleteMenuItem}
            onAddCategory={handleAddCategory}
          />
        )}

        {activeTab === 'tables' && (
          <TablesTab 
            restaurant={restaurant}
            tables={tables}
            onAddTable={handleAddTable}
            onUpdateTable={handleUpdateTable}
            onDeleteTable={handleDeleteTable}
            restaurantName={restaurant?.name || 'Restaurant'}
          />
        )}

        {activeTab === 'staff' && (
          <StaffTab 
            staff={staff}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsTab 
            stats={stats}
            revenueData={revenueData}
            orders={orders}
            staff={staff}
            menuItems={menuItems}
          />
        )}
      </div>
      
      {/* Auth Debug removed - Database is now set up */}
      
      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full my-4 sm:my-0 max-h-[80vh]"
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Profile Settings</h2>
                <button
                  onClick={() => setShowProfileSettings(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profileData.full_name}
                  onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your phone number"
                  />
                </div>
                
            </div>
            
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowProfileSettings(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateProfile}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Restaurant Settings Modal */}
      {showRestaurantSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start sm:items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-xl shadow-xl max-w-lg w-full my-4 sm:my-0 max-h-[80vh]"
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Restaurant Settings</h2>
                <button
                  onClick={() => setShowRestaurantSettings(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={restaurantData.name}
                  onChange={(e) => setRestaurantData({ ...restaurantData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter restaurant name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={restaurantData.phone}
                  onChange={(e) => setRestaurantData({ ...restaurantData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Type
                </label>
                <select
                  value={restaurantData.cuisine_type}
                  onChange={(e) => setRestaurantData({ ...restaurantData, cuisine_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select cuisine type</option>
                  <option value="Indian">Indian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Italian">Italian</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Thai">Thai</option>
                  <option value="American">American</option>
                  <option value="Continental">Continental</option>
                  <option value="Multi-Cuisine">Multi-Cuisine</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRestaurantSettings(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRestaurant}
                  className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-2 py-2 z-50">
        <div className="flex justify-around">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-neutral-500 hover:text-orange-600'
              }`}
            >
              <tab.icon className={`h-5 w-5 transition-all duration-200 ${
                activeTab === tab.id ? 'scale-110' : ''
              }`} />
              <span className="text-xs font-medium">{tab.name}</span>
              {activeTab === tab.id && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-orange-500 rounded-b-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile content padding to avoid bottom nav overlap */}
      <div className="md:hidden h-20"></div>
    </div>
  )
}

export default OwnerDashboard
