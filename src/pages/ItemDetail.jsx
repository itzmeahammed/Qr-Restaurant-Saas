import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  HeartIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon,
  MinusIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import { supabase } from '../config/supabase'
import useCartStore from '../stores/useCartStore'
import toast from 'react-hot-toast'

// Ordyrr Brand Colors - Match CustomerMenu
const BRAND_GREEN = '#00E676' // Header background
const ACTION_GREEN = '#00C853' // Buttons, active states
const DARK_TEXT = '#212121' // Primary text
const MEDIUM_GRAY = '#666666' // Secondary text
const VEG_GREEN = '#4CAF50'
const NON_VEG_RED = '#D32F2F'
const MOST_LOVED_RED = '#FF4458'

const ItemDetail = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { restaurantId, itemId } = useParams()
  const { addToCart } = useCartStore()
  
  const { tableId, tableNumber } = location.state || {}
  
  const [item, setItem] = useState(null)
  const [similarItems, setSimilarItems] = useState([])
  const [quantity, setQuantity] = useState(1)
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showDishInfo, setShowDishInfo] = useState(true)
  const [showDishSection, setShowDishSection] = useState(false)

  useEffect(() => {
    fetchItemDetails()
  }, [itemId])

  const fetchItemDetails = async () => {
    try {
      setLoading(true)
      
      // Fetch item details
      const { data: itemData, error: itemError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('id', itemId)
        .single()

      if (itemError) throw itemError
      setItem(itemData)

      // Fetch similar items (same category, different item)
      if (itemData.category_id) {
        const { data: similarData, error: similarError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('category_id', itemData.category_id)
          .eq('is_available', true)
          .neq('id', itemId)
          .limit(6)

        if (!similarError) {
          setSimilarItems(similarData || [])
        }
      }
    } catch (error) {
      console.error('Error fetching item details:', error)
      toast.error('Failed to load item details')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!item) return
    
    for (let i = 0; i < quantity; i++) {
      addToCart(item)
    }
    
    toast.success(`Added ${quantity} ${item.name} to cart`)
    navigate(-1)
  }

  const handleSimilarItemClick = (similarItem) => {
    navigate(`/menu/${restaurantId}/item/${similarItem.id}`, {
      state: { tableId, tableNumber }
    })
  }

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
            <p className="text-lg font-semibold" style={{ color: DARK_TEXT }}>Loading item details...</p>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Item not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-6 py-2 bg-black text-white rounded-xl"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Header - Compact with rounded buttons */}
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
        >
          <ArrowLeftIcon className="w-5 h-5 text-black" />
        </motion.button>
        
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </motion.button>
        </div>
      </div>

      {/* Item Image - Reduced height */}
      <div className="relative h-96 bg-gray-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-8xl">🍽️</span>
          </div>
        )}
        
        {/* Time & Highly Reordered Badge - Bottom Left */}
        <div className="absolute bottom-4 left-4 flex items-center gap-2">
          <div className="bg-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
            <ClockIcon className="w-4 h-4" style={{ color: ACTION_GREEN }} />
            <span className="text-xs font-medium text-gray-700">{item.prep_time || 16} mins</span>
          </div>
          
          {item.is_popular && (
            <div className="bg-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ACTION_GREEN }}></div>
              <span className="text-xs font-semibold" style={{ color: ACTION_GREEN }}>Highly reordered</span>
            </div>
          )}
        </div>
      </div>

      {/* Item Details - Compact */}
      <div className="px-4 py-3">
        {/* Name */}
        <h2 className="text-xl font-bold mb-2" style={{ color: DARK_TEXT }}>{item.name}</h2>
        
        {/* Description */}
        {item.description && (
          <p className="text-sm mb-3" style={{ color: MEDIUM_GRAY, lineHeight: '1.5' }}>
            {item.description}
          </p>
        )}
        
        {/* Veg Indicator & Serves */}
        <div className="flex items-center gap-3 mb-4">
          {item.is_vegetarian ? (
            <div className="w-5 h-5 border-2 rounded flex items-center justify-center" style={{ borderColor: VEG_GREEN }}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: VEG_GREEN }}></div>
            </div>
          ) : (
            <div className="w-5 h-5 border-2 rounded flex items-center justify-center" style={{ borderColor: NON_VEG_RED }}>
              <div className="w-2 h-2" style={{ backgroundColor: NON_VEG_RED, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
            </div>
          )}
          
          {item.serves && (
            <span className="text-sm font-medium" style={{ color: DARK_TEXT }}>Serves {item.serves}</span>
          )}
        </div>

        {/* View Product Details Link */}
        <button 
          onClick={() => setShowDishSection(!showDishSection)}
          className="text-sm font-semibold mb-4" 
          style={{ color: ACTION_GREEN }}
        >
          View product details →
        </button>

        {/* Dish Information - Collapsible with Border */}
        {showDishSection && (
          <div className="border border-gray-300 rounded-lg p-4 mb-4">
          <button 
            onClick={() => setShowDishInfo(!showDishInfo)}
            className="w-full flex items-center justify-between py-2"
          >
            <span className="text-base font-semibold" style={{ color: DARK_TEXT }}>Dish Information</span>
            <svg 
              className="w-5 h-5 transition-transform" 
              style={{ color: DARK_TEXT, transform: showDishInfo ? 'rotate(180deg)' : 'rotate(0deg)' }} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDishInfo && (
            <div className="py-3 space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium" style={{ color: MEDIUM_GRAY }}>Allergen Information</span>
              <span className="text-sm" style={{ color: DARK_TEXT }}>Gluten</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium" style={{ color: MEDIUM_GRAY }}>Nutritional Value</span>
              <span className="text-sm text-right" style={{ color: DARK_TEXT }}>
                Protein: 5g, Fat: 29g, Carbs: 52g,<br/>Fiber: 4g, Calories: 489kcal
              </span>
            </div>
            
            {item.description && (
              <div className="flex justify-between">
                <span className="text-sm font-medium" style={{ color: MEDIUM_GRAY }}>Key Ingredients</span>
                <span className="text-sm text-right" style={{ color: DARK_TEXT }}>
                  {item.description.split(',').slice(0, 3).join(', ')}
                </span>
              </div>
            )}
          </div>
          )}
        </div>
        )}

        {/* People Also Bought - Match Menu Page Style */}
        {similarItems.length > 0 && (
          <div className="border-t border-gray-200 pt-4 pb-4">
            <h2 className="mb-3 font-black italic uppercase" style={{ fontSize: '20px', color: DARK_TEXT }}>
              PEOPLE ALSO BOUGHT
              <span style={{ color: ACTION_GREEN }}>.</span>
            </h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {similarItems.map((similarItem, index) => (
                <motion.div
                  key={similarItem.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-2xl overflow-hidden flex-shrink-0"
                  style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.08)', width: '180px' }}
                  onClick={() => handleSimilarItemClick(similarItem)}
                >
                  {/* Food Image */}
                  <div className="relative bg-gray-100 cursor-pointer" style={{ height: '120px', borderRadius: '16px 16px 0 0' }}>
                    {similarItem.image_url ? (
                      <img src={similarItem.image_url} alt={similarItem.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-4xl">🍽️</span>
                      </div>
                    )}
                    {similarItem.is_popular && (
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
                      {similarItem.is_vegetarian ? (
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
                    <h3 className="font-semibold line-clamp-2 mb-1 cursor-pointer" style={{ fontSize: '13px', fontWeight: 600, color: DARK_TEXT, lineHeight: '1.3' }}>
                      {similarItem.name}
                    </h3>
                    {similarItem.is_popular && (
                      <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded mb-1" style={{ backgroundColor: '#E8F5E9' }}>
                        <span className="text-[9px] font-semibold" style={{ color: '#2E7D32' }}>Highly reordered</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-sm font-bold" style={{ color: DARK_TEXT }}>₹{similarItem.price}</span>
                      <motion.button whileTap={{ scale: 0.95 }}
                        onClick={(e) => { e.stopPropagation(); }}
                        className="px-3 py-1 rounded-lg font-black border-3 border-black"
                        style={{ backgroundColor: ACTION_GREEN, color: '#000000', boxShadow: '3px 3px 0px 0px rgba(0,0,0,1)', fontSize: '11px' }}>
                        ADD
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Similar Items - Old section removed */}
      {false && similarItems.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">You might also like</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {similarItems.map((similarItem) => (
                <motion.div
                  key={similarItem.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSimilarItemClick(similarItem)}
                  className="bg-gray-800 rounded-2xl overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                >
                  {/* Food Image */}
                  <div className="relative h-32 bg-gradient-to-br from-gray-700 to-gray-800">
                    {similarItem.image_url ? (
                      <img
                        src={similarItem.image_url}
                        alt={similarItem.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl">🍽️</span>
                      </div>
                    )}
                    
                    {/* Veg/Non-veg Indicator */}
                    <div className="absolute top-2 left-2">
                      {similarItem.is_vegetarian ? (
                        <div className="w-4 h-4 border-2 border-green-500 rounded flex items-center justify-center bg-white">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                        </div>
                      ) : (
                        <div className="w-4 h-4 border-2 border-red-500 rounded flex items-center justify-center bg-white">
                          <div className="w-1.5 h-1.5 bg-red-500" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="p-3">
                    <h4 className="font-semibold text-sm text-white mb-1 line-clamp-2 min-h-[2.5rem]">
                      {similarItem.name}
                    </h4>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-base font-bold text-white">
                        ₹{similarItem.price}
                      </span>
                      {similarItem.rating && (
                        <div className="flex items-center gap-1 bg-yellow-500 px-1.5 py-0.5 rounded">
                          <StarSolidIcon className="w-3 h-3 text-white" />
                          <span className="text-xs font-semibold text-white">{similarItem.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Fixed Bottom Bar - Price & Add to Cart */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-50">
        <div className="flex items-center justify-between gap-4">
          {/* Price & Quantity */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-medium" style={{ color: MEDIUM_GRAY }}>{item.serves || '280'} g</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold" style={{ color: DARK_TEXT }}>₹{item.price * quantity}</span>
              {item.original_price && item.original_price > item.price && (
                <span className="text-sm line-through" style={{ color: MEDIUM_GRAY }}>₹{item.original_price * quantity}</span>
              )}
            </div>
            <span className="text-xs" style={{ color: MEDIUM_GRAY }}>Inclusive of all taxes</span>
          </div>

          {/* Add to Cart Button - Match Menu Page Style */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleAddToCart}
            className="px-8 py-3 rounded-lg font-black border-3 border-black flex-shrink-0"
            style={{ 
              backgroundColor: ACTION_GREEN, 
              color: '#000000',
              boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
              fontSize: '14px'
            }}
          >
            ADD TO CART
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default ItemDetail
