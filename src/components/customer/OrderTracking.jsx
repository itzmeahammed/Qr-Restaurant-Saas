import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  FireIcon,
  TruckIcon,
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline'
import UnifiedOrderService from '../../services/unifiedOrderService'
import NotificationService from '../../services/notificationService'
import realtimeService from '../../services/realtimeService'
import { supabase } from '../../config/supabase'

const OrderTracking = ({ sessionId, isOpen, onClose }) => {
  const [orders, setOrders] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)

  // Load customer orders when component opens
  useEffect(() => {
    if (isOpen && sessionId) {
      loadCustomerOrders()
      setupRealtimeSubscription()
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [isOpen, sessionId])

  const loadCustomerOrders = async () => {
    try {
      setLoading(true)
      
      // Get customer orders using supabase directly
      const { data: customerOrders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          tables(table_number),
          users!orders_assigned_staff_id_fkey(full_name),
          payment_transactions(*)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      // Orders already include payment information from the join
      const enrichedOrders = customerOrders.map(order => {
        return {
          ...order,
          payment_info: order.payment_transactions?.length > 0 ? order.payment_transactions[0] : null
        }
      })
      
      setOrders(enrichedOrders)
      
      // Set the most recent order as current
      if (enrichedOrders.length > 0) {
        setCurrentOrder(enrichedOrders[0])
      }
    } catch (error) {
      console.error('Error loading customer orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = async () => {
    try {
      // Subscribe to session updates for order and payment changes
      const subscription = customerService.trackSessionOrder(sessionId, null, {
        onOrderUpdate: async (orderUpdate) => {
          console.log('Order update received:', orderUpdate)
          
          // Enrich with payment info if needed
          let enrichedUpdate = orderUpdate
          try {
            const paymentInfo = await PaymentService.getPaymentHistory(orderUpdate.id)
            enrichedUpdate = {
              ...orderUpdate,
              payment_info: paymentInfo.length > 0 ? paymentInfo[0] : null
            }
          } catch (error) {
            console.warn('Failed to enrich order update with payment info')
          }
          
          // Update orders list
          setOrders(prevOrders => 
            prevOrders.map(order => 
              order.id === enrichedUpdate.id ? { ...order, ...enrichedUpdate } : order
            )
          )
          
          // Update current order if it matches
          setCurrentOrder(prevOrder => 
            prevOrder?.id === enrichedUpdate.id ? { ...prevOrder, ...enrichedUpdate } : prevOrder
          )
        },
        onOrderAssigned: (data) => {
          console.log('Order assigned:', data)
          // This will be handled by onOrderUpdate
        },
        onStatusUpdate: (data) => {
          console.log('Status update:', data)
          // This will be handled by onOrderUpdate
        },
        onPaymentConfirmed: (data) => {
          console.log('Payment confirmed:', data)
          // Refresh payment info for the order
          loadCustomerOrders()
        }
      })
      
      setSubscription(subscription)
    } catch (error) {
      console.error('Error setting up realtime subscription:', error)
    }
  }

  const orderStatuses = [
    { 
      id: 'pending', 
      label: 'Order Placed', 
      icon: CheckCircleIcon,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100'
    },
    { 
      id: 'assigned', 
      label: 'Assigned to Staff', 
      icon: UserGroupIcon,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100'
    },
    { 
      id: 'preparing', 
      label: 'Preparing', 
      icon: FireIcon,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100'
    },
    { 
      id: 'ready', 
      label: 'Ready', 
      icon: ClockIcon,
      color: 'text-green-500',
      bgColor: 'bg-green-100'
    },
    { 
      id: 'served', 
      label: 'Served', 
      icon: TruckIcon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100'
    }
  ]

  const getStatusIndex = (status) => {
    return orderStatuses.findIndex(s => s.id === status)
  }

  const isStatusCompleted = (statusId) => {
    const currentIndex = getStatusIndex(currentOrder?.status || 'pending')
    const statusIndex = getStatusIndex(statusId)
    return statusIndex <= currentIndex
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
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
          className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black">Order Tracking</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-black" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your orders...</p>
            </div>
          ) : !currentOrder ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No orders found for this session</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-black">Order #{currentOrder.order_number}</h4>
                    <p className="text-sm text-gray-600">
                      Placed at {new Date(currentOrder.created_at).toLocaleTimeString()}
                    </p>
                    {currentOrder.assigned_staff_name && (
                      <p className="text-sm text-blue-600">
                        👨‍🍳 Assigned to: {currentOrder.assigned_staff_name}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-black">₹{currentOrder.total_amount}</p>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      {currentOrder.payment_method === 'cash' ? (
                        <>
                          <BanknotesIcon className="h-4 w-4" />
                          <span>Pay at table</span>
                        </>
                      ) : (
                        <>
                          <CreditCardIcon className="h-4 w-4" />
                          <span>Online payment</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Payment Status */}
                {currentOrder.payment_info && (
                  <div className="mt-3 p-3 rounded-lg border-l-4 border-blue-400 bg-blue-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {currentOrder.payment_info.payment_method === 'online' ? (
                          <CreditCardIcon className="h-5 w-5 text-blue-600" />
                        ) : (
                          <BanknotesIcon className="h-5 w-5 text-orange-600" />
                        )}
                        <span className="font-medium text-gray-800">Payment Status</span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        currentOrder.payment_info.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : currentOrder.payment_info.status === 'pending'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {currentOrder.payment_info.status === 'completed' ? '✅ Paid' :
                         currentOrder.payment_info.status === 'pending' ? '⏳ Pending' :
                         currentOrder.payment_info.status}
                      </span>
                    </div>
                    
                    {currentOrder.payment_info.payment_method === 'cash' && 
                     currentOrder.payment_info.status === 'pending' && (
                      <p className="text-sm text-orange-700 mt-2">
                        💰 Staff will collect ₹{currentOrder.total_amount} when your order is ready
                      </p>
                    )}
                    
                    {currentOrder.payment_info.payment_method === 'online' && 
                     currentOrder.payment_info.status === 'completed' && (
                      <p className="text-sm text-green-700 mt-2">
                        ✅ Payment of ₹{currentOrder.payment_info.amount} confirmed
                        {currentOrder.payment_info.transaction_id && (
                          <span className="block text-xs text-gray-600 mt-1">
                            Transaction ID: {currentOrder.payment_info.transaction_id}
                          </span>
                        )}
                      </p>
                    )}
                    
                    {currentOrder.payment_info.tip_amount > 0 && (
                      <p className="text-sm text-purple-700 mt-1">
                        💚 Tip: ₹{currentOrder.payment_info.tip_amount} (Thank you!)
                      </p>
                    )}
                  </div>
                )}
                
                {currentOrder.special_instructions && (
                  <div className="mt-2 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                    <p className="text-sm text-yellow-800">
                      <strong>Special Instructions:</strong> {currentOrder.special_instructions}
                    </p>
                  </div>
                )}
              </div>

              {/* Status Timeline */}
              <div className="space-y-4">
                <h4 className="font-semibold text-black">Order Status</h4>
                <div className="space-y-3">
                  {orderStatuses.map((status, index) => {
                    const isCompleted = isStatusCompleted(status.id)
                    const isCurrent = currentOrder.status === status.id
                    const StatusIcon = status.icon

                    return (
                      <motion.div
                        key={status.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center gap-4 p-3 rounded-lg transition-all ${
                          isCurrent 
                            ? 'bg-blue-50 border-2 border-blue-200' 
                            : isCompleted 
                              ? 'bg-green-50' 
                              : 'bg-gray-50'
                        }`}
                      >
                        <div className={`p-2 rounded-full ${
                          isCurrent 
                            ? 'bg-blue-500 text-white' 
                            : isCompleted 
                              ? 'bg-green-500 text-white' 
                              : status.bgColor
                        }`}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        
                        <div className="flex-1">
                          <p className={`font-medium ${
                            isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-700'
                          }`}>
                            {status.label}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-blue-600">Current status</p>
                          )}
                          {isCompleted && !isCurrent && (
                            <p className="text-sm text-green-600">Completed</p>
                          )}
                        </div>

                        {isCurrent && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-3 h-3 bg-blue-500 rounded-full"
                          />
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              </div>

              {/* Order Items */}
              {currentOrder.order_items && currentOrder.order_items.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-black">Order Items</h4>
                  <div className="space-y-2">
                    {currentOrder.order_items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-black">{item.item_name}</p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          {item.special_instructions && (
                            <p className="text-xs text-gray-500 italic">{item.special_instructions}</p>
                          )}
                        </div>
                        <p className="font-medium text-black">₹{item.total_price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Orders History */}
              {orders.length > 1 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-black">Order History</h4>
                  <div className="space-y-2">
                    {orders.map((order, index) => (
                      <button
                        key={order.id}
                        onClick={() => setCurrentOrder(order)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          currentOrder.id === order.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium text-black">Order #{order.order_number}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(order.created_at).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-black">₹{order.total_amount}</p>
                            <p className={`text-sm capitalize ${
                              order.status === 'completed' ? 'text-green-600' :
                              order.status === 'cancelled' ? 'text-red-600' :
                              'text-blue-600'
                            }`}>
                              {order.status}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default OrderTracking
