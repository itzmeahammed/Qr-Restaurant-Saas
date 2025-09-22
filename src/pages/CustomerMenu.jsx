import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ShoppingCartIcon, 
  PlusIcon,
  MapPinIcon,
  ClockIcon,
  CheckBadgeIcon as LeafIcon,
  FireIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import useCartStore from '../stores/useCartStore'
import CartSidebar from '../components/customer/CartSidebar'
import CheckoutModal from '../components/customer/CheckoutModal'
import OrderTracking from '../components/customer/OrderTracking'
import OrderService from '../services/orderService'
import realtimeService from '../services/realtimeService'
import toast from 'react-hot-toast'

const CustomerMenu = () => {
  const { restaurantId, tableId } = useParams()
  const { cart, addToCart, initializeSession, getCartCount } = useCartStore()
  
  const [restaurant, setRestaurant] = useState(null)
  const [table, setTable] = useState(null)
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showOrderTracking, setShowOrderTracking] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeCustomerSession()
    fetchRestaurantData()
    
    return () => {
      realtimeService.unsubscribeAll()
    }
  }, [restaurantId, tableId])

  const initializeCustomerSession = async () => {
    try {
      const sessionToken = initializeSession(restaurantId, tableId)
      setSessionId(sessionToken)
      
      // Subscribe to real-time updates
      subscribeToOrderUpdates(sessionToken)
    } catch (error) {
      console.error('Session initialization error:', error)
    }
  }

  const subscribeToOrderUpdates = (sessionId) => {
    realtimeService.subscribeToSession(sessionId, {
      onOrderConfirmed: (data) => {
        toast.success(`Order #${data.orderNumber} confirmed!`)
        setCurrentOrder(data)
        setShowOrderTracking(true)
      },
      onOrderAssigned: (data) => {
        toast.success(`${data.staffName} is handling your order`)
        setCurrentOrder(prev => ({ ...prev, assignedStaff: data.staffName }))
      },
      onStatusUpdate: (data) => {
        const statusMessages = {
          preparing: '👨‍🍳 Your order is being prepared',
          ready: '✅ Your order is ready!',
          served: '🍽️ Your order has been served'
        }
        toast(statusMessages[data.status] || 'Order updated', { icon: '📱' })
        setCurrentOrder(prev => ({ ...prev, status: data.status }))
      }
    })
  }

  const fetchRestaurantData = async () => {
    try {
      // Fetch restaurant info
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single()

      if (restaurantError) throw restaurantError
      setRestaurant(restaurantData)

      // Fetch table info if tableId exists
      if (tableId) {
        const { data: tableData, error: tableError } = await supabase
          .from('restaurant_tables')
          .select('*')
          .eq('id', tableId)
          .single()

        if (!tableError) {
          setTable(tableData)
        }
      }

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .eq('is_active', true)
        .order('sort_order')

      if (categoriesError) throw categoriesError
      setCategories(categoriesData)
      setActiveCategory(categoriesData[0]?.id)

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantData.id)
        .eq('is_available', true)
        .order('sort_order')

      if (itemsError) throw itemsError
      setMenuItems(itemsData)
    } catch (error) {
      toast.error('Failed to load menu')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (item) => {
    addToCart(item)
    toast.success(`${item.name} added to cart`)
  }

  const handleCheckout = async (checkoutData) => {
    try {
      setLoading(true)
      
      const orderData = {
        restaurantId,
        tableId,
        sessionId,
        customerId: null,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        specialInstructions: checkoutData.customerInfo.specialInstructions,
        paymentMethod: checkoutData.customerInfo.paymentMethod,
        tipAmount: checkoutData.selectedTip || 0
      }

      const order = await OrderService.createOrder(orderData)
      
      // Clear cart and close modals
      useCartStore.getState().clearCart()
      setShowCheckout(false)
      setShowCart(false)
      
      // Show order tracking
      setCurrentOrder(order)
      setShowOrderTracking(true)
      
      toast.success('Order placed successfully!')
    } catch (error) {
      console.error('Checkout error:', error)
      toast.error('Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = menuItems.filter(item => item.category_id === activeCategory)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-500 to-purple-600 text-white sticky top-0 z-40 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{restaurant?.name}</h1>
              <p className="text-sm opacity-90 flex items-center gap-1">
                <MapPinIcon className="h-4 w-4" />
                {table ? `Table ${table.table_number}` : restaurant?.address}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {currentOrder && (
                <button
                  onClick={() => setShowOrderTracking(true)}
                  className="p-3 bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-colors"
                >
                  <ArrowPathIcon className="h-6 w-6" />
                </button>
              )}
              <button
                onClick={() => setShowCart(true)}
                className="relative p-3 bg-white text-orange-500 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <ShoppingCartIcon className="h-6 w-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {getCartCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="bg-white border-b sticky top-16 z-30">
          <div className="px-4 py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    activeCategory === category.id
                      ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="px-4 py-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
            >
              {item.image_url && (
                <div className="h-48 overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {item.is_vegetarian && (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600">
                          <LeafIcon className="h-3 w-3" />
                          Veg
                        </span>
                      )}
                      {item.is_vegan && (
                        <span className="text-xs text-green-600">Vegan</span>
                      )}
                      {item.is_gluten_free && (
                        <span className="text-xs text-blue-600">Gluten-Free</span>
                      )}
                    </div>
                  </div>
                  <span className="text-lg font-bold text-orange-500">₹{item.price}</span>
                </div>
                
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                )}
                
                {item.preparation_time && (
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <ClockIcon className="h-3 w-3" />
                    <span>{item.preparation_time} mins</span>
                  </div>
                )}
                
                <button
                  onClick={() => handleAddToCart(item)}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white py-2 rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={showCart}
        onClose={() => setShowCart(false)}
        onCheckout={() => {
          setShowCart(false)
          setShowCheckout(true)
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onConfirm={handleCheckout}
      />

      {/* Order Tracking */}
      <OrderTracking
        order={currentOrder}
        isOpen={showOrderTracking}
        onClose={() => setShowOrderTracking(false)}
      />
    </div>
  )
}

export default CustomerMenu
