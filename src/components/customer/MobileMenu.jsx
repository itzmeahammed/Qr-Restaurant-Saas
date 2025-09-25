import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  HomeIcon,
  UserIcon,
  ClockIcon,
  HeartIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline'
import { useCustomerNavigation } from '../../contexts/CustomerNavigationContext'

const MobileMenu = ({ isOpen, onClose }) => {
  // Safe navigation hook usage with fallback
  let navigationContext = null
  try {
    navigationContext = useCustomerNavigation()
  } catch (error) {
    console.warn('MobileMenu: Navigation context not available, using fallbacks')
  }
  
  const { 
    goToHome = () => window.location.href = '/customer', 
    goToProfile = () => window.location.href = '/customer-auth', 
    goToOrders = () => window.location.href = '/customer-auth',
    currentUser = null, 
    isAuthenticated = false, 
    signOut = () => window.location.href = '/customer'
  } = navigationContext || {}

  const handleSignOut = () => {
    signOut()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          {/* Mobile Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="bg-black text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
                    <span className="text-black font-bold text-lg">QR</span>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">Menu</h2>
                    <p className="text-white/70 text-sm">Customer Options</p>
                  </div>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-all"
                >
                  <XMarkIcon className="w-5 h-5" />
                </motion.button>
              </div>

              {/* User Info */}
              {isAuthenticated && currentUser ? (
                <div className="bg-white/10 rounded-xl p-3 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{currentUser.name || 'Customer'}</p>
                      <p className="text-white/70 text-sm">{currentUser.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white/10 rounded-xl p-3 mt-4 text-center">
                  <p className="text-white/80 text-sm mb-2">Sign in for better experience</p>
                  <button
                    onClick={() => {
                      goToProfile()
                      onClose()
                    }}
                    className="px-4 py-2 bg-white text-black rounded-lg font-semibold text-sm hover:bg-gray-100 transition-all"
                  >
                    Sign In
                  </button>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="flex-1 p-4">
              <div className="space-y-2">
                {/* Home */}
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    goToHome()
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left"
                >
                  <HomeIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Home</p>
                    <p className="text-xs text-gray-500">Back to main page</p>
                  </div>
                </motion.button>

                {/* Profile */}
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    goToProfile()
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left"
                >
                  <UserIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {isAuthenticated ? 'Profile' : 'Sign In'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isAuthenticated ? 'Manage account' : 'Sign in to account'}
                    </p>
                  </div>
                </motion.button>

                {/* Orders */}
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    window.location.href = '/customer-orders'
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left"
                >
                  <ClockIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">My Orders</p>
                    <p className="text-xs text-gray-500">View order history</p>
                  </div>
                </motion.button>

                {/* Favorites */}
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    window.location.href = '/customer-favorites'
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left"
                >
                  <HeartIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Favorites</p>
                    <p className="text-xs text-gray-500">Your favorite items</p>
                  </div>
                </motion.button>

                {/* Settings */}
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    window.location.href = '/customer-settings'
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all text-left"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Settings</p>
                    <p className="text-xs text-gray-500">App preferences</p>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Sign Out Button */}
            {isAuthenticated && (
              <div className="p-4 border-t border-gray-200">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all font-semibold"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  <span>Sign Out</span>
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default MobileMenu
