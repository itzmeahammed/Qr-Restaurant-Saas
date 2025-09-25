import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeftIcon,
  HomeIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  QrCodeIcon,
  HeartIcon,
  ClockIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useCustomerNavigation } from '../../contexts/CustomerNavigationContext'

const CustomerNavHeader = ({ title, showBackButton = true, showMenu = true, onMenuClick }) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  // Safe navigation hook usage with fallback
  let navigationContext = null
  try {
    navigationContext = useCustomerNavigation()
  } catch (error) {
    console.warn('CustomerNavHeader: Navigation context not available, using fallbacks')
  }
  
  const { 
    goBack = () => window.history.back(), 
    goToHome = () => window.location.href = '/customer', 
    goToProfile = () => window.location.href = '/customer-auth', 
    goToOrders = () => window.location.href = '/customer-auth',
    canGoBack = true, 
    currentUser = null, 
    isAuthenticated = false, 
    signOut = () => window.location.href = '/customer'
  } = navigationContext || {}

  const handleSignOut = () => {
    signOut()
    setShowMobileMenu(false)
  }

  return (
    <>
      {/* Main Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left Side - Back Button */}
            <div className="flex items-center gap-3">
              {showBackButton && canGoBack && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goBack}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
                >
                  <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
                </motion.button>
              )}
              
              {/* Home Button (when no back button) */}
              {(!showBackButton || !canGoBack) && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={goToHome}
                  className="w-10 h-10 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-all"
                >
                  <HomeIcon className="w-5 h-5 text-white" />
                </motion.button>
              )}
            </div>

            {/* Center - Title */}
            <div className="flex-1 text-center">
              <h1 className="text-lg font-bold text-gray-900 truncate">
                {title}
              </h1>
            </div>

            {/* Right Side - User Menu */}
            <div className="flex items-center gap-2">
              {isAuthenticated && currentUser && (
                <div className="hidden sm:flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
                  <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center">
                    <UserIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 truncate max-w-20">
                    {currentUser.name || currentUser.email}
                  </span>
                </div>
              )}

              {showMenu && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onMenuClick || (() => setShowMobileMenu(true))}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-all"
                >
                  <Bars3Icon className="w-5 h-5 text-gray-700" />
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />

            {/* Awesome Mobile Menu Panel */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-80 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              {/* Swipe Handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Awesome Menu Header */}
              <div className="bg-gradient-to-br from-black via-gray-900 to-black text-white p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="w-16 h-16 bg-gradient-to-br from-white to-gray-200 rounded-3xl flex items-center justify-center shadow-xl"
                      >
                        <QrCodeIcon className="w-8 h-8 text-black" />
                      </motion.div>
                      <div>
                        <h2 className="font-black text-2xl tracking-tight">QR RESTAURANT</h2>
                        <p className="text-white/80 font-medium">Customer Experience</p>
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowMobileMenu(false)}
                      className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </motion.button>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                  <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
                </div>

                {/* User Info */}
                {isAuthenticated && currentUser ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/10 backdrop-blur-md rounded-3xl p-5 mt-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-white to-gray-200 rounded-2xl flex items-center justify-center shadow-lg">
                        <UserIcon className="w-8 h-8 text-black" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg text-white">{currentUser.name || 'Customer'}</p>
                        <p className="text-white/70 text-sm">{currentUser.email}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-green-300 text-xs font-medium">Online</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-white/10 backdrop-blur-md rounded-3xl p-5 mt-4 text-center"
                  >
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <UserIcon className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-white/80 mb-3">Sign in for a personalized experience</p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        goToProfile()
                        setShowMobileMenu(false)
                      }}
                      className="px-6 py-2 bg-white text-black rounded-2xl font-bold hover:bg-gray-100 transition-all"
                    >
                      Sign In
                    </motion.button>
                  </motion.div>
                )}
              </div>

              {/* Awesome Menu Items */}
              <div className="flex-1 bg-gray-50 p-6">
                <div className="space-y-3">
                  {/* Home */}
                  <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    whileHover={{ x: 8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      goToHome()
                      setShowMobileMenu(false)
                    }}
                    className="w-full flex items-center gap-4 p-5 bg-white rounded-3xl hover:shadow-lg transition-all text-left group"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                      <HomeIcon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg">Home</p>
                      <p className="text-sm text-gray-600">Back to main page</p>
                    </div>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-gray-400"
                    >
                      →
                    </motion.div>
                  </motion.button>

                {/* Profile */}
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    goToProfile()
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all text-left"
                >
                  <UserIcon className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {isAuthenticated ? 'Profile' : 'Sign In'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {isAuthenticated ? 'Manage your account' : 'Sign in to your account'}
                    </p>
                  </div>
                </motion.button>

                {/* Orders */}
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => {
                    goToOrders()
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all text-left"
                >
                  <ClockIcon className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">My Orders</p>
                    <p className="text-sm text-gray-500">View order history</p>
                  </div>
                </motion.button>

                {/* Favorites */}
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all text-left"
                >
                  <HeartIcon className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Favorites</p>
                    <p className="text-sm text-gray-500">Your favorite restaurants</p>
                  </div>
                </motion.button>

                {/* Settings */}
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => setShowMobileMenu(false)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-all text-left"
                >
                  <Cog6ToothIcon className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-semibold text-gray-900">Settings</p>
                    <p className="text-sm text-gray-500">App preferences</p>
                  </div>
                </motion.button>
                </div>
              </div>

              {/* Sign Out Button */}
              {isAuthenticated && (
                <div className="p-6 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all font-semibold"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    <span>Sign Out</span>
                  </motion.button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default CustomerNavHeader
