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
  XMarkIcon
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
import { useAuthStore } from '../store/authStore'
import StaffTab from '../components/dashboard/StaffTab'
import MenuTab from '../components/dashboard/MenuTab'
import OrdersTab from '../components/dashboard/OrdersTab'
import TablesTab from '../components/dashboard/TablesTab'
import AnalyticsTab from '../components/dashboard/AnalyticsTab'
import toast from 'react-hot-toast'

const OwnerDashboard = () => {
  const { user, profile, signOut, loading: authLoading } = useAuthStore()
  const navigate = useNavigate()
  
  // Debug auth state
  console.log('=== OwnerDashboard Render ====')
  console.log('Auth loading:', authLoading)
  console.log('User:', user)
  console.log('Profile:', profile)
  
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

  // Handle logout function
  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

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
    
    // Prevent multiple calls if restaurant is already loaded
    if (restaurant) {
      console.log('Restaurant already loaded, skipping setup check')
      return
    }
    
    // Database is now set up - using real API calls
    // User is available, proceed with restaurant setup check
    console.log('User available, checking restaurant setup')
    checkRestaurantSetup()
  }, [authLoading, user, navigate, profile, restaurant])

  const checkRestaurantSetup = async () => {
    console.log('=== checkRestaurantSetup called =====')
    console.log('User object:', user)
    console.log('Profile object:', profile)
    
    if (!user?.id) {
      console.log('No user ID found, redirecting to login')
      navigate('/login')
      return
    }

    try {
      setLoading(true)
      
      // Check if user has a restaurant
      console.log('Checking for existing restaurant...')
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .eq('role', 'restaurant_owner')
        .single()

      if (restaurantError && restaurantError.code !== 'PGRST116') {
        console.error('Error fetching restaurant:', restaurantError)
        throw restaurantError
      }

      if (!restaurantData) {
        console.log('No restaurant found, redirecting to setup')
        navigate('/restaurant-setup')
        return
      }

      console.log('Restaurant found:', restaurantData)
      setRestaurant(restaurantData)
      
      // Load dashboard data
      await Promise.all([
        fetchStats(restaurantData.id),
        fetchOrders(restaurantData.id),
        fetchStaff(restaurantData.id),
        fetchMenuItems(restaurantData.id),
        fetchTables(restaurantData.id),
        fetchNotifications(restaurantData.id)
      ])
      
    } catch (error) {
      console.error('Error in checkRestaurantSetup:', error)
      toast.error('Failed to load restaurant data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch functions (simplified for brevity)
  const fetchStats = async (restaurantId) => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('restaurant_id', restaurantId)

      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const totalOrders = orders?.length || 0

      const today = new Date().toISOString().split('T')[0]
      const todayOrders = orders?.filter(order => order.created_at?.startsWith(today)) || []
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)

      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)

      setStats({
        totalRevenue,
        totalOrders,
        activeStaff: staffData?.length || 0,
        avgRating: 4.5,
        todayRevenue,
        todayOrders: todayOrders.length
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchOrders = async (restaurantId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    }
  }

  const fetchStaff = async (restaurantId) => {
    try {
      const { data: staffData, error } = await supabase
        .from('staff')
        .select('*')
        .eq('restaurant_id', restaurantId)

      if (error) throw error

      // Enrich staff data with auth user information
      const enrichedStaff = await Promise.all(
        (staffData || []).map(async (staffMember) => {
          if (staffMember.user_id) {
            try {
              const { data: userData } = await supabase.auth.admin.getUserById(staffMember.user_id)
              return {
                ...staffMember,
                full_name: userData.user?.user_metadata?.full_name || 'Staff Member',
                email: userData.user?.email || 'No email',
                phone: userData.user?.user_metadata?.phone || 'No phone'
              }
            } catch (authError) {
              console.warn('Could not fetch auth data for staff:', authError)
              return {
                ...staffMember,
                full_name: 'Staff Member',
                email: 'No email',
                phone: 'No phone'
              }
            }
          }
          return {
            ...staffMember,
            full_name: 'Staff Member',
            email: 'No email',
            phone: 'No phone'
          }
        })
      )

      setStaff(enrichedStaff)
    } catch (error) {
      console.error('Error fetching staff:', error)
      setStaff([])
    }
  }

  const fetchMenuItems = async (restaurantId) => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)

      if (error) throw error
      setMenuItems(data || [])
    } catch (error) {
      console.error('Error fetching menu items:', error)
      setMenuItems([])
    }
  }

  const fetchTables = async (restaurantId) => {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)

      if (error) throw error
      setTables(data || [])
    } catch (error) {
      console.error('Error fetching tables:', error)
      setTables([])
    }
  }

  const fetchNotifications = async (restaurantId) => {
    try {
      // Fetch recent orders for notifications
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('id, order_number, status, created_at, customer_name, total_amount')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      const notifications = []
      
      // Add order notifications
      recentOrders?.forEach(order => {
        const timeAgo = new Date(order.created_at).toLocaleTimeString()
        notifications.push({
          id: `order_${order.id}`,
          message: `New order #${order.order_number} from ${order.customer_name || 'Customer'}`,
          type: order.status === 'pending' ? 'info' : 'success',
          time: timeAgo
        })
      })
      
      setNotifications(notifications.slice(0, 5))
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setNotifications([])
    }
  }

  // Staff management functions
  const handleAddStaff = async (staffData) => {
    try {
      console.log('Creating staff record:', staffData)
      
      // Validate required fields
      if (!staffData.full_name || !staffData.email || !staffData.position) {
        toast.error('Please fill in all required fields (Name, Email, Position)')
        return
      }
      
      if (!restaurant?.id) {
        toast.error('Restaurant information not available')
        return
      }
      
      // Use provided password or generate a secure one
      const tempPassword = staffData.password || `Staff${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`
      
      // Step 1: Create staff record in database
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
        .select()
        .single()

      if (staffError) {
        console.error('Error creating staff record:', staffError)
        throw staffError
      }

      console.log('Staff record created:', staffRecord)

      // Step 2: Try to create auth user
      let authUserId = null
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: staffData.email,
          password: tempPassword,
          options: {
            data: {
              full_name: staffData.full_name,
              phone: staffData.phone,
              role: 'staff',
              staff_id: staffRecord.id,
              restaurant_id: restaurant.id
            }
          }
        })

        if (authError) throw authError
        authUserId = authData.user?.id
        console.log('Auth user created:', authUserId)

        // Step 3: Link auth user to staff record
        if (authUserId) {
          const { error: linkError } = await supabase
            .from('staff')
            .update({ user_id: authUserId })
            .eq('id', staffRecord.id)

          if (linkError) {
            console.error('Error linking auth user:', linkError)
          } else {
            console.log('Auth user linked to staff record')
          }
        }
      } catch (authCreateError) {
        console.warn('Could not create auth user:', authCreateError)
      }

      // Step 4: Create display object with user data
      const newStaffMember = {
        ...staffRecord,
        full_name: staffData.full_name,
        email: staffData.email,
        phone: staffData.phone,
        user_id: authUserId
      }
      
      setStaff([...staff, newStaffMember])
      
      // Show success message with login credentials
      const loginMessage = authUserId 
        ? `Staff account created successfully!\n\nLogin Credentials:\nEmail: ${staffData.email}\nPassword: ${tempPassword}\n\nThe staff member can now login to the system.`
        : `Staff record created successfully!\n\nStaff Details:\nName: ${staffData.full_name}\nEmail: ${staffData.email}\nPosition: ${staffData.position}\n\nNote: Login account creation failed, but staff can be managed from dashboard.`
      
      toast.success(loginMessage, {
        duration: 12000,
        style: {
          maxWidth: '500px',
          whiteSpace: 'pre-line'
        }
      })
      
    } catch (error) {
      console.error('Error in handleAddStaff:', error)
      toast.error('Failed to create staff member')
    }
  }

  const handleUpdateStaff = async (staffId, updates) => {
    try {
      const staffMember = staff.find(s => s.id === staffId)
      if (!staffMember) return

      // Update staff table
      const { error: staffError } = await supabase
        .from('staff')
        .update({
          position: updates.position,
          hourly_rate: parseFloat(updates.hourly_rate) || 0
        })
        .eq('id', staffId)

      if (staffError) throw staffError

      // Update auth metadata if user_id exists
      if (staffMember.user_id && (updates.full_name || updates.phone)) {
        try {
          await supabase.auth.admin.updateUserById(staffMember.user_id, {
            user_metadata: {
              full_name: updates.full_name,
              phone: updates.phone
            }
          })
        } catch (authError) {
          console.warn('Could not update auth metadata:', authError)
        }
      }

      // Update local state
      setStaff(staff.map(s => s.id === staffId ? { ...s, ...updates } : s))
      toast.success('Staff member updated successfully')
    } catch (error) {
      console.error('Error updating staff:', error)
      toast.error('Failed to update staff member')
    }
  }

  const handleDeleteStaff = async (staffId) => {
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId)

      if (error) throw error

      setStaff(staff.filter(s => s.id !== staffId))
      toast.success('Staff member removed successfully')
    } catch (error) {
      console.error('Error deleting staff:', error)
      toast.error('Failed to remove staff member')
    }
  }

  const handleCreateLoginForStaff = async (staffId, email, fullName, phone) => {
    try {
      const tempPassword = `Staff${Math.random().toString(36).slice(-8)}${Date.now().toString().slice(-4)}`
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            full_name: fullName,
            phone,
            role: 'staff',
            staff_id: staffId,
            restaurant_id: restaurant.id
          }
        }
      })

      if (authError) throw authError

      // Link auth user to staff record
      const { error: linkError } = await supabase
        .from('staff')
        .update({ user_id: authData.user.id })
        .eq('id', staffId)

      if (linkError) throw linkError

      // Update local state
      setStaff(staff.map(s => s.id === staffId ? { ...s, user_id: authData.user.id, email } : s))

      toast.success(`Login account created!\n\nCredentials:\nEmail: ${email}\nPassword: ${tempPassword}`, {
        duration: 10000,
        style: { whiteSpace: 'pre-line' }
      })
    } catch (error) {
      console.error('Error creating login for staff:', error)
      toast.error('Failed to create login account')
    }
  }

  // Show loading if auth is still loading or dashboard is loading
  if (authLoading || loading) {
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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'orders', name: 'Orders', icon: ShoppingBagIcon },
    { id: 'menu', name: 'Menu', icon: PlusIcon },
    { id: 'staff', name: 'Staff', icon: UsersIcon },
    { id: 'tables', name: 'Tables', icon: QrCodeIcon },
    { id: 'analytics', name: 'Analytics', icon: TrendingUpIcon }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersTab orders={orders} />
      case 'menu':
        return <MenuTab menuItems={menuItems} categories={categories} />
      case 'staff':
        return (
          <StaffTab 
            staff={staff}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
            onCreateLoginForStaff={handleCreateLoginForStaff}
          />
        )
      case 'tables':
        return <TablesTab tables={tables} />
      case 'analytics':
        return <AnalyticsTab stats={stats} revenueData={revenueData} />
      default:
        return (
          <div className="space-y-6">
            {/* Overview Dashboard Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CurrencyRupeeIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <UsersIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Staff</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeStaff}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <StarIcon className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
    }
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
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                >
                  <tab.icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mb-20 md:mb-0">
          {renderTabContent()}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-40">
        <div className="flex justify-around">
          {tabs.slice(0, 5).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors relative ${
                activeTab === tab.id ? 'text-orange-500' : 'text-gray-400'
              }`}
            >
              <tab.icon className="h-6 w-6" />
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
