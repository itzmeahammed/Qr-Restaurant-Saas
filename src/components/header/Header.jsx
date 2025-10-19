import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClipboardDocumentListIcon,
  PlusIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import NotificationDropdown from './NotificationDropdown'
import ProfileDropdown from './ProfileDropdown'

const Header = ({ 
  restaurant, 
  user, 
  profile, 
  notifications = [],
  setActiveTab,
  handleLogout 
}) => {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // Close dropdowns when clicking outside or when one opens
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-dropdown')) {
        setShowProfileMenu(false)
      }
      if (showNotifications && !event.target.closest('.notifications-dropdown')) {
        setShowNotifications(false)
      }
      if (showMobileMenu && !event.target.closest('.mobile-menu')) {
        setShowMobileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showProfileMenu, showNotifications, showMobileMenu])

  // Close other dropdown when one opens
  const handleNotificationToggle = () => {
    setShowNotifications(!showNotifications)
    if (showProfileMenu) setShowProfileMenu(false)
    if (showMobileMenu) setShowMobileMenu(false)
  }

  const handleProfileToggle = () => {
    setShowProfileMenu(!showProfileMenu)
    if (showNotifications) setShowNotifications(false)
    if (showMobileMenu) setShowMobileMenu(false)
  }

  const handleMobileMenuToggle = () => {
    setShowMobileMenu(!showMobileMenu)
    if (showNotifications) setShowNotifications(false)
    if (showProfileMenu) setShowProfileMenu(false)
  }

  return (
    <>
      {/* Orange Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-orange-500 to-orange-600 border-b border-orange-700 shadow-lg">
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18 lg:h-20">
            
            {/* Left Section - Enhanced Logo & Brand */}
            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14"
              >
                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center shadow-md">
                  <span className="text-sm sm:text-base lg:text-lg font-bold text-orange-600">QR</span>
                </div>
              </motion.div>
              
              <div className="min-w-0 flex-1">
                <motion.h1 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate"
                >
                  {restaurant?.name || 'Restaurant Dashboard'}
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xs sm:text-sm text-orange-100 truncate hidden sm:block"
                >
                  {restaurant?.address || 'Manage your restaurant operations'}
                </motion.p>
              </div>
            </div>

            {/* Right Section - Enhanced Actions */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              
              {/* Quick Actions - Desktop Only */}
              <div className="hidden lg:flex items-center space-x-2 mr-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('orders')}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 border border-white/30"
                >
                  <ClipboardDocumentListIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">Orders</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveTab('menu')}
                  className="p-2.5 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 border border-white/30"
                >
                  <PlusIcon className="h-4 w-4" />
                </motion.button>
              </div>

              {/* Mobile Menu Button */}
              <div className="lg:hidden mobile-menu">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleMobileMenuToggle}
                  className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 border border-white/30"
                >
                  <AnimatePresence mode="wait">
                    {showMobileMenu ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Bars3Icon className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>

              {/* Enhanced Notifications */}
              <div className="notifications-dropdown">
                <NotificationDropdown 
                  notifications={notifications}
                  showNotifications={showNotifications}
                  setShowNotifications={handleNotificationToggle}
                />
              </div>

              {/* Enhanced Profile Menu */}
              <div className="profile-dropdown">
                <ProfileDropdown 
                  user={user}
                  profile={profile}
                  showProfileMenu={showProfileMenu}
                  setShowProfileMenu={handleProfileToggle}
                  setActiveTab={setActiveTab}
                  handleLogout={handleLogout}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Enhanced Mobile Menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="fixed top-20 left-4 right-4 bg-white rounded-xl shadow-lg border border-gray-200 z-50 lg:hidden overflow-hidden"
            >
              <div className="p-6 space-y-4">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setActiveTab('orders')
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors duration-200"
                >
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                  <span className="font-semibold">Orders</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setActiveTab('menu')
                    setShowMobileMenu(false)
                  }}
                  className="w-full flex items-center space-x-3 p-4 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg transition-colors duration-200"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="font-semibold">Add Menu Item</span>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header
