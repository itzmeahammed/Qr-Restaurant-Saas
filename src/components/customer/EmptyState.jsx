import React from 'react'
import { motion } from 'framer-motion'

const EmptyState = ({ categories, activeCategory, onCategoryChange }) => {
  const hasCategories = categories && categories.length > 0
  const hasMultipleCategories = categories && categories.length > 1

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh] px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md mx-auto"
      >
        {/* Icon */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
          className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center"
        >
          <svg 
            className="w-12 h-12 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="1.5" 
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
            />
          </svg>
        </motion.div>

        {/* Title */}
        <motion.h3 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-xl font-bold text-gray-900 mb-3"
        >
          {hasCategories ? 'No Items Available' : 'Menu Coming Soon'}
        </motion.h3>

        {/* Description */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-gray-600 mb-6 leading-relaxed"
        >
          {!hasCategories 
            ? "This restaurant is still setting up their menu. Please check back soon for delicious options!"
            : "No items available in this category right now. Try exploring other categories or check back later."
          }
        </motion.p>

        {/* Action Button */}
        {hasMultipleCategories && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onCategoryChange(categories[0]?.id)}
            className="px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            Browse All Categories
          </motion.button>
        )}

        {/* Decorative Elements */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-8 flex justify-center space-x-2"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2
              }}
              className="w-2 h-2 bg-gray-300 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

export default EmptyState
