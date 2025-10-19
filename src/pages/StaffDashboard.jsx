import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  UserIcon,
  CurrencyRupeeIcon,
  TrophyIcon,
  BellIcon,
  PlayIcon,
  StopIcon,
  Bars3Icon,
  HomeIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  BuildingStorefrontIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  UserCircleIcon,
  ChevronDownIcon,
  SparklesIcon,
  StarIcon,
  ShoppingBagIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import useAuthStore from '../stores/useAuthStore'
import toast from 'react-hot-toast'
import StaffOrderManagement from '../components/staff/StaffOrderManagement'
import StaffPerformance from '../components/staff/StaffPerformance'
import RestaurantInfo from '../components/staff/RestaurantInfo'
import StaffRestaurantApplication from '../components/staff/StaffRestaurantApplication'

const StaffDashboard = () => {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuthStore()
  const [isOnline, setIsOnline] = useState(false)
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayEarnings: 0,
    todayTips: 0,
    rating: 5.0
  })
  const [staffData, setStaffData] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [staffSession, setStaffSession] = useState(null)
  const [restaurantInfo, setRestaurantInfo] = useState(null)

  useEffect(() => {
    const checkStaffApprovalStatus = async () => {
      if (!user?.id) return

      try {
        // Check for cached session first for instant loading
        const cachedSession = localStorage.getItem('staff_session')
        if (cachedSession) {
          try {
            const sessionData = JSON.parse(cachedSession)
            if (sessionData.user_id === user.id && sessionData.staff_id) {
              console.log('📦 Using cached session data for instant loading')
              setStaffSession(sessionData)
              setRestaurantInfo({
                id: sessionData.restaurant_id,
                name: sessionData.restaurant_name
              })
              setLoading(false)
              
              // Load stats in background
              loadStaffStats(sessionData.staff_id)
              return
            }
          } catch (error) {
            localStorage.removeItem('staff_session')
          }
        }

        console.log('🔍 Fetching fresh staff data...')
        
        // Parallel fetch for better performance
        const [staffResult, applicationResult] = await Promise.all([
          supabase
            .from('staff')
            .select('id, position, restaurant_id, restaurants(id, name), approved_at')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('staff_applications')
            .select('id, status, restaurant_id, restaurants(id, name)')
            .eq('user_id', user.id)
            .order('applied_at', { ascending: false })
            .maybeSingle()
        ])

        const { data: staffData, error: staffError } = staffResult
        const { data: applicationData, error: appError } = applicationResult

        if (!staffError && staffData?.approved_at) {
          console.log('✅ Staff approved - loading dashboard')
          const sessionData = {
            staff_id: staffData.id,
            user_id: user.id,
            restaurant_id: staffData.restaurant_id,
            position: staffData.position,
            full_name: user.full_name || 'Staff Member',
            email: user.email,
            phone: user.phone || '',
            restaurant_name: staffData.restaurants?.name || 'Restaurant'
          }

          setStaffSession(sessionData)
          setRestaurantInfo({
            id: staffData.restaurant_id,
            name: staffData.restaurants?.name
          })
          localStorage.setItem('staff_session', JSON.stringify(sessionData))
          
          // Load stats in parallel
          loadStaffStats(staffData.id)
        } else if (!appError && applicationData) {
          console.log(`📋 Application status: ${applicationData.status}`)
          setApplicationStatus(applicationData.status)
          setStaffSession({ 
            status: applicationData.status,
            restaurant_name: applicationData.restaurants?.name 
          })
        } else {
          console.log('❌ No staff record or application found')
          setStaffSession({ status: 'no_application' })
        }
      } catch (error) {
        console.error('❌ Error loading staff data:', error)
        toast.error('Failed to load staff information')
      } finally {
        setLoading(false)
      }
    }

    checkStaffApprovalStatus()
  }, [user])

  useEffect(() => {
    // Set up real-time subscription for new orders
    if (profile?.restaurant_id) {
      const subscription = supabase
        .channel('new-orders')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'orders',
            filter: `restaurant_id=eq.${profile.restaurant_id}`
          }, 
          (payload) => {
            if (payload.new.status === 'pending') {
              toast.success('New order available!')
              fetchOrders(profile.restaurant_id)
            }
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [profile])

  const loadStaffStats = async (staffId) => {
    if (!staffId) return

    try {
      console.log('📊 Loading staff stats for:', staffId)
      
      const today = new Date().toISOString().split('T')[0]
      
      // Parallel fetch for better performance
      const [ordersResult, reviewsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('total_amount, tip_amount')
          .eq('assigned_staff_id', staffId)
          .gte('created_at', `${today}T00:00:00`)
          .eq('status', 'delivered'),
        supabase
          .from('reviews')
          .select('rating')
          .eq('staff_id', staffId)
      ])

      const { data: todayOrdersData } = ordersResult
      const { data: reviewsData } = reviewsResult

      const todayOrders = todayOrdersData?.length || 0
      const todayEarnings = todayOrdersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const todayTips = todayOrdersData?.reduce((sum, order) => sum + (order.tip_amount || 0), 0) || 0

      const avgRating = reviewsData?.length > 0 
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length 
        : 5.0

      setStats({
        todayOrders,
        todayEarnings: Math.round(todayEarnings),
        todayTips: Math.round(todayTips),
        rating: Number(avgRating.toFixed(1))
      })

      console.log('📊 Stats loaded successfully')
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const checkOnlineStatus = async (staffId) => {
    try {
      const { data } = await supabase
        .from('staff')
        .select('is_available')
        .eq('id', staffId || user?.id)
        .single()

      setIsOnline(data?.is_available || false)
    } catch (error) {
      console.error('Error checking online status:', error)
    }
  }

  const handleLogout = async () => {
    try {
      // Update staff status to offline
      if (staffSession?.staff_id) {
        await supabase
          .from('staff')
          .update({ is_available: false })
          .eq('id', staffSession.staff_id)
      }
      localStorage.removeItem('staff_session')
      await signOut()
      navigate('/auth')
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: HomeIcon },
    { id: 'orders', name: 'Orders', icon: ShoppingBagIcon },
    { id: 'performance', name: 'Performance', icon: TrophyIcon },
    { id: 'restaurant', name: 'Restaurant', icon: BuildingStorefrontIcon }
  ]

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline
      const updates = {
        is_available: newStatus,
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', staffSession?.staff_id || user?.id)

      if (error) throw error

      setIsOnline(newStatus)
      toast.success(newStatus ? '🟢 You are now online!' : '🔴 You are now offline')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const renderContent = () => {
    // Handle different application states
    if (staffSession?.status === 'pending') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClockIcon className="h-10 w-10 text-yellow-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Application Under Review</h3>
            <p className="text-gray-600 mb-8 text-lg">
              Your application is being reviewed by the restaurant management.
            </p>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
              <p className="text-yellow-800 font-medium">
                🕐 You'll receive a notification once your application is approved.
              </p>
            </div>
          </div>
        </motion.div>
      )
    }

    if (staffSession?.status === 'rejected') {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircleIcon className="h-10 w-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Application Not Approved</h3>
            <p className="text-gray-600 mb-8 text-lg">
              Unfortunately, your application was not approved at this time.
            </p>
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 mb-8">
              <p className="text-red-800 font-medium">
                💬 You may contact the restaurant directly for more information.
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium"
            >
              Back to Login
            </motion.button>
          </div>
        </motion.div>
      )
    }

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Today's Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.todayOrders}</p>
                    <p className="text-xs text-green-600 font-medium">+12% from yesterday</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <ShoppingBagIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Today's Earnings</p>
                    <p className="text-3xl font-bold text-gray-900">₹{stats.todayEarnings}</p>
                    <p className="text-xs text-green-600 font-medium">+8% from yesterday</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <CurrencyRupeeIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Tips Earned</p>
                    <p className="text-3xl font-bold text-gray-900">₹{stats.todayTips}</p>
                    <p className="text-xs text-green-600 font-medium">+15% from yesterday</p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <SparklesIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Rating</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.rating}/5</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`h-3 w-3 ${
                            i < Math.floor(stats.rating)
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <TrophyIcon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <SparklesIcon className="h-6 w-6 text-orange-500" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleOnlineStatus}
                  className={`flex flex-col items-center justify-center gap-4 p-6 rounded-xl border-2 transition-all duration-200 ${
                    isOnline
                      ? 'border-red-200 bg-gradient-to-br from-red-50 to-red-100 text-red-700 hover:border-red-300'
                      : 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 text-green-700 hover:border-green-300'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isOnline ? 'bg-red-200' : 'bg-green-200'
                  }`}>
                    {isOnline ? (
                      <StopIcon className="h-6 w-6" />
                    ) : (
                      <PlayIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">
                      {isOnline ? 'Go Offline' : 'Go Online'}
                    </p>
                    <p className="text-sm opacity-75">
                      {isOnline ? 'Stop receiving orders' : 'Start receiving orders'}
                    </p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('orders')}
                  className="flex flex-col items-center justify-center gap-4 p-6 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 hover:border-blue-300 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <ShoppingBagIcon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">Manage Orders</p>
                    <p className="text-sm opacity-75">View and update orders</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('performance')}
                  className="flex flex-col items-center justify-center gap-4 p-6 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 hover:border-purple-300 transition-all duration-200"
                >
                  <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                    <ChartBarIcon className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-lg">View Performance</p>
                    <p className="text-sm opacity-75">Check your stats</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Current Status</h3>
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${
                      isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-lg font-medium text-gray-700">
                      You are {isOnline ? 'online and ready for orders' : 'offline'}
                    </span>
                  </div>
                  <p className="text-gray-500 mt-1">
                    Working at <span className="font-medium text-orange-600">{restaurantInfo?.name}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Position</p>
                  <p className="text-lg font-semibold text-gray-900">{staffSession?.position}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )

      case 'orders':
        return <StaffOrderManagement staffId={staffSession?.staff_id} />

      case 'performance':
        return <StaffPerformance staffId={staffSession?.staff_id} />

      case 'restaurant':
        return <RestaurantInfo restaurantId={staffSession?.restaurant_id} />

      default:
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <UserIcon className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Staff Portal</h3>
            <p className="text-gray-600 text-lg">Select a tab to get started</p>
          </motion.div>
        )
    }
  }

  const renderPendingStatus = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClockIcon className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Application Pending</h2>
          
          <div className="space-y-3 mb-6">
            <p className="text-gray-600">
              Your staff application to <strong>{staffSession?.restaurant_name}</strong> is being reviewed.
            </p>
            <p className="text-sm text-gray-500">
              Applied on {new Date(staffSession?.applied_at).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <BellIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-yellow-800">What happens next?</p>
                <p className="text-sm text-yellow-700 mt-1">
                  The restaurant manager will review your application and notify you via email once approved.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Check Status
            </button>
            <button
              onClick={handleLogout}
              className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  const renderRejectedStatus = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Rejection Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto text-center mb-8"
          >
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircleIcon className="w-8 h-8 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Application Rejected
            </h2>
            
            <p className="text-gray-600 mb-6">
              Your application to <span className="font-semibold">{staffSession?.restaurant_name}</span> was not approved. You can apply to other restaurants below.
            </p>
            
            {staffSession?.reviewed_at && (
              <p className="text-sm text-gray-500 mb-4">
                Reviewed on {new Date(staffSession.reviewed_at).toLocaleDateString()}
              </p>
            )}
          </motion.div>

          {/* New Application Form */}
          <StaffRestaurantApplication 
            user={user} 
            onApplicationSubmitted={() => {
              // Refresh the status after application is submitted
              setTimeout(() => {
                checkStaffApprovalStatus()
              }, 1000)
            }}
          />

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6"
          >
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Logout
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  const renderNoApplicationStatus = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.full_name || 'Staff Member'}!</h1>
            <p className="text-gray-600">
              Apply to a restaurant to start working
            </p>
          </motion.div>

          {/* Application Form */}
          <StaffRestaurantApplication 
            user={user} 
            onApplicationSubmitted={() => {
              // Refresh the status after application is submitted
              setTimeout(() => {
                checkStaffApprovalStatus()
              }, 1000)
            }}
          />

          {/* Logout Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-6"
          >
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
              Logout
            </button>
          </motion.div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium text-lg mb-2">Loading Staff Dashboard...</p>
          <p className="text-gray-500 text-sm">Checking your access permissions...</p>
        </div>
      </div>
    )
  }

  if (!staffSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <UserIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Session not found</h3>
          <p className="text-gray-500 mb-4">Please log in again to access your dashboard</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 pb-20">
      {/* Top Header Bar */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">QR</span>
            </div>
            <div>
              <h1 className="text-lg font-bold">{restaurantInfo?.name || 'Staff Portal'}</h1>
              <p className="text-xs text-white/80">{staffSession?.position}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"
            >
              <BellIcon className="h-5 w-5" />
            </motion.button>
            
            {/* Profile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2"
            >
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                <span className="text-orange-500 text-sm font-bold">
                  {staffSession?.full_name?.charAt(0) || 'S'}
                </span>
              </div>
              <ChevronDownIcon className="h-4 w-4" />
            </motion.button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {showProfileDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-16 right-4 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{staffSession?.full_name}</p>
                    <p className="text-sm text-gray-500">{staffSession?.email}</p>
                    <p className="text-sm text-orange-600 font-medium">{staffSession?.position}</p>
                  </div>
                  
                  <div className="px-4 py-2">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${
                        isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm text-gray-700">
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={toggleOnlineStatus}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-2 ${
                        isOnline
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {isOnline ? (
                        <StopIcon className="h-4 w-4" />
                      ) : (
                        <PlayIcon className="h-4 w-4" />
                      )}
                      {isOnline ? 'Go Offline' : 'Go Online'}
                    </motion.button>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              {tabs.find(tab => tab.id === activeTab)?.name || 'Overview'}
            </h1>
            <p className="text-gray-600">
              Welcome back, <span className="font-medium text-orange-600">{staffSession?.full_name}</span>
            </p>
          </motion.div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-orange-500 bg-orange-50'
                  : 'text-gray-500 hover:text-orange-400 hover:bg-gray-50'
              }`}
            >
              <tab.icon className={`h-6 w-6 ${
                activeTab === tab.id ? 'text-orange-500' : 'text-gray-400'
              }`} />
              <span className="text-xs font-medium">{tab.name}</span>
            </motion.button>
          ))}
          
          {/* Staff Tab (Active indicator) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center justify-center gap-1 text-orange-500 bg-orange-50"
          >
            <UserIcon className="h-6 w-6 text-orange-500" />
            <span className="text-xs font-medium">Staff</span>
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
