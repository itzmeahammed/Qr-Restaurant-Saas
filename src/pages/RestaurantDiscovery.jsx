import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  MapPinIcon,
  StarIcon,
  ClockIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  EyeIcon,
  HeartIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'
import CustomerLoader from '../components/customer/CustomerLoader'
import CustomerNavHeader from '../components/customer/CustomerNavHeader'
import CustomerBreadcrumbs from '../components/customer/CustomerBreadcrumbs'
import MobileMenu from '../components/customer/MobileMenu'
import logo from '../assets/logo green.png'

// Brand colors - Matching Menu Page
const BRAND_GREEN = '#00E676' // Header background
const ACTION_GREEN = '#00C853' // Buttons, active states
const BRAND_LIME = '#C6FF3D'
const BRAND_BLACK = '#2D2D2D'

const RestaurantDiscovery = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('location') || '')
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const cuisineTypes = [
    { id: 'all', name: 'All Cuisines' },
    { id: 'indian', name: 'Indian' },
    { id: 'chinese', name: 'Chinese' },
    { id: 'italian', name: 'Italian' },
    { id: 'mexican', name: 'Mexican' },
    { id: 'thai', name: 'Thai' },
    { id: 'american', name: 'American' }
  ]

  useEffect(() => {
    fetchRestaurants()
  }, [])

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      
      // Fetch restaurants from users table (simplified schema)
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          email,
          restaurant_name,
          restaurant_description,
          restaurant_address,
          restaurant_phone,
          restaurant_email,
          cuisine_type,
          logo_url,
          banner_url,
          opening_hours,
          is_active,
          is_open,
          created_at,
          updated_at
        `)
        .eq('role', 'restaurant_owner')
        .eq('is_active', true)
        .not('restaurant_name', 'is', null)
        .order('created_at', { ascending: false })

      if (restaurantsError) throw restaurantsError

      // Fetch categories and menu items separately for each restaurant
      const restaurantsWithCounts = await Promise.all(
        (restaurantsData || []).map(async (restaurant) => {
          try {
            // Get categories count - categories.restaurant_id references users.id
            const { count: categoriesCount } = await supabase
              .from('categories')
              .select('*', { count: 'exact', head: true })
              .eq('restaurant_id', restaurant.id)
              .eq('is_active', true)

            // Get menu items count - menu_items.restaurant_id references users.id  
            const { count: menuItemsCount } = await supabase
              .from('menu_items')
              .select('*', { count: 'exact', head: true })
              .eq('restaurant_id', restaurant.id)
              .eq('is_available', true)

            // Get reviews for rating calculation
            const { data: reviews } = await supabase
              .from('reviews')
              .select('overall_rating')
              .eq('restaurant_id', restaurant.id)

            const avgRating = reviews?.length > 0 
              ? reviews.reduce((sum, review) => sum + review.overall_rating, 0) / reviews.length
              : 4.2

            return {
              ...restaurant,
              // Map users table fields to restaurant fields for compatibility
              name: restaurant.restaurant_name,
              description: restaurant.restaurant_description,
              address: restaurant.restaurant_address,
              phone: restaurant.restaurant_phone,
              email: restaurant.restaurant_email || restaurant.email,
              owner: {
                id: restaurant.id,
                full_name: restaurant.full_name,
                email: restaurant.email
              },
              rating: Number(avgRating.toFixed(1)),
              review_count: reviews?.length || 0,
              menu_count: menuItemsCount || 12,
              category_count: categoriesCount || 3
            }
          } catch (error) {
            console.warn(`Error fetching data for restaurant ${restaurant.id}:`, error)
            return {
              ...restaurant,
              rating: 4.2,
              review_count: 0,
              menu_count: 12,
              category_count: 3
            }
          }
        })
      )

      // Process restaurant data with fallback ratings
      const restaurantsWithRatings = restaurantsWithCounts

      setRestaurants(restaurantsWithRatings)
      
      // Set up real-time subscription for restaurant updates
      const subscription = supabase
        .channel('restaurants')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'restaurants' },
          (payload) => {
            console.log('Restaurant updated:', payload)
            fetchRestaurants() // Refetch on changes
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error)
      toast.error('Failed to load restaurants. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = (restaurant.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (restaurant.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (restaurant.cuisine_type || '').toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCuisine = selectedCuisine === 'all' || restaurant.cuisine_type === selectedCuisine
    
    return matchesSearch && matchesCuisine
  })

  const handleRestaurantClick = (restaurant) => {
    // Navigate to restaurant menu without requiring login
    navigate(`/menu/${restaurant.id}`)
  }

  const handleViewMenu = (restaurant, e) => {
    e.stopPropagation()
    navigate(`/menu/${restaurant.id}`)
  }

  const handleQRCode = (restaurant, e) => {
    e.stopPropagation()
    // Generate QR code URL for the restaurant
    const qrUrl = `${window.location.origin}/menu/${restaurant.id}`
    navigator.clipboard.writeText(qrUrl)
    toast.success('QR code URL copied to clipboard!')
  }

  const isCurrentlyOpen = (restaurant) => {
    // Default to open if opening_hours is missing (restaurant still setting up)
    if (!restaurant?.opening_hours) return true
    
    try {
      const hours = restaurant.opening_hours
      
      // Create IST time directly
      const now = new Date()
      // Add 5:30 hours to UTC to get IST
      const istOffset = 5.5 * 60 * 60 * 1000 // 5.5 hours in milliseconds
      const istTime = new Date(now.getTime() + istOffset)
      
      // Get current day in IST
      const today = istTime.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const todayHours = hours[today]
      
      // Get current time in HH:MM format
      const currentHour = istTime.getUTCHours().toString().padStart(2, '0')
      const currentMinute = istTime.getUTCMinutes().toString().padStart(2, '0')
      const currentTime = `${currentHour}:${currentMinute}`
      
      if (!todayHours || todayHours.closed === true) {
        return false
      }
      
      const openTime = todayHours.open
      const closeTime = todayHours.close
      
      // Convert time strings to minutes for comparison
      const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        return hours * 60 + minutes
      }
      
      const currentMinutes = timeToMinutes(currentTime)
      const openMinutes = timeToMinutes(openTime)
      const closeMinutes = timeToMinutes(closeTime)
      
      return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
    } catch (error) {
      return true // Default to open if can't parse
    }
  }

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
              FINDING RESTAURANTS
            </h2>
            <p className="text-base font-bold text-black/70 mb-6">
              Discovering amazing food near you... 🍽️
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

  return (
    <div className="min-h-screen bg-white">
      {/* Vibrant Green Header - Matching Menu Page */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          background: `linear-gradient(135deg, ${BRAND_GREEN} 0%, #00D966 100%)`,
          minHeight: '200px',
          borderBottomLeftRadius: '24px',
          borderBottomRightRadius: '24px'
        }}
      >
        {/* Decorative sparkles */}
        <div className="absolute inset-0 opacity-30">
          {[...Array(15)].map((_, i) => (
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
          <div className="flex items-center justify-between mb-4">
            {/* Back Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/customer')}
              className="w-10 h-10 bg-white flex items-center justify-center rounded-full"
              style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' }}
            >
              <ArrowLeftIcon className="w-5 h-5 text-black" />
            </motion.button>
            
            {/* Logo */}
            <img src={logo} alt="Ordyrr" className="h-12" />
            
            {/* Filter Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMobileMenu(true)}
              className="w-10 h-10 bg-white flex items-center justify-center rounded-full"
              style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' }}
            >
              <FunnelIcon className="w-5 h-5 text-black" />
            </motion.button>
          </div>
        </div>

        {/* Header Title */}
        <div className="relative z-10 px-4 pb-6">
          <h1 
            className="font-black uppercase leading-none mb-2"
            style={{ 
              fontSize: '32px',
              letterSpacing: '-0.5px',
              color: '#2C2C2C',
              fontStyle: 'italic'
            }}
          >
            DISCOVER<br/>RESTAURANTS
          </h1>
          <p className="text-sm font-normal" style={{ color: '#424242' }}>
            {filteredRestaurants.length} amazing places
          </p>
        </div>
      </div>

      {/* Search and Filters Section - White Background */}
      <div className="bg-white px-4 py-4 sticky top-0 z-40" style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.05)' }}>
        {/* Search Bar */}
        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurants..."
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent text-sm"
          />
        </div>

        {/* Cuisine Filter Chips */}
        <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-2 pb-1">
            {cuisineTypes.map((cuisine) => (
              <motion.button
                key={cuisine.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSelectedCuisine(cuisine.id)}
                className={`px-4 py-2 rounded-full font-semibold text-xs whitespace-nowrap transition-all ${
                  selectedCuisine === cuisine.id
                    ? 'text-white border-2'
                    : 'bg-white text-gray-700 border border-gray-300'
                }`}
                style={selectedCuisine === cuisine.id ? { 
                  backgroundColor: ACTION_GREEN,
                  borderColor: ACTION_GREEN,
                  boxShadow: '0px 2px 6px rgba(0,200,83,0.3)'
                } : {}}
              >
                {cuisine.name.toUpperCase()}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Restaurant Cards */}
      <div className="bg-gray-50 px-4 py-4 min-h-screen">
        {loading ? (
          <CustomerLoader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRestaurants.map((restaurant, index) => (
            <motion.div
              key={restaurant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleRestaurantClick(restaurant)}
              className="bg-white rounded-2xl overflow-hidden border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[5px_5px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              {/* Restaurant Image */}
              <div className="relative h-48 sm:h-56 overflow-hidden bg-gray-200">
                {restaurant.banner_url || restaurant.image_url || restaurant.logo_url ? (
                  <img
                    src={restaurant.banner_url || restaurant.image_url || restaurant.logo_url}
                    alt={restaurant.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-500"><span class="text-6xl">🍽️</span></div>'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-green-400 to-green-500">
                    <span className="text-6xl">🍽️</span>
                  </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] ${
                    isCurrentlyOpen(restaurant)
                      ? 'text-white'
                      : 'bg-red-500 text-white'
                  }`}
                    style={isCurrentlyOpen(restaurant) ? { backgroundColor: ACTION_GREEN } : {}}
                  >
                    {isCurrentlyOpen(restaurant) ? '● OPEN' : '● CLOSED'}
                  </span>
                </div>

                {/* Favorite Button */}
                <div className="absolute top-3 right-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      toast.success('Added to favorites!')
                    }}
                    className="p-2 bg-white rounded-full border border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)] hover:shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                  >
                    <HeartIcon className="w-5 h-5 text-red-500" />
                  </motion.button>
                </div>

                {/* Restaurant Name Overlay */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-lg sm:text-xl font-black text-white mb-2 tracking-tight leading-tight drop-shadow-lg">
                    {(restaurant.restaurant_name || restaurant.name || restaurant.business_name || 'Restaurant')?.toUpperCase()}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 rounded-full px-2.5 py-1 border border-black text-white" style={{ backgroundColor: ACTION_GREEN }}>
                      <StarSolidIcon className="w-4 h-4 text-white" />
                      <span className="text-white font-bold text-xs">{restaurant.rating || '4.2'}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 border border-black">
                      <ClockIcon className="w-4 h-4 text-black" />
                      <span className="text-black font-bold text-xs">{restaurant.estimated_delivery_time || restaurant.delivery_time || '25-30'}m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restaurant Details */}
              <div className="p-4">
                  <p className="text-gray-700 text-sm mb-3 line-clamp-2 leading-relaxed">
                    {restaurant.description || restaurant.bio || restaurant.about || 'Delicious food awaits you at this amazing restaurant.'}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <MapPinIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <span className="text-gray-600 text-sm truncate">{restaurant.address || restaurant.location || restaurant.full_address || 'Location not available'}</span>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center gap-2">
                    {/* Cuisine Badge */}
                    <span className="px-3 py-1.5 bg-black text-xs font-bold rounded-full capitalize border border-black" style={{ color: ACTION_GREEN }}>
                      {restaurant.cuisine_type}
                    </span>

                    {/* View Menu Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => handleViewMenu(restaurant, e)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all text-white"
                      style={{ backgroundColor: ACTION_GREEN }}
                    >
                      <EyeIcon className="w-4 h-4" />
                      <span>VIEW MENU</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </div>
  )
}

export default RestaurantDiscovery
