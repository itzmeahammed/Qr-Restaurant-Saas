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
  BookOpenIcon,
  TableCellsIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import useAuthStore from '../stores/useAuthStore'
import toast from 'react-hot-toast'
import StaffOrderManagement from '../components/staff/StaffOrderManagement'
// import StaffPerformance from '../components/staff/StaffPerformance' // REMOVED
import RestaurantInfo from '../components/staff/RestaurantInfo'
import StaffRestaurantApplication from '../components/staff/StaffRestaurantApplication'
import StaffOverview from '../components/staff/StaffOverview'
import StaffMenuView from '../components/staff/StaffMenuView'
import StaffTableSelection from '../components/staff/StaffTableSelection'
import StaffOrderingFlow from '../components/staff/StaffOrderingFlow'

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
  const [showOrderingFlow, setShowOrderingFlow] = useState(false)
  
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



  // Toggle online status with database persistence
  const toggleOnlineStatus = async () => {
    if (!user?.id) {
      toast.error('User data not available')
      return
    }

    try {
      const newOnlineStatus = !isOnline
      
      // Update database first
      const { error } = await supabase
        .from('users')
        .update({ 
          is_available: newOnlineStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      // Update local state only after successful database update
      setIsOnline(newOnlineStatus)
      
      // Show success message
      toast.success(
        newOnlineStatus ? 'You are now online and ready to receive orders!' : 'You are now offline',
        {
          icon: newOnlineStatus ? '🟢' : '🔴',
          duration: 3000
        }
      )

      console.log(`✅ Staff ${newOnlineStatus ? 'online' : 'offline'} status updated`)
      
    } catch (error) {
      console.error('❌ Error updating online status:', error)
      toast.error('Failed to update online status: ' + error.message)
    }
  }

  // Load staff online status from database
  const loadStaffOnlineStatus = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_available')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setIsOnline(data.is_available || false)
        console.log('📱 Loaded staff online status:', data.is_available)
      }
    } catch (error) {
      console.error('❌ Error loading online status:', error)
      // Default to offline if there's an error
      setIsOnline(false)
    }
  }

  // Move checkStaffApprovalStatus outside useEffect so it can be called from callbacks
  const checkStaffApprovalStatus = async () => {
    if (!user?.id) return

    try {
      console.log('🔍 Checking staff approval status for user:', user.id)
      console.log('👤 Current user data:', { 
        id: user.id, 
        role: user.role, 
        restaurant_id: user.restaurant_id,
        approved_at: user.approved_at 
      })

      // Fetch fresh user data from database to check approval status
      const { data: freshUserData, error: userError } = await supabase
        .from('users')
        .select('id, role, restaurant_id, approved_at, approved_by, position, hourly_rate, full_name')
        .eq('id', user.id)
        .single()

      if (userError) {
        console.error('❌ Error fetching fresh user data:', userError)
        toast.error('Failed to load user information')
        setLoading(false)
        return
      }

      console.log('📊 Fresh user data from database:', freshUserData)

      // Check if staff is approved (has restaurant_id and approved_at)
      if (freshUserData.role === 'staff' && freshUserData.restaurant_id && freshUserData.approved_at) {
        console.log('✅ Staff is approved, loading dashboard...')
        
        // Get restaurant information
        const { data: restaurantOwner, error: restaurantError } = await supabase
          .from('users')
          .select('restaurant_name, full_name')
          .eq('id', freshUserData.restaurant_id)
          .eq('role', 'restaurant_owner')
          .single()

        if (restaurantError) {
          console.error('❌ Error fetching restaurant info:', restaurantError)
          toast.error('Failed to load restaurant information')
          setLoading(false)
          return
        }

        // Set up approved staff session
        if (!freshUserData.restaurant_id) {
          console.error('❌ Restaurant ID is missing for approved staff')
          toast.error('Restaurant information missing. Please contact support.')
          // Redirect to application flow since restaurant_id is missing
          setStaffSession({
            status: 'no_application',
            user_id: freshUserData.id,
            full_name: freshUserData.full_name
          })
          setLoading(false)
          return
        }
        
        console.log('✅ Setting up staff session with restaurant_id:', freshUserData.restaurant_id)
        const staffSessionData = {
          staff_id: freshUserData.id,
          user_id: freshUserData.id,
          restaurant_id: freshUserData.restaurant_id, // Ensure this is properly set
          full_name: freshUserData.full_name,
          position: freshUserData.position,
          hourly_rate: freshUserData.hourly_rate,
          status: 'approved'
        }
        
        console.log('🔍 Staff session data being set:', staffSessionData)
        setStaffSession(staffSessionData)
        setRestaurantInfo({
          id: freshUserData.restaurant_id,
          name: restaurantOwner.restaurant_name,
          owner: restaurantOwner.full_name
        })
        
        // Set restaurant data for components that need it
        setRestaurant({
          id: freshUserData.restaurant_id,
          name: restaurantOwner.restaurant_name,
          owner_id: freshUserData.restaurant_id // In unified table, restaurant_id is the owner's user ID
        })
        
        // Load performance stats, notifications, and online status
        await loadStaffStats(freshUserData.id)
        await loadOrderNotifications(freshUserData.id)
        await loadStaffOnlineStatus(freshUserData.id)
        
      } else {
        // Staff is not approved, check application status
        console.log('❌ Staff not approved, checking application status...')
        
        const { data: applicationData, error: appError } = await supabase
          .from('staff_applications')
          .select(`
            id, 
            status, 
            restaurant_id,
            applied_at,
            reviewed_at
          `)
          .eq('user_id', user.id)
          .order('applied_at', { ascending: false })
          .maybeSingle()

        if (!appError && applicationData) {
          console.log(`📋 Application found with status: ${applicationData.status}`)
          
          // Get restaurant owner details separately
          const { data: restaurantOwnerData, error: ownerError } = await supabase
            .from('users')
            .select('restaurant_name, full_name')
            .eq('id', applicationData.restaurant_id)
            .eq('role', 'restaurant_owner')
            .single()

          setApplicationStatus(applicationData.status)
          setStaffSession({ 
            status: applicationData.status,
            restaurant_name: restaurantOwnerData?.restaurant_name || 'Unknown Restaurant',
            restaurant_owner: restaurantOwnerData?.full_name || 'Unknown Owner',
            applied_at: applicationData.applied_at,
            reviewed_at: applicationData.reviewed_at
          })
        } else {
          console.log('❌ No application found')
          setStaffSession({ status: 'no_application' })
        }
      }
    } catch (error) {
      console.error('❌ Error checking staff approval status:', error)
      toast.error('Failed to load staff information')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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
        .from('users')
        .select('is_available')
        .eq('id', user?.id)
        .single()

      setIsOnline(data?.is_available || false)
    } catch (error) {
      console.error('Error checking online status:', error)
    }
  }

  const handleLogout = async () => {
    try {
      // Update staff status to offline
      if (user?.id) {
        await supabase
          .from('users')
          .update({ is_available: false })
          .eq('id', user.id)
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



// Define tabs (Performance tab removed as requested)
  const tabs = [
    { id: 'overview', name: 'Overview', icon: HomeIcon },
    { id: 'orders', name: 'Orders', icon: ShoppingBagIcon },
    { id: 'tables', name: 'Tables', icon: TableCellsIcon },
    { id: 'menu', name: 'Menu', icon: BookOpenIcon },
    { id: 'restaurant', name: 'Restaurant', icon: BuildingStorefrontIcon }
  ]



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
            onStartOrdering={() => setShowOrderingFlow(true)}
          />
        )

      case 'orders':
        console.log('🍽️ Rendering StaffOrderManagement with:', { 
          staffId: staffSession?.staff_id, 
          restaurantId: staffSession?.restaurant_id 
        })
        return (
          <StaffOrderManagement 
            staffId={staffSession?.staff_id} 
            restaurantId={staffSession?.restaurant_id}
            isOnline={isOnline}
          />
        )

      case 'tables':
        console.log('🪑 Rendering StaffTableSelection with:', { 
          restaurantId: staffSession?.restaurant_id, 
          staffId: staffSession?.staff_id 
        })
        return (
          <div className="space-y-6">
            <StaffTableSelection 
              restaurantId={staffSession?.restaurant_id}
              staffId={staffSession?.staff_id}
              onTableReserved={(data) => {
                toast.success(`Table ${data.table.table_number} reserved for ${data.customer.name}`)
                // You can add additional logic here if needed
              }}
            />
            
            {/* Quick Action Button for Staff-Assisted Ordering */}
            <div className="fixed bottom-20 right-4 z-40">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowOrderingFlow(true)}
                className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <ShoppingBagIcon className="h-6 w-6" />
              </motion.button>
            </div>
          </div>
        )

      case 'menu':
        console.log('📖 Rendering StaffMenuView with restaurantId:', staffSession?.restaurant_id)
        return <StaffMenuView restaurantId={staffSession?.restaurant_id} />

      // case 'performance': // REMOVED
      //   return <StaffPerformance staffId={staffSession?.staff_id} />

      case 'restaurant':
        console.log('🏢 Rendering RestaurantInfo with restaurantId:', staffSession?.restaurant_id)
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

  // Show different screens based on staff approval status
  if (staffSession.status === 'no_application') {
    return renderNoApplicationStatus()
  }

  if (staffSession.status === 'pending') {
    return renderPendingStatus()
  }

  if (staffSession.status === 'rejected') {
    return renderRejectedStatus()
  }

  // Only show full dashboard if staff is approved AND has valid restaurant_id
  if (staffSession.status !== 'approved' || !staffSession.restaurant_id) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-orange-400 via-orange-500 to-red-500">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-20 right-10 w-24 h-24 rounded-full border-4 border-white/20"
            animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-32 left-16 w-16 h-16 rounded-full bg-white/10"
            animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-1/2 left-10 w-8 h-8 rounded-full bg-white/15"
            animate={{ x: [0, 30, 0], rotate: [0, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Dot Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%23ffffff'/%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Main Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
            className="bg-white rounded-3xl p-8 w-full max-w-md border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] text-center"
          >
            {/* Animated Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.4 }}
              className="mb-6"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                >
                  <ClockIcon className="h-10 w-10 text-orange-600" />
                </motion.div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-black text-black mb-4 tracking-tight"
            >
              ACCESS PENDING
            </motion.h3>
            
            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-black/70 font-bold mb-8 text-lg"
            >
              Your staff application is still being processed
            </motion.p>

            {/* Status Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-yellow-50 to-orange-50 border-4 border-black rounded-2xl p-6 mb-8 shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
            >
              <div className="flex items-center justify-center gap-3 mb-3">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🕰️
                </motion.div>
                <span className="font-black text-orange-800">REVIEW IN PROGRESS</span>
              </div>
              <p className="text-orange-700 font-bold text-sm">
                You'll receive a notification once approved!
              </p>
            </motion.div>

            {/* Refresh Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 px-6 rounded-2xl border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all duration-200 text-lg tracking-wide"
            >
              🔄 REFRESH STATUS
            </motion.button>

            {/* Logout Option */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={handleLogout}
              className="mt-4 text-black/60 hover:text-black font-bold text-sm transition-colors underline"
            >
              Sign Out
            </motion.button>
          </motion.div>
        </div>
      </div>
    )
  }

  // Full Staff Dashboard - Only shown for approved staff
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Top Header Bar - Professional Design */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 py-3 z-40 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">QR</span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900">{restaurantInfo?.name || 'Staff Portal'}</h1>
              <p className="text-xs text-gray-500">{staffSession?.position}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Professional Notifications */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <BellIcon className="h-5 w-5 text-gray-600" />
                {unreadNotifications > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-semibold rounded-full flex items-center justify-center shadow-sm"
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </motion.span>
                )}
              </motion.button>

              {/* Professional Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    ref={notificationsDropdownRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="fixed top-20 left-4 right-4 sm:absolute sm:top-14 sm:left-auto sm:right-0 sm:w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-[9999] max-h-96 overflow-y-auto"
                    style={{ zIndex: 9999 }}
                  >
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                        {unreadNotifications > 0 && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
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
                            className={`px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 ${
                              notification.isRead ? '' : 'bg-[#C6FF3D]/10'
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
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 text-sm">
                                {notification.status === 'pending' ? '⏳' :
                                 notification.status === 'preparing' ? '👨‍🍳' :
                                 notification.status === 'ready' ? '✅' : '📋'}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm">{notification.title}</p>
                                <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                              </div>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                              )}
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                            <BellIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-sm">No notifications yet</p>
                        </div>
                      )}
                    </div>
                    
                    {notifications.length > 0 && (
                      <div className="px-4 py-2 border-t border-gray-200">
                        <button
                          onClick={() => {
                            const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }))
                            setNotifications(updatedNotifications)
                            setUnreadNotifications(0)
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark all as read
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Professional Profile */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 hover:bg-gray-200 transition-colors"
              >
                <div className="relative">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {staffSession?.full_name?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-white rounded-full ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-gray-900 text-sm font-medium">{staffSession?.full_name || 'Staff Member'}</p>
                  <p className="text-gray-500 text-xs">{staffSession?.position || 'Staff'}</p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-gray-600" />
              </motion.button>

              {/* Professional Profile Dropdown */}
              <AnimatePresence>
                {showProfileDropdown && (
                  <motion.div
                    ref={profileDropdownRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-14 right-0 w-72 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-[9999]"
                    style={{ zIndex: 9999 }}
                  >
                    {/* Profile Header */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-md">
                            <span className="text-white text-lg font-semibold">
                              {staffSession?.full_name?.charAt(0) || 'S'}
                            </span>
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-white rounded-full ${
                            isOnline ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{staffSession?.full_name || 'Staff Member'}</p>
                          <p className="text-gray-600 text-xs">{staffSession?.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="bg-white text-gray-700 px-2 py-0.5 rounded text-xs font-medium">
                              {staffSession?.position || 'Staff'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {isOnline ? '● Online' : '● Offline'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="px-4 py-3 bg-white border-b border-gray-200">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-lg font-semibold text-gray-900">{stats.todayOrders}</p>
                          <p className="text-xs text-gray-500">Orders</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <p className="text-lg font-semibold text-gray-900">₹{stats.todayEarnings}</p>
                          <p className="text-xs text-gray-500">Earned</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                          <p className="text-lg font-semibold text-gray-900">{stats.rating}★</p>
                          <p className="text-xs text-gray-500">Rating</p>
                        </div>
                      </div>
                    </div>

                    {/* Profile Information */}
                    <div className="px-4 py-3 bg-white border-b border-gray-200">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <BuildingStorefrontIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-500">Restaurant</p>
                            <p className="text-sm font-medium text-gray-900 truncate">{restaurantInfo?.name || 'Loading...'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <UserCircleIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Position</p>
                            <p className="text-sm font-medium text-gray-900">{staffSession?.position || 'Staff'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            <ClockIcon className="h-4 w-4 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs text-gray-500">Shift Time</p>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="px-4 py-3 bg-white">
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={toggleOnlineStatus}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 mb-2 ${
                          isOnline
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
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
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                        >
                          <Cog6ToothIcon className="h-4 w-4" />
                          Settings
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handleLogout}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
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
      <div className="px-4 py-6 pt-20 pb-24 max-w-7xl mx-auto">
        {/* Professional Page Header */}
        <div className="mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-left"
          >
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              {tabs.find(tab => tab.id === activeTab)?.name || 'Overview'}
            </h1>
            <p className="text-sm text-gray-600">
              {activeTab === 'overview' && `Welcome back, ${staffSession?.full_name || 'Staff Member'}!`}
              {activeTab === 'orders' && 'Manage your assigned orders'}
              {activeTab === 'tables' && 'Reserve tables and assist customers'}
              {activeTab === 'menu' && 'View restaurant menu items'}
              {activeTab === 'restaurant' && 'Restaurant information'}
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

      {/* Professional Floating Action Button for Staff-Assisted Ordering */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowOrderingFlow(true)}
        className="fixed bottom-20 right-4 z-50 bg-gradient-to-br from-blue-600 to-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", bounce: 0.3 }}
      >
        <UserIcon className="h-6 w-6" />
      </motion.button>

      {/* Professional Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="grid grid-cols-5 h-16 max-w-7xl mx-auto">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 px-1 transition-all duration-200 ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className={`h-5 w-5 ${
                activeTab === tab.id ? 'text-blue-600' : 'text-gray-500'
              }`} />
              <span className={`text-[10px] leading-tight ${
                activeTab === tab.id ? 'font-semibold' : 'font-medium'
              }`}>{tab.name}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Staff Ordering Flow Modal */}
      <AnimatePresence>
        {showOrderingFlow && (
          <StaffOrderingFlow
            restaurantId={staffSession?.restaurant_id}
            staffId={staffSession?.staff_id}
            onClose={() => setShowOrderingFlow(false)}
            onOrderComplete={(orderData) => {
              toast.success(`Order placed successfully for ${orderData.customerName}!`)
              setShowOrderingFlow(false)
              // Refresh stats or update UI as needed
              fetchStats()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaffDashboard
