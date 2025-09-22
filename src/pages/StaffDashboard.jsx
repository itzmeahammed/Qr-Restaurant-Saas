import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  UserIcon,
  CurrencyRupeeIcon,
  TrophyIcon,
  BellIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import useAuthStore from '../stores/useAuthStore'
import useOrderStore from '../stores/useOrderStore'
import toast from 'react-hot-toast'

const StaffDashboard = () => {
  const { user, profile } = useAuthStore()
  const { orders, fetchOrders, updateOrderStatus } = useOrderStore()
  const [isOnline, setIsOnline] = useState(false)
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayEarnings: 0,
    todayTips: 0,
    rating: 5.0
  })
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile?.restaurant_id) {
      fetchOrders(profile.restaurant_id, { staff_id: user.id })
      fetchStats()
      checkOnlineStatus()
    }
    setLoading(false)
  }, [profile])

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

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch today's orders for this staff
      const { data: todayOrdersData } = await supabase
        .from('orders')
        .select('total_amount, tip_amount')
        .eq('staff_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .eq('status', 'delivered')

      const todayOrders = todayOrdersData?.length || 0
      const todayEarnings = todayOrdersData?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0
      const todayTips = todayOrdersData?.reduce((sum, order) => sum + parseFloat(order.tip_amount || 0), 0) || 0

      // Fetch staff profile for rating
      const { data: staffProfile } = await supabase
        .from('staff_profiles')
        .select('performance_rating')
        .eq('user_id', user.id)
        .single()

      setStats({
        todayOrders,
        todayEarnings,
        todayTips,
        rating: staffProfile?.performance_rating || 5.0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const checkOnlineStatus = async () => {
    try {
      const { data } = await supabase
        .from('staff_profiles')
        .select('is_available')
        .eq('user_id', user.id)
        .single()

      setIsOnline(data?.is_available || false)
    } catch (error) {
      console.error('Error checking online status:', error)
    }
  }

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !isOnline
      const updates = {
        is_available: newStatus,
        ...(newStatus ? { login_time: new Date().toISOString() } : { logout_time: new Date().toISOString() })
      }

      const { error } = await supabase
        .from('staff_profiles')
        .update(updates)
        .eq('user_id', user.id)

      if (error) throw error

      setIsOnline(newStatus)
      toast.success(newStatus ? 'You are now online!' : 'You are now offline')
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const acceptOrder = async (orderId) => {
    const result = await updateOrderStatus(orderId, 'assigned', user.id)
    if (result.data) {
      toast.success('Order accepted!')
      fetchStats()
    }
  }

  const updateStatus = async (orderId, status) => {
    const result = await updateOrderStatus(orderId, status)
    if (result.data) {
      toast.success(`Order marked as ${status}`)
      fetchStats()
    }
  }

  const pendingOrders = orders.filter(order => order.status === 'pending')
  const myOrders = orders.filter(order => order.staff_id === user.id && order.status !== 'delivered')

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Staff Dashboard</h1>
              <p className="text-neutral-600">Welcome back, {profile?.full_name}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-neutral-400'}`}></div>
                <span className="text-sm text-neutral-600">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              <button
                onClick={toggleOnlineStatus}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                  isOnline 
                    ? 'bg-error text-white hover:bg-error/90' 
                    : 'bg-success text-white hover:bg-success/90'
                }`}
              >
                {isOnline ? <StopIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
                {isOnline ? 'Go Offline' : 'Go Online'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.todayOrders}</p>
                <p className="text-sm text-neutral-600">Orders Today</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-accent-100 rounded-xl">
                <CurrencyRupeeIcon className="h-6 w-6 text-accent-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">₹{stats.todayEarnings.toFixed(0)}</p>
                <p className="text-sm text-neutral-600">Earnings Today</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-secondary-100 rounded-xl">
                <CurrencyRupeeIcon className="h-6 w-6 text-secondary-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">₹{stats.todayTips.toFixed(0)}</p>
                <p className="text-sm text-neutral-600">Tips Today</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 bg-warning/20 rounded-xl">
                <TrophyIcon className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900">{stats.rating.toFixed(1)}</p>
                <p className="text-sm text-neutral-600">Rating</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Available Orders */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-neutral-900">Available Orders</h2>
              <div className="flex items-center gap-2">
                <BellIcon className="h-5 w-5 text-neutral-400" />
                <span className="text-sm text-neutral-600">{pendingOrders.length} pending</span>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {pendingOrders.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <ClockIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No pending orders</p>
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-neutral-50 rounded-xl p-4 border border-neutral-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-neutral-900">#{order.order_number}</p>
                        <p className="text-sm text-neutral-600">{order.customer_name}</p>
                        <p className="text-sm text-neutral-500">Table: {order.table_number || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-500">₹{order.total_amount}</p>
                        <p className="text-xs text-neutral-500">
                          {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptOrder(order.id)}
                        className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors text-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* My Active Orders */}
          <div className="card">
            <h2 className="text-xl font-bold text-neutral-900 mb-6">My Active Orders</h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {myOrders.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <UserIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active orders</p>
                </div>
              ) : (
                myOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-neutral-50 rounded-xl p-4 border border-neutral-200"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-neutral-900">#{order.order_number}</p>
                        <p className="text-sm text-neutral-600">{order.customer_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'assigned' ? 'bg-warning/20 text-warning' :
                            order.status === 'preparing' ? 'bg-primary/20 text-primary-500' :
                            'bg-success/20 text-success'
                          }`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary-500">₹{order.total_amount}</p>
                        {order.tip_amount > 0 && (
                          <p className="text-xs text-success">+₹{order.tip_amount} tip</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {order.status === 'assigned' && (
                        <button
                          onClick={() => updateStatus(order.id, 'preparing')}
                          className="flex-1 bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateStatus(order.id, 'ready')}
                          className="flex-1 bg-success text-white py-2 px-4 rounded-lg hover:bg-success/90 transition-colors text-sm font-medium"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateStatus(order.id, 'delivered')}
                          className="flex-1 bg-accent-500 text-white py-2 px-4 rounded-lg hover:bg-accent-600 transition-colors text-sm font-medium"
                        >
                          Mark Delivered
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2 border border-neutral-300 rounded-lg hover:bg-neutral-100 transition-colors text-sm"
                      >
                        Details
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedOrder(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">Order #{selectedOrder.order_number}</h3>
                    <p className="text-neutral-600">{selectedOrder.customer_name}</p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-neutral-100 rounded-lg"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Items</h4>
                    <div className="space-y-2">
                      {selectedOrder.order_items?.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.menu_items?.name} x{item.quantity}</span>
                          <span>₹{item.total_price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedOrder.special_instructions && (
                    <div>
                      <h4 className="font-semibold mb-2">Special Instructions</h4>
                      <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                        {selectedOrder.special_instructions}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>₹{selectedOrder.total_amount}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaffDashboard
