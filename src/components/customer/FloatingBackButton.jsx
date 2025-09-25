import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { useCustomerNavigation } from '../../contexts/CustomerNavigationContext'

const FloatingBackButton = ({ show = true, position = 'bottom-left' }) => {
  // Safe navigation hook usage with fallback
  let navigationContext = null
  try {
    navigationContext = useCustomerNavigation()
  } catch (error) {
    console.warn('FloatingBackButton: Navigation context not available, using fallback')
  }
  
  const { 
    goBack = () => window.history.back(), 
    canGoBack = true 
  } = navigationContext || {}

  if (!show || !canGoBack) return null

  const positionClasses = {
    'bottom-left': 'bottom-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'top-left': 'top-6 left-6',
    'top-right': 'top-6 right-6'
  }

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={goBack}
        className={`fixed ${positionClasses[position]} w-14 h-14 bg-black text-white rounded-full shadow-2xl hover:bg-gray-800 transition-all z-40 flex items-center justify-center`}
      >
        <ArrowLeftIcon className="w-6 h-6" />
      </motion.button>
    </AnimatePresence>
  )
}

export default FloatingBackButton
