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
  const [processingOrders, setProcessingOrders] = useState(new Set())

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
        return ['pending', 'assigned'] // Include assigned orders in pending tab
      case 'assigned':
        return ['assigned', 'preparing', 'ready']
      case 'completed':
        return ['delivered', 'cancelled', 'served', 'completed']
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

    // Prevent multiple clicks
    if (processingOrders.has(orderId)) return
    
    setProcessingOrders(prev => new Set(prev).add(orderId))

    try {
      console.log('✅ Accepting order:', orderId, 'for staff:', staffId)
      
      const result = await updateOrderStatusByStaff(orderId, 'assigned', staffId)
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      toast.success('Order accepted successfully!', {
        icon: '✅',
        duration: 3000
      })
      
      // Refresh orders to show updated status
      await handleRefresh()
    } catch (error) {
      console.error('❌ Error accepting order:', error)
      toast.error(`Failed to accept order: ${error.message}`)
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    if (!staffId) {
      toast.error('Staff ID not available')
      return
    }

    // Prevent multiple clicks
    if (processingOrders.has(orderId)) return
    
    setProcessingOrders(prev => new Set(prev).add(orderId))

    try {
      console.log('🔄 Updating order status:', orderId, 'to:', newStatus)
      
      const result = await updateOrderStatusByStaff(orderId, newStatus, staffId)
      
      if (result.error) {
        throw new Error(result.error.message)
      }

      const statusMessages = {
        'preparing': 'Started preparing order! 🍳',
        'ready': 'Order is ready for pickup! 🔔',
        'served': 'Order served successfully! ✅',
        'completed': 'Order completed! 🎉'
      }

      toast.success(statusMessages[newStatus] || `Order status updated to ${newStatus}!`, {
        icon: newStatus === 'completed' ? '🎉' : '🔄',
        duration: 3000
      })
      
      // Refresh orders to show updated status
      await handleRefresh()
      setSelectedOrder(null)
    } catch (error) {
      console.error('❌ Error updating order status:', error)
      toast.error(`Failed to update order: ${error.message}`)
    } finally {
      setProcessingOrders(prev => {
        const newSet = new Set(prev)
        newSet.delete(orderId)
        return newSet
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'assigned':
        return 'bg-blue-100 text-blue-800'
      case 'preparing':
        return 'bg-orange-100 text-orange-800'
      case 'ready':
        return 'bg-green-100 text-green-800'
      case 'served':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'delivered':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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
            {filteredOrders.map((order, index) => {
              const priority = getOrderPriority(order)
              const isProcessing = processingOrders.has(order.id)
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl border-2 p-4 sm:p-6 hover:shadow-xl transition-all duration-300 touch-manipulation ${
                    priority === 'high' ? 'border-red-200 bg-red-50/30' :
                    priority === 'medium' ? 'border-yellow-200 bg-yellow-50/30' :
                    'border-gray-200'
                  } ${isProcessing ? 'opacity-75 pointer-events-none' : ''}`}
                >
                  {/* Enhanced Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4">
                    <div className="flex-1 mb-3 sm:mb-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                          #{order.order_number || order.id.slice(-6)}
                        </h3>
                        
                        {/* Priority Badge */}
                        {priority === 'high' && (
                          <motion.span 
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg"
                          >
                            🚨 URGENT
                          </motion.span>
                        )}
                        
                        {priority === 'medium' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                            ⚡ PRIORITY
                          </span>
                        )}
                      </div>
                      
                      {/* Order Info */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <ClockIcon className="h-4 w-4" />
                          <span>{new Date(order.created_at).toLocaleTimeString()}</span>
                          <span className="text-gray-400">•</span>
                          <span className="font-medium">Table {order.table_number || 'N/A'}</span>
                        </div>
                        
                        {order.customer_name && (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <UserIcon className="h-4 w-4" />
                            <span>{order.customer_name}</span>
                          </div>
                        )}
                        
                        {order.special_instructions && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                            <p className="text-xs text-blue-600 font-medium mb-1">SPECIAL INSTRUCTIONS</p>
                            <p className="text-sm text-blue-800">{order.special_instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Status and Amount */}
                    <div className="flex flex-row sm:flex-col items-start sm:items-end gap-3 sm:gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}>
                        {order.status.toUpperCase()}
                      </span>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">₹{Math.round(order.total_amount)}</p>
                        <p className="text-xs text-gray-500">
                          {order.payment_method === 'cash' ? '💵 Cash' : '💳 Online'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Items Preview */}
                  {order.order_items && order.order_items.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Items ({order.order_items.length})</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {order.order_items.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900 truncate">
                              {item.menu_items?.name || item.item_name}
                            </span>
                            <span className="text-sm text-gray-600 ml-2">
                              {item.quantity}× ₹{Math.round(item.unit_price)}
                            </span>
                          </div>
                        ))}
                        {order.order_items.length > 4 && (
                          <div className="flex items-center justify-center p-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                            +{order.order_items.length - 4} more items
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    {/* View Details Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200 text-sm"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span>View Details</span>
                    </motion.button>
                    
                    {/* Status Action Buttons */}
                    {order.status === 'pending' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => acceptOrder(order.id)}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold transition-all duration-200 text-sm shadow-lg disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Accept Order</span>
                          </>
                        )}
                      </motion.button>
                    )}
                    
                    {order.status === 'assigned' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateOrderStatus(order.id, 'preparing')}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all duration-200 text-sm shadow-lg disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            <PlayIcon className="h-4 w-4" />
                            <span>Start Preparing</span>
                          </>
                        )}
                      </motion.button>
                    )}
                    
                    {order.status === 'preparing' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateOrderStatus(order.id, 'ready')}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all duration-200 text-sm shadow-lg disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            <BellIcon className="h-4 w-4" />
                            <span>Mark Ready</span>
                          </>
                        )}
                      </motion.button>
                    )}
                    
                    {order.status === 'ready' && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => updateOrderStatus(order.id, 'served')}
                        disabled={isProcessing}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-200 text-sm shadow-lg disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Mark Served</span>
                          </>
                        )}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Order #{selectedOrder.order_number || selectedOrder.id.slice(-6)}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {selectedOrder.customer_name || 'Guest Customer'} • Table {selectedOrder.table_number || 'N/A'}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Order Status and Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 font-medium mb-1">STATUS</p>
                    <p className="text-sm font-bold text-blue-900 capitalize">
                      {selectedOrder.status}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-xs text-green-600 font-medium mb-1">TOTAL</p>
                    <p className="text-sm font-bold text-green-900">
                      ₹{Math.round(selectedOrder.total_amount)}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <p className="text-xs text-purple-600 font-medium mb-1">TIME</p>
                    <p className="text-sm font-bold text-purple-900">
                      {new Date(selectedOrder.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-xl">
                    <p className="text-xs text-orange-600 font-medium mb-1">PAYMENT</p>
                    <p className="text-sm font-bold text-orange-900">
                      {selectedOrder.payment_method === 'cash' ? '💵 Cash' : '💳 Online'}
                    </p>
                  </div>
                </div>

                {/* Special Instructions */}
                {selectedOrder.special_instructions && (
                  <div className="mb-6 p-4 bg-yellow-50 rounded-xl border-l-4 border-yellow-400">
                    <p className="text-xs text-yellow-600 font-medium mb-2">SPECIAL INSTRUCTIONS</p>
                    <p className="text-sm text-yellow-800">{selectedOrder.special_instructions}</p>
                  </div>
                )}

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">
                            {item.menu_items?.name || item.item_name}
                          </h4>
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

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedOrder.status === 'pending' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        acceptOrder(selectedOrder.id)
                        setSelectedOrder(null)
                      }}
                      disabled={processingOrders.has(selectedOrder.id)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Accept Order</span>
                    </motion.button>
                  )}
                  
                  {selectedOrder.status === 'assigned' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'preparing')
                        setSelectedOrder(null)
                      }}
                      disabled={processingOrders.has(selectedOrder.id)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg disabled:opacity-50"
                    >
                      <PlayIcon className="h-5 w-5" />
                      <span>Start Preparing</span>
                    </motion.button>
                  )}
                  
                  {selectedOrder.status === 'preparing' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'ready')
                        setSelectedOrder(null)
                      }}
                      disabled={processingOrders.has(selectedOrder.id)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg disabled:opacity-50"
                    >
                      <BellIcon className="h-5 w-5" />
                      <span>Mark Ready</span>
                    </motion.button>
                  )}
                  
                  {selectedOrder.status === 'ready' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        updateOrderStatus(selectedOrder.id, 'served')
                        setSelectedOrder(null)
                      }}
                      disabled={processingOrders.has(selectedOrder.id)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all duration-200 shadow-lg disabled:opacity-50"
                    >
                      <CheckCircleIcon className="h-5 w-5" />
                      <span>Mark Served</span>
                    </motion.button>
                  )}
                  
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all duration-200"
                  >
                    Close
                  </button>
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
