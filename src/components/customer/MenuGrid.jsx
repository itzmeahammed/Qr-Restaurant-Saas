import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MenuItem from './MenuItem'
import EmptyState from './EmptyState'

const MenuGrid = ({ items, onAddToCart, categories, activeCategory, onCategoryChange }) => {
  if (!items || items.length === 0) {
    return (
      <EmptyState 
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={onCategoryChange}
      />
    )
  }

  return (
    <div className="px-4 py-6 sm:px-6 sm:py-8">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"
      >
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <MenuItem
              key={item.id}
              item={item}
              index={index}
              onAddToCart={onAddToCart}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default MenuGrid
