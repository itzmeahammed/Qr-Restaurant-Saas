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
  XMarkIcon,
  MapPinIcon,
  ArrowUpIcon,
  ArrowDownIcon
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
import ordyrrCoin from '../assets/ordyrr coin.png'
import logoBg from '../assets/logo_bg.png'

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
  const { cart, addToCart, updateQuantity, initializeSession, getCartCount } = useCartStore()
  
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
  
  // Order history states
  const [showOrderHistory, setShowOrderHistory] = useState(false)
  const [orderHistory, setOrderHistory] = useState([])
  const [loadingOrderHistory, setLoadingOrderHistory] = useState(false)
  
  // Coins history states
  const [showCoinsHistory, setShowCoinsHistory] = useState(false)
  const [coinsTransactions, setCoinsTransactions] = useState([])
  const [loadingCoinsHistory, setLoadingCoinsHistory] = useState(false)
  
  // Tip state - shared between CartSidebar and CheckoutModal
  const [selectedTip, setSelectedTip] = useState(0)
  
  // Sync itemQuantities with cart whenever cart changes
  useEffect(() => {
    const newQuantities = {}
    cart.forEach(item => {
      newQuantities[item.id] = item.quantity
    })
    setItemQuantities(newQuantities)
  }, [cart])

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
    const totalSlides = isAuthenticated ? 2 : 3 // 2 slides for authenticated, 3 for guests
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 4000) // Change slide every 4 seconds

    return () => clearInterval(interval)
  }, [isAuthenticated])

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
    
    // Update guest customer session with customer_id if available
    if (orderData.customer_id && currentCustomer && !currentCustomer.id) {
      const updatedCustomer = {
        ...currentCustomer,
        id: orderData.customer_id
      }
      setCurrentCustomer(updatedCustomer)
      saveSession(updatedCustomer)
      console.log('✅ Guest customer ID saved to session:', orderData.customer_id)
    }
    
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

  // Fetch order history for a customer
  const fetchOrderHistory = async () => {
    // For guest users, check if they have a phone number or ID to fetch orders
    if (!currentCustomer?.id && !currentCustomer?.phone) {
      console.log('❌ No customer ID or phone available:', currentCustomer)
      toast.error('No order history available')
      return
    }

    console.log('🔍 Fetching order history for:', {
      id: currentCustomer?.id,
      phone: currentCustomer?.phone,
      name: currentCustomer?.name
    })

    setLoadingOrderHistory(true)
    setShowMobileMenu(false)
    try {
      // Build query based on user type
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            order_id,
            menu_item_id,
            item_name,
            quantity,
            unit_price,
            total_price,
            special_instructions
          ),
          tables (
            table_number,
            location
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50)

      // For authenticated users or guests with ID, query by customer_id
      // For guests without ID, query by customer_phone
      if (currentCustomer.id) {
        console.log('📋 Querying by customer_id:', currentCustomer.id)
        query = query.eq('customer_id', currentCustomer.id)
      } else if (currentCustomer.phone) {
        console.log('📋 Querying by customer_phone:', currentCustomer.phone)
        query = query.eq('customer_phone', currentCustomer.phone)
      }

      const { data: orders, error } = await query

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      // Fetch menu item images separately for each order item
      if (orders && orders.length > 0) {
        for (const order of orders) {
          if (order.order_items && order.order_items.length > 0) {
            for (const item of order.order_items) {
              if (item.menu_item_id) {
                const { data: menuItem } = await supabase
                  .from('menu_items')
                  .select('name, image_url')
                  .eq('id', item.menu_item_id)
                  .single()
                
                if (menuItem) {
                  item.menu_items = menuItem
                }
              }
            }
          }
        }
      }

      console.log('✅ Order history fetched:', orders?.length || 0, 'orders')
      setOrderHistory(orders || [])
      setShowOrderHistory(true)
    } catch (error) {
      console.error('Error fetching order history:', error)
      toast.error('Failed to load order history')
    } finally {
      setLoadingOrderHistory(false)
    }
  }

  // Fetch coins transaction history
  const fetchCoinsHistory = async () => {
    if (!currentCustomer?.id) return
    
    setLoadingCoinsHistory(true)
    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('customer_id', currentCustomer.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setCoinsTransactions(data || [])
      setShowCoinsHistory(true)
    } catch (error) {
      console.error('Error fetching coins history:', error)
      toast.error('Failed to load coins history')
    } finally {
      setLoadingCoinsHistory(false)
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
          description: 'Welcome bonus - 100 Ordyrr Coins',
          tier: 'bronze'
        }])

      // Success
      setCurrentCustomer(newCustomer)
      setIsAuthenticated(true)
      saveSession(newCustomer)
      setLoyaltyPoints(100) // New signup gets 100 points
      setShowAuthModal(false)
      setShowMobileMenu(true)
      toast.success('🎉 Account created! You earned 100 Ordyrr Coins!')
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
    // Update local UI state
    setItemQuantities(prev => {
      const current = prev[itemId] || 0
      const newQuantity = Math.max(0, current + change)
      return { ...prev, [itemId]: newQuantity }
    })
    
    // Update cart store (outside of setState to avoid warning)
    const cartItem = cart.find(item => item.id === itemId)
    if (cartItem) {
      // Item already in cart, update quantity
      updateQuantity(itemId, cartItem.quantity + change)
    } else if (change > 0) {
      // Item not in cart, add it
      const menuItem = menuItems.find(item => item.id === itemId)
      if (menuItem) {
        addToCart(menuItem)
      }
    }
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

              {/* Slide 2: Signup Offer - Only show if NOT authenticated */}
              {currentSlide === 1 && !isAuthenticated && (
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
                      <p className="text-base font-bold" style={{ color: BRAND_GREEN }}>100 Ordyrr Coins</p>
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
              {currentSlide === (isAuthenticated ? 1 : 2) && (
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
              {(isAuthenticated ? [0, 1] : [0, 1, 2]).map((index) => (
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
            onCheckout={(tipAmount) => {
              setSelectedTip(tipAmount)
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
            initialTip={selectedTip}
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
              className="absolute right-0 top-0 bottom-0 w-full max-w-xs bg-white shadow-2xl overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <div className="sticky top-0 z-10 bg-white p-4 flex justify-end border-b border-gray-200">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowMobileMenu(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                  <XMarkIcon className="w-6 h-6" style={{ color: '#212121' }} />
                </motion.button>
              </div>

              {/* Menu Content */}
              <div className="p-4 pt-2">
                {!isAuthenticated ? (
                  /* Guest User - Show Minimal Profile with Signup Promotion */
                  <div className="space-y-6">
                    {/* Guest Account Section */}
                    <div>
                      <h2 className="text-xl font-bold mb-1" style={{ color: '#212121' }}>Your account</h2>
                      <p className="text-sm mb-0.5" style={{ color: '#666666' }}>
                        {currentCustomer?.name || 'Guest User'}
                      </p>
                      {currentCustomer?.phone && (
                        <div className="flex items-center gap-2 mb-3">
                          <svg className="w-4 h-4" style={{ color: '#666666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <p className="text-sm" style={{ color: '#666666' }}>{currentCustomer.phone}</p>
                        </div>
                      )}

                      {/* Signup Promotion Card - Minimal Design */}
                      <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                        <div className="flex items-center gap-3 mb-3">
                          <img src={ordyrrCoin} alt="Ordyrr Coin" className="w-10 h-10 object-contain" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold" style={{ color: '#666666' }}>Sign up and get</p>
                            <p className="text-2xl font-black" style={{ color: '#F59E0B' }}>100 Coins!</p>
                          </div>
                        </div>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setAuthMode('signup')
                            setShowAuthModal(true)
                            setShowMobileMenu(false)
                          }}
                          className="w-full py-2.5 text-black font-bold text-sm rounded-xl"
                          style={{ 
                            backgroundColor: '#F59E0B',
                            boxShadow: '0 3px 0 0 #000000'
                          }}
                        >
                          CREATE ACCOUNT
                        </motion.button>
                      </div>
                    </div>

                    {/* Your Information Section */}
                    <div>
                      <h3 className="text-xs font-bold uppercase mb-3" style={{ color: '#999999' }}>Your Information</h3>
                      <div className="space-y-2">
                        {/* Track Live Orders */}
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setShowMobileMenu(false)
                            setShowOrderTracking(true)
                          }}
                          className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <MapPinIcon className="w-5 h-5" style={{ color: ACTION_GREEN }} />
                            <span className="text-sm font-semibold" style={{ color: ACTION_GREEN }}>
                              Track Live Orders
                            </span>
                          </div>
                          <svg className="w-5 h-5" style={{ color: ACTION_GREEN }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>

                    {/* Other Information Section */}
                    <div>
                      <h3 className="text-xs font-bold uppercase mb-3" style={{ color: '#999999' }}>Other Information</h3>
                      <div className="space-y-2">
                        {/* Help and Support */}
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toast.info('Help & Support - Coming soon!')}
                          className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" style={{ color: '#666666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-normal" style={{ color: '#212121' }}>Help and support</span>
                          </div>
                          <svg className="w-5 h-5" style={{ color: '#CCCCCC' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {/* Login Button */}
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setAuthMode('login')
                          setShowAuthModal(true)
                          setShowMobileMenu(false)
                        }}
                        className="w-full py-3 text-black font-bold text-sm rounded-xl"
                        style={{ 
                          backgroundColor: ACTION_GREEN,
                          boxShadow: '0 4px 0 0 #000000'
                        }}
                      >
                        LOGIN TO YOUR ACCOUNT
                      </motion.button>
                    </div>

                    {/* Brand Logo at Bottom */}
                    <div className="mt-8 mb-6 flex justify-center">
                      <img 
                        src={logoBg} 
                        alt="Ordyrr" 
                        className="h-24 opacity-60"
                      />
                    </div>
                  </div>
                ) : (
                  /* Authenticated User - Show Profile Info */
                  <div className="space-y-6">
                    {/* Your Account Section */}
                    <div>
                      <h2 className="text-xl font-bold mb-1" style={{ color: '#212121' }}>Your account</h2>
                      <p className="text-sm mb-0.5" style={{ color: '#666666' }}>{currentCustomer.full_name}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4" style={{ color: '#666666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <p className="text-sm" style={{ color: '#666666' }}>{currentCustomer.phone || 'No phone'}</p>
                      </div>

                      {/* Ordyrr Coins Card */}
                      <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <img src={ordyrrCoin} alt="Ordyrr Coin" className="w-8 h-8 object-contain" />
                            <div>
                              <p className="text-xs font-medium" style={{ color: '#666666' }}>Ordyrr Coins</p>
                              <p className="text-lg font-bold" style={{ color: '#F59E0B' }}>{loyaltyPoints}</p>
                            </div>
                          </div>
                          <button
                            onClick={fetchCoinsHistory}
                            className="text-xs font-medium underline hover:no-underline transition-all"
                            style={{ color: '#92400E' }}
                          >
                            View History
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Your Information Section */}
                    <div>
                      <h3 className="text-xs font-bold uppercase mb-3" style={{ color: '#999999' }}>Your Information</h3>
                      <div className="space-y-2">
                        {/* Track Live Orders */}
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setShowProfile(false)
                            setShowOrderTracking(true)
                          }}
                          className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <MapPinIcon className="w-5 h-5" style={{ color: ACTION_GREEN }} />
                            <span className="text-sm font-semibold" style={{ color: ACTION_GREEN }}>
                              Track Live Orders
                            </span>
                          </div>
                          <svg className="w-5 h-5" style={{ color: ACTION_GREEN }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>

                        {/* Order History */}
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={fetchOrderHistory}
                          disabled={loadingOrderHistory}
                          className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <ClockIcon className="w-5 h-5" style={{ color: '#666666' }} />
                            <span className="text-sm font-normal" style={{ color: '#212121' }}>
                              {loadingOrderHistory ? 'Loading...' : 'Your orders'}
                            </span>
                          </div>
                          <svg className="w-5 h-5" style={{ color: '#CCCCCC' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>

                        {/* Email Info */}
                        <div className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" style={{ color: '#666666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-normal" style={{ color: '#212121' }}>Email</span>
                          </div>
                          <span className="text-xs" style={{ color: '#666666' }}>{currentCustomer.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Other Information Section */}
                    <div>
                      <h3 className="text-xs font-bold uppercase mb-3" style={{ color: '#999999' }}>Other Information</h3>
                      <div className="space-y-2">
                        {/* Help and Support */}
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toast.info('Help & Support - Coming soon!')}
                          className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200 hover:border-green-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" style={{ color: '#666666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm font-normal" style={{ color: '#212121' }}>Help and support</span>
                          </div>
                          <svg className="w-5 h-5" style={{ color: '#CCCCCC' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>

                        {/* Member Since */}
                        <div className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200">
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" style={{ color: '#666666' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-normal" style={{ color: '#212121' }}>Member since</span>
                          </div>
                          <span className="text-xs" style={{ color: '#666666' }}>
                            {new Date(currentCustomer.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                          </span>
                        </div>

                        {/* Logout */}
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={handleLogout}
                          className="w-full flex items-center justify-between py-3 px-4 bg-white rounded-xl border border-gray-200 hover:border-red-300 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-5 h-5" style={{ color: '#EF4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="text-sm font-normal" style={{ color: '#EF4444' }}>Log out</span>
                          </div>
                          <svg className="w-5 h-5" style={{ color: '#CCCCCC' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.button>
                      </div>
                    </div>

                    {/* Brand Logo at Bottom */}
                    <div className="mt-8 mb-6 flex justify-center">
                      <img 
                        src={logoBg} 
                        alt="Ordyrr" 
                        className="h-24 opacity-60"
                      />
                    </div>
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
                    <p className="text-white font-black text-lg">🎁 Get 100 Ordyrr Coins</p>
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

      {/* Order History Modal */}
      <AnimatePresence>
        {showOrderHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-4"
            onClick={() => setShowOrderHistory(false)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b-2 border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-6 h-6" style={{ color: ACTION_GREEN }} />
                  <h2 className="text-xl font-black" style={{ color: DARK_TEXT }}>Order History</h2>
                </div>
                <button
                  onClick={() => setShowOrderHistory(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                >
                  <XMarkIcon className="w-6 h-6" style={{ color: DARK_TEXT }} />
                </button>
              </div>

              {/* Order List */}
              <div className="overflow-y-auto max-h-[calc(85vh-80px)] px-6 py-4">
                {orderHistory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <ClockIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-lg font-bold" style={{ color: DARK_TEXT }}>No Orders Yet</p>
                    <p className="text-sm mt-2" style={{ color: MEDIUM_GRAY }}>
                      Your order history will appear here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderHistory.map((order) => (
                      <div
                        key={order.id}
                        className="border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 transition-colors"
                      >
                        {/* Order Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-bold text-base" style={{ color: DARK_TEXT }}>
                              Order #{order.order_number}
                            </p>
                            <p className="text-xs mt-1" style={{ color: MEDIUM_GRAY }}>
                              {new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                            {order.tables && (
                              <p className="text-xs mt-0.5" style={{ color: MEDIUM_GRAY }}>
                                Table {order.tables.table_number}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <div
                              className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                              style={{
                                backgroundColor: 
                                  order.status === 'completed' ? '#E8F5E9' :
                                  order.status === 'cancelled' ? '#FFEBEE' :
                                  order.status === 'preparing' ? '#FFF3E0' :
                                  '#E3F2FD',
                                color:
                                  order.status === 'completed' ? '#2E7D32' :
                                  order.status === 'cancelled' ? '#C62828' :
                                  order.status === 'preparing' ? '#E65100' :
                                  '#1565C0'
                              }}
                            >
                              {order.status.toUpperCase()}
                            </div>
                            <p className="text-lg font-black mt-2" style={{ color: ACTION_GREEN }}>
                              ₹{order.total_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2 border-t border-gray-200 pt-3">
                          {order.order_items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                              {item.menu_items?.image_url && (
                                <img
                                  src={item.menu_items.image_url}
                                  alt={item.item_name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: DARK_TEXT }}>
                                  {item.item_name}
                                </p>
                                <p className="text-xs" style={{ color: MEDIUM_GRAY }}>
                                  Qty: {item.quantity} × ₹{item.unit_price.toFixed(2)}
                                </p>
                              </div>
                              <p className="text-sm font-bold" style={{ color: DARK_TEXT }}>
                                ₹{item.total_price.toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Order Summary */}
                        <div className="border-t border-gray-200 mt-3 pt-3 space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span style={{ color: MEDIUM_GRAY }}>Subtotal:</span>
                            <span className="font-semibold" style={{ color: DARK_TEXT }}>
                              ₹{order.subtotal.toFixed(2)}
                            </span>
                          </div>
                          {order.tax_amount > 0 && (
                            <div className="flex justify-between">
                              <span style={{ color: MEDIUM_GRAY }}>Platform Fee (1.5%):</span>
                              <span className="font-semibold" style={{ color: DARK_TEXT }}>
                                ₹{order.tax_amount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {order.discount_amount > 0 && (
                            <div className="flex justify-between">
                              <span style={{ color: order.coins_redeemed > 0 ? '#F59E0B' : ACTION_GREEN }}>
                                {order.coins_redeemed > 0 
                                  ? `🪙 Ordyrr Coins (${order.coins_redeemed}):`
                                  : '🎉 First Order Discount (10%):'
                                }
                              </span>
                              <span className="font-semibold" style={{ color: order.coins_redeemed > 0 ? '#F59E0B' : ACTION_GREEN }}>
                                -₹{order.discount_amount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          {order.tip_amount > 0 && (
                            <div className="flex justify-between">
                              <span style={{ color: MEDIUM_GRAY }}>Tip:</span>
                              <span className="font-semibold" style={{ color: DARK_TEXT }}>
                                ₹{order.tip_amount.toFixed(2)}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-1 border-t border-gray-200">
                            <span className="font-bold" style={{ color: DARK_TEXT }}>Total:</span>
                            <span className="font-black" style={{ color: ACTION_GREEN }}>
                              ₹{order.total_amount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Payment Info */}
                        <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs">
                          <span style={{ color: MEDIUM_GRAY }}>
                            Payment: <span className="font-semibold capitalize">{order.payment_method}</span>
                          </span>
                          <span
                            className="px-2 py-1 rounded-full font-semibold"
                            style={{
                              backgroundColor: order.payment_status === 'completed' ? '#E8F5E9' : '#FFF3E0',
                              color: order.payment_status === 'completed' ? '#2E7D32' : '#E65100'
                            }}
                          >
                            {order.payment_status === 'completed' ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Coins History Modal */}
      <AnimatePresence>
        {showCoinsHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowCoinsHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={ordyrrCoin} alt="Ordyrr Coin" className="w-6 h-6" />
                  <h3 className="text-lg font-bold" style={{ color: DARK_TEXT }}>Coins History</h3>
                </div>
                <button onClick={() => setShowCoinsHistory(false)} className="p-2">
                  <XMarkIcon className="w-5 h-5" style={{ color: DARK_TEXT }} />
                </button>
              </div>

              {/* Current Balance */}
              <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: MEDIUM_GRAY }}>Current Balance</span>
                  <span className="text-2xl font-black" style={{ color: '#F59E0B' }}>{loyaltyPoints || 0} coins</span>
                </div>
              </div>

              {/* Transaction List */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingCoinsHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                  </div>
                ) : coinsTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm" style={{ color: MEDIUM_GRAY }}>No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coinsTransactions.map((transaction) => {
                      const isEarned = transaction.points_earned > 0
                      const isRedeemed = transaction.points_redeemed > 0
                      const amount = isEarned ? transaction.points_earned : transaction.points_redeemed
                      
                      return (
                        <motion.div
                          key={transaction.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isEarned ? 'bg-green-100' : 'bg-red-100'
                              }`}>
                                {isEarned ? (
                                  <ArrowDownIcon className="w-4 h-4 text-green-600" />
                                ) : (
                                  <ArrowUpIcon className="w-4 h-4 text-red-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-bold" style={{ color: DARK_TEXT }}>
                                  {isEarned ? 'Earned' : 'Redeemed'}
                                </p>
                                <p className="text-xs" style={{ color: MEDIUM_GRAY }}>
                                  {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>
                            <span className={`text-lg font-black ${
                              isEarned ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {isEarned ? '+' : '-'}{amount}
                            </span>
                          </div>
                          {transaction.description && (
                            <p className="text-xs mt-2 pl-10" style={{ color: MEDIUM_GRAY }}>
                              {transaction.description}
                            </p>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CustomerMenu
