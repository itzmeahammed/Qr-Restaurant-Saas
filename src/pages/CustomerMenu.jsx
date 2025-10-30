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
  MagnifyingGlassIcon,
  FunnelIcon,
  StarIcon,
  FireIcon,
  UserCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import bcrypt from 'bcryptjs'
import { supabase } from '../config/supabase'
import useCartStore from '../stores/useCartStore'
import UnifiedOrderService from '../services/unifiedOrderService'
import NotificationService from '../services/notificationService'
import tableService from '../services/tableService'
import realtimeService from '../services/realtimeService'
import toast from 'react-hot-toast'
import logo from '../assets/logo green.png'
import ordyrrLogo from '../assets/logo green.png'

// Import 3D Food Icons
import croissantIcon from '../assets/3D food icons/Croisant.png'
import burgerIcon from '../assets/3D food icons/Burger.png'
import pizzaIcon from '../assets/3D food icons/Pizza.png'
import coffeeIcon from '../assets/3D food icons/Cofee.png'
import cakeIcon from '../assets/3D food icons/Cake.png'
import steakIcon from '../assets/3D food icons/Steak.png'

// Import Food PNG Images for Header
import croissantSandwich from '../assets/food png/Aloo_Paratha_with_curd_and_pickle-removebg-preview.png'
import butterChicken from '../assets/food png/Butter_Chicken_with_Naan-removebg-preview.png'
import lasagna from '../assets/food png/classic_Italian_lasagna_slice__night_dinner_-removebg-preview.png'
import cupcake from '../assets/food png/fancy_cupcake__evening_snacks_-removebg-preview.png'
import biryani from '../assets/food png/plate_of_Chicken_Biryani__meals_-removebg-preview.png'
import rajmaChawal from '../assets/food png/Rajma_Chawal__Kidney_Beans_and_Rice_-removebg-preview.png'
import samosas from '../assets/food png/Samosas-removebg-preview.png'
import springRolls from '../assets/food png/spring_rolls_with_dipping_sauce__appetizer_-removebg-preview.png'
import cookies from '../assets/food png/stack_of_cookies_for__snacks_-removebg-preview.png'
import pokeBowl from '../assets/food png/vibrant_poke_bowl__afternoon_lunch_-removebg-preview.png'

// Import components
import CartSidebar from '../components/customer/CartSidebar'
import CheckoutModal from '../components/customer/CheckoutModal'
import OrderTracking from '../components/customer/OrderTracking'

// Ordyrr Brand Colors - From UI Spec
const BRAND_GREEN = '#00E676' // Header background
const ACTION_GREEN = '#00C853' // Buttons, active states
const DARK_TEXT = '#212121' // Primary text
const MEDIUM_GRAY = '#666666' // Secondary text
const LIGHT_GRAY = '#E0E0E0' // Borders
const BG_WHITE = '#FFFFFF' // Background

// Semantic Colors
const VEG_GREEN = '#4CAF50'
const NON_VEG_RED = '#D32F2F'
const EGG_ORANGE = '#F57C00'
const CHEF_SPECIAL_TEAL = '#00BCD4'
const MOST_LOVED_RED = '#FF4458'
const HIGHLY_REORDERED_GREEN = '#2E7D32'
const HIGHLY_REORDERED_BG = '#E8F5E9'

// Legacy compatibility
const LIME = ACTION_GREEN
const SUCCESS_GREEN = ACTION_GREEN

// Helper function to get category icon
const getCategoryIcon = (categoryName) => {
  const name = categoryName?.toLowerCase() || ''
  if (name.includes('breakfast') || name.includes('appetizer')) return croissantIcon
  if (name.includes('burger') || name.includes('sandwich')) return burgerIcon
  if (name.includes('pizza')) return pizzaIcon
  if (name.includes('beverage') || name.includes('drink') || name.includes('coffee')) return coffeeIcon
  if (name.includes('dessert') || name.includes('sweet')) return cakeIcon
  if (name.includes('main') || name.includes('steak') || name.includes('meat')) return steakIcon
  return croissantIcon // default
}

// Helper function to get time of day period
const getTimeOfDay = () => {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 11) return 'morning'
  if (hour >= 11 && hour < 15) return 'afternoon'
  if (hour >= 15 && hour < 18) return 'evening'
  if (hour >= 18 && hour < 23) return 'night'
  if (hour >= 23 || hour < 2) return 'latenight'
  return 'morning' // default
}

// Helper function to get time-based tagline and image
const getTimeBasedContent = () => {
  const timeOfDay = getTimeOfDay()
  
  const timeBasedData = {
    morning: {
      tagline: 'ALL-DAY BREAKFAST',
      subtitle: 'Start your day right',
      image: croissantSandwich
    },
    afternoon: {
      tagline: 'AFTERNOON DELIGHTS',
      subtitle: 'Perfect lunch picks',
      image: pokeBowl
    },
    evening: {
      tagline: 'EVENING SNACKS',
      subtitle: 'Light bites & treats',
      image: cookies
    },
    night: {
      tagline: 'DINNER SPECIALS',
      subtitle: 'Hearty meals await',
      image: butterChicken
    },
    latenight: {
      tagline: 'LATE NIGHT CRAVINGS',
      subtitle: 'Satisfy your hunger',
      image: biryani
    }
  }
  
  return timeBasedData[timeOfDay] || timeBasedData.morning
}

// Helper function to get category food PNG image for header
const getCategoryFoodImage = (categoryName) => {
  const name = categoryName?.toLowerCase() || ''
  if (name.includes('breakfast')) return croissantSandwich
  if (name.includes('appetizer') || name.includes('starter')) return springRolls
  if (name.includes('biryani') || name.includes('rice')) return biryani
  if (name.includes('main') || name.includes('meal') || name.includes('dinner')) return butterChicken
  if (name.includes('lunch')) return pokeBowl
  if (name.includes('dessert') || name.includes('sweet')) return cupcake
  if (name.includes('snack')) return cookies
  if (name.includes('indian')) return rajmaChawal
  if (name.includes('pasta') || name.includes('italian')) return lasagna
  if (name.includes('fried') || name.includes('samosa')) return samosas
  return croissantSandwich // default
}

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
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfile, setShowProfile] = useState(false)
  
  // Customer authentication states
  const [currentCustomer, setCurrentCustomer] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login') // 'login' or 'signup'
  const [loyaltyPoints, setLoyaltyPoints] = useState(0)
  
  // New menu UI states
  const [selectedFilters, setSelectedFilters] = useState([])
  const [favorites, setFavorites] = useState([])
  const [itemQuantities, setItemQuantities] = useState({})
  const [timeBasedContent, setTimeBasedContent] = useState(getTimeBasedContent())
  
  // Update time-based content every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeBasedContent(getTimeBasedContent())
    }, 60000) // Check every minute
    
    return () => clearInterval(interval)
  }, [])
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    initializeCustomerSession()
    fetchRestaurantData()
    restoreSession() // Check for existing session
    
    return () => {
      // Cleanup realtime connections safely
      try {
        realtimeService.cleanup()
      } catch (error) {
        console.warn('Error during cleanup:', error)
      }
    }
  }, [restaurantId, finalTableId])

  // Auto-slide carousel effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3) // 3 slides total
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(interval)
  }, [])

  const initializeCustomerSession = async () => {
    try {
      if (restaurantId) {
        const sessionToken = initializeSession(restaurantId, finalTableId)
        setSessionId(sessionToken)
        console.log('✅ Customer session initialized:', sessionToken)
        
        // Show welcome message for QR scan (NO table reservation yet)
        if (finalTableId && tableNumber) {
          toast.success(`Welcome to Table ${tableNumber}! Browse our menu and place your order.`, {
            icon: '🍽️',
            duration: 4000
          })
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

  // Session Management
  const saveSession = (customer) => {
    try {
      localStorage.setItem('ordyrr_customer', JSON.stringify({
        id: customer.id,
        email: customer.email,
        full_name: customer.full_name,
        phone: customer.phone,
        timestamp: new Date().toISOString()
      }))
    } catch (error) {
      console.error('Error saving session:', error)
    }
  }

  const restoreSession = async () => {
    try {
      const savedSession = localStorage.getItem('ordyrr_customer')
      if (!savedSession) return

      const sessionData = JSON.parse(savedSession)
      
      // Verify customer still exists
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', sessionData.id)
        .maybeSingle()

      if (customer && !error) {
        setCurrentCustomer(customer)
        setIsAuthenticated(true)
        await fetchLoyaltyPoints(customer.id)
        console.log('✅ Session restored:', customer.full_name)
      } else {
        localStorage.removeItem('ordyrr_customer')
      }
    } catch (error) {
      console.error('Error restoring session:', error)
      localStorage.removeItem('ordyrr_customer')
    }
  }

  const clearSession = () => {
    localStorage.removeItem('ordyrr_customer')
    setCurrentCustomer(null)
    setIsAuthenticated(false)
    setLoyaltyPoints(0)
  }

  // Fetch loyalty points for a customer
  const fetchLoyaltyPoints = async (customerId) => {
    try {
      // Fetch all loyalty point transactions for the customer
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('points_earned, points_redeemed')
        .eq('customer_id', customerId)
        .eq('restaurant_id', restaurantId)

      if (error) {
        console.error('Error fetching loyalty points:', error)
        setLoyaltyPoints(0)
        return
      }

      // Calculate total points: sum of all earned points minus redeemed points
      const totalPoints = (data || []).reduce((total, transaction) => {
        const earned = transaction.points_earned || 0
        const redeemed = transaction.points_redeemed || 0
        return total + earned - redeemed
      }, 0)

      setLoyaltyPoints(totalPoints)
      console.log('✅ Loyalty points calculated:', totalPoints, 'from', data?.length || 0, 'transactions')
    } catch (error) {
      console.error('Error fetching loyalty points:', error)
      setLoyaltyPoints(0)
    }
  }

  // Authentication Functions
  const handleLogin = async (email, password) => {
    try {
      // Find customer by email
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .maybeSingle()

      if (!customer || error) {
        toast.error('Account not found')
        return false
      }

      // Verify password
      const passwordHash = customer.dietary_preferences?.password_hash
      if (!passwordHash) {
        toast.error('Account has no password set')
        return false
      }

      const isValid = await bcrypt.compare(password, passwordHash)
      if (!isValid) {
        toast.error('Incorrect password')
        return false
      }

      // Success
      setCurrentCustomer(customer)
      setIsAuthenticated(true)
      saveSession(customer)
      await fetchLoyaltyPoints(customer.id)
      setShowAuthModal(false)
      setShowMobileMenu(true)
      toast.success(`Welcome back, ${customer.full_name}!`)
      return true
    } catch (error) {
      console.error('Login error:', error)
      toast.error('Login failed')
      return false
    }
  }

  const handleSignup = async (fullName, email, phone, password) => {
    try {
      // Check if email exists
      const { data: existing } = await supabase
        .from('customers')
        .select('email')
        .eq('email', email)

      if (existing && existing.length > 0) {
        toast.error('Email already registered')
        return false
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10)

      // Create customer
      const { data: newCustomer, error } = await supabase
        .from('customers')
        .insert([{
          email,
          phone,
          full_name: fullName,
          is_guest: false,
          total_orders: 0,
          total_spent: 0,
          loyalty_tier: 'bronze',
          dietary_preferences: { password_hash: passwordHash }
        }])
        .select()
        .single()

      if (error) throw error

      // Award signup bonus
      await supabase
        .from('loyalty_points')
        .insert([{
          customer_id: newCustomer.id,
          restaurant_id: restaurantId,
          points_earned: 100,
          points_redeemed: 0,
          current_balance: 100,
          transaction_type: 'signup_bonus',
          description: 'Welcome bonus - 100 loyalty points',
          tier: 'bronze'
        }])

      // Success
      setCurrentCustomer(newCustomer)
      setIsAuthenticated(true)
      saveSession(newCustomer)
      setLoyaltyPoints(100) // New signup gets 100 points
      setShowAuthModal(false)
      setShowMobileMenu(true)
      toast.success('🎉 Account created! You earned 100 loyalty points!')
      return true
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Signup failed')
      return false
    }
  }

  const handleLogout = () => {
    clearSession()
    setShowMobileMenu(false)
    toast.success('Logged out successfully')
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

  // Filter items by category, search query, and dietary filters
  let filteredItems = menuItems.filter(item => item.category_id === activeCategory)
  
  // Apply search filter
  if (searchQuery.trim()) {
    filteredItems = filteredItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }
  
  // Apply dietary filters
  if (selectedFilters.length > 0) {
    filteredItems = filteredItems.filter(item => {
      if (selectedFilters.includes('veg') && item.is_vegetarian) return true
      if (selectedFilters.includes('non-veg') && !item.is_vegetarian) return true
      if (selectedFilters.includes('egg') && item.contains_egg) return true
      if (selectedFilters.includes('highly-reordered') && item.is_popular) return true
      return selectedFilters.length === 0
    })
  }

  // Loading state with Ordyrr branding and food animations
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="text-center px-4">
          {/* Ordyrr Logo - Boxy with Border */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div 
              className="inline-block p-6 border-3 border-black rounded-2xl bg-white"
              style={{ boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
            >
              <img 
                src="/src/assets/logo.png"
                alt="Ordyrr" 
                className="h-16 w-auto"
              />
            </div>
          </motion.div>

          {/* Food Elements Loading Animation */}
          <div className="flex justify-center items-center gap-4 mb-8">
            {/* Pizza */}
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ 
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <span className="text-5xl">🍕</span>
            </motion.div>

            {/* Burger */}
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, -10, 0]
              }}
              transition={{ 
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.2
              }}
            >
              <span className="text-5xl">🍔</span>
            </motion.div>

            {/* Noodles */}
            <motion.div
              animate={{ 
                y: [0, -15, 0],
                rotate: [0, 10, 0]
              }}
              transition={{ 
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.4
              }}
            >
              <span className="text-5xl">🍜</span>
            </motion.div>
          </div>

          {/* Loading Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <p className="text-lg font-semibold" style={{ color: DARK_TEXT }}>Loading your menu...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  // Error state
  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
            <span className="text-4xl">😕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Not Found</h2>
          <p className="text-gray-500 mb-6">We couldn't load the menu. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Vibrant Green Header - Compact Design with Curved Bottom */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${BRAND_GREEN} 0%, #00D966 100%)`,
          minHeight: '140px',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px',
          borderBottom: '1px solid rgba(0,0,0,0.1)'
        }}
      >
        {/* Decorative sparkles */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-white rounded-full animate-pulse"
              style={{
                width: Math.random() * 6 + 3 + 'px',
                height: Math.random() * 6 + 3 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 2 + 's'
              }}
            />
          ))}
        </div>

        {/* Navigation Bar */}
        <div className="relative z-10 px-4 pt-3">
          <div className="flex items-center justify-between mb-2">
            {/* Back Button - White Circle with Curved Edge */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white flex items-center justify-center"
              style={{ 
                boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '50%',
                clipPath: 'circle(50% at 50% 50%)'
              }}
            >
              <ArrowLeftIcon className="w-5 h-5 text-black" />
            </motion.button>
            
            {/* Ordyrr Logo */}
            <img 
              src={ordyrrLogo} 
              alt="Ordyrr" 
              className="h-12"
            />
            
            {/* Profile Button - White Circle with Curved Edge */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileMenu(true)}
              className="w-10 h-10 bg-white flex items-center justify-center relative"
              style={{ 
                boxShadow: '0px 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '50%',
                clipPath: 'circle(50% at 50% 50%)'
              }}
            >
              <UserCircleIcon className="w-5 h-5 text-black" />
              {isAuthenticated && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </motion.button>
          </div>
        </div>

        {/* Category Hero Section - Compact */}
        <div className="relative z-10 px-4 pt-2 pb-4">
          <div className="flex items-center justify-between">
            {/* Left: Category Title - Time-based */}
            <div className="flex-1 pr-4" style={{ maxWidth: '55%' }}>
              <h1 
                className="font-black uppercase leading-none mb-1.5"
                style={{ 
                  fontSize: '28px',
                  letterSpacing: '-0.5px',
                  lineHeight: '0.95',
                  color: '#2C2C2C',
                  fontStyle: 'italic'
                }}
              >
                {timeBasedContent.tagline.split(' ').map((word, i) => (
                  <React.Fragment key={i}>
                    {word}{i < timeBasedContent.tagline.split(' ').length - 1 && <br/>}
                  </React.Fragment>
                ))}
              </h1>
              <p className="text-sm font-normal" style={{ color: '#424242' }}>
                {filteredItems.length} items
              </p>
            </div>

            {/* Right: Food Image - Time-based */}
            <div className="relative flex-shrink-0" style={{ width: '160px', height: '160px' }}>
              {/* Food Image */}
              <img
                src={timeBasedContent.image}
                alt={timeBasedContent.tagline}
                className="w-full h-full object-contain"
                style={{
                  filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.3)) drop-shadow(0px 4px 8px rgba(0,0,0,0.2))'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Carousel Section - Restaurant Info & Offers */}
      {restaurant && (
        <div className="px-4 py-3 relative overflow-hidden">
          <div className="relative">
            <AnimatePresence mode="wait">
              {/* Slide 1: Restaurant Info */}
              {currentSlide === 0 && (
                <motion.div
                  key="slide-1"
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="bg-white rounded-xl p-3 border border-gray-400"
                >
                  <div className="flex items-center gap-3">
                    {/* Restaurant Logo */}
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {restaurant.logo_url ? (
                        <img src={restaurant.logo_url} alt={restaurant.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl font-bold" style={{ color: DARK_TEXT }}>{restaurant.name?.charAt(0)}</span>
                      )}
                    </div>
                    
                    {/* Restaurant Details */}
                    <div className="flex-1 min-w-0">
                      <h2 className="font-bold text-sm truncate" style={{ color: DARK_TEXT }}>
                        {restaurant.restaurant_name || restaurant.name || restaurant.full_name || 'Restaurant'}
                      </h2>
                      <p className="text-sm font-bold truncate" style={{ color: DARK_TEXT }}>
                        {table ? `Table ${table.table_number}` : 'Welcome!'}
                      </p>
                      <p className="text-[10px] mt-0.5 truncate" style={{ color: MEDIUM_GRAY }}>
                        {restaurant.restaurant_address || restaurant.address || 'Enjoy your meal'}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6" style={{ color: DARK_TEXT }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Slide 2: Signup Offer */}
              {currentSlide === 1 && (
                <motion.div
                  key="slide-2"
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="bg-white rounded-xl p-3 border border-gray-400"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: BRAND_GREEN }}>
                      <span className="text-3xl">🎁</span>
                    </div>
                    
                    {/* Offer Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base" style={{ color: DARK_TEXT }}>Sign Up & Get</h3>
                      <p className="text-base font-bold" style={{ color: BRAND_GREEN }}>100 Loyalty Points</p>
                      <p className="text-xs mt-0.5" style={{ color: MEDIUM_GRAY }}>Join our loyalty program today!</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6" style={{ color: DARK_TEXT }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Slide 3: Order Discount Offer */}
              {currentSlide === 2 && (
                <motion.div
                  key="slide-3"
                  initial={{ x: 300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="bg-white rounded-xl p-3 border border-gray-400"
                >
                  <div className="flex items-center gap-3">
                    {/* Icon */}
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)' }}>
                      <span className="text-3xl">🔥</span>
                    </div>
                    
                    {/* Offer Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-base" style={{ color: DARK_TEXT }}>Order ₹499 or More</h3>
                      <p className="text-base font-bold" style={{ background: 'linear-gradient(135deg, #F97316 0%, #EF4444 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Get 10% OFF</p>
                      <p className="text-xs mt-0.5" style={{ color: MEDIUM_GRAY }}>Limited time offer!</p>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <svg className="w-6 h-6" style={{ color: DARK_TEXT }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Slide Indicators */}
            <div className="flex justify-center gap-2 mt-3">
              {[0, 1, 2].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className="transition-all"
                  style={{
                    width: currentSlide === index ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: currentSlide === index ? DARK_TEXT : '#E0E0E0'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}


      {/* Category Tabs - UI Spec */}
      <div className="bg-white">
        <div className="px-4 py-3">
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(category.id)}
                className={`px-5 py-2 rounded-full font-semibold text-xs whitespace-nowrap transition-all ${
                  activeCategory === category.id
                    ? 'bg-black text-white shadow-md'
                    : 'bg-gray-100 text-gray-600'
                }`}
                style={{
                  height: '36px',
                  fontSize: '13px',
                  fontWeight: activeCategory === category.id ? 600 : 500,
                  boxShadow: activeCategory === category.id ? '0px 2px 8px rgba(0,0,0,0.15)' : 'none'
                }}
              >
                {category.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Chips - UI Spec Exact Match */}
      <div className="sticky top-0 z-40 bg-white" style={{ borderBottom: '1px solid #F0F0F0' }}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleFilter('veg')}
              className={`flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all h-9 ${
                selectedFilters.includes('veg')
                  ? 'bg-white shadow-md'
                  : 'bg-white'
              }`}
              style={{
                borderRadius: '24px',
                border: selectedFilters.includes('veg') ? `1.5px solid ${VEG_GREEN}` : '1.5px solid #E0E0E0',
                boxShadow: selectedFilters.includes('veg') ? '0px 2px 8px rgba(76, 175, 80, 0.15)' : 'none'
              }}
            >
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: VEG_GREEN }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: VEG_GREEN }}></div>
              </div>
              <span className="text-xs font-medium" style={{ color: '#424242' }}>Veg</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleFilter('non-veg')}
              className={`flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all h-9 ${
                selectedFilters.includes('non-veg') ? 'bg-white shadow-md' : 'bg-white'
              }`}
              style={{
                borderRadius: '24px',
                border: selectedFilters.includes('non-veg') ? `1.5px solid ${NON_VEG_RED}` : '1.5px solid #E0E0E0',
                boxShadow: selectedFilters.includes('non-veg') ? '0px 2px 8px rgba(211, 47, 47, 0.15)' : 'none'
              }}
            >
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: NON_VEG_RED }}>
                <div className="w-1.5 h-1.5" style={{ backgroundColor: NON_VEG_RED, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
              </div>
              <span className="text-xs font-medium" style={{ color: '#424242' }}>Non-veg</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleFilter('egg')}
              className={`flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all h-9 ${
                selectedFilters.includes('egg') ? 'bg-white shadow-md' : 'bg-white'
              }`}
              style={{
                borderRadius: '24px',
                border: selectedFilters.includes('egg') ? `1.5px solid ${EGG_ORANGE}` : '1.5px solid #E0E0E0',
                boxShadow: selectedFilters.includes('egg') ? '0px 2px 8px rgba(245, 124, 0, 0.15)' : 'none'
              }}
            >
              <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: EGG_ORANGE }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: EGG_ORANGE }}></div>
              </div>
              <span className="text-xs font-medium" style={{ color: '#424242' }}>Egg</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleFilter('highly-reordered')}
              className={`flex items-center gap-2 px-3 py-2 whitespace-nowrap transition-all h-9 ${
                selectedFilters.includes('highly-reordered') ? 'bg-white shadow-md' : 'bg-white'
              }`}
              style={{
                borderRadius: '24px',
                border: selectedFilters.includes('highly-reordered') ? `1.5px solid ${VEG_GREEN}` : '1.5px solid #E0E0E0',
                boxShadow: selectedFilters.includes('highly-reordered') ? '0px 2px 8px rgba(76, 175, 80, 0.15)' : 'none'
              }}
            >
              <FireIcon className="w-4 h-4" style={{ color: VEG_GREEN }} />
              <span className="text-xs font-medium" style={{ color: '#424242' }}>Highly Reordered</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Food Cards - Horizontal Scrolling Layout with Sections */}
      <div className="py-4 pb-32">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
              <span className="text-4xl">🔍</span>
            </div>
            <p className="text-gray-500 font-medium">No items found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            {/* Section: Everything Under ₹99 */}
            {filteredItems.filter(item => item.price < 99).length > 0 && (
              <div className="mb-6">
                <h2 className="px-4 mb-3 font-black italic uppercase" style={{ fontSize: '20px', color: DARK_TEXT }}>
                  EVERYTHING UNDER ₹99
                  <span style={{ color: BRAND_GREEN }}>.</span>
                </h2>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
                  {filteredItems.filter(item => item.price < 99).map((item, index) => {
                    const quantity = itemQuantities[item.id] || 0
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="bg-white rounded-2xl overflow-hidden flex-shrink-0"
                        style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.08)', width: '180px' }}
                      >
                        {/* Food Image */}
                        <div 
                          onClick={() => navigate(`/menu/${restaurantId}/item/${item.id}`, {
                            state: { tableId: finalTableId, tableNumber }
                          })}
                          className="relative bg-gray-100 cursor-pointer"
                          style={{ height: '120px', borderRadius: '16px 16px 0 0' }}
                        >
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <span className="text-4xl">🍽️</span>
                            </div>
                          )}
                          {item.is_popular && (
                            <div className="absolute top-2 left-2 px-3 py-1.5 rounded-md flex items-center gap-1"
                              style={{ background: 'linear-gradient(135deg, #FF4458 0%, #FF6B7A 100%)', boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}>
                              <HeartSolidIcon className="w-3.5 h-3.5 text-white" />
                              <span className="text-xs font-semibold text-white">Most Loved</span>
                            </div>
                          )}
                        </div>
                        {/* Card Content */}
                        <div className="p-2.5">
                          <div className="flex items-center gap-1 mb-1.5">
                            {item.is_vegetarian ? (
                              <div className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: VEG_GREEN }}>
                                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: VEG_GREEN }}></div>
                              </div>
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: NON_VEG_RED }}>
                                <div className="w-1 h-1" style={{ backgroundColor: NON_VEG_RED, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                              </div>
                            )}
                            <ClockIcon className="w-3 h-3 flex-shrink-0" style={{ color: ACTION_GREEN }} />
                            <span className="text-[10px] font-medium" style={{ color: DARK_TEXT }}>16 mins</span>
                            <span className="text-[10px] font-medium" style={{ color: DARK_TEXT }}>2 cups</span>
                          </div>
                          <h3 className="font-semibold line-clamp-2 mb-1 cursor-pointer" style={{ fontSize: '13px', fontWeight: 600, color: DARK_TEXT, lineHeight: '1.3' }}
                            onClick={() => navigate(`/menu/${restaurantId}/item/${item.id}`, { state: { tableId: finalTableId, tableNumber } })}>
                            {item.name}
                          </h3>
                          {item.is_popular && (
                            <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded mb-1" style={{ backgroundColor: HIGHLY_REORDERED_BG }}>
                              <span className="text-[9px] font-semibold" style={{ color: HIGHLY_REORDERED_GREEN }}>Highly reordered</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-sm font-bold" style={{ color: DARK_TEXT }}>₹{item.price}</span>
                            {quantity === 0 ? (
                              <motion.button whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); setItemQuantities(prev => ({ ...prev, [item.id]: 1 })); handleAddToCart(item); }}
                                className="px-3 py-1 rounded-lg font-black border-3 border-black"
                                style={{ backgroundColor: ACTION_GREEN, color: '#000000', boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)', fontSize: '11px' }}>
                                ADD
                              </motion.button>
                            ) : (
                              <div className="px-2 py-1 rounded-lg border-3 border-black flex items-center gap-1.5"
                                style={{ backgroundColor: ACTION_GREEN, boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, -1); }}
                                  className="w-4 h-4 rounded flex items-center justify-center text-black">
                                  <MinusIcon className="w-3 h-3 font-bold" />
                                </motion.button>
                                <span className="font-black text-xs min-w-[0.75rem] text-center text-black">{quantity}</span>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, 1); }}
                                  className="w-4 h-4 rounded flex items-center justify-center text-black">
                                  <PlusIcon className="w-3 h-3 font-bold" />
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Section: Everything Under ₹199 */}
            {filteredItems.filter(item => item.price >= 99 && item.price <= 199).length > 0 && (
              <div className="mb-6">
                <h2 className="px-4 mb-3 font-black italic uppercase" style={{ fontSize: '20px', color: DARK_TEXT }}>
                  EVERYTHING UNDER ₹199
                  <span style={{ color: BRAND_GREEN }}>.</span>
                </h2>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
                  {filteredItems.filter(item => item.price >= 99 && item.price <= 199).map((item, index) => {
                    const quantity = itemQuantities[item.id] || 0
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="bg-white rounded-2xl overflow-hidden flex-shrink-0"
                        style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.08)', width: '180px' }}
                      >
                        {/* Food Image */}
                        <div 
                          onClick={() => navigate(`/menu/${restaurantId}/item/${item.id}`, {
                            state: { tableId: finalTableId, tableNumber }
                          })}
                          className="relative bg-gray-100 cursor-pointer"
                          style={{ height: '120px', borderRadius: '16px 16px 0 0' }}
                        >
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <span className="text-4xl">🍽️</span>
                            </div>
                          )}
                          {item.is_popular && (
                            <div className="absolute top-2 left-2 px-3 py-1.5 rounded-md flex items-center gap-1"
                              style={{ background: 'linear-gradient(135deg, #FF4458 0%, #FF6B7A 100%)', boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}>
                              <HeartSolidIcon className="w-3.5 h-3.5 text-white" />
                              <span className="text-xs font-semibold text-white">Most Loved</span>
                            </div>
                          )}
                        </div>
                        {/* Card Content */}
                        <div className="p-2.5">
                          <div className="flex items-center gap-1 mb-1.5">
                            {item.is_vegetarian ? (
                              <div className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: VEG_GREEN }}>
                                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: VEG_GREEN }}></div>
                              </div>
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: NON_VEG_RED }}>
                                <div className="w-1 h-1" style={{ backgroundColor: NON_VEG_RED, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                              </div>
                            )}
                            <ClockIcon className="w-3 h-3 flex-shrink-0" style={{ color: ACTION_GREEN }} />
                            <span className="text-[10px] font-medium" style={{ color: DARK_TEXT }}>16 mins</span>
                            <span className="text-[10px] font-medium" style={{ color: DARK_TEXT }}>2 cups</span>
                          </div>
                          <h3 className="font-semibold line-clamp-2 mb-1 cursor-pointer" style={{ fontSize: '13px', fontWeight: 600, color: DARK_TEXT, lineHeight: '1.3' }}
                            onClick={() => navigate(`/menu/${restaurantId}/item/${item.id}`, { state: { tableId: finalTableId, tableNumber } })}>
                            {item.name}
                          </h3>
                          {item.is_popular && (
                            <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded mb-1" style={{ backgroundColor: HIGHLY_REORDERED_BG }}>
                              <span className="text-[9px] font-semibold" style={{ color: HIGHLY_REORDERED_GREEN }}>Highly reordered</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-sm font-bold" style={{ color: DARK_TEXT }}>₹{item.price}</span>
                            {quantity === 0 ? (
                              <motion.button whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); setItemQuantities(prev => ({ ...prev, [item.id]: 1 })); handleAddToCart(item); }}
                                className="px-3 py-1 rounded-lg font-black border-3 border-black"
                                style={{ backgroundColor: ACTION_GREEN, color: '#000000', boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)', fontSize: '11px' }}>
                                ADD
                              </motion.button>
                            ) : (
                              <div className="px-2 py-1 rounded-lg border-3 border-black flex items-center gap-1.5"
                                style={{ backgroundColor: ACTION_GREEN, boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)' }}>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, -1); }}
                                  className="w-4 h-4 rounded flex items-center justify-center text-black">
                                  <MinusIcon className="w-3 h-3 font-bold" />
                                </motion.button>
                                <span className="font-black text-xs min-w-[0.75rem] text-center text-black">{quantity}</span>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); updateItemQuantity(item.id, 1); }}
                                  className="w-4 h-4 rounded flex items-center justify-center text-black">
                                  <PlusIcon className="w-3 h-3 font-bold" />
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Section: All Other Items (₹199+) */}
            {filteredItems.filter(item => item.price >= 199).length > 0 && (
              <div className="mb-6">
                <h2 className="px-4 mb-3 font-black italic uppercase" style={{ fontSize: '20px', color: DARK_TEXT }}>
                  MORE DELICIOUS ITEMS
                  <span style={{ color: BRAND_GREEN }}>.</span>
                </h2>
                <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-2">
                  {filteredItems.filter(item => item.price >= 199).map((item, index) => {
                    const quantity = itemQuantities[item.id] || 0
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="bg-white rounded-2xl overflow-hidden flex-shrink-0"
                        style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.08)', width: '180px' }}
                      >
                  {/* Food Image Section */}
                  <div 
                    onClick={() => navigate(`/menu/${restaurantId}/item/${item.id}`, {
                      state: { tableId: finalTableId, tableNumber }
                    })}
                    className="relative bg-gray-100 cursor-pointer"
                    style={{ height: '120px', borderRadius: '16px 16px 0 0' }}
                  >
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                    
                    {/* Most Loved Badge */}
                    {item.is_popular && (
                      <div 
                        className="absolute top-2 left-2 px-3 py-1.5 rounded-md flex items-center gap-1"
                        style={{ 
                          background: 'linear-gradient(135deg, #FF4458 0%, #FF6B7A 100%)',
                          boxShadow: '0px 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        <HeartSolidIcon className="w-3.5 h-3.5 text-white" />
                        <span className="text-xs font-semibold text-white">Most Loved</span>
                      </div>
                    )}



                    {/* Quantity Selector Overlay (when added) - REMOVED, using button above instead */}
                    {quantity > 0 && false && (
                      <div 
                        className="absolute left-1/2 bottom-0 flex items-center justify-between px-5 py-3"
                        style={{
                          transform: 'translate(-50%, 50%)',
                          backgroundColor: ACTION_GREEN,
                          borderRadius: '12px',
                          width: '140px',
                          height: '48px',
                          boxShadow: '0px 4px 12px rgba(0, 200, 83, 0.3)',
                          zIndex: 10
                        }}
                      >
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            updateItemQuantity(item.id, -1)
                          }}
                          className="text-white"
                        >
                          <MinusIcon className="w-5 h-5" />
                        </motion.button>
                        <span className="text-lg font-bold text-white">{quantity}</span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            updateItemQuantity(item.id, 1)
                          }}
                          className="text-white"
                        >
                          <PlusIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Card Content Section */}
                  <div className="p-2.5">
                    {/* Veg Indicator + Time + Serves Row */}
                    <div className="flex items-center gap-1 mb-1.5">
                      {/* Veg/Non-veg Indicator */}
                      {item.is_vegetarian ? (
                        <div className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: VEG_GREEN }}>
                          <div className="w-1 h-1 rounded-full" style={{ backgroundColor: VEG_GREEN }}></div>
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: NON_VEG_RED }}>
                          <div className="w-1 h-1" style={{ backgroundColor: NON_VEG_RED, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                        </div>
                      )}
                      
                      {/* Time Icon */}
                      <ClockIcon className="w-3 h-3 flex-shrink-0" style={{ color: ACTION_GREEN }} />
                      <span className="text-[10px] font-medium" style={{ color: DARK_TEXT }}>16 mins</span>
                      
                      {/* Serves */}
                      <span className="text-[10px] font-medium" style={{ color: DARK_TEXT }}>2 cups</span>
                    </div>

                    {/* Food Title */}
                    <h3 
                      onClick={() => navigate(`/menu/${restaurantId}/item/${item.id}`, {
                        state: { tableId: finalTableId, tableNumber }
                      })}
                      className="font-semibold line-clamp-2 mb-1 cursor-pointer"
                      style={{ 
                        fontSize: '13px',
                        fontWeight: 600,
                        color: DARK_TEXT,
                        lineHeight: '1.3'
                      }}
                    >
                      {item.name}
                    </h3>

                    {/* Highly Reordered Badge - Compact */}
                    {item.is_popular && (
                      <div 
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded mb-1"
                        style={{ 
                          backgroundColor: HIGHLY_REORDERED_BG
                        }}
                      >
                        <span className="text-[9px] font-semibold" style={{ color: HIGHLY_REORDERED_GREEN }}>
                          Highly reordered
                        </span>
                      </div>
                    )}

                    {/* Price and ADD Button Row */}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-sm font-bold" style={{ color: DARK_TEXT }}>
                        ₹{item.price}
                      </span>

                      {/* ADD Button - Compact Design */}
                      {quantity === 0 ? (
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setItemQuantities(prev => ({ ...prev, [item.id]: 1 }))
                            handleAddToCart(item)
                          }}
                          className="px-3 py-1 rounded-lg font-black border-3 border-black"
                          style={{
                            backgroundColor: ACTION_GREEN,
                            color: '#000000',
                            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)',
                            fontSize: '11px'
                          }}
                        >
                          ADD
                        </motion.button>
                      ) : (
                        <div 
                          className="px-2 py-1 rounded-lg border-3 border-black flex items-center gap-1.5"
                          style={{
                            backgroundColor: ACTION_GREEN,
                            boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)'
                          }}
                        >
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              updateItemQuantity(item.id, -1)
                            }}
                            className="w-4 h-4 rounded flex items-center justify-center text-black"
                          >
                            <MinusIcon className="w-3 h-3 font-bold" />
                          </motion.button>
                          
                          <span className="font-black text-xs min-w-[0.75rem] text-center text-black">{quantity}</span>
                          
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation()
                              updateItemQuantity(item.id, 1)
                            }}
                            className="w-4 h-4 rounded flex items-center justify-center text-black"
                          >
                            <PlusIcon className="w-3 h-3 font-bold" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )}
</div>

      {/* Floating Cart Button - Boxy Lime & Black Design */}
      {getCartCount() > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-0 right-0 z-50 flex justify-center px-4"
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCart(true)}
            className="py-3 px-5 rounded-full font-black text-black uppercase flex items-center gap-3 border-4 border-black"
            style={{
              backgroundColor: ACTION_GREEN,
              boxShadow: '6px 6px 0px 0px rgba(0,0,0,1)',
              minWidth: '280px',
              maxWidth: '90%'
            }}
          >
            {/* Circular Food Thumbnail */}
            {cart[0]?.image_url && (
              <div className="w-10 h-10 rounded-full border-3 border-black overflow-hidden flex-shrink-0">
                <img 
                  src={cart[0].image_url} 
                  alt="Cart item" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1 text-left">
              <p className="text-sm font-black">View cart</p>
              <p className="text-xs font-bold normal-case">
                {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'} • 17 mins
              </p>
            </div>
            
            {/* Right Arrow */}
            <svg className="w-5 h-5 text-black flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </motion.div>
      )}

      {/* Modals and Sidebars */}
      <AnimatePresence>
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
            currentCustomer={currentCustomer}
            isAuthenticated={isAuthenticated}
            restaurantId={restaurantId}
            allMenuItems={menuItems}
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
            currentCustomer={currentCustomer}
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

        {/* Mobile Profile Menu */}
        {showMobileMenu && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-gradient-to-r from-green-400 to-green-500 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-black text-white uppercase">Profile</h2>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMobileMenu(false)}
                    className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center"
                  >
                    <XMarkIcon className="w-6 h-6 text-white" />
                  </motion.button>
                </div>

                {/* User Info */}
                {isAuthenticated && currentCustomer ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                      <UserCircleIcon className="w-10 h-10 text-green-500" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">{currentCustomer.full_name}</p>
                      <p className="text-white text-sm opacity-90">{currentCustomer.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
                      <UserCircleIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-lg">Guest User</p>
                      <p className="text-white text-sm opacity-90">Login to continue</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Content */}
              <div className="p-4">
                {!isAuthenticated ? (
                  /* Guest User - Show Login/Signup Options */
                  <div className="space-y-3">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setAuthMode('login')
                        setShowAuthModal(true)
                      }}
                      className="w-full py-3 rounded-xl font-bold text-white"
                      style={{ backgroundColor: ACTION_GREEN }}
                    >
                      Login to Your Account
                    </motion.button>
                    
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setAuthMode('signup')
                        setShowAuthModal(true)
                      }}
                      className="w-full py-3 rounded-xl font-bold border-2"
                      style={{ borderColor: ACTION_GREEN, color: ACTION_GREEN }}
                    >
                      Create New Account
                    </motion.button>

                    <div className="mt-6 p-4 bg-green-50 rounded-xl border-2 border-green-200">
                      <p className="text-center text-sm font-semibold text-green-800">
                        🎁 Sign up and get 100 loyalty points!
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Authenticated User - Show Profile Info */
                  <div className="space-y-3">
                    {/* Loyalty Points - Compact Yellow Card */}
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-gray-600">Loyalty Points</p>
                        <p className="text-2xl font-black text-yellow-600">{loyaltyPoints}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        <span className="text-xl">🎁</span>
                      </div>
                    </div>

                    {/* Account Info - Minimal Design */}
                    <div className="bg-white rounded-xl p-3 border border-gray-200">
                      <h3 className="text-sm font-bold mb-2" style={{ color: '#212121' }}>Account Information</h3>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span style={{ color: '#666666' }}>Name:</span>
                          <span className="font-semibold" style={{ color: '#212121' }}>{currentCustomer.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: '#666666' }}>Email:</span>
                          <span className="font-semibold" style={{ color: '#212121' }}>{currentCustomer.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: '#666666' }}>Phone:</span>
                          <span className="font-semibold" style={{ color: '#212121' }}>{currentCustomer.phone || 'Not set'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: '#666666' }}>Member Since:</span>
                          <span className="font-semibold" style={{ color: '#212121' }}>
                            {new Date(currentCustomer.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order History Button - Playful Boxy Design */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toast.success('Order history feature coming soon!')}
                      className="w-full py-2.5 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2"
                      style={{ 
                        backgroundColor: '#00C853',
                        boxShadow: '0 4px 0 0 #000000'
                      }}
                    >
                      <ClockIcon className="w-4 h-4" />
                      <span>View Order History</span>
                    </motion.button>

                    {/* Logout Button - Playful Boxy Design */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={handleLogout}
                      className="w-full py-2.5 text-white font-bold text-sm rounded-xl"
                      style={{ 
                        backgroundColor: '#EF4444',
                        boxShadow: '0 4px 0 0 #000000'
                      }}
                    >
                      Logout
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Auth Modal (Login/Signup) */}
        {showAuthModal && (
          <motion.div
            key="auth-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black uppercase" style={{ color: DARK_TEXT }}>
                  {authMode === 'login' ? 'Login' : 'Sign Up'}
                </h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAuthModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                >
                  <XMarkIcon className="w-5 h-5" style={{ color: DARK_TEXT }} />
                </motion.button>
              </div>

              {authMode === 'login' ? (
                /* Login Form */
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target)
                  await handleLogin(formData.get('email'), formData.get('password'))
                }}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: DARK_TEXT }}>
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: DARK_TEXT }}>
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                        placeholder="Enter your password"
                      />
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full py-3 rounded-xl font-bold text-white"
                      style={{ backgroundColor: ACTION_GREEN }}
                    >
                      Login
                    </motion.button>

                    <div className="text-center">
                      <p className="text-sm" style={{ color: MEDIUM_GRAY }}>
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setAuthMode('signup')}
                          className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Sign up
                        </button>
                      </p>
                    </div>
                  </div>
                </form>
              ) : (
                /* Signup Form */
                <form onSubmit={async (e) => {
                  e.preventDefault()
                  const formData = new FormData(e.target)
                  const password = formData.get('password')
                  const confirmPassword = formData.get('confirmPassword')
                  
                  if (password !== confirmPassword) {
                    toast.error('Passwords do not match!')
                    return
                  }
                  
                  await handleSignup(
                    formData.get('fullName'),
                    formData.get('email'),
                    formData.get('phone'),
                    password
                  )
                }}>
                  <div className="bg-gradient-to-r from-green-400 to-green-500 rounded-xl p-4 mb-6 text-center">
                    <p className="text-white font-black text-lg">🎁 Get 100 Loyalty Points</p>
                    <p className="text-white text-sm opacity-90">Join our loyalty program today!</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: DARK_TEXT }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                        placeholder="Enter your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: DARK_TEXT }}>
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                        placeholder="Enter your email"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: DARK_TEXT }}>
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                        placeholder="Enter your phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: DARK_TEXT }}>
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        required
                        minLength="6"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                        placeholder="Create a password (min 6 characters)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold mb-2" style={{ color: DARK_TEXT }}>
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        required
                        minLength="6"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none"
                        placeholder="Confirm your password"
                      />
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      className="w-full py-3 rounded-xl font-bold text-white"
                      style={{ backgroundColor: ACTION_GREEN }}
                    >
                      Sign Up & Get 100 Points
                    </motion.button>

                    <div className="text-center">
                      <p className="text-sm" style={{ color: MEDIUM_GRAY }}>
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => setAuthMode('login')}
                          className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                          Login
                        </button>
                      </p>
                    </div>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomerMenu
