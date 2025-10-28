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
import logo from '../../assets/logo.png'

// Brand colors
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
            className="fixed right-0 top-0 bottom-0 w-80 shadow-2xl z-50 flex flex-col border-l-4 border-black"
            style={{ backgroundColor: BRAND_LIME }}
          >
            {/* Header */}
            <div className="bg-black text-white p-4 border-b-4 border-black">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="Ordyrr" className="h-8 w-auto" />
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center border-2 border-black shadow-[2px_2px_0_0_rgba(198,255,61,1)] hover:shadow-[3px_3px_0_0_rgba(198,255,61,1)] transition-all"
                >
                  <XMarkIcon className="w-5 h-5 text-black" />
                </motion.button>
              </div>
              
              <div>
                <h2 className="font-black text-xl tracking-tight">MENU</h2>
                <p className="font-bold text-sm" style={{ color: BRAND_LIME }}>Customer Options</p>
              </div>

              {/* User Info */}
              {isAuthenticated && currentUser ? (
                <div className="bg-white rounded-xl p-3 mt-4 border-4 border-black shadow-[3px_3px_0_0_rgba(198,255,61,1)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-3 border-black" style={{ backgroundColor: BRAND_LIME }}>
                      <UserIcon className="w-5 h-5 text-black" />
                    </div>
                    <div>
                      <p className="font-black text-black">{currentUser.name || 'Customer'}</p>
                      <p className="text-black/70 text-sm font-bold">{currentUser.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-3 mt-4 text-center border-4 border-black shadow-[3px_3px_0_0_rgba(198,255,61,1)]">
                  <p className="text-black/80 text-sm mb-2 font-bold">Sign in for better experience</p>
                  <button
                    onClick={() => {
                      goToProfile()
                      onClose()
                    }}
                    className="px-4 py-2 text-black rounded-full font-black text-sm border-3 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
                    style={{ backgroundColor: BRAND_LIME }}
                  >
                    SIGN IN
                  </button>
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {/* Home */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    goToHome()
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all text-left"
                >
                  <HomeIcon className="w-5 h-5 text-black" />
                  <div>
                    <p className="font-black text-black">HOME</p>
                    <p className="text-xs text-black/70 font-bold">Back to main page</p>
                  </div>
                </motion.button>

                {/* Profile */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    goToProfile()
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all text-left"
                >
                  <UserIcon className="w-5 h-5 text-black" />
                  <div>
                    <p className="font-black text-black">
                      {isAuthenticated ? 'PROFILE' : 'SIGN IN'}
                    </p>
                    <p className="text-xs text-black/70 font-bold">
                      {isAuthenticated ? 'Manage account' : 'Sign in to account'}
                    </p>
                  </div>
                </motion.button>

                {/* Orders */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    window.location.href = '/customer-orders'
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all text-left"
                >
                  <ClockIcon className="w-5 h-5 text-black" />
                  <div>
                    <p className="font-black text-black">MY ORDERS</p>
                    <p className="text-xs text-black/70 font-bold">View order history</p>
                  </div>
                </motion.button>

                {/* Favorites */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    window.location.href = '/customer-favorites'
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all text-left"
                >
                  <HeartIcon className="w-5 h-5 text-black" />
                  <div>
                    <p className="font-black text-black">FAVORITES</p>
                    <p className="text-xs text-black/70 font-bold">Your favorite items</p>
                  </div>
                </motion.button>

                {/* Settings */}
                <motion.button
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    window.location.href = '/customer-settings'
                    onClose()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all text-left"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-black" />
                  <div>
                    <p className="font-black text-black">SETTINGS</p>
                    <p className="text-xs text-black/70 font-bold">App preferences</p>
                  </div>
                </motion.button>
              </div>
            </div>

            {/* Sign Out Button */}
            {isAuthenticated && (
              <div className="p-4 border-t-4 border-black">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 p-3 bg-red-500 text-white rounded-full border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all font-black"
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
