import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon,
  ClockIcon,
  CheckBadgeIcon as LeafIcon,
  HeartIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'

const MenuItem = ({ item, onAddToCart, index }) => {
  const [isLiked, setIsLiked] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddToCart = async () => {
    setIsAdding(true)
    await new Promise(resolve => setTimeout(resolve, 300)) // Smooth animation
    onAddToCart(item)
    setIsAdding(false)
  }

  const toggleLike = (e) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.5,
        ease: "easeOut"
      }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 h-[320px] flex flex-col"
    >
      {/* Image Section */}
      {item.image_url ? (
        <div className="relative h-36 overflow-hidden flex-shrink-0">
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Like Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleLike}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm"
          >
            {isLiked ? (
              <HeartSolidIcon className="w-4 h-4 text-red-500" />
            ) : (
              <HeartIcon className="w-4 h-4 text-gray-600" />
            )}
          </motion.button>

          {/* Dietary Badges */}
          <div className="absolute top-3 left-3 flex gap-1">
            {item.is_vegetarian && (
              <div className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                <LeafIcon className="w-3 h-3" />
                Veg
              </div>
            )}
            {item.is_vegan && (
              <div className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                Vegan
              </div>
            )}
            {item.is_gluten_free && (
              <div className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                GF
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="h-36 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
          <div className="text-center text-gray-500">
            <div className="w-12 h-12 mx-auto mb-2 bg-gray-300 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs">No image</p>
          </div>
        </div>
      )}

      {/* Content Section */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className="font-bold text-base text-gray-900 truncate mb-1">
              {item.name}
            </h3>
            
            {/* Dietary indicators for non-image items */}
            {!item.image_url && (
              <div className="flex items-center gap-1 mb-1">
                {item.is_vegetarian && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                    <LeafIcon className="w-2.5 h-2.5" />
                    Veg
                  </span>
                )}
                {item.is_vegan && (
                  <span className="text-xs text-green-600 font-medium">Vegan</span>
                )}
                {item.is_gluten_free && (
                  <span className="text-xs text-blue-600 font-medium">GF</span>
                )}
              </div>
            )}
          </div>
          
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-bold text-gray-900">
              ₹{item.price}
            </span>
          </div>
        </div>
        
        {/* Description */}
        <div className="flex-1 mb-3">
          {item.description && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
          
          {/* Preparation Time */}
          {item.preparation_time && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
              <ClockIcon className="w-3 h-3" />
              <span>{item.preparation_time} mins</span>
            </div>
          )}
        </div>
        
        {/* Add to Cart Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          disabled={isAdding}
          className={`
            w-full py-2.5 rounded-lg font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 mt-auto
            ${isAdding 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-gray-800 shadow-sm hover:shadow-md'
            }
          `}
        >
          {isAdding ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full"
            />
          ) : (
            <>
              <PlusIcon className="w-4 h-4" />
              Add to Cart
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}

export default MenuItem
