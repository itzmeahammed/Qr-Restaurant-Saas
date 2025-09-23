import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../config/supabase'
import useCartStore from '../stores/useCartStore'
import OrderService from '../services/orderService'
import realtimeService from '../services/realtimeService'
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

  useEffect(() => {
    initializeCustomerSession()
    fetchRestaurantData()
    
    return () => {
      realtimeService.unsubscribeAll()
    }
  }, [restaurantId, finalTableId])

  const initializeCustomerSession = async () => {
    try {
      if (restaurantId) {
        const sessionToken = initializeSession(restaurantId, finalTableId)
        setSessionId(sessionToken)
        console.log('✅ Customer session initialized:', sessionToken)
        
        // Subscribe to real-time updates
        subscribeToOrderUpdates(sessionToken)
      }
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

      // Fetch categories
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

      // Fetch menu items
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
      toast.error(`Failed to load menu: ${error.message}`)
      
      // If restaurant not found, show error state
      if (error.code === 'PGRST116' || error.message.includes('No rows found')) {
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
      {/* Restaurant Header */}
      <RestaurantHeader 
        restaurant={restaurant}
        table={table}
        cartCount={getCartCount()}
        onCartClick={() => setShowCart(true)}
        onOrderTrackingClick={() => setShowOrderTracking(true)}
        hasCurrentOrder={!!currentOrder}
      />

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
      </AnimatePresence>
    </div>
  )
}

export default CustomerMenu
