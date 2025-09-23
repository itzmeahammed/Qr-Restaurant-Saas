import React from 'react'
import { motion } from 'framer-motion'
import { 
  MapPinIcon, 
  ShoppingCartIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

const RestaurantHeader = ({ 
  restaurant, 
  table, 
  cartCount, 
  onCartClick, 
  onOrderTrackingClick, 
  hasCurrentOrder 
}) => {
  return (
    <motion.header 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm"
    >
      <div className="px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Restaurant Info */}
          <div className="flex-1 min-w-0">
            <motion.h1 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-xl sm:text-2xl font-bold text-gray-900 truncate"
            >
              {restaurant?.name}
            </motion.h1>
            
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center gap-3 mt-1 text-sm text-gray-600"
            >
              {table && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">Table {table.table_number}</span>
                </div>
              )}
              
              {table?.location && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" />
                  <span>{table.location}</span>
                </div>
              )}
              
              {!table && restaurant?.address && (
                <div className="flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" />
                  <span className="truncate">{restaurant.address}</span>
                </div>
              )}
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="flex items-center gap-2 ml-4"
          >
            {/* Order Tracking Button */}
            {hasCurrentOrder && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOrderTrackingClick}
                className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors duration-200"
              >
                <ArrowPathIcon className="w-5 h-5 text-gray-700" />
              </motion.button>
            )}

            {/* Cart Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCartClick}
              className="relative p-3 bg-black hover:bg-gray-800 rounded-full transition-colors duration-200 shadow-lg"
            >
              <ShoppingCartIcon className="w-5 h-5 text-white" />
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                >
                  {cartCount}
                </motion.span>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.header>
  )
}

export default RestaurantHeader
