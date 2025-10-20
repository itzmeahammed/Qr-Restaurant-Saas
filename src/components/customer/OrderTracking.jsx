import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  FireIcon,
  TruckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import OrderService from '../../services/orderService'
import useOrderStore from '../../stores/useOrderStore'

const OrderTracking = ({ order, isOpen, onClose }) => {
  const { subscribeToCustomerOrders } = useOrderStore()
  const [currentStatus, setCurrentStatus] = useState(order?.status || 'pending')
  const [assignedStaff, setAssignedStaff] = useState(order?.assignedStaff || null)
  const [subscription, setSubscription] = useState(null)

  const orderStatuses = [
    { 
      id: 'pending', 
      label: 'Order Placed', 
      icon: CheckCircleIcon,
      color: 'text-gray-500',
      bgColor: 'bg-gray-100'
    },
    { 
      id: 'confirmed', 
      label: 'Confirmed', 
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

  useEffect(() => {
    if (order?.session_id) {
      // Subscribe to customer order updates using enhanced service
      const sub = subscribeToCustomerOrders(order.session_id, (orderUpdate) => {
        console.log('📨 Customer order update:', orderUpdate)
        if (orderUpdate.id === order.id) {
          setCurrentStatus(orderUpdate.status)
          if (orderUpdate.assigned_staff_name) {
            setAssignedStaff(orderUpdate.assigned_staff_name)
          }
        }
      })
      
      setSubscription(sub)
      
      return () => {
        if (sub) {
          sub.unsubscribe()
        }
      }
    }
  }, [order?.session_id, order?.id])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [subscription])

  const getCurrentStatusIndex = () => {
    return orderStatuses.findIndex(s => s.id === currentStatus)
  }

  const getEstimatedTime = () => {
    switch (currentStatus) {
      case 'pending':
        return 'Waiting for confirmation...'
      case 'confirmed':
        return `Assigned to ${assignedStaff || 'staff'}`
      case 'preparing':
        return 'Your order is being prepared'
      case 'ready':
        return 'Your order is ready!'
      case 'served':
        return 'Enjoy your meal!'
      default:
        return 'Processing...'
    }
  }

  if (!isOpen || !order) return null

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
          className="bg-white rounded-2xl p-6 w-full max-w-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Order Tracking</h3>
              <p className="text-sm text-gray-600 mt-1">Order #{order.orderNumber || order.id?.slice(-8)}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Status Timeline */}
          <div className="space-y-4 mb-6">
            {orderStatuses.map((status, index) => {
              const isActive = index <= getCurrentStatusIndex()
              const isCurrent = status.id === currentStatus
              const Icon = status.icon

              return (
                <div key={status.id} className="flex items-center gap-4">
                  {/* Icon */}
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                      rotate: isCurrent ? [0, 360] : 0
                    }}
                    transition={{
                      duration: isCurrent ? 2 : 0.3,
                      repeat: isCurrent ? Infinity : 0,
                      ease: "linear"
                    }}
                    className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                      isActive ? status.bgColor : 'bg-gray-100'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${isActive ? status.color : 'text-gray-400'}`} />
                    {isCurrent && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-orange-500"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    )}
                  </motion.div>

                  {/* Content */}
                  <div className="flex-1">
                    <p className={`font-medium ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>
                      {status.label}
                    </p>
                    {isCurrent && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-gray-600"
                      >
                        {getEstimatedTime()}
                      </motion.p>
                    )}
                  </div>

                  {/* Checkmark for completed */}
                  {isActive && !isCurrent && (
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Assigned Staff Info */}
          {assignedStaff && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-purple-600 rounded-full flex items-center justify-center">
                  <UserGroupIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Your server</p>
                  <p className="font-semibold text-gray-900">{assignedStaff}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Estimated Time */}
          {order.estimatedTime && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Estimated preparation time</span>
                <span className="font-semibold text-gray-900">{order.estimatedTime} mins</span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default OrderTracking
