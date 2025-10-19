import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BellIcon, SparklesIcon } from '@heroicons/react/24/outline'

const NotificationDropdown = ({ 
  notifications = [], 
  showNotifications, 
  setShowNotifications 
}) => {
  return (
    <div className="relative">
      <motion.button 
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowNotifications(!showNotifications)}
        className={`relative p-2.5 sm:p-3 rounded-lg transition-colors duration-200 border ${
          showNotifications 
            ? 'bg-white/30 text-white border-white/50' 
            : 'bg-white/20 hover:bg-white/30 text-white border-white/30'
        }`}
      >
        <BellIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-xs font-bold text-white rounded-full flex items-center justify-center">
            {notifications.length > 9 ? '9+' : notifications.length}
          </span>
        )}
      </motion.button>
      
      {/* Enhanced Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40" 
              onClick={() => setShowNotifications(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="absolute right-0 top-full mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <BellIcon className="h-5 w-5 text-gray-600 mr-2" />
                    Notifications
                  </h3>
                  {notifications.length > 0 && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      {notifications.length} new
                    </span>
                  )}
                </div>
              </div>
              
              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-100/50">
                    {notifications.map((notification, index) => (
                      <motion.div 
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`relative w-3 h-3 rounded-full mt-1.5 flex-shrink-0 shadow-sm ${
                            notification.type === 'success' ? 'bg-gradient-to-r from-green-400 to-green-500' :
                            notification.type === 'warning' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                            notification.type === 'error' ? 'bg-gradient-to-r from-red-400 to-red-500' :
                            'bg-gradient-to-r from-blue-400 to-blue-500'
                          }`}>
                            <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                              notification.type === 'success' ? 'bg-green-400' :
                              notification.type === 'warning' ? 'bg-yellow-400' :
                              notification.type === 'error' ? 'bg-red-400' :
                              'bg-blue-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="px-6 py-12 text-center">
                    <BellIcon className="mx-auto w-16 h-16 text-gray-300 mb-4" />
                    <p className="text-sm font-medium text-gray-500 mb-1">All caught up!</p>
                    <p className="text-xs text-gray-400">No new notifications to show</p>
                  </div>
                )}
              </div>
              
              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                  <button className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors px-2 py-1 rounded hover:bg-orange-50">
                    View all
                  </button>
                  <button className="text-xs text-gray-600 hover:text-gray-700 font-medium transition-colors px-2 py-1 rounded hover:bg-gray-100">
                    Mark all as read
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationDropdown
