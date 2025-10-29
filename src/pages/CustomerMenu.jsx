import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeftIcon, 
  Bars3Icon,
  HeartIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  MinusIcon,
  ShoppingCartIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { supabase } from '../config/supabase'
import useCartStore from '../stores/useCartStore'
import UnifiedOrderService from '../services/unifiedOrderService'
import NotificationService from '../services/notificationService'
import tableService from '../services/tableService'
import realtimeService from '../services/realtimeService'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'

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

// Brand colors
const BRAND_LIME = '#C6FF3D'
const BRAND_BLACK = '#2D2D2D'

const CustomerMenu = () => {
  const navigate = useNavigate()
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
  
  // New menu UI states
  const [selectedFilters, setSelectedFilters] = useState([])
  const [favorites, setFavorites] = useState([])
  const [itemQuantities, setItemQuantities] = useState({})

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

  const handleCheckoutSuccess = (orderData) => {
    // Called when CheckoutModal successfully creates an order
    console.log('✅ Order completed successfully:', orderData)
    
    // Close checkout modal
    setShowCheckout(false)
    setShowCart(false)
    
    // Show order tracking
    setCurrentOrder(orderData)
    setShowOrderTracking(true)
  }

  // Helper functions for new menu UI
  const toggleFilter = (filter) => {
    setSelectedFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const toggleFavorite = (itemId) => {
    setFavorites(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const updateItemQuantity = (itemId, change) => {
    setItemQuantities(prev => {
      const current = prev[itemId] || 0
      const newQuantity = Math.max(0, current + change)
      return { ...prev, [itemId]: newQuantity }
    })
  }

  const handleAddToCartWithQuantity = (item) => {
    const quantity = itemQuantities[item.id] || 0
    if (quantity > 0) {
      for (let i = 0; i < quantity; i++) {
        addToCart(item)
      }
      toast.success(`Added ${quantity} ${item.name} to cart`)
    } else {
      addToCart(item)
      setItemQuantities(prev => ({ ...prev, [item.id]: 1 }))
      toast.success(`Added ${item.name} to cart`)
    }
  }

  // Filter items by category and dietary filters
  let filteredItems = menuItems.filter(item => item.category_id === activeCategory)
  
  if (selectedFilters.length > 0) {
    filteredItems = filteredItems.filter(item => {
      if (selectedFilters.includes('veg') && item.is_vegetarian) return true
      if (selectedFilters.includes('non-veg') && !item.is_vegetarian) return true
      if (selectedFilters.includes('egg') && item.contains_egg) return true
      if (selectedFilters.includes('highly-reordered') && item.is_popular) return true
      return selectedFilters.length === 0
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND_LIME }}>
        {/* Playful Background - Matching Landing Page */}
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

        {/* Loading Content */}
        <div className="relative z-10 text-center px-4">
          {/* Logo Container - Matching Landing Page Style */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
            className="mb-8"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="bg-white rounded-2xl px-8 py-6 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] inline-block"
            >
              <img src={logo} alt="Ordyrr" className="h-20 w-auto" />
            </motion.div>
          </motion.div>

          {/* Loading Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl sm:text-3xl font-black text-black mb-3 tracking-tight">
              LOADING MENU
            </h2>
            <p className="text-base font-bold text-black/70 mb-6">
              Preparing delicious options for you... 🍽️
            </p>
            
            {/* Animated Food Emojis */}
            <div className="flex items-center justify-center gap-4">
              {['🍕', '🍔', '🍜', '🍰'].map((emoji, i) => (
                <motion.div
                  key={i}
                  className="text-4xl"
                  animate={{
                    y: [0, -15, 0],
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                >
                  {emoji}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Error state
  if (!restaurant) {
    return <ErrorScreen onRetry={() => window.location.reload()} />
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
              onClick={() => navigate(-1)}
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

      {/* Restaurant Info Card */}
      {restaurant && (
        <div className="relative z-10 p-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center border-3 border-black" style={{ backgroundColor: BRAND_LIME }}>
                {restaurant.logo_url ? (
                  <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="text-lg font-bold text-black">{restaurant.name?.charAt(0)}</span>
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="font-black text-black text-lg">{restaurant.name}</h2>
                <p className="text-sm font-bold text-black/70">{restaurant.address}</p>
                {table && (
                  <p className="text-xs font-bold text-black/50 mt-1">Table {table.table_number}</p>
                )}
              </div>

              {currentOrder && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowOrderTracking(true)}
                  className="px-3 py-2 rounded-full text-sm font-black border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                  style={{ backgroundColor: BRAND_LIME, color: BRAND_BLACK }}
                >
                  Track Order
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>
      )}


      {/* Hero Banner with Category - Boxy Brand Style */}
      {activeCategory && categories.find(c => c.id === activeCategory) && (
        <div className="relative z-10 p-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] mb-4 flex items-center justify-between"
            style={{ backgroundColor: BRAND_LIME }}
          >
            <div className="flex-1">
              <h2 className="text-3xl font-black text-black mb-2 uppercase italic tracking-tight">
                {categories.find(c => c.id === activeCategory)?.name}
              </h2>
              <p className="text-base font-bold text-black/70">
                {filteredItems.length} items
              </p>
            </div>
            
            {/* Circular Food Image */}
            <div className="w-28 h-28 rounded-full border-4 border-black shadow-lg overflow-hidden bg-white flex-shrink-0">
              {categories.find(c => c.id === activeCategory)?.image_url ? (
                <img 
                  src={categories.find(c => c.id === activeCategory).image_url} 
                  alt={categories.find(c => c.id === activeCategory)?.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500">
                  <span className="text-4xl">🍽️</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Filter Chips - Brand Style */}
      <div className="px-4 py-3 border-b-2 border-black sticky top-[72px] z-40" style={{ backgroundColor: BRAND_LIME }}>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide max-w-4xl mx-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleFilter('veg')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black whitespace-nowrap transition-all ${
              selectedFilters.includes('veg')
                ? 'bg-black text-white'
                : 'bg-white text-black'
            }`}
          >
            <div className="w-3 h-3 rounded-full bg-green-500 border border-green-700"></div>
            <span className="text-sm font-bold">Veg</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleFilter('non-veg')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black whitespace-nowrap transition-all ${
              selectedFilters.includes('non-veg')
                ? 'bg-black text-white'
                : 'bg-white text-black'
            }`}
          >
            <div className="w-3 h-3 bg-red-500 border border-red-700" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
            <span className="text-sm font-bold">Non-veg</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleFilter('egg')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black whitespace-nowrap transition-all ${
              selectedFilters.includes('egg')
                ? 'bg-black text-white'
                : 'bg-white text-black'
            }`}
          >
            <div className="w-3 h-3 rounded-sm bg-yellow-600 border border-yellow-800"></div>
            <span className="text-sm font-bold">Egg</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleFilter('highly-reordered')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 border-black whitespace-nowrap transition-all ${
              selectedFilters.includes('highly-reordered')
                ? 'bg-black text-white'
                : 'bg-white text-black'
            }`}
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span className="text-sm font-bold">Highly Reordered</span>
          </motion.button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-4 py-3 border-b-2 border-black sticky top-[132px] z-40" style={{ backgroundColor: BRAND_LIME }}>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide max-w-4xl mx-auto">
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(category.id)}
              className={`px-6 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all border-2 border-black ${
                activeCategory === category.id
                  ? 'bg-black text-white'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              {category.name}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Professional Menu Grid - Swiggy Style */}
      <div className="px-4 py-4 max-w-4xl mx-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map((item, index) => {
              const quantity = itemQuantities[item.id] || 0
              const isFavorite = favorites.includes(item.id)
              
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200"
                >
                  {/* Food Image */}
                  <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                    
                    {/* Badges */}
                    {item.is_popular && (
                      <div className="absolute top-2 left-2 bg-pink-500 text-white px-2 py-1 rounded-md flex items-center gap-1 text-xs font-bold">
                        <HeartSolidIcon className="w-3 h-3" />
                        Most Loved
                      </div>
                    )}
                    
                    {item.is_special && (
                      <div className="absolute top-2 left-2 bg-teal-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                        Chef's Special
                      </div>
                    )}

                    {/* Favorite Button */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleFavorite(item.id)}
                      className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md"
                    >
                      {isFavorite ? (
                        <HeartSolidIcon className="w-5 h-5 text-red-500" />
                      ) : (
                        <HeartIcon className="w-5 h-5 text-gray-600" />
                      )}
                    </motion.button>
                  </div>

                  {/* Item Details */}
                  <div className="p-3">
                    <h3 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
                      {item.name}
                    </h3>
                    
                    {/* Meta Info */}
                    <div className="flex items-center gap-2 mb-2 text-xs text-gray-600">
                      {item.prep_time && (
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          <span>{item.prep_time} min</span>
                        </div>
                      )}
                      {item.serves && (
                        <div className="flex items-center gap-1">
                          <UserGroupIcon className="w-3 h-3" />
                          <span>{item.serves}</span>
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {item.description || 'Delicious and freshly prepared'}
                    </p>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg font-bold text-gray-900">
                        ₹{item.price}
                      </span>
                      {item.original_price && item.original_price > item.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ₹{item.original_price}
                        </span>
                      )}
                    </div>

                    {/* Add to Cart / Quantity Controls */}
                    {quantity === 0 ? (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setItemQuantities(prev => ({ ...prev, [item.id]: 1 }))
                          handleAddToCart(item)
                        }}
                        className="w-full py-2 rounded-lg font-bold text-sm text-black border-2 border-black transition-all shadow-md"
                        style={{ backgroundColor: BRAND_LIME }}
                      >
                        ADD
                        {item.customizable && (
                          <span className="block text-xs font-normal opacity-90">customisable</span>
                        )}
                      </motion.button>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg px-3 py-2 border-2 border-black" style={{ backgroundColor: BRAND_LIME }}>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateItemQuantity(item.id, -1)}
                          className="w-6 h-6 rounded-full bg-black flex items-center justify-center"
                        >
                          <MinusIcon className="w-4 h-4 text-white" />
                        </motion.button>
                        
                        <span className="text-black font-bold">{quantity}</span>
                        
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateItemQuantity(item.id, 1)}
                          className="w-6 h-6 rounded-full bg-black flex items-center justify-center"
                        >
                          <PlusIcon className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {getCartCount() > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-4xl mx-auto"
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCart(true)}
            className="w-full py-4 rounded-2xl font-bold text-black shadow-2xl flex items-center justify-between px-6 border-4 border-black"
            style={{ backgroundColor: BRAND_LIME }}
          >
            <div className="flex items-center gap-2">
              <ShoppingCartIcon className="w-6 h-6" />
              <span>View cart • {getCartCount()} items</span>
            </div>
            <div className="flex items-center gap-2">
              <span>₹{cart.reduce((total, item) => total + item.price, 0)}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </motion.button>
        </motion.div>
      )}

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
            onSuccess={handleCheckoutSuccess}
            restaurantId={restaurantId}
            tableId={finalTableId}
            sessionId={sessionId}
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
