import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  StarIcon,
  MapPinIcon,
  CalendarIcon,
  ArrowLeftIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import CustomerNavHeader from '../components/customer/CustomerNavHeader'
import MobileMenu from '../components/customer/MobileMenu'
import { useCustomerNavigation } from '../contexts/CustomerNavigationContext'
import { supabase } from '../config/supabase'
import OrderService from '../services/orderService'
import useOrderStore from '../stores/useOrderStore'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

// Brand colors
const BRAND_LIME = '#C6FF3D'
const BRAND_BLACK = '#2D2D2D'

const CustomerOrders = () => {
  const navigate = useNavigate()
  
  // Use enhanced order store
  const {
    orders,
    loading,
    error,
    getCustomerOrders,
    subscribeToCustomerOrders,
    clearError
  } = useOrderStore()

  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [subscription, setSubscription] = useState(null)

  // Safe navigation hook usage
  let navigationContext = null
  try {
    navigationContext = useCustomerNavigation()
  } catch (error) {
    console.warn('CustomerOrders: Navigation context not available')
  }
  
  const { currentUser, isAuthenticated } = navigationContext || {}

  // Fetch customer orders using enhanced service
  useEffect(() => {
    if (!currentUser) {
      return
    }

    // Clear any previous errors
    clearError()

    // Fetch customer orders
    const fetchCustomerOrders = async () => {
      try {
        await getCustomerOrders(currentUser.id)
      } catch (error) {
        console.error('Error fetching customer orders:', error)
        toast.error('Failed to load orders')
      }
    }

    fetchCustomerOrders()

    // Setup real-time subscription for order updates
    if (currentUser.session_id) {
      const sub = subscribeToCustomerOrders(currentUser.session_id, (orderUpdate) => {
        console.log('📨 Customer order update:', orderUpdate)
        toast.success(`Order #${orderUpdate.order_number} status updated: ${orderUpdate.status}`, {
          icon: '🔔',
          duration: 3000
        })
      })
      
      setSubscription(sub)
      
      return () => {
        if (sub) {
          sub.unsubscribe()
        }
      }
    }
  }, [currentUser])

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [subscription])

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-50'
      case 'preparing': return 'text-blue-600 bg-blue-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered': return CheckCircleIcon
      case 'preparing': return ClockIcon
      case 'cancelled': return XCircleIcon
      default: return ClockIcon
    }
  }

  // Transform orders for UI display
  const transformedOrders = orders.map(order => ({
    id: order.id,
    restaurantName: order.restaurant_name || 'Unknown Restaurant',
    restaurantAddress: order.restaurant_address || 'Unknown Address',
    date: new Date(order.created_at).toLocaleDateString(),
    time: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: order.status,
    total: order.total_amount,
    items: order.order_items?.map(item => ({
      name: item.menu_items?.name || 'Unknown Item',
      quantity: item.quantity,
      price: item.unit_price
    })) || [],
    tableNumber: order.table_number ? `Table ${order.table_number}` : 'Unknown Table',
    order_number: order.order_number
  }))

  const filteredOrders = transformedOrders.filter(order => {
    if (activeTab === 'all') return true
    return order.status === activeTab
  })

  const handleReorder = (order) => {
    toast.success(`🍽️ Added ${order.items.length} items to cart`, {
      duration: 2000
    })
  }

  const handleRateOrder = (orderId) => {
    toast.success('⭐ Thank you for your rating!', {
      duration: 2000
    })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavHeader 
          title="My Orders" 
          showBackButton={true}
          showMenu={true}
          onMenuClick={() => setShowMobileMenu(true)}
        />
        <div className="p-6 text-center py-20">
          <ClockIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your order history</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/customer-auth'}
            className="px-6 py-3 bg-black text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all"
          >
            Sign In
          </motion.button>
        </div>
        <MobileMenu 
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND_LIME }}>
      {/* Playful Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-20 right-10 w-32 h-32 rounded-full border-4 border-black/5"
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-32 left-10 w-24 h-24 rounded-full bg-black/5"
          animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Dot Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%232D2D2D'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-black border-b-4 border-black"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.1, rotate: -10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/customer')}
              className="w-12 h-12 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(198,255,61,1)] hover:shadow-[4px_4px_0_0_rgba(198,255,61,1)] transition-all"
            >
              <ArrowLeftIcon className="w-5 h-5 text-black" />
            </motion.button>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            >
              <img src={logo} alt="Ordyrr" className="h-10 w-auto" />
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(true)}
              className="w-12 h-12 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(198,255,61,1)] hover:shadow-[4px_4px_0_0_rgba(198,255,61,1)] transition-all"
            >
              <Bars3Icon className="w-5 h-5 text-black" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Page Title & User Info */}
      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] mb-4"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-black font-black text-2xl"
              style={{ backgroundColor: BRAND_LIME, color: BRAND_BLACK }}
            >
              {currentUser?.name?.charAt(0) || 'U'}
            </motion.div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-black tracking-tight mb-1">MY ORDERS</h2>
              <p className="text-black/70 font-bold text-sm">{currentUser?.email || 'Not signed in'}</p>
            </div>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: `All Orders (${transformedOrders.length})` },
              { id: 'active', label: `Active (${transformedOrders.filter(o => o.status === 'preparing').length})` },
              { id: 'delivered', label: `Delivered (${transformedOrders.filter(o => o.status === 'delivered').length})` },
              { id: 'cancelled', label: `Cancelled (${transformedOrders.filter(o => o.status === 'cancelled').length})` }
            ].map(tab => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 rounded-full font-black text-sm whitespace-nowrap border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all ${
                  activeTab === tab.id
                    ? 'bg-black text-white'
                    : 'bg-white text-black'
                }`}
                style={activeTab === tab.id ? {} : { backgroundColor: 'white' }}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Orders List */}
        {loading ? (
          <div className="text-center py-12">
            <ArrowPathIcon className="w-8 h-8 text-black mx-auto mb-4 animate-spin" />
            <p className="font-bold text-black">Loading your orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] text-center"
          >
            <ClockIcon className="w-16 h-16 text-black mx-auto mb-4" />
            <h3 className="text-2xl font-black text-black mb-2">NO ORDERS FOUND</h3>
            <p className="text-black/70 font-bold mb-6">You haven't placed any orders yet</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.href = '/restaurants'}
              className="px-8 py-4 bg-black text-white rounded-full font-black border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
              style={{ color: BRAND_LIME }}
            >
              BROWSE RESTAURANTS
            </motion.button>
          </motion.div>
        ) : (
          filteredOrders.map((order, index) => {
            const StatusIcon = getStatusIcon(order.status)
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-gray-900">{order.restaurantName}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {order.date} at {order.time}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-4 h-4" />
                        {order.tableNumber}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{order.restaurantAddress}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">₹{order.total}</p>
                    <p className="text-sm text-gray-500">#{order.id}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.quantity}x {item.name}</span>
                        <span className="text-gray-900 font-medium">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Actions */}
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleReorder(order)}
                    className="flex-1 px-4 py-2 bg-black text-white rounded-xl font-medium text-sm hover:bg-gray-800 transition-all"
                  >
                    <ArrowPathIcon className="w-4 h-4 inline mr-2" />
                    Reorder
                  </motion.button>
                  
                  {order.status === 'delivered' && !order.rating && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRateOrder(order.id)}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-xl font-medium text-sm hover:bg-yellow-600 transition-all"
                    >
                      <StarIcon className="w-4 h-4 inline mr-1" />
                      Rate
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-all"
                  >
                    <EyeIcon className="w-4 h-4 inline mr-1" />
                    Details
                  </motion.button>
                </div>
              </motion.div>
            )
          })
        )}
      </div>

      <MobileMenu 
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </div>
  )
}

export default CustomerOrders
