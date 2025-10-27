import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import useCartStore from '../stores/useCartStore'
import OrderService from '../services/orderService'
import realtimeService from '../services/realtimeService'
import tableService from '../services/tableService'
import toast from 'react-hot-toast'

// Import new components
import RestaurantHeader from '../components/customer/RestaurantHeader'
import CategoryTabs from '../components/customer/CategoryTabs'
import MenuGrid from '../components/customer/MenuGrid'
import LoadingScreen from '../components/customer/LoadingScreen'
import ErrorScreen from '../components/customer/ErrorScreen'
import CartSidebar from '../components/customer/CartSidebar'
import CheckoutModal from '../components/customer/CheckoutModal'
import OrderTracking from '../components/customer/OrderTracking'
import CustomerNavHeader from '../components/customer/CustomerNavHeader'
import FloatingBackButton from '../components/customer/FloatingBackButton'
import MobileMenu from '../components/customer/MobileMenu'

const CustomerMenu = () => {
  const { restaurantId, tableId } = useParams()
  const [searchParams] = useSearchParams()
  const { cart, addToCart, initializeSession, getCartCount } = useCartStore()
  
  // Get table info from URL params or search params
  const tableNumber = searchParams.get('table')
  const tableIdFromQuery = searchParams.get('tableId')
  const finalTableId = tableId || tableIdFromQuery
  
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
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    initializeCustomerSession()
    fetchRestaurantData()
    
    return () => {
      // Cleanup realtime connections safely
      try {
        realtimeService.cleanup()
      } catch (error) {
        console.warn('Error during cleanup:', error)
      }
    }
  }, [restaurantId, finalTableId])

  const initializeCustomerSession = async () => {
    try {
      if (restaurantId) {
        const sessionToken = initializeSession(restaurantId, finalTableId)
        setSessionId(sessionToken)
        console.log('✅ Customer session initialized:', sessionToken)
        
        // Reserve table if tableId is provided (QR scan)
        if (finalTableId) {
          try {
            await tableService.reserveTableByCustomer(
              finalTableId, 
              restaurantId, 
              sessionToken,
              {} // Customer info will be added during checkout
            )
            toast.success(`Table ${tableNumber || 'reserved'} successfully!`, {
              icon: '🪑',
              duration: 3000
            })
          } catch (tableError) {
            console.warn('Table reservation failed:', tableError)
            // Don't block the customer experience if table reservation fails
            if (tableError.message.includes('already reserved')) {
              toast.error('This table is currently occupied. Please contact staff for assistance.', {
                duration: 5000
              })
            }
          }
        }
        
        // Subscribe to real-time updates
        subscribeToOrderUpdates(sessionToken)
      }
    } catch (error) {
      console.error('Session initialization error:', error)
    }
  }

  const subscribeToOrderUpdates = (sessionId) => {
    try {
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
        },
        onError: (error) => {
          console.warn('Realtime connection error:', error)
          // Continue without realtime - app still works
        },
        onTimeout: () => {
          console.warn('Realtime connection timeout - continuing without live updates')
        },
        onClosed: () => {
          console.log('Realtime connection closed')
        }
      })
    } catch (error) {
      console.error('Error setting up realtime subscription:', error)
      // App continues to work without realtime
    }
  }

  const fetchRestaurantData = async () => {
    try {
      // Fetch restaurant info from users table (consistent foreign key)
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('users')
        .select('*')
        .eq('id', restaurantId)
        .eq('role', 'restaurant_owner')
        .single()

      if (restaurantError) throw restaurantError
      setRestaurant(restaurantData)

      // Fetch table info if tableId exists
      if (finalTableId) {
        try {
          const { data: tableData, error: tableError } = await supabase
            .from('tables')
            .select('*')
            .eq('id', finalTableId)
            .single()

          if (tableError) {
            console.warn('Table not found by ID:', tableError)
          } else {
            setTable(tableData)
          }
        } catch (err) {
          console.warn('Error fetching table by ID:', err)
        }
      } else if (tableNumber) {
        try {
          // If we only have table number, try to find the table by number
          const { data: tableData, error: tableError } = await supabase
            .from('tables')
            .select('*')
            .eq('restaurant_id', restaurantData.id)
            .eq('table_number', tableNumber)
            .single()

          if (tableError) {
            console.warn('Table not found by number:', tableError)
          } else {
            setTable(tableData)
          }
        } catch (err) {
          console.warn('Error fetching table by number:', err)
        }
      }

      // Fetch categories - categories.restaurant_id references restaurants.id
      try {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .eq('is_active', true)
          .order('name')

        if (categoriesError) {
          console.warn('Categories fetch error:', categoriesError)
          setCategories([])
        } else {
          setCategories(categoriesData || [])
          setActiveCategory(categoriesData?.[0]?.id)
        }
      } catch (err) {
        console.warn('Error fetching categories:', err)
        setCategories([])
      }

      // Fetch menu items - menu_items.restaurant_id references restaurants.id
      try {
        const { data: itemsData, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurantData.id)
          .eq('is_available', true)
          .order('name')

        if (itemsError) {
          console.warn('Menu items fetch error:', itemsError)
          setMenuItems([])
        } else {
          setMenuItems(itemsData || [])
        }
      } catch (err) {
        console.warn('Error fetching menu items:', err)
        setMenuItems([])
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error)
      
      // Handle different types of errors
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        toast.error('Network connection issue. Please check your internet and try again.')
      } else if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
        toast.error('Restaurant not found')
        setRestaurant(null)
      } else {
        toast.error(`Failed to load menu: ${error.message || 'Unknown error'}`)
      }
      
      // Set error state but don't break the app
      if (error.code === 'PGRST116' || error.message?.includes('No rows found')) {
        setRestaurant(null)
      }
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
      
      // Validate required data
      if (!restaurantId) {
        throw new Error('Restaurant information is missing')
      }
      
      if (!sessionId) {
        throw new Error('Session not initialized')
      }
      
      if (!cart || cart.length === 0) {
        throw new Error('Cart is empty')
      }

      console.log('🛒 Creating order with data:', {
        restaurantId,
        tableId: finalTableId,
        sessionId,
        itemCount: cart.length
      })
      
      const orderData = {
        restaurantId,
        tableId: finalTableId,
        sessionId,
        customerId: null, // Anonymous customer
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || ''
        })),
        specialInstructions: checkoutData?.customerInfo?.specialInstructions || '',
        paymentMethod: checkoutData?.customerInfo?.paymentMethod || 'cash',
        tipAmount: checkoutData?.selectedTip || 0
      }

      // Update customer session with customer details from checkout
      if (checkoutData?.customerInfo?.name && checkoutData?.customerInfo?.phone) {
        try {
          await supabase
            .from('customer_sessions')
            .update({
              customer_name: checkoutData.customerInfo.name,
              customer_phone: checkoutData.customerInfo.phone
            })
            .eq('session_id', sessionId)
          
          console.log('✅ Customer session updated with customer details')
        } catch (sessionError) {
          console.warn('Failed to update customer session:', sessionError)
          // Continue with order creation even if session update fails
        }
      }

      console.log('📝 Order data prepared:', orderData)
      
      const order = await OrderService.createOrder(orderData)
      
      console.log('✅ Order created successfully:', order)
      
      // Clear cart and close modals
      useCartStore.getState().clearCart()
      setShowCheckout(false)
      setShowCart(false)
      
      // Show order tracking
      setCurrentOrder(order)
      setShowOrderTracking(true)
      
      toast.success(`Order #${order.order_number} placed successfully!`)
    } catch (error) {
      console.error('❌ Checkout error:', error)
      
      // Show specific error messages
      if (error.message.includes('customer_id')) {
        toast.error('Database configuration issue. Please contact support.')
      } else if (error.message.includes('PGRST')) {
        toast.error('Database connection issue. Please try again.')
      } else {
        toast.error(`Failed to place order: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = menuItems.filter(item => item.category_id === activeCategory)

  // Loading state
  if (loading) {
    return <LoadingScreen />
  }

  // Error state
  if (!restaurant) {
    return <ErrorScreen onRetry={() => window.location.reload()} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Restaurant Header with Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        {/* Top Navigation Bar */}
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
            </motion.button>
            
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {restaurant?.name || 'Menu'}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              {getCartCount() > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCart(true)}
                  className="relative w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-all"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 1.5M7 13l1.5 1.5M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {getCartCount()}
                  </span>
                </motion.button>
              )}
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMobileMenu(true)}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        {restaurant && (
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                {restaurant.logo_url ? (
                  <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-lg font-bold text-gray-600">{restaurant.name?.charAt(0)}</span>
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="font-bold text-gray-900">{restaurant.name}</h2>
                <p className="text-sm text-gray-600">{restaurant.address}</p>
                {table && (
                  <p className="text-xs text-gray-500 mt-1">Table {table.table_number}</p>
                )}
              </div>

              {currentOrder && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowOrderTracking(true)}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
                >
                  Track Order
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>


      {/* Category Tabs */}
      <CategoryTabs 
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Menu Grid */}
      <MenuGrid 
        items={filteredItems}
        onAddToCart={handleAddToCart}
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Modals and Sidebars */}
      <AnimatePresence>
        {/* Mobile Menu */}
        <MobileMenu 
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
        />

        {/* Cart Sidebar */}
        {showCart && (
          <CartSidebar 
            key="cart-sidebar"
            isOpen={showCart}
            onClose={() => setShowCart(false)}
            onCheckout={() => {
              setShowCart(false)
              setShowCheckout(true)
            }}
          />
        )}

        {/* Checkout Modal */}
        {showCheckout && (
          <CheckoutModal
            key="checkout-modal"
            isOpen={showCheckout}
            onClose={() => setShowCheckout(false)}
            onConfirm={handleCheckout}
          />
        )}

        {/* Order Tracking */}
        {showOrderTracking && (
          <OrderTracking
            key="order-tracking"
            order={currentOrder}
            isOpen={showOrderTracking}
            onClose={() => setShowOrderTracking(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomerMenu
