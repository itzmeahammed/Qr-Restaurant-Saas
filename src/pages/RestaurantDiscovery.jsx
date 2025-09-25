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
  HeartIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'
import CustomerLoader from '../components/customer/CustomerLoader'
import CustomerNavHeader from '../components/customer/CustomerNavHeader'
import CustomerBreadcrumbs from '../components/customer/CustomerBreadcrumbs'
import MobileMenu from '../components/customer/MobileMenu'

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
      
      // Fetch real-time restaurant data with menu counts and ratings
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          categories(count),
          menu_items(count)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Process restaurant data with fallback ratings
      const restaurantsWithRatings = (data || []).map(restaurant => {
        return {
          ...restaurant,
          rating: restaurant.rating || 4.2, // Fallback rating
          review_count: restaurant.review_count || 0,
          menu_count: restaurant.menu_items?.[0]?.count || 12,
          category_count: restaurant.categories?.[0]?.count || 3
        }
      })

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
    const matchesSearch = restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         restaurant.cuisine_type.toLowerCase().includes(searchQuery.toLowerCase())
    
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

  if (loading) {
    return <CustomerLoader message="Finding restaurants near you..." />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <CustomerNavHeader 
        title="Restaurants"
        showBackButton={true}
        showMenu={true}
        onMenuClick={() => setShowMobileMenu(true)}
      />
      
      {/* Breadcrumbs */}
      <CustomerBreadcrumbs />

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

        {/* Cuisine Filter */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
          {cuisineTypes.map((cuisine) => (
            <button
              key={cuisine.id}
              onClick={() => setSelectedCuisine(cuisine.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                selectedCuisine === cuisine.id
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {cuisine.name}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-4">
          {filteredRestaurants.length} restaurants found
          {searchQuery && ` for "${searchQuery}"`}
        </p>
      </div>

      {/* Restaurant Grid */}
      <div className="px-4">
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No restaurants found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCuisine('all')
              }}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRestaurants.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => handleRestaurantClick(restaurant)}
                className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100"
              >
                {/* Restaurant Image Header */}
                <div className="relative h-48 overflow-hidden">
                  {restaurant.banner_url || restaurant.logo_url ? (
                    <img
                      src={restaurant.banner_url || restaurant.logo_url}
                      alt={restaurant.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-black rounded-3xl flex items-center justify-center mx-auto mb-3">
                          <QrCodeIcon className="w-8 h-8 text-white" />
                        </div>
                        <p className="font-bold text-gray-600">No Image</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay Elements */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-4 py-2 rounded-2xl font-bold text-sm backdrop-blur-md ${
                      restaurant.is_open 
                        ? 'bg-green-500/90 text-white' 
                        : 'bg-red-500/90 text-white'
                    }`}>
                      {restaurant.is_open ? 'OPEN NOW' : 'CLOSED'}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => handleQRCode(restaurant, e)}
                      className="w-12 h-12 bg-black/80 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-black transition-all"
                    >
                      <QrCodeIcon className="w-6 h-6 text-white" />
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white transition-all"
                    >
                      <HeartIcon className="w-6 h-6 text-red-500" />
                    </motion.button>
                  </div>

                  {/* Restaurant Name Overlay */}
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-2xl font-black text-white mb-1 tracking-tight">
                      {restaurant.name?.toUpperCase()}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-full px-3 py-1">
                        <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-white font-bold text-sm">{restaurant.rating}</span>
                        <span className="text-white/70 text-sm">({restaurant.review_count || 0})</span>
                      </div>
                      <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md rounded-full px-3 py-1">
                        <ClockIcon className="w-4 h-4 text-white" />
                        <span className="text-white font-medium text-sm">{restaurant.estimated_delivery_time || '25-30'} min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restaurant Details */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {restaurant.description || 'Delicious food awaits you at this amazing restaurant.'}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 text-sm font-medium truncate">{restaurant.address}</span>
                    </div>
                    
                    {restaurant.phone && (
                      <div className="flex items-center gap-1">
                        <PhoneIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-500 text-xs">{restaurant.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    {/* Cuisine Badge */}
                    <span className="px-4 py-2 bg-black text-white text-sm font-bold rounded-2xl capitalize">
                      {restaurant.cuisine_type}
                    </span>

                    {/* View Menu Button */}
                    <motion.button
                      whileHover={{ scale: 1.05, x: 4 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleViewMenu(restaurant, e)}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-2xl hover:from-black hover:to-gray-900 transition-all font-bold shadow-lg"
                    >
                      <EyeIcon className="w-5 h-5" />
                      <span>VIEW MENU</span>
                      <motion.div
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.div>
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
