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

      // Fetch menu categories
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('sort_order')

      // Fetch popular menu items (based on order frequency)
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
    if (!restaurant?.operating_hours) return 'Not specified'
    
    try {
      const hours = JSON.parse(restaurant.operating_hours)
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const todayHours = hours[today]
      
      if (!todayHours || todayHours.closed) {
        return 'Closed today'
      }
      
      return `${todayHours.open} - ${todayHours.close}`
    } catch {
      return restaurant.operating_hours
    }
  }

  const isCurrentlyOpen = () => {
    if (!restaurant?.operating_hours) return false
    
    try {
      const hours = JSON.parse(restaurant.operating_hours)
      const now = new Date()
      const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
      const todayHours = hours[today]
      
      if (!todayHours || todayHours.closed) return false
      
      const currentTime = now.toTimeString().slice(0, 5)
      return currentTime >= todayHours.open && currentTime <= todayHours.close
    } catch {
      return true // Default to open if can't parse
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <BuildingStorefrontIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Restaurant not found</h3>
        <p className="text-gray-500">Unable to load restaurant information</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
        <div className="pt-16 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPinIcon className="h-4 w-4" />
                  <span>{restaurant.address || 'Address not provided'}</span>
                </div>
                {restaurant.phone && (
                  <div className="flex items-center gap-1">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{restaurant.phone}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                isCurrentlyOpen() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isCurrentlyOpen() ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                {isCurrentlyOpen() ? 'Open Now' : 'Closed'}
              </div>
              <p className="text-sm text-gray-600 mt-1">{getOperatingHours()}</p>
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

      {/* Menu Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu Categories</h2>
        {menuCategories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {menuCategories.map((category) => (
              <div
                key={category.id}
                className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center"
              >
                <h3 className="font-medium text-gray-900">{category.name}</h3>
                {category.description && (
                  <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TagIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No menu categories available</p>
          </div>
        )}
      </motion.div>

      {/* Popular Items */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Popular Menu Items</h2>
        {popularItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularItems.map((item) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <CameraIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                    <p className="text-sm text-gray-600 mb-1">{item.categories?.name}</p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-orange-600">
                        {formatCurrency(item.price)}
                      </span>
                      {item.orderCount > 0 && (
                        <span className="text-xs text-gray-500">
                          {item.orderCount} orders
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CurrencyRupeeIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No popular items to display</p>
          </div>
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
  )
}

export default RestaurantInfo
