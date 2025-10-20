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
import OrderService from '../../services/orderService'
import useOrderStore from '../../stores/useOrderStore'
import toast from 'react-hot-toast'

const StaffOrderManagement = ({ staffId, restaurantId, isOnline }) => {
  // Use enhanced order store
  const {
    orders,
    loading,
    error,
    fetchStaffOrders,
    updateOrderStatusByStaff,
    subscribeToStaffOrders,
    clearError
  } = useOrderStore()

  const [selectedOrder, setSelectedOrder] = useState(null)
  const [filter, setFilter] = useState('pending') // pending, assigned, completed
  const [refreshing, setRefreshing] = useState(false)
  const [subscription, setSubscription] = useState(null)

  useEffect(() => {
    console.log('🔍 StaffOrderManagement props:', { staffId, restaurantId, isOnline, filter })
    
    if (restaurantId && staffId) {
      // Clear any previous errors
      clearError()
      
      // Fetch staff orders using enhanced service
      fetchStaffOrders(staffId, {
        status: getStatusFilter(filter),
        limit: 30
      })
      
      // Setup real-time subscription
      const sub = subscribeToStaffOrders(staffId, (newOrder) => {
        console.log('📨 New order notification:', newOrder)
        playNotificationSound()
        toast.success(`New order assigned: #${newOrder.order_number}`, {
          icon: '🔔',
          duration: 5000
        })
      })
      
      setSubscription(sub)
      
      return () => {
        if (sub) {
          console.log('🔌 Cleaning up staff order subscription')
          sub.unsubscribe()
        }
      }
    } else {
      console.warn('⚠️ Missing staffId or restaurantId')
    }
  }, [restaurantId, filter, staffId])

  const getStatusFilter = (filter) => {
    switch (filter) {
      case 'pending':
        return ['pending']
      case 'assigned':
        return ['assigned', 'preparing', 'ready']
      case 'completed':
        return ['delivered', 'cancelled']
      default:
        return null
    }
  }

  const handleRefresh = async () => {
    if (!staffId) return
    
    setRefreshing(true)
    try {
      await fetchStaffOrders(staffId, {
        status: getStatusFilter(filter),
        limit: 30
      })
      toast.success('Orders refreshed!')
    } catch (error) {
      toast.error('Failed to refresh orders')
    } finally {
      setRefreshing(false)
    }
  }

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [subscription])



  const playNotificationSound = () => {
    // Create audio notification
    const audio = new Audio('/notification.mp3')
    audio.play().catch(e => console.log('Audio play failed:', e))
  }

  const acceptOrder = async (orderId) => {
    if (!staffId) {
      toast.error('Staff ID not available')
      return
    }

    try {
      console.log('✅ Accepting order:', orderId, 'for staff:', staffId)
      
      const result = await updateOrderStatusByStaff(orderId, 'assigned', staffId)
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      toast.success('Order accepted successfully!')
      
      // Refresh orders to show updated status
      await handleRefresh()
    } catch (error) {
      console.error('❌ Error accepting order:', error)
      toast.error(`Failed to accept order: ${error.message}`)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!staffId) {
      toast.error('Staff ID not available')
      return
    }

    try {
      console.log('🔄 Updating order status:', orderId, 'to:', newStatus)
      
      const result = await updateOrderStatusByStaff(orderId, newStatus, staffId)
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      toast.success(`Order marked as ${newStatus}!`)
      
      // Refresh orders to show updated status
      await handleRefresh()
      setSelectedOrder(null)
    } catch (error) {
      console.error('❌ Error updating order status:', error)
      toast.error(`Failed to update order: ${error.message}`)
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
    <div className="h-full bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Mobile-First Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                📋 Order Management
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <p className="text-xs sm:text-sm text-gray-600">
                  {isOnline ? 'Online - Ready for orders' : 'Offline - Not receiving orders'}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
            >
              <motion.div
                animate={{ rotate: refreshing ? 360 : 0 }}
                transition={{ duration: 1, repeat: refreshing ? Infinity : 0 }}
                className="text-sm sm:text-base"
              >
                🔄
              </motion.div>
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile-First Filter Tabs */}
      <div className="px-4 sm:px-6 py-4 bg-white border-b border-gray-100">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto scrollbar-hide">
          {[
            { key: 'pending', label: 'Pending', icon: '🔔', count: orders.filter(o => o.status === 'pending').length },
            { key: 'assigned', label: 'My Orders', icon: '👨‍🍳', count: orders.filter(o => ['assigned', 'preparing', 'ready'].includes(o.status)).length },
            { key: 'completed', label: 'Completed', icon: '✅', count: orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length }
          ].map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-medium transition-all duration-200 whitespace-nowrap min-w-0 ${
                filter === tab.key
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <span className="text-sm sm:text-lg">{tab.icon}</span>
              <span className="font-bold text-xs sm:text-sm">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold ${
                  filter === tab.key ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Mobile-First Orders List */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-8 sm:w-12 h-8 sm:h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"
              />
              <p className="text-gray-600 font-medium text-sm sm:text-base">Loading orders...</p>
            </div>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-4xl sm:text-6xl mb-4">😞</div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">{error}</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
            >
              Try Again
            </motion.button>
          </motion.div>
        ) : orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="text-4xl sm:text-6xl mb-4">
              {filter === 'pending' ? '🔔' : filter === 'assigned' ? '👨‍🍳' : '✅'}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
              {filter === 'pending' ? 'No pending orders' : filter === 'assigned' ? 'No assigned orders' : 'No completed orders'}
            </h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base px-4">
              {filter === 'pending' ? 'All caught up! New orders will appear here.' : 
               filter === 'assigned' ? 'Accept some pending orders to get started.' : 
               'Completed orders will show up here.'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
            >
              Refresh Orders
            </motion.button>
          </motion.div>
        ) : (
        <div className="space-y-3 sm:space-y-4">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-200 touch-manipulation"
            >
              {/* Mobile-First Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 sm:mb-4">
                <div className="flex-1 mb-3 sm:mb-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      #{order.order_number || order.id.slice(-6)}
                    </h3>
                    {getOrderPriority(order) === 'high' && (
                      <motion.span 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse"
                      >
                        🔥 URGENT
                      </motion.span>
                    )}
                  </div>
                  <p className="text-gray-600 font-medium mb-2">
                    {order.customer_name || 'Guest Customer'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      🪑 Table {order.tables?.table_number || 'N/A'}
                    </span>
                    <span className="flex items-center gap-1">
                      ⏰ {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
                
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`px-3 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${getStatusColor(order.status)}`}
                >
                  {order.status === 'pending' && '🔔 New'}
                  {order.status === 'assigned' && '👨‍🍳 Assigned'}
                  {order.status === 'preparing' && '🔥 Cooking'}
                  {order.status === 'ready' && '✅ Ready'}
                  {order.status === 'delivered' && '🎉 Done'}
                </motion.span>
              </div>

              {/* Mobile-First Order Items Preview */}
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {order.order_items?.slice(0, 2).map((item, index) => (
                    <motion.span 
                      key={index} 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg text-sm font-medium border border-orange-200"
                    >
                      {item.quantity}× {item.menu_items?.name}
                    </motion.span>
                  ))}
                  {order.order_items?.length > 2 && (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium border border-gray-200"
                    >
                      +{order.order_items.length - 2} more items
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Mobile-First Order Total & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 sm:gap-4">
                  <span className="text-xl sm:text-2xl font-bold text-gray-900">
                    ₹{Math.round(order.total_amount)}
                  </span>
                  {order.tip_amount > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-2 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-lg border border-green-200"
                    >
                      💰 +₹{Math.round(order.tip_amount)}
                    </motion.span>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedOrder(order)}
                    className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors touch-manipulation"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </motion.button>

                  {order.status === 'pending' && isOnline && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => acceptOrder(order.id)}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg text-sm sm:text-base touch-manipulation"
                    >
                      Accept Order
                    </motion.button>
                  )}

                  {order.assigned_staff_id === staffId && order.status === 'assigned' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateOrderStatus(order.id, 'preparing')}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-xl font-bold hover:bg-blue-600 transition-colors text-sm sm:text-base touch-manipulation"
                    >
                      Start Cooking
                    </motion.button>
                  )}

                  {order.assigned_staff_id === staffId && order.status === 'preparing' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateOrderStatus(order.id, 'ready')}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 transition-colors text-sm sm:text-base touch-manipulation"
                    >
                      Mark Ready
                    </motion.button>
                  )}

                  {order.assigned_staff_id === staffId && order.status === 'ready' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors text-sm sm:text-base touch-manipulation"
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
      </div>

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
