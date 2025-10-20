import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpenIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const StaffMenuView = ({ restaurantId }) => {
  const [categories, setCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState(null)
  const [showItemModal, setShowItemModal] = useState(false)

  useEffect(() => {
    if (restaurantId) {
      fetchMenuData()
    }
  }, [restaurantId])

  const fetchMenuData = async () => {
    try {
      setLoading(true)
      
      // Fetch categories and menu items in parallel
      const [categoriesResult, itemsResult] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('menu_items')
          .select(`
            *,
            categories (
              id,
              name
            )
          `)
          .eq('restaurant_id', restaurantId)
          .order('sort_order', { ascending: true })
      ])

      const { data: categoriesData, error: categoriesError } = categoriesResult
      const { data: itemsData, error: itemsError } = itemsResult

      if (categoriesError) throw categoriesError
      if (itemsError) throw itemsError

      setCategories(categoriesData || [])
      setMenuItems(itemsData || [])
    } catch (error) {
      console.error('Error fetching menu data:', error)
      toast.error('Failed to load menu data')
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleItemClick = (item) => {
    setSelectedItem(item)
    setShowItemModal(true)
  }

  if (loading) {
    return (
      <div className="space-y-4 p-2 sm:p-4">
        {/* Loading Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl"></div>
              <div>
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
            {/* Loading Search Bar */}
            <div className="h-10 sm:h-12 bg-gray-200 rounded-lg mb-4"></div>
            {/* Loading Category Tabs */}
            <div className="flex gap-2 overflow-x-auto">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 sm:h-10 w-20 sm:w-24 bg-gray-200 rounded-full flex-shrink-0"></div>
              ))}
            </div>
          </div>
        </div>

        {/* Loading Menu Items */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="animate-pulse">
                <div className="h-32 sm:h-40 bg-gray-200 rounded-lg mb-3"></div>
                <div className="h-4 sm:h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="flex justify-between items-center">
                  <div className="h-5 sm:h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 sm:h-8 w-6 sm:w-8 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Mobile-First Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        >
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4 sm:p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30"
              >
                <BookOpenIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </motion.div>
              <div className="flex-1">
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl sm:text-2xl font-bold mb-1"
                >
                  📖 Restaurant Menu
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-sm sm:text-base text-white/90"
                >
                  Browse all menu items and categories
                </motion.p>
              </div>
              <div className="text-center">
                <motion.p 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-xs sm:text-sm text-white/80 mb-1"
                >
                  Total Items
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-2xl sm:text-3xl font-bold"
                >
                  {menuItems.length}
                </motion.p>
              </div>
            </div>

            {/* Mobile-First Search Bar */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative"
            >
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/70" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-xl placeholder-white/70 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50 text-sm sm:text-base font-medium"
              />
            </motion.div>
          </div>

          {/* Mobile-First Category Tabs */}
          <div className="p-4 sm:p-6 bg-white">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
              <motion.button
                key="all"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory('all')}
                className={`flex items-center gap-2 px-4 py-2 sm:py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FunnelIcon className="h-4 w-4" />
                <span className="text-sm sm:text-base">All Items</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                }`}>
                  {menuItems.length}
                </span>
              </motion.button>
              
              {categories.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 sm:py-3 rounded-xl font-bold whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-sm sm:text-base">{category.name}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    selectedCategory === category.id ? 'bg-white/20 text-white' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {menuItems.filter(item => item.category_id === category.id).length}
                  </span>
                </motion.button>
              ))}
          </div>
        </div>
      </motion.div>

      {/* Mobile-First Menu Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {filteredItems.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ y: -4, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
            onClick={() => handleItemClick(item)}
          >
            {/* Enhanced Item Image */}
            <div className="relative w-full h-40 sm:h-48 bg-gradient-to-br from-orange-100 to-orange-200 overflow-hidden">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpenIcon className="h-12 w-12 text-orange-600" />
                </div>
              )}
              
              {/* Status Badge */}
              <div className="absolute top-3 right-3">
                {item.is_available ? (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-bold shadow-lg"
                  >
                    <CheckCircleIcon className="h-3 w-3" />
                    Available
                  </motion.span>
                ) : (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-red-500 text-white rounded-full text-xs font-bold shadow-lg"
                  >
                    <XCircleIcon className="h-3 w-3" />
                    Unavailable
                  </motion.span>
                )}
              </div>
              
              {/* Price Badge */}
              <div className="absolute bottom-3 left-3">
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-white/90 backdrop-blur-sm text-orange-600 rounded-full text-sm font-bold shadow-lg"
                >
                  <CurrencyRupeeIcon className="h-3 w-3" />
                  {item.price}
                </motion.span>
              </div>
            </div>    
              {/* Item Details */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {item.name}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 bg-orange-100 text-orange-600 rounded-full hover:bg-orange-200 transition-colors flex-shrink-0"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </motion.button>
                </div>
                
                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
                  {item.description || 'No description available'}
                </p>
                
                {item.preparation_time && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <ClockIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.preparation_time} minutes</span>
                  </div>
                )}
                
                {/* Enhanced Tags */}
                <div className="flex flex-wrap gap-2">
                  <span className="bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 px-3 py-1 rounded-full text-xs font-bold border border-orange-300">
                    {item.categories?.name || 'Uncategorized'}
                  </span>
                  
                  {item.is_vegetarian && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-gradient-to-r from-green-100 to-green-200 text-green-700 px-3 py-1 rounded-full text-xs font-bold border border-green-300"
                    >
                      🌱 Vegetarian
                    </motion.span>
                  )}
                  
                  {item.is_spicy && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="bg-gradient-to-r from-red-100 to-red-200 text-red-700 px-3 py-1 rounded-full text-xs font-bold border border-red-300"
                    >
                      🌶️ Spicy
                    </motion.span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Enhanced Empty State */}
        {filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full text-center py-12 sm:py-16"
          >
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-orange-300"
            >
              <BookOpenIcon className="h-10 w-10 sm:h-12 sm:w-12 text-orange-600" />
            </motion.div>
            <motion.h3 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl sm:text-2xl font-bold text-gray-900 mb-3"
            >
              No menu items found
            </motion.h3>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-600 text-sm sm:text-base max-w-md mx-auto"
            >
              {searchTerm ? `No items match "${searchTerm}"` : 'No items available in this category'}
            </motion.p>
            {searchTerm && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchTerm('')}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all duration-200"
              >
                Clear Search
              </motion.button>
            )}
          </motion.div>
        )}

        {/* Item Detail Modal */}
        <AnimatePresence>
          {showItemModal && selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowItemModal(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="relative h-64 bg-gradient-to-br from-orange-100 to-red-100">
                  {selectedItem.image_url ? (
                    <img
                      src={selectedItem.image_url}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpenIcon className="h-20 w-20 text-orange-300" />
                    </div>
                  )}
                  <button
                    onClick={() => setShowItemModal(false)}
                    className="absolute top-4 right-4 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                  >
                    <XCircleIcon className="h-6 w-6 text-gray-600" />
                  </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedItem.name}
                      </h2>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm font-medium">
                          {selectedItem.categories?.name || 'Uncategorized'}
                        </span>
                        {selectedItem.is_available ? (
                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            Available
                          </span>
                        ) : (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                            Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-orange-600">₹{selectedItem.price}</p>
                      {selectedItem.preparation_time && (
                        <div className="flex items-center gap-1 text-gray-500 mt-1">
                          <ClockIcon className="h-4 w-4" />
                          <span className="text-sm">{selectedItem.preparation_time} minutes</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">
                    {selectedItem.description || 'No description available'}
                  </p>

                  {/* Dietary Information */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className={`h-5 w-5 ${selectedItem.is_vegetarian ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className={`text-sm ${selectedItem.is_vegetarian ? 'text-green-700' : 'text-gray-500'}`}>
                        Vegetarian
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FireIcon className={`h-5 w-5 ${selectedItem.is_spicy ? 'text-red-500' : 'text-gray-300'}`} />
                      <span className={`text-sm ${selectedItem.is_spicy ? 'text-red-700' : 'text-gray-500'}`}>
                        Spicy
                      </span>
                    </div>
                  </div>

                  {/* Ingredients */}
                  {selectedItem.ingredients && selectedItem.ingredients.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Ingredients</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.ingredients.map((ingredient, index) => (
                          <span
                            key={index}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                          >
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Allergens */}
                  {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Allergens</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.allergens.map((allergen, index) => (
                          <span
                            key={index}
                            className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm"
                          >
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default StaffMenuView
