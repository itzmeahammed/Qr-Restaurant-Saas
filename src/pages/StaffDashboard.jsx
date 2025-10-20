import React, { useState, useEffect, useRef } from 'react'
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
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  PlayIcon,
  StopIcon,
  StarIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  Cog6ToothIcon,
  HomeIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import useAuthStore from '../stores/useAuthStore'
import toast from 'react-hot-toast'
import StaffOrderManagement from '../components/staff/StaffOrderManagement'
import StaffPerformance from '../components/staff/StaffPerformance'
import RestaurantInfo from '../components/staff/RestaurantInfo'
import StaffRestaurantApplication from '../components/staff/StaffRestaurantApplication'
import StaffOverview from '../components/staff/StaffOverview'
import StaffMenuView from '../components/staff/StaffMenuView'

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
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [staffSession, setStaffSession] = useState(null)
  const [restaurantInfo, setRestaurantInfo] = useState(null)
  
  // Refs for click-outside handling
  const profileDropdownRef = useRef(null)
  const notificationsDropdownRef = useRef(null)

  // Handle click outside 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false)
      }
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }

    if (showProfileDropdown || showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileDropdown, showNotifications])

  // Load order notifications
  const loadOrderNotifications = async (staffId) => {
    try {
      // Get recent orders assigned to this staff member
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          created_at,
          users (full_name)
        `)
        .eq('assigned_staff_id', staffId)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
        .order('created_at', { ascending: false })
        .limit(10)

      if (!error && orders) {
        const notificationList = orders.map(order => ({
          id: order.id,
          type: 'order',
          title: `New Order #${order.id.slice(-6)}`,
          message: `Order from ${order.users?.full_name || 'Customer'} - ₹${order.total_amount}`,
          time: new Date(order.created_at).toLocaleTimeString(),
          status: order.status,
          isRead: false
        }))
        
        setNotifications(notificationList)
        setUnreadNotifications(notificationList.filter(n => !n.isRead).length)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

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
              
              // Load stats and notifications in background
              loadStaffStats(sessionData.staff_id)
              loadOrderNotifications(sessionData.staff_id)
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

        if (!staffError && staffData?.data) {
          console.log('✅ Staff approved, loading dashboard...')
          setStaffData(staffData.data)
          setRestaurant(staffData.data.restaurants)
          
          // Cache session for faster subsequent loads
          const sessionData = {
            user_id: user.id,
            staff_id: staffData.data.id,
            restaurant_id: staffData.data.restaurant_id,
            restaurant_name: staffData.data.restaurants?.name,
            full_name: user.user_metadata?.full_name,
            email: user.email,
            position: staffData.data.position,
            cached_at: Date.now()
          }
          
          localStorage.setItem('staff_session', JSON.stringify(sessionData))
          setStaffSession(sessionData)
          setRestaurantInfo({
            id: staffData.data.restaurant_id,
            name: staffData.data.restaurants?.name
          })
          
          // Load performance stats and notifications
          await loadStaffStats(staffData.data.id)
          await loadOrderNotifications(staffData.data.id)
          await checkOnlineStatus(staffData.data.id)
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
      
      // First, get today's orders for this staff member
      const { data: todayOrdersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, tip_amount')
        .eq('assigned_staff_id', staffId)
        .gte('created_at', `${today}T00:00:00`)
        .eq('status', 'delivered')

      if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        return
      }

      // Calculate basic stats from orders
      const todayOrders = todayOrdersData?.length || 0
      const todayEarnings = todayOrdersData?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const todayTips = todayOrdersData?.reduce((sum, order) => sum + (order.tip_amount || 0), 0) || 0

      // Get reviews for this staff member's orders (if any orders exist)
      let avgRating = 5.0
      if (todayOrdersData && todayOrdersData.length > 0) {
        const orderIds = todayOrdersData.map(order => order.id)
        
        const { data: reviewsData, error: reviewsError } = await supabase
          .from('reviews')
          .select('overall_rating')
          .in('order_id', orderIds)

        if (!reviewsError && reviewsData?.length > 0) {
          avgRating = reviewsData.reduce((sum, review) => sum + (review.overall_rating || 5), 0) / reviewsData.length
        }
      }

      setStats({
        todayOrders,
        todayEarnings: Math.round(todayEarnings),
        todayTips: Math.round(todayTips),
        rating: Number(avgRating.toFixed(1))
      })

      console.log('📊 Stats loaded successfully:', {
        todayOrders,
        todayEarnings: Math.round(todayEarnings),
        todayTips: Math.round(todayTips),
        rating: Number(avgRating.toFixed(1))
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      // Set default stats on error
      setStats({
        todayOrders: 0,
        todayEarnings: 0,
        todayTips: 0,
        rating: 5.0
      })
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



// Define tabs
  const tabs = [
    { id: 'overview', name: 'Overview', icon: HomeIcon },
    { id: 'orders', name: 'Orders', icon: ShoppingBagIcon },
    { id: 'menu', name: 'Menu', icon: BookOpenIcon },
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
      console.error('Error updating status:', error)
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
          <StaffOverview 
            stats={stats}
            isOnline={isOnline}
            toggleOnlineStatus={toggleOnlineStatus}
            setActiveTab={setActiveTab}
            restaurantInfo={restaurantInfo}
            staffSession={staffSession}
          />
        )

      case 'orders':
        return (
          <StaffOrderManagement 
            staffId={staffSession?.staff_id} 
            restaurantId={staffSession?.restaurant_id}
            isOnline={isOnline}
          />
        )

      case 'menu':
        return <StaffMenuView restaurantId={staffSession?.restaurant_id} />

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Fixed Top Header Bar */}
      <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3 z-40 shadow-lg">
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
            {/* Enhanced Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30 hover:bg-white/30 transition-all duration-200"
              >
                <BellIcon className="h-5 w-5 text-white" />
                {unreadNotifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </motion.span>
                )}
              </motion.button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    ref={notificationsDropdownRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="fixed top-20 left-4 right-4 sm:absolute sm:top-12 sm:left-auto sm:right-0 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 py-2 z-[9999] max-h-96 overflow-y-auto"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-gray-900">🔔 Notifications</h3>
                        {unreadNotifications > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-bold">
                            {unreadNotifications} new
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notification, index) => (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-l-4 ${
                              notification.isRead ? 'border-gray-200' : 'border-orange-400 bg-orange-50/30'
                            }`}
                            onClick={() => {
                              // Mark as read
                              const updatedNotifications = notifications.map(n => 
                                n.id === notification.id ? { ...n, isRead: true } : n
                              )
                              setNotifications(updatedNotifications)
                              setUnreadNotifications(updatedNotifications.filter(n => !n.isRead).length)
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                notification.status === 'pending' ? 'bg-yellow-100' :
                                notification.status === 'preparing' ? 'bg-blue-100' :
                                notification.status === 'ready' ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                                {notification.status === 'pending' ? '⏳' :
                                 notification.status === 'preparing' ? '👨‍🍳' :
                                 notification.status === 'ready' ? '✅' : '📋'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">{notification.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <BellIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-sm">No notifications yet</p>
                        </div>
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-100">
                        <button
                          onClick={() => {
                            const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }))
                            setNotifications(updatedNotifications)
                            setUnreadNotifications(0)
                          }}
                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Enhanced Profile */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/30 hover:bg-white/30 transition-all duration-200"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-100 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-orange-500 text-sm font-bold">
                      {staffSession?.full_name?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-white text-sm font-medium">{staffSession?.full_name || 'Staff Member'}</p>
                  <p className="text-white/80 text-xs">{staffSession?.position || 'Staff'}</p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-white" />
              </motion.button>

              {/* Enhanced Profile Dropdown */}
              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    ref={profileDropdownRef}
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute top-12 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-[9999]"
                    style={{ zIndex: 9999 }}
                  >
                    {/* Profile Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-4 text-white">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/30">
                            <span className="text-white text-lg font-bold">
                              {staffSession?.full_name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-white">{staffSession?.full_name || 'Staff Member'}</p>
                          <p className="text-white/90 text-sm">{staffSession?.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-white/20 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                              {staffSession?.position || 'Staff'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              isOnline ? 'bg-green-500/20 text-green-100' : 'bg-gray-500/20 text-gray-200'
                            }`}>
                              {isOnline ? '🟢 Online' : '⚫ Offline'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="px-4 py-3 bg-gray-50">
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div>
                          <p className="text-lg font-bold text-orange-600">{stats.todayOrders}</p>
                          <p className="text-xs text-gray-600">Orders</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-600">₹{stats.todayEarnings}</p>
                          <p className="text-xs text-gray-600">Earnings</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-yellow-600">{stats.rating}★</p>
                          <p className="text-xs text-gray-600">Rating</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="px-4 py-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={toggleOnlineStatus}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 mb-3 ${
                          isOnline
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 hover:shadow-lg'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 hover:shadow-lg'
                        }`}
                      >
                        {isOnline ? (
                          <>
                            <StopIcon className="h-4 w-4" />
                            Go Offline
                          </>
                        ) : (
                          <>
                            <PlayIcon className="h-4 w-4" />
                            Go Online
                          </>
                        )}
                      </motion.button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                          Settings
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleLogout}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          <ArrowRightOnRectangleIcon className="h-4 w-4" />
                          Sign Out
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with top padding for fixed header */}
      <div className="px-4 py-6 pt-20">
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
              {activeTab === 'overview' && `Welcome back, ${staffSession?.full_name || 'Staff Member'}`}
              {activeTab === 'orders' && 'Manage your assigned orders'}
              {activeTab === 'menu' && 'View restaurant menu items'}
              {activeTab === 'performance' && 'Track your performance metrics'}
              {activeTab === 'restaurant' && 'Restaurant information and details'}
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
              <tab.icon className={`h-5 w-5 ${
                activeTab === tab.id ? 'text-orange-500' : 'text-gray-400'
              }`} />
              <span className="text-xs font-medium">{tab.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StaffDashboard
