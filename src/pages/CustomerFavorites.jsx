import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  HeartIcon,
  StarIcon,
  MapPinIcon,
  EyeIcon,
  QrCodeIcon,
  ClockIcon,
  ArrowLeftIcon,
  Bars3Icon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import CustomerNavHeader from '../components/customer/CustomerNavHeader'
import MobileMenu from '../components/customer/MobileMenu'
import { useCustomerNavigation } from '../contexts/CustomerNavigationContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'
import logo from '../assets/logo.png'

// Brand colors
const BRAND_LIME = '#C6FF3D'
const BRAND_BLACK = '#2D2D2D'

const CustomerFavorites = () => {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Safe navigation hook usage
  let navigationContext = null
  try {
    navigationContext = useCustomerNavigation()
  } catch (error) {
    console.warn('CustomerFavorites: Navigation context not available')
  }
  
  const { currentUser, isAuthenticated } = navigationContext || {}

  // Fetch real favorites data
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!currentUser) {
        setLoading(false)
        return
      }

      try {
        // Fetch favorite restaurants from Supabase
        const { data, error } = await supabase
          .from('customer_favorites')
          .select(`
            *,
            restaurants (
              id,
              name,
              address,
              cuisine_type,
              logo_url,
              is_open,
              average_rating,
              total_reviews
            )
          `)
          .eq('customer_id', currentUser.id)

        if (error) throw error

        // Transform data to match UI expectations
        const transformedFavorites = data?.map(favorite => ({
          id: favorite.restaurants?.id,
          name: favorite.restaurants?.name || 'Unknown Restaurant',
          address: favorite.restaurants?.address || 'Unknown Address',
          cuisine: favorite.restaurants?.cuisine_type || 'Various',
          rating: favorite.restaurants?.average_rating || 0,
          reviews: favorite.restaurants?.total_reviews || 0,
          image: favorite.restaurants?.logo_url,
          isOpen: favorite.restaurants?.is_open !== false,
          favoriteItems: [] // Will be populated from order history if needed
        })) || []

        setFavorites(transformedFavorites)
      } catch (error) {
        console.error('Error fetching favorites:', error)
        toast.error('Failed to load favorites')
        // Show empty state on error
        setFavorites([])
      } finally {
        setLoading(false)
      }
    }

    fetchFavorites()
  }, [currentUser])

  const removeFavorite = (restaurantId) => {
    setFavorites(prev => prev.filter(fav => fav.id !== restaurantId))
    toast.success('💔 Removed from favorites', { duration: 1500 })
  }

  const viewMenu = (restaurant) => {
    navigate(`/menu/${restaurant.id}`)
    toast.success(`🍽️ Opening ${restaurant.name} menu`, { duration: 1500 })
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavHeader 
          title="My Favorites" 
          showBackButton={true}
          showMenu={true}
          onMenuClick={() => setShowMobileMenu(true)}
        />
        <div className="p-6 text-center py-20">
          <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view your favorite restaurants</p>
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
              className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-black"
              style={{ backgroundColor: BRAND_LIME }}
            >
              <HeartSolidIcon className="w-10 h-10 text-red-500" />
            </motion.div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-black tracking-tight mb-1">MY FAVORITES</h2>
              <p className="text-black/70 font-bold text-sm">{favorites.length} favorite restaurants</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Favorites List */}
      <div className="p-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your favorites...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-16">
            <HeartIcon className="w-20 h-20 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-gray-900 mb-3">No Favorites Yet</h3>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Start exploring restaurants and add your favorites by tapping the heart icon
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/restaurants')}
              className="px-8 py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all"
            >
              Discover Restaurants
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((restaurant, index) => (
              <motion.div
                key={restaurant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
              >
                {/* Restaurant Image */}
                <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200">
                  {restaurant.image ? (
                    <img 
                      src={restaurant.image} 
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-2">
                          <span className="text-lg font-bold text-gray-600">
                            {restaurant.name.charAt(0)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{restaurant.cuisine}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      restaurant.isOpen 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {restaurant.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  {/* Favorite Button */}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFavorite(restaurant.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
                  >
                    <HeartSolidIcon className="w-5 h-5 text-red-500" />
                  </motion.button>
                </div>

                {/* Restaurant Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900 mb-1">{restaurant.name}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-1">
                          <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{restaurant.rating}</span>
                          <span>({restaurant.reviews})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          <span>{restaurant.deliveryTime}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPinIcon className="w-4 h-4" />
                        <span>{restaurant.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Favorite Items */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Your favorite items:</p>
                    <div className="space-y-1">
                      {restaurant.favoriteItems.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.name}</span>
                          <span className="text-gray-900 font-medium">₹{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => viewMenu(restaurant)}
                      disabled={!restaurant.isOpen}
                      className={`flex-1 px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        restaurant.isOpen
                          ? 'bg-black text-white hover:bg-gray-800'
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <EyeIcon className="w-4 h-4" />
                      View Menu
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toast.success('📱 QR code feature coming soon!')}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all"
                    >
                      <QrCodeIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <MobileMenu 
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </div>
  )
}

export default CustomerFavorites
