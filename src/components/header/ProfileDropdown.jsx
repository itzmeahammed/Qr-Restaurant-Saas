import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserCircleIcon, 
  ChevronDownIcon,
  ChartBarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  StarIcon
} from '@heroicons/react/24/outline'

const ProfileDropdown = ({ 
  user, 
  profile, 
  showProfileMenu, 
  setShowProfileMenu,
  setActiveTab,
  handleLogout 
}) => {
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Owner'
  const userEmail = user?.email || 'owner@restaurant.com'

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowProfileMenu(!showProfileMenu)}
        className={`flex items-center space-x-2 sm:space-x-3 p-2 sm:p-2.5 rounded-lg transition-colors duration-200 border ${
          showProfileMenu 
            ? 'bg-white/30 border-white/50' 
            : 'bg-white/20 hover:bg-white/30 border-white/30'
        }`}
      >
        {/* Avatar */}
        <div className="relative">
          <div className="w-7 h-7 sm:w-9 sm:h-9 bg-white rounded-lg flex items-center justify-center">
            <UserCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
        </div>
        
        {/* User Info */}
        <div className="hidden sm:block text-left min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate max-w-24 lg:max-w-none">
            {userName}
          </p>
          <p className="text-xs text-orange-100">
            Restaurant Owner
          </p>
        </div>
        
        {/* Chevron */}
        <ChevronDownIcon className={`h-4 w-4 text-white transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Enhanced Profile Dropdown */}
      <AnimatePresence>
        {showProfileMenu && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40" 
              onClick={() => setShowProfileMenu(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute right-0 top-full mt-3 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
            >
              {/* Profile Header */}
              <div className="px-6 py-5 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <UserCircleIcon className="h-7 w-7 text-white" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {userName}
                    </h3>
                    <p className="text-xs text-gray-600 truncate">
                      {userEmail}
                    </p>
                    <div className="flex items-center mt-1">
                      <StarIcon className="h-3 w-3 text-yellow-400 mr-1" />
                      <span className="text-xs text-gray-500">Premium Owner</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Menu Items */}
              <div className="py-3">
                <button 
                  onClick={() => {
                    setShowProfileMenu(false)
                    setActiveTab('analytics')
                  }}
                  className="w-full text-left px-6 py-3 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 flex items-center space-x-4 transition-colors duration-200"
                >
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <ChartBarIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="block">Analytics</span>
                    <span className="text-xs text-gray-500">View performance metrics</span>
                  </div>
                </button>
                
                <button 
                  onClick={() => {
                    setShowProfileMenu(false)
                    // Add settings functionality here
                  }}
                  className="w-full text-left px-6 py-3 text-sm font-medium text-gray-700 hover:text-purple-700 hover:bg-purple-50 flex items-center space-x-4 transition-colors duration-200"
                >
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <CogIcon className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <span className="block">Settings</span>
                    <span className="text-xs text-gray-500">Manage preferences</span>
                  </div>
                </button>
                
                {/* Divider */}
                <div className="my-2 mx-6 border-t border-gray-100"></div>
                
                <button 
                  onClick={() => {
                    setShowProfileMenu(false)
                    handleLogout()
                  }}
                  className="w-full text-left px-6 py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center space-x-4 transition-colors duration-200"
                >
                  <div className="p-2 bg-red-50 rounded-lg">
                    <ArrowRightOnRectangleIcon className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <span className="block">Sign out</span>
                    <span className="text-xs text-red-400">End your session</span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProfileDropdown
