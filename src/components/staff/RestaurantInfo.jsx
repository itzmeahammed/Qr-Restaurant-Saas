import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  StarIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  TagIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  CameraIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../config/supabase'

const RestaurantInfo = ({ restaurantId }) => {
  const [restaurant, setRestaurant] = useState(null)
  const [menuCategories, setMenuCategories] = useState([])
  const [popularItems, setPopularItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantInfo()
    }
  }, [restaurantId])

  const fetchRestaurantInfo = async () => {
    try {
      setLoading(true)

      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single()

      if (restaurantError) throw restaurantError

      // Fetch menu categories - categories.restaurant_id references restaurants.id
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('sort_order')

      // Fetch popular menu items - menu_items.restaurant_id references restaurants.id
      const { data: popularItemsData } = await supabase
        .from('menu_items')
        .select(`
          *,
          categories (name),
          order_items (id)
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .limit(6)

      // Sort by order frequency
      const itemsWithOrderCount = popularItemsData?.map(item => ({
        ...item,
        orderCount: item.order_items?.length || 0
      })).sort((a, b) => b.orderCount - a.orderCount) || []

      setRestaurant(restaurantData)
      setMenuCategories(categoriesData || [])
      setPopularItems(itemsWithOrderCount)

    } catch (error) {
      console.error('Error fetching restaurant info:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getOperatingHours = () => {
    if (!restaurant?.opening_hours) return 'Not specified'
    
    try {
      // opening_hours is already an object, no need to parse JSON
      const hours = restaurant.opening_hours
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const todayHours = hours[today]
      
      if (!todayHours || todayHours.closed) {
        return 'Closed today'
      }
      
      return `${todayHours.open} - ${todayHours.close}`
    } catch {
      return 'Hours not available'
    }
  }

  const isCurrentlyOpen = () => {
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
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Loading Header */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-2xl"></div>
                <div className="flex-1">
                  <div className="h-6 sm:h-8 bg-gray-200 rounded-lg w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
          {/* Loading Cards */}
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-2xl shadow-lg border border-gray-200 p-8 sm:p-12 max-w-md mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6"
          >
            <BuildingStorefrontIcon className="h-10 w-10 text-orange-600" />
          </motion.div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">Restaurant not found</h3>
          <p className="text-gray-600">Unable to load restaurant information</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Restaurant Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg border border-gray-200 overflow-hidden"
      >
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-r from-orange-400 to-orange-600">
          {restaurant.banner_url ? (
            <img
              src={restaurant.banner_url}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <CameraIcon className="h-16 w-16 text-white opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          
          {/* Restaurant Logo */}
          <div className="absolute -bottom-12 left-6">
            <div className="w-24 h-24 bg-white rounded-full border-4 border-white shadow-lg overflow-hidden">
              {restaurant.logo_url ? (
                <img
                  src={restaurant.logo_url}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <BuildingStorefrontIcon className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="pt-16 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="line-clamp-2">{restaurant.address || 'Address not provided'}</span>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-left sm:text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isCurrentlyOpen() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isCurrentlyOpen() ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {isCurrentlyOpen() ? 'Open' : 'Closed'}
              </div>
              <div className="flex items-center gap-1 text-gray-500 mt-1">
                <ClockIcon className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">{getOperatingHours()}</span>
              </div>
            </div>
          </div>

          {restaurant.description && (
            <p className="text-gray-700 mb-4">{restaurant.description}</p>
          )}

          {/* Restaurant Stats */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <StarIcon className="h-4 w-4 text-yellow-500" />
                <span className="font-semibold">{restaurant.rating || '4.5'}</span>
              </div>
              <p className="text-xs text-gray-600">Rating</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <UserGroupIcon className="h-4 w-4 text-blue-500" />
                <span className="font-semibold">{restaurant.total_orders || '0'}</span>
              </div>
              <p className="text-xs text-gray-600">Total Orders</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TagIcon className="h-4 w-4 text-green-500" />
                <span className="font-semibold">{menuCategories.length}</span>
              </div>
              <p className="text-xs text-gray-600">Categories</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Contact Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {restaurant.phone && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <PhoneIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{restaurant.phone}</p>
              </div>
            </div>
          )}
          
          {restaurant.email && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <EnvelopeIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{restaurant.email}</p>
              </div>
            </div>
          )}
          
          {restaurant.website && (
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <GlobeAltIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Website</p>
                <a 
                  href={restaurant.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-600 hover:underline"
                >
                  {restaurant.website}
                </a>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Hours Today</p>
              <p className="font-medium">{getOperatingHours()}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4"
      >
        {[
          { icon: TagIcon, label: 'Categories', value: menuCategories.length, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
          { icon: CurrencyRupeeIcon, label: 'Menu Items', value: popularItems.length, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
          { icon: StarIcon, label: 'Rating', value: '4.5', bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' },
          { icon: UserGroupIcon, label: 'Orders', value: '150+', bgColor: 'bg-purple-100', iconColor: 'text-purple-600' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            whileHover={{ scale: 1.02, y: -2 }}
            className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl flex items-center justify-center ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 ${stat.iconColor}`} />
              </div>
            </div>
            <div>
              <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-xs sm:text-sm text-gray-600 font-medium line-clamp-1">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Mobile-First Menu Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center">
            <TagIcon className="h-5 w-5 text-orange-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Menu Categories</h2>
        </div>
        
        {menuCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {menuCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-center hover:shadow-md transition-all duration-200 hover:scale-105"
              >
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-200 to-orange-300 rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform duration-300">
                    <TagIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8 text-orange-700" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 line-clamp-1 text-sm sm:text-base">{category.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{category.description || 'Category items'}</p>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 sm:py-12"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TagIcon className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No Categories Yet</h3>
            <p className="text-gray-600 text-sm">Menu categories will appear here</p>
          </motion.div>
        )}
      </motion.div>

      {/* Mobile-First Popular Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6"
      >
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
            <StarIcon className="h-5 w-5 text-green-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Popular Menu Items</h2>
        </div>
        
        {popularItems.length > 0 ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {popularItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 lg:p-6 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex gap-2 sm:gap-3">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl overflow-hidden flex-shrink-0 border-2 border-orange-200"
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CameraIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-orange-600" />
                      </div>
                    )}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-1 line-clamp-2 text-sm sm:text-base">{item.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2 font-medium line-clamp-1">{item.categories?.name}</p>
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <span className="text-sm sm:text-base lg:text-lg font-bold text-orange-600">
                        {formatCurrency(item.price)}
                      </span>
                      {item.orderCount > 0 && (
                        <motion.span 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold self-start"
                        >
                          <FireIcon className="h-3 w-3" />
                          {item.orderCount} orders
                        </motion.span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 sm:py-12"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">No Popular Items</h3>
            <p className="text-gray-600 text-sm">Popular menu items will appear here</p>
          </motion.div>
        )}
      </motion.div>

      {/* Additional Info */}
      {(restaurant.special_features || restaurant.payment_methods) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="space-y-4">
            {restaurant.special_features && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Special Features</h3>
                <p className="text-gray-700">{restaurant.special_features}</p>
              </div>
            )}
            
            {restaurant.payment_methods && (
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Payment Methods</h3>
                <p className="text-gray-700">{restaurant.payment_methods}</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
      </div>
    </div>
  )
}

export default RestaurantInfo
