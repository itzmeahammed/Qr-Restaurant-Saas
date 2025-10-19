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
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <BookOpenIcon className="h-8 w-8 text-orange-500" />
          </div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <BookOpenIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Restaurant Menu</h2>
              <p className="text-gray-600">View all menu items and categories</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{menuItems.length}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none bg-white min-w-[200px]"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredItems.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              onClick={() => handleItemClick(item)}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200"
            >
              {/* Item Image */}
              <div className="relative h-48 bg-gradient-to-br from-orange-100 to-red-100">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpenIcon className="h-16 w-16 text-orange-300" />
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {item.is_available ? (
                    <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <CheckCircleIcon className="h-3 w-3" />
                      Available
                    </div>
                  ) : (
                    <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                      <XCircleIcon className="h-3 w-3" />
                      Unavailable
                    </div>
                  )}
                </div>

                {/* Dietary Icons */}
                <div className="absolute top-3 left-3 flex gap-1">
                  {item.is_vegetarian && (
                    <div className="bg-green-500 text-white p-1 rounded-full">
                      <SparklesIcon className="h-3 w-3" />
                    </div>
                  )}
                  {item.is_spicy && (
                    <div className="bg-red-500 text-white p-1 rounded-full">
                      <FireIcon className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>

              {/* Item Details */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-1">
                    {item.name}
                  </h3>
                  <div className="text-right">
                    <p className="text-xl font-bold text-orange-600">₹{item.price}</p>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {item.description || 'No description available'}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {item.categories?.name || 'Uncategorized'}
                    </span>
                  </div>
                  
                  {item.preparation_time && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <ClockIcon className="h-4 w-4" />
                      <span className="text-xs">{item.preparation_time}min</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpenIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No Menu Items Found</h3>
          <p className="text-gray-600 text-lg">
            {searchTerm || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'No menu items have been added yet'
            }
          </p>
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
  )
}

export default StaffMenuView
