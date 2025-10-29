import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BellIcon, 
  SparklesIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'

const NotificationDropdown = ({ 
  notifications = [], 
  unreadNotifications = 0,
  showNotifications, 
  setShowNotifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead
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
        {unreadNotifications > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-red-500 text-xs font-bold text-white rounded-full flex items-center justify-center">
            {unreadNotifications > 9 ? '9+' : unreadNotifications}
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
                  {unreadNotifications > 0 && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                      {unreadNotifications} unread
                    </span>
                  )}
                </div>
              </div>
              
              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  <div className="divide-y divide-gray-100/50">
                    {notifications.map((notification, index) => {
                      const getNotificationIcon = (type) => {
                        switch (type) {
                          case 'new_order':
                            return <InformationCircleIcon className="h-5 w-5 text-blue-500" />
                          case 'order_assigned':
                            return <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          case 'order_accepted':
                            return <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          case 'order_rejected':
                            return <XCircleIcon className="h-5 w-5 text-red-500" />
                          case 'no_staff_available':
                            return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                          default:
                            return <BellIcon className="h-5 w-5 text-gray-500" />
                        }
                      }

                      const getNotificationBg = (isRead) => {
                        return isRead ? 'hover:bg-gray-50' : 'bg-blue-50/50 hover:bg-blue-50'
                      }

                      return (
                        <motion.div 
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`px-6 py-4 transition-colors duration-200 cursor-pointer ${getNotificationBg(notification.is_read)}`}
                          onClick={() => onMarkNotificationRead && onMarkNotificationRead(notification.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.notification_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm leading-relaxed ${notification.is_read ? 'text-gray-700' : 'text-gray-900 font-medium'}`}>
                                {notification.message}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs text-gray-500">
                                  {new Date(notification.created_at).toLocaleString()}
                                </p>
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
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
                  <span className="text-xs text-gray-500">
                    {notifications.length} total notifications
                  </span>
                  {unreadNotifications > 0 && (
                    <button 
                      onClick={() => onMarkAllNotificationsRead && onMarkAllNotificationsRead()}
                      className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors px-2 py-1 rounded hover:bg-orange-50"
                    >
                      Mark all as read
                    </button>
                  )}
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
