import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CurrencyRupeeIcon,
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const StaffOrderManagement = ({ staffId, restaurantId, isOnline }) => {
  const [orders, setOrders] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending') // pending, assigned, completed
  const [refreshing, setRefreshing] = useState(false)
  const [cachedOrders, setCachedOrders] = useState({})

  useEffect(() => {
    if (restaurantId) {
      // Load cached data first for instant display
      const cacheKey = `orders_${restaurantId}_${filter}`
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          const parsedCache = JSON.parse(cached)
          if (Date.now() - parsedCache.timestamp < 30000) { // 30 seconds cache
            setOrders(parsedCache.data)
            setLoading(false)
          }
        } catch (error) {
          localStorage.removeItem(cacheKey)
        }
      }
      
      fetchOrders()
      const cleanup = setupRealtimeSubscription()
      
      return cleanup
    }
  }, [restaurantId, filter])

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      // Optimized query with minimal data for faster loading
      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          total_amount,
          tip_amount,
          created_at,
          assigned_at,
          assigned_staff_id,
          customer_name,
          payment_method,
          special_instructions,
          order_items!inner (
            id,
            quantity,
            unit_price,
            total_price,
            special_instructions,
            menu_items (
              id,
              name,
              image_url
            )
          ),
          tables (
            table_number
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(50) // Limit for better performance

      // Optimized filters
      if (filter === 'pending') {
        query = query.eq('status', 'pending').is('assigned_staff_id', null)
      } else if (filter === 'assigned') {
        query = query.eq('assigned_staff_id', staffId).in('status', ['assigned', 'preparing', 'ready'])
      } else if (filter === 'completed') {
        query = query.eq('assigned_staff_id', staffId).eq('status', 'delivered')
      }

      const { data, error } = await query

      if (error) throw error

      const ordersData = data || []
      setOrders(ordersData)
      
      // Cache the results
      const cacheKey = `orders_${restaurantId}_${filter}`
      localStorage.setItem(cacheKey, JSON.stringify({
        data: ordersData,
        timestamp: Date.now()
      }))

      console.log(`📦 Loaded ${ordersData.length} orders for ${filter} filter`)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('staff-orders')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`
        }, 
        (payload) => {
          console.log('Order update received:', payload)
          
          if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
            // New order notification
            toast.success('🔔 New order available!', {
              duration: 5000,
              icon: '🛎️'
            })
            
            // Play notification sound
            playNotificationSound()
          }
          
          // Refresh orders
          fetchOrders()
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }

  const playNotificationSound = () => {
    // Create audio notification
    const audio = new Audio('/notification.mp3')
    audio.play().catch(e => console.log('Audio play failed:', e))
  }

  const acceptOrder = async (orderId) => {
    if (!isOnline) {
      toast.error('You must be online to accept orders')
      return
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'assigned', 
          assigned_staff_id: staffId,
          assigned_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      toast.success('Order accepted successfully!')
      fetchOrders()
    } catch (error) {
      console.error('Error accepting order:', error)
      toast.error('Failed to accept order')
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const updates = { status: newStatus }
      
      // Add timestamp for each status
      switch (newStatus) {
        case 'preparing':
          updates.preparing_at = new Date().toISOString()
          break
        case 'ready':
          updates.ready_at = new Date().toISOString()
          break
        case 'delivered':
          updates.delivered_at = new Date().toISOString()
          break
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)

      if (error) throw error

      toast.success(`Order marked as ${newStatus}`)
      fetchOrders()
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-orange-100 text-orange-800'
      case 'ready': return 'bg-green-100 text-green-800'
      case 'delivered': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOrderPriority = (order) => {
    const createdAt = new Date(order.created_at)
    const now = new Date()
    const minutesOld = (now - createdAt) / (1000 * 60)
    
    if (minutesOld > 30) return 'high'
    if (minutesOld > 15) return 'medium'
    return 'low'
  }

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true
    if (filter === 'pending') return order.status === 'pending'
    if (filter === 'assigned') return order.assigned_staff_id === staffId && ['assigned', 'preparing', 'ready'].includes(order.status)
    if (filter === 'completed') return order.assigned_staff_id === staffId && order.status === 'delivered'
    return true
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Orders</h2>
          <p className="text-sm text-gray-500">
            {isOnline ? '🟢 Online & Ready' : '🔴 Offline'}
          </p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
          >
            🔄
          </motion.div>
          Refresh
        </motion.button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'pending', label: 'Available', icon: '🔔', color: 'bg-blue-500' },
          { key: 'assigned', label: 'My Orders', icon: '👨‍🍳', color: 'bg-orange-500' },
          { key: 'completed', label: 'Completed', icon: '✅', color: 'bg-green-500' }
        ].map((tab) => (
          <motion.button
            key={tab.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              filter === tab.key
                ? `${tab.color} text-white shadow-lg`
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-sm">{tab.label}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              filter === tab.key
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {orders.filter(o => {
                if (tab.key === 'pending') return o.status === 'pending'
                if (tab.key === 'assigned') return o.assigned_staff_id === staffId && ['assigned', 'preparing', 'ready'].includes(o.status)
                if (tab.key === 'completed') return o.status === 'delivered' && o.assigned_staff_id === staffId
                return false
              }).length}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ClockIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500 mb-6">
            {filter === 'pending' ? 'No new orders available right now' : 
             filter === 'assigned' ? 'No orders assigned to you yet' :
             'No completed orders to show'}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchOrders(true)}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-colors"
          >
            Refresh Orders
          </motion.button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg transition-all duration-200"
            >
              {/* Order Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      #{order.order_number || order.id.slice(-6)}
                    </h3>
                    {getOrderPriority(order) === 'high' && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                        🔥 URGENT
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 font-medium">
                    {order.customer_name || 'Guest Customer'}
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                    <span>🪑 Table {order.tables?.table_number || 'N/A'}</span>
                    <span>⏰ {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                
                <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${getStatusColor(order.status)}`}>
                  {order.status === 'pending' && '🔔 New'}
                  {order.status === 'assigned' && '👨‍🍳 Assigned'}
                  {order.status === 'preparing' && '🔥 Cooking'}
                  {order.status === 'ready' && '✅ Ready'}
                  {order.status === 'delivered' && '🎉 Done'}
                </span>
              </div>

              {/* Order Items Preview */}
              <div className="mb-3">
                <div className="flex flex-wrap gap-1.5">
                  {order.order_items?.slice(0, 2).map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium">
                      {item.quantity}× {item.menu_items?.name}
                    </span>
                  ))}
                  {order.order_items?.length > 2 && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                      +{order.order_items.length - 2} more items
                    </span>
                  )}
                </div>
              </div>

              {/* Order Total & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-gray-900">
                    ₹{Math.round(order.total_amount)}
                  </span>
                  {order.tip_amount > 0 && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-lg">
                      💰 +₹{Math.round(order.tip_amount)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedOrder(order)}
                    className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </motion.button>

                  {order.status === 'pending' && isOnline && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => acceptOrder(order.id)}
                      className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg"
                    >
                      Accept
                    </motion.button>
                  )}

                  {order.assigned_staff_id === staffId && order.status === 'assigned' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="px-4 py-2 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors"
                    >
                      Start Cooking
                    </motion.button>
                  )}

                  {order.assigned_staff_id === staffId && order.status === 'preparing' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors"
                    >
                      Mark Ready
                    </motion.button>
                  )}

                  {order.assigned_staff_id === staffId && order.status === 'ready' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="px-4 py-2 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors"
                    >
                      Delivered
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      #{selectedOrder.order_number || selectedOrder.id.slice(-6)}
                    </h2>
                    <p className="text-gray-500 font-medium">
                      {selectedOrder.customer_name || 'Guest Customer'}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6 text-gray-600" />
                  </motion.button>
                </div>
              </div>

              <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Order Status & Info */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status === 'pending' && '🔔 New Order'}
                        {selectedOrder.status === 'assigned' && '👨‍🍳 Assigned'}
                        {selectedOrder.status === 'preparing' && '🔥 Cooking'}
                        {selectedOrder.status === 'ready' && '✅ Ready'}
                        {selectedOrder.status === 'delivered' && '🎉 Delivered'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 mb-1">Table</p>
                      <p className="text-xl font-bold text-gray-900">
                        🪑 {selectedOrder.tables?.table_number || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <p className="text-xs text-blue-600 font-medium mb-1">ORDER TIME</p>
                      <p className="text-sm font-bold text-blue-900">
                        {new Date(selectedOrder.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-xl">
                      <p className="text-xs text-green-600 font-medium mb-1">PAYMENT</p>
                      <p className="text-sm font-bold text-green-900">
                        💳 {selectedOrder.payment_method || 'Cash'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-6 pb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{item.menu_items?.name}</h4>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg font-medium">
                              {item.quantity}×
                            </span>
                            <span>₹{Math.round(item.unit_price)} each</span>
                          </div>
                          {item.special_instructions && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <p className="text-xs text-blue-600 font-medium mb-1">SPECIAL NOTE</p>
                              <p className="text-sm text-blue-800">{item.special_instructions}</p>
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xl font-bold text-gray-900">₹{Math.round(item.total_price)}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Order Total */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-gray-700">Subtotal</span>
                      <span className="text-lg font-bold text-gray-900">₹{Math.round(selectedOrder.total_amount)}</span>
                    </div>
                    {selectedOrder.tip_amount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span className="font-medium">💰 Tip</span>
                        <span className="font-bold">+₹{Math.round(selectedOrder.tip_amount)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-gray-900">Total</span>
                        <span className="text-2xl font-bold text-orange-600">
                          ₹{Math.round(selectedOrder.total_amount + (selectedOrder.tip_amount || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaffOrderManagement
