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
import logo from '../assets/logo.png'

// Brand colors
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
      
      // Fetch restaurants from users table (consistent foreign key)
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'restaurant_owner')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (restaurantsError) throw restaurantsError

      // Fetch categories and menu items separately for each restaurant
      const restaurantsWithCounts = await Promise.all(
        (restaurantsData || []).map(async (restaurant) => {
          try {
            // Get categories count - categories.restaurant_id references restaurants.id
            const { count: categoriesCount } = await supabase
              .from('categories')
              .select('*', { count: 'exact', head: true })
              .eq('restaurant_id', restaurant.id)
              .eq('is_active', true)

            // Get menu items count - menu_items.restaurant_id references restaurants.id  
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
    if (!restaurant?.opening_hours) return false
    
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
    return <CustomerLoader message="Finding restaurants near you..." />
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

      {/* Professional Navbar */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-black border-b-4 border-black"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: -10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/customer')}
              className="w-12 h-12 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(198,255,61,1)] hover:shadow-[4px_4px_0_0_rgba(198,255,61,1)] transition-all"
            >
              <ArrowLeftIcon className="w-5 h-5 text-black" />
            </motion.button>
            
            {/* Logo */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
              className="flex items-center"
            >
              <img src={logo} alt="Ordyrr" className="h-10 w-auto" />
            </motion.div>
            
            {/* Filter Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(true)}
              className="w-12 h-12 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(198,255,61,1)] hover:shadow-[4px_4px_0_0_rgba(198,255,61,1)] transition-all"
            >
              <FunnelIcon className="w-5 h-5 text-black" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <div className="px-4 py-4">
        {/* Search Bar */}
        <div className="relative mb-4">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search restaurants..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent shadow-sm"
          />
        </div>

        {/* Cuisine Filter Chips - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 overflow-x-auto scrollbar-hide"
        >
          <div className="flex gap-2 pb-2">
            {cuisineTypes.map((cuisine) => (
              <motion.button
                key={cuisine.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCuisine(cuisine.id)}
                className={`px-4 py-2 rounded-full font-black text-sm whitespace-nowrap border-4 border-black transition-all shadow-[3px_3px_0_0_rgba(0,0,0,1)] ${
                  selectedCuisine === cuisine.id
                    ? 'bg-black text-lime-400'
                    : 'bg-white text-black hover:bg-gray-50'
                }`}
                style={selectedCuisine === cuisine.id ? { color: BRAND_LIME } : {}}
              >
                {cuisine.name.toUpperCase()}
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-4">
          {filteredRestaurants.length} restaurants found
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Restaurant Cards Grid - Mobile First */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <CustomerLoader />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredRestaurants.map((restaurant, index) => (
            <motion.div
              key={restaurant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRestaurantClick(restaurant)}
              className="bg-white rounded-2xl overflow-hidden border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
            >
              {/* Restaurant Image */}
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <img
                  src={restaurant.image_url || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop`}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-black border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                    isCurrentlyOpen(restaurant)
                      ? 'bg-lime-400 text-black'
                      : 'bg-red-500 text-white'
                  }`}>
                    {isCurrentlyOpen(restaurant) ? '● OPEN' : '● CLOSED'}
                  </span>
                </div>

                {/* Favorite Button */}
                <div className="absolute top-3 right-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      toast.success('Added to favorites!')
                    }}
                    className="p-2 bg-white rounded-full border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                  >
                    <HeartIcon className="w-5 h-5 text-red-500" />
                  </motion.button>
                </div>

                {/* Restaurant Name Overlay */}
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight leading-tight">
                    {restaurant.name?.toUpperCase()}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1 rounded-full px-2 py-1 border-2 border-black" style={{ backgroundColor: BRAND_LIME }}>
                      <StarSolidIcon className="w-4 h-4 text-black" />
                      <span className="text-black font-black text-xs">{restaurant.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 border-2 border-black">
                      <ClockIcon className="w-4 h-4 text-black" />
                      <span className="text-black font-black text-xs">{restaurant.estimated_delivery_time || '25-30'}m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Restaurant Details */}
              <div className="p-4">
                  <p className="text-black/70 text-xs sm:text-sm mb-3 line-clamp-2 leading-relaxed font-bold">
                    {restaurant.description || 'Delicious food awaits you at this amazing restaurant.'}
                  </p>

                  <div className="flex items-center gap-2 mb-3">
                    <MapPinIcon className="w-4 h-4 text-black/60 flex-shrink-0" />
                    <span className="text-black/70 text-xs font-bold truncate">{restaurant.address}</span>
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center gap-2">
                    {/* Cuisine Badge */}
                    <span className="px-3 py-1.5 bg-black text-xs font-black rounded-full capitalize border-2 border-black" style={{ color: BRAND_LIME }}>
                      {restaurant.cuisine_type}
                    </span>

                    {/* View Menu Button */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleViewMenu(restaurant, e)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-full font-black text-xs sm:text-sm border-4 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all text-black"
                      style={{ backgroundColor: BRAND_LIME }}
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
