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
  XMarkIcon,
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  CogIcon,
  ClipboardDocumentListIcon,
  Bars3Icon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import Header from '../components/header/Header'
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
import OrderService from '../services/orderService'
import useOrderStore from '../stores/useOrderStore'
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
  
  // State declarations (moved before usage)
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState(null)
  
  // Debug auth state
  console.log('=== Dashboard Render State ===')
  console.log('authLoading:', authLoading)
  console.log('loading:', loading)
  console.log('user:', user)
  console.log('restaurant:', restaurant)
  
  if (loading) {
    console.log('Showing loading screen because:', { authLoading, loading })
  }
  
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
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
  const [notifications, setNotifications] = useState([])

  // Handle logout function
  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Removed artificial timeout - database should maintain persistent connection

  // Optimized useEffect to prevent multiple API calls
  useEffect(() => {
    console.log('=== OwnerDashboard useEffect triggered =====')
    console.log('Auth loading:', authLoading)
    console.log('User ID:', user?.id)
    console.log('Restaurant loaded:', !!restaurant)
    
    // Don't proceed if auth is still loading
    if (authLoading) {
      console.log('Auth still loading, waiting...')
      return
    }
    
    // If auth is done but no user, redirect to login
    if (!user?.id) {
      console.log('No user found after auth completed, redirecting to login')
      navigate('/auth')
      return
    }
    
    // Prevent multiple calls if restaurant is already loaded
    if (restaurant?.id) {
      console.log('Restaurant already loaded, skipping setup check')
      return
    }
    
    // Only run once when user is available and restaurant not loaded
    console.log('User available, checking restaurant setup')
    checkRestaurantSetup()
  }, [authLoading, user?.id, restaurant?.id]) // Simplified dependencies to prevent multiple calls


  const checkRestaurantSetup = async () => {
    console.log('=== checkRestaurantSetup called =====')
    console.log('User object:', user)
    console.log('Profile object:', profile)
    
    if (!user?.id) {
      console.log('No user ID found, redirecting to login')
      navigate('/auth')
      return
    }
    
    try {
      // Fetch fresh user data from database to check restaurant setup
      console.log('Fetching fresh user data for restaurant setup check:', user.id)
      
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .single()

      if (userError || !userData) {
        console.error('Error fetching user data:', userError)
        toast.error('Error loading user data')
        navigate('/auth')
        return
      }

      console.log('Fresh user data:', userData)
      
      // Check if required restaurant fields are filled
      const hasRestaurantName = userData.restaurant_name && userData.restaurant_name.trim() !== ''
      const hasRestaurantAddress = userData.restaurant_address && userData.restaurant_address.trim() !== ''
      const hasCuisineType = userData.cuisine_type && userData.cuisine_type.trim() !== ''
      
      console.log('Restaurant setup check:', {
        hasRestaurantName,
        hasRestaurantAddress,
        hasCuisineType,
        restaurant_name: userData.restaurant_name,
        restaurant_address: userData.restaurant_address,
        cuisine_type: userData.cuisine_type
      })
      
      if (!hasRestaurantName || !hasRestaurantAddress || !hasCuisineType) {
        // Restaurant setup incomplete - redirect to setup
        console.log('Restaurant setup incomplete, redirecting to setup')
        toast.error('Please complete restaurant setup first')
        navigate('/restaurant-setup')
        return
      }
      
      // Restaurant setup is complete, try to fetch actual restaurant record
      // First try by owner_id, then fallback to finding by user's restaurant name
      let restaurantData, restaurantError

      // Get restaurant data from users table (consistent foreign key)
      const { data: restaurantByOwner, error: ownerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .eq('role', 'restaurant_owner')
        .maybeSingle()

      if (restaurantByOwner) {
        restaurantData = restaurantByOwner
        restaurantError = ownerError
        console.log('✅ Restaurant found by owner_id:', restaurantByOwner.name)
      } else {
        // Fallback: Find restaurant by matching name with user's restaurant_name
        console.log('No restaurant found by owner_id, trying by name:', userData.restaurant_name)
        
        const { data: restaurantByName, error: nameError } = await supabase
          .from('users')
          .select('*')
          .eq('restaurant_name', userData.restaurant_name)
          .eq('role', 'restaurant_owner')
          .maybeSingle()
          
        restaurantData = restaurantByName
        restaurantError = nameError
        
        if (restaurantByName) {
          console.log('✅ Restaurant found by name:', restaurantByName.name)
          console.log('Note: Restaurant owner_id mismatch detected but working around it')
        }
      }

      if (restaurantError) {
        console.error('Error fetching restaurant data:', restaurantError)
        toast.error('Error loading restaurant data. Please try again.')
        return
      }

      if (!restaurantData) {
        // Final fallback: Use user profile data as restaurant data (RLS fallback approach)
        console.log('No restaurant table record found, using user profile data as fallback')
        restaurantData = {
          id: user.id,
          owner_id: user.id,
          name: userData.restaurant_name,
          description: userData.restaurant_description || '',
          address: userData.restaurant_address,
          phone: userData.restaurant_phone || userData.phone,
          email: userData.restaurant_email || userData.email,
          cuisine_type: userData.cuisine_type,
          logo_url: userData.logo_url,
          banner_url: userData.banner_url,
          is_active: true,
          created_at: userData.created_at,
          updated_at: userData.updated_at
        }
        console.log('✅ Using user profile as restaurant data:', restaurantData.name)
        toast.success('Restaurant data loaded from profile')
      }  
      
      console.log('✅ Restaurant found:', restaurantData.name)
      setRestaurant(restaurantData)
      
      // Fetch all dashboard data using actual restaurant ID
      await Promise.all([
        fetchOrders(restaurantData.id),
        fetchStaff(restaurantData.id),
        fetchMenuItems(restaurantData.id),
        fetchCategories(restaurantData.id),
        fetchTables(restaurantData.id)
      ])
      
      console.log('✅ Dashboard data loaded successfully')
      
    } catch (error) {
      console.error('Error in checkRestaurantSetup:', error)
      toast.error('Failed to load dashboard: ' + error.message)
    } finally {
      setLoading(false)
    }
  }
  
  const ensureUserInUnifiedTable = async () => {
    // Skip unified table creation - use existing restaurant system
    console.log('Skipping unified table migration - using existing restaurant system')
    return null
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
        .from('users')
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
        .from('users')
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
      
      // Use enhanced OrderService for restaurant orders with analytics
      const ordersData = await OrderService.getRestaurantOrdersWithAnalytics(restaurantId, {
        limit: 50,
        include_analytics: true
      })

      console.log('Orders fetched:', ordersData.orders?.length || 0)
      setOrders(ordersData.orders || [])
      
      // Update stats with analytics data if available
      if (ordersData.analytics) {
        setStats(prevStats => ({
          ...prevStats,
          totalOrders: ordersData.analytics.totalOrders,
          todayOrders: ordersData.analytics.todaysOrders,
          totalRevenue: ordersData.analytics.totalRevenue,
          todayRevenue: ordersData.analytics.todaysRevenue
        }))
      }
    } catch (error) {
      console.error('Error in fetchOrders:', error)
      setOrders([])
    }
  }

  const fetchStaff = async (restaurantId) => {
    try {
      console.log('Fetching staff for restaurant (user ID):', restaurantId)
      
      // In unified system, staff are linked directly to user ID (restaurant owner)
      // Query staff table where restaurant_id equals the user ID
      const { data: staffData, error } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Staff query error:', error)
        setStaff([])
        return
      }

      // Transform the data to flatten the structure
      const enrichedStaff = (staffData || []).map(staff => ({
        ...staff,
        full_name: staff.staff_applications?.full_name || 'Staff Member',
        email: staff.staff_applications?.email || 'No email',
        phone: staff.staff_applications?.phone || 'No phone'
      }))

      console.log('Staff fetched with application data:', enrichedStaff?.length || 0)
      console.log('Sample staff data:', enrichedStaff[0])
      setStaff(enrichedStaff || [])
    } catch (error) {
      console.error('Error in fetchStaff:', error)
      setStaff([])
    }
  }

  const fetchMenuItems = async (restaurantId) => {
    try {
      console.log('Fetching menu items for restaurant:', restaurantId)
      
      // menu_items.restaurant_id references restaurants.id
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
      
      // categories.restaurant_id references restaurants.id
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
      
      // tables.restaurant_id references restaurants.id
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
      console.log('=== Creating Staff Account (Unified Schema) ===')
      
      // Validate required fields
      if (!staffData.full_name?.trim()) {
        toast.error('Please enter staff member name')
        return
      }
      if (!staffData.email?.trim()) {
        toast.error('Please enter email address')
        return
      }
      if (!staffData.position?.trim()) {
        toast.error('Please select a position')
        return
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(staffData.email)) {
        toast.error('Please enter a valid email address')
        return
      }
      
      if (!user?.id) {
        toast.error('Restaurant owner information not available')
        return
      }
      
      // Find restaurant data from users table (consistent foreign key)
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('users')
        .select('id, restaurant_name')
        .eq('id', user.id)
        .eq('role', 'restaurant_owner')
        .maybeSingle()
      
      if (restaurantError || !restaurantData) {
        toast.error('Restaurant not found. Please complete restaurant setup first.')
        console.error('Restaurant lookup error:', restaurantError)
        return
      }
      
      console.log('Found restaurant:', restaurantData.id, restaurantData.name)
      
      // Generate secure password if not provided
      const tempPassword = staffData.password?.trim() || 
        `Staff${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`
      
      console.log('Creating staff with existing schema:', staffData.email)
      
      // Try to create auth user for login capability
      let authUserId = null
      let authCreated = false
      
      try {
        console.log('Step 1: Creating auth user account...')
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: staffData.email,
          password: tempPassword,
          options: {
            data: {
              full_name: staffData.full_name,
              phone: staffData.phone || '',
              role: 'staff',
              restaurant_id: restaurantData.id
            }
          }
        })

        if (authError) {
          console.error('Auth user creation failed:', authError)
          if (authError.message?.includes('User already registered')) {
            toast.error('This email is already registered. Please use a different email.')
            return
          }
          
          // Handle network connectivity issues
          if (authError.message?.includes('Failed to fetch') || authError.message?.includes('ERR_INTERNET_DISCONNECTED')) {
            toast.error('Network connection issue. Please check your internet connection and try again.')
            return
          }
          
          console.warn('Auth creation failed, will create staff record without login capability')
        } else if (authData?.user?.id) {
          authUserId = authData.user.id
          authCreated = true
          console.log('✅ Auth user created:', authUserId)
        }
      } catch (authCreateError) {
        console.warn('Auth user creation failed, continuing without login capability:', authCreateError)
      }

      // Step 2: Create staff record (with or without auth user link)
      console.log('Step 2: Creating staff record...')
      const staffInsertData = {
        restaurant_id: restaurantData.id,
        position: staffData.position,
        hourly_rate: parseFloat(staffData.hourly_rate) || 0,
        is_available: true,
        total_orders_completed: 0,
        total_tips_received: 0,
        performance_rating: 5.0
      }
      
      // Only add user_id if auth user was created successfully
      if (authUserId) {
        staffInsertData.user_id = authUserId
      }
      
      let { data: staffRecord, error: staffError } = await supabase
        .from('users')
        .insert(staffInsertData)
        .select('*')
        .single()

      if (staffError) {
        console.error('Staff record creation failed:', staffError)
        if (staffError.code === '23505') {
          toast.error('This staff member already exists.')
          return
        }
        if (staffError.code === '23503') {
          // Foreign key constraint - try creating staff record without user_id
          console.log('Retrying staff creation without user_id...')
          const staffInsertDataWithoutUser = {
            restaurant_id: restaurantData.id,
            position: staffData.position,
            hourly_rate: parseFloat(staffData.hourly_rate) || 0,
            is_available: true,
            total_orders_completed: 0,
            total_tips_received: 0,
            performance_rating: 5.0
          }
          
          const { data: retryStaffRecord, error: retryStaffError } = await supabase
            .from('users')
            .insert(staffInsertDataWithoutUser)
            .select('*')
            .single()
          
          if (retryStaffError) {
            throw new Error(`Failed to create staff record even without user_id: ${retryStaffError.message}`)
          }
          
          // Use the retry result
          staffRecord = retryStaffRecord
          authUserId = null
          authCreated = false
          
          toast.success('Staff record created without login capability. You can create login credentials later.')
        } else {
          throw new Error(`Failed to create staff record: ${staffError.message}`)
        }
      }

      if (!staffRecord) {
        throw new Error('Staff record creation returned null')
      }

      console.log('✅ Staff record created:', staffRecord.id)
      
      // Create display object with user data
      const newStaffMember = {
        ...staffRecord,
        full_name: staffData.full_name,
        email: staffData.email,
        phone: staffData.phone || '',
        user_id: authUserId
      }
      
      // Update local state
      setStaff(prevStaff => [...prevStaff, newStaffMember])
      
      // Show success message based on auth creation status
      if (authCreated) {
        toast.success(
          `✅ Staff Account Created Successfully!\n\n🔑 Login Credentials:\nEmail: ${staffData.email}\nPassword: ${tempPassword}\n\n👤 Staff: ${staffData.full_name}\n📍 Position: ${staffData.position}\n\n📧 Staff can now login to the system.\n\nShare these credentials with ${staffData.full_name}.`,
          {
            duration: 15000,
            style: {
              maxWidth: '500px',
              whiteSpace: 'pre-line',
              fontSize: '14px'
            }
          }
        )
      } else {
        toast.success(
          `✅ Staff Record Created!\n\n👤 Staff: ${staffData.full_name}\n📍 Position: ${staffData.position}\n\n⚠️ Note: Login account creation failed due to network issues.\nYou can create login credentials later.`,
          {
            duration: 10000,
            style: {
              maxWidth: '500px',
              whiteSpace: 'pre-line',
              fontSize: '14px'
            }
          }
        )
      }
      
      console.log('=== Staff Creation Complete ===')
      console.log('Staff ID:', staffRecord.id)
      console.log('Auth User ID:', authUserId || 'None')
      console.log('Login Available:', authCreated ? 'Yes' : 'No')
      
    } catch (error) {
      console.error('=== Staff Creation Failed ===')
      console.error('Error:', error)
      
      // Handle network connectivity issues
      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_INTERNET_DISCONNECTED')) {
        toast.error('Network connection issue. Please check your internet connection and try again.')
      } else {
        toast.error(`Failed to create staff account: ${error.message}`)
      }
    }
  }

  const handleUpdateStaff = async (staffId, updates) => {
    try {
      console.log('Updating staff:', staffId, updates)
      
      // Find the staff member
      const staffMember = staff.find(member => member.id === staffId)
      if (!staffMember) {
        throw new Error('Staff member not found')
      }
      
      // Prepare staff table updates (only fields that exist in schema)
      const staffUpdates = { ...updates }
      
      // Remove user fields that don't exist in staff table
      const userUpdates = {
        full_name: updates.full_name,
        email: updates.email,
        phone: updates.phone
      }
      delete staffUpdates.full_name
      delete staffUpdates.email
      delete staffUpdates.phone
      
      // Step 1: Update staff record in database
      const { data, error } = await supabase
        .from('users')
        .update(staffUpdates)
        .eq('id', staffId)
        .select('*')
        .single()

      if (error) {
        if (error.code === '23503') {
          // Foreign key constraint violation - remove user_id and retry
          console.log('Foreign key constraint error, retrying without user_id...')
          const staffUpdatesWithoutUserId = { ...staffUpdates }
          delete staffUpdatesWithoutUserId.user_id
          
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .update(staffUpdatesWithoutUserId)
            .eq('id', staffId)
            .select('*')
            .single()
          
          if (retryError) throw retryError
          
          toast.warning('Staff updated but login link failed. User information updated separately.')
          return retryData
        } else {
          throw error
        }
      }
      
      // Step 2: Handle user information updates
      let updatedUserId = staffMember.user_id
      
      if (userUpdates.email || userUpdates.full_name || userUpdates.phone) {
        if (staffMember.user_id) {
          // Update existing auth user
          try {
            const userMetadataUpdates = {}
            if (userUpdates.full_name) userMetadataUpdates.full_name = userUpdates.full_name
            if (userUpdates.phone) userMetadataUpdates.phone = userUpdates.phone
            
            await supabase.auth.admin.updateUserById(staffMember.user_id, {
              user_metadata: userMetadataUpdates
            })
            console.log('User metadata updated successfully')
          } catch (metadataError) {
            console.warn('Could not update user metadata:', metadataError)
          }
        } else if (userUpdates.email) {
          // Create new auth user if email is provided and no user_id exists
          try {
            console.log('Creating new auth user for existing staff member...')
            const tempPassword = `Staff${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`
            
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: userUpdates.email,
              password: tempPassword,
              options: {
                data: {
                  full_name: userUpdates.full_name || 'Staff Member',
                  phone: userUpdates.phone || '',
                  role: 'staff',
                  staff_id: staffId,
                  restaurant_id: restaurant.id
                }
              }
            })
            
            if (!authError && authData?.user?.id) {
              updatedUserId = authData.user.id
              
              // Link the auth user to staff record with error handling
              try {
                const { error: linkError } = await supabase
                  .from('users')
                  .update({ user_id: authData.user.id })
                  .eq('id', staffId)
                
                if (linkError) {
                  console.error('Failed to link auth user to staff:', linkError)
                  // Don't update the user_id if linking failed
                  updatedUserId = staffMember.user_id
                  toast.error('Staff updated but failed to create login account. Please try again.')
                } else {
                  toast.success(
                    `Staff updated and login account created!\n\nLogin Credentials:\nEmail: ${userUpdates.email}\nPassword: ${tempPassword}\n\nPlease share these credentials with the staff member.`,
                    {
                      duration: 10000,
                      style: {
                        maxWidth: '500px',
                        whiteSpace: 'pre-line'
                      }
                    }
                  )
                  console.log('New auth user created and linked to staff:', authData.user.id)
                }
              } catch (linkError) {
                console.error('Error linking auth user to staff:', linkError)
                updatedUserId = staffMember.user_id
                toast.error('Staff updated but failed to create login account. Please try again.')
              }
            } else {
              console.warn('Auth user creation failed:', authError)
              toast.warning('Staff updated but login account creation failed. You can try creating login credentials later.')
            }
          } catch (authCreateError) {
            console.warn('Could not create auth user during update:', authCreateError)
          }
        }
      }
      
      // Step 3: Create updated staff object with user data for display
      const updatedStaff = {
        ...data,
        user_id: updatedUserId,
        full_name: userUpdates.full_name || staffMember.full_name,
        email: userUpdates.email || staffMember.email,
        phone: userUpdates.phone || staffMember.phone
      }
      
      setStaff(staff.map(member => member.id === staffId ? updatedStaff : member))
      
      if (!userUpdates.email || staffMember.user_id) {
        toast.success('Staff member updated successfully')
      }
      
    } catch (error) {
      console.error('Error updating staff:', error)
      toast.error('Failed to update staff member: ' + error.message)
    }
  }

  const handleCreateLoginForStaff = async (staffId, email, fullName, phone) => {
    try {
      console.log('Creating login account for existing staff member:', staffId)
      
      const tempPassword = `Staff${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: tempPassword,
        options: {
          data: {
            full_name: fullName || 'Staff Member',
            phone: phone || '',
            role: 'staff',
            staff_id: staffId,
            restaurant_id: restaurant.id
          }
        }
      })
      
      if (!authError && authData?.user?.id) {
        // Link the auth user to staff record
        await supabase
          .from('users')
          .update({ user_id: authData.user.id })
          .eq('id', staffId)
        
        // Update the staff in state
        setStaff(staff.map(member => 
          member.id === staffId 
            ? { ...member, user_id: authData.user.id }
            : member
        ))
        
        toast.success(
          `Login account created successfully!\n\nLogin Credentials:\nEmail: ${email}\nPassword: ${tempPassword}\n\nPlease share these credentials with the staff member.`,
          {
            duration: 10000,
            style: {
              maxWidth: '500px',
              whiteSpace: 'pre-line'
            }
          }
        )
        console.log('Login account created for staff:', authData.user.id)
      } else {
        throw new Error(authError?.message || 'Failed to create login account')
      }
    } catch (error) {
      console.error('Error creating login for staff:', error)
      toast.error('Failed to create login account: ' + error.message)
    }
  }

  const handleDeleteStaff = async (staffId) => {
    try {
      console.log('Deleting staff:', staffId)
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', staffId)

      if (error) throw error
      
      setStaff(staff.filter(member => member.id !== staffId))
      toast.success('Staff member deleted successfully')
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast.error('Failed to delete staff member')
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

  // Handle table deletion
  const handleDeleteTable = async (tableId) => {
    if (!tableId) {
      toast.error('Invalid table ID')
      return
    }

    try {
      console.log('Deleting table:', tableId)
      
      const { error } = await supabase
        .from('tables')
        .delete()
        .eq('id', tableId)

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      // Update local state
      setTables(prevTables => prevTables.filter(t => t.id !== tableId))
      toast.success('Table deleted successfully')
    } catch (error) {
      console.error('Error deleting table:', error)
      toast.error('Failed to delete table: ' + (error.message || 'Unknown error'))
    }
  }

  const handleUpdateOrder = async (orderId, updates) => {
    try {
      // Use enhanced OrderService for order updates with proper validation
      if (updates.assigned_staff_id && user?.id) {
        // Manual staff assignment by owner
        await OrderService.assignOrderToStaffByOwner(orderId, updates.assigned_staff_id, user.id)
        toast.success('Order assigned to staff successfully')
      } else {
        // Other order updates
        const { error } = await supabase
          .from('orders')
          .update(updates)
          .eq('id', orderId)

        if (error) throw error
        toast.success('Order updated successfully')
      }

      if (restaurant?.id) {
        fetchOrders(restaurant.id)
      }
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error(error.message || 'Failed to update order')
    }
  }

  const handleAddMenuItem = async (itemData) => {
    try {
      if (!restaurant?.id) {
        throw new Error('Restaurant ID not available')
      }

      const insertData = { ...itemData, restaurant_id: restaurant.id }

      const { data, error } = await supabase
        .from('menu_items')
        .insert([insertData])
        .select('*, categories(*)')
        .single()

      if (error) throw error
      
      setMenuItems([...menuItems, data])
      toast.success('Menu item added successfully')
    } catch (error) {
      console.error('Error adding menu item:', error)
      toast.error('Failed to add menu item: ' + error.message)
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
        .from('users')
        .update(updatedData)
        .eq('id', restaurant.id)
        .eq('role', 'restaurant_owner')
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
      {/* Enhanced Header Component */}
      <Header 
        restaurant={restaurant}
        user={user}
        profile={profile}
        notifications={notifications}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />


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
          .notifications-dropdown,
          .profile-dropdown {
            z-index: 99999 !important;
          }
          .notifications-dropdown > div,
          .profile-dropdown > div {
            z-index: 99999 !important;
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
            onAddItem={handleAddMenuItem}
            onUpdateItem={handleUpdateMenuItem}
            onDeleteItem={handleDeleteMenuItem}
            onAddCategory={handleAddCategory}
            restaurantId={user?.id}
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
            onCreateLoginForStaff={handleCreateLoginForStaff}
            restaurant={restaurant}
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
