import React, { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const CategoryTabs = ({ categories, activeCategory, onCategoryChange }) => {
  const scrollRef = useRef(null)
  const activeRef = useRef(null)

  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current
      const activeElement = activeRef.current
      const containerRect = container.getBoundingClientRect()
      const activeRect = activeElement.getBoundingClientRect()
      
      if (activeRect.left < containerRect.left || activeRect.right > containerRect.right) {
        activeElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'center' 
        })
      }
    }
  }, [activeCategory])

  if (!categories || categories.length === 0) return null

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="sticky top-[73px] sm:top-[81px] z-40 bg-white border-b border-gray-100"
    >
      <div className="px-4 py-3 sm:px-6">
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category, index) => {
            const isActive = activeCategory === category.id
            return (
              <motion.button
                key={category.id}
                ref={isActive ? activeRef : null}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onCategoryChange(category.id)}
                className={`
                  relative px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all duration-300 min-w-fit
                  ${isActive 
                    ? 'bg-black text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {category.name}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-black rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

export default CategoryTabs
