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
import logo from '../../assets/logo green.png'

// Brand colors - Matching Menu Page
const BRAND_GREEN = '#00E676'
const ACTION_GREEN = '#00C853'
const BRAND_LIME = '#C6FF3D'
const BRAND_BLACK = '#2D2D2D'

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
            className="fixed right-0 top-0 bottom-0 w-80 shadow-2xl z-50 flex flex-col bg-white"
          >
            {/* Header - Green Gradient */}
            <div className="p-4 relative overflow-hidden" style={{ 
              background: `linear-gradient(135deg, ${BRAND_GREEN} 0%, #00D966 100%)`,
              minHeight: '140px'
            }}>
              {/* Decorative sparkles */}
              <div className="absolute inset-0 opacity-30">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute bg-white rounded-full animate-pulse"
                    style={{
                      width: Math.random() * 4 + 2 + 'px',
                      height: Math.random() * 4 + 2 + 'px',
                      top: Math.random() * 100 + '%',
                      left: Math.random() * 100 + '%',
                      animationDelay: Math.random() * 2 + 's'
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <img src={logo} alt="Ordyrr" className="h-10 w-auto" />
                  
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center"
                    style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' }}
                  >
                    <XMarkIcon className="w-5 h-5 text-black" />
                  </motion.button>
                </div>
                
                <div>
                  <h2 className="font-black text-2xl tracking-tight uppercase" style={{ color: '#2C2C2C', fontStyle: 'italic' }}>MENU</h2>
                  <p className="font-normal text-sm" style={{ color: '#424242' }}>Customer Options</p>
                </div>
              </div>

              {/* User Info */}
              {isAuthenticated && currentUser && (
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 mt-4 relative z-10" style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.1)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: ACTION_GREEN }}>
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{currentUser.name || 'Customer'}</p>
                      <p className="text-gray-600 text-sm">{currentUser.email}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-2">
                {/* Home */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    goToHome()
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-white transition-all text-left"
                  style={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}
                >
                  <HomeIcon className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="font-semibold text-gray-900">HOME</p>
                    <p className="text-xs text-gray-500">Back to main page</p>
                  </div>
                </motion.button>

                {/* Profile */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    goToProfile()
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-white transition-all text-left"
                  style={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}
                >
                  <UserIcon className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {isAuthenticated ? 'PROFILE' : 'SIGN IN'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {isAuthenticated ? 'Manage account' : 'Sign in to account'}
                    </p>
                  </div>
                </motion.button>

                {/* Orders */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    window.location.href = '/customer-orders'
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-white transition-all text-left"
                  style={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}
                >
                  <ClockIcon className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="font-semibold text-gray-900">MY ORDERS</p>
                    <p className="text-xs text-gray-500">View order history</p>
                  </div>
                </motion.button>

                {/* Favorites */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    window.location.href = '/customer-favorites'
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-white transition-all text-left"
                  style={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}
                >
                  <HeartIcon className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="font-semibold text-gray-900">FAVORITES</p>
                    <p className="text-xs text-gray-500">Your favorite items</p>
                  </div>
                </motion.button>

                {/* Settings */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    window.location.href = '/customer-settings'
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl bg-white transition-all text-left"
                  style={{ boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' }}
                >
                  <Cog6ToothIcon className="w-5 h-5 text-gray-700" />
                  <div>
                    <p className="font-semibold text-gray-900">SETTINGS</p>
                    <p className="text-xs text-gray-500">App preferences</p>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Sign Out Button */}
            {isAuthenticated && (
              <div className="p-4 bg-white border-t border-gray-200">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-xl transition-all font-semibold"
                  style={{ boxShadow: '0px 2px 8px rgba(239,68,68,0.3)' }}
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>SIGN OUT</span>
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
