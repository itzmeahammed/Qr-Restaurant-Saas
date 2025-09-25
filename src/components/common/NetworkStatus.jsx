import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  WifiIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineMessage, setShowOfflineMessage] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineMessage(false)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineMessage(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-hide offline message after 5 seconds when back online
  useEffect(() => {
    if (isOnline && showOfflineMessage) {
      const timer = setTimeout(() => {
        setShowOfflineMessage(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, showOfflineMessage])

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-black text-white px-4 py-4 border-b-4 border-white"
        >
          <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto">
            <ExclamationTriangleIcon className="w-6 h-6" />
            <span className="font-bold tracking-tight">
              YOU'RE OFFLINE - Some features may not work properly
            </span>
          </div>
        </motion.div>
      )}
      
      {isOnline && showOfflineMessage && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 bg-white text-black px-4 py-4 border-b-4 border-black"
        >
          <div className="flex items-center justify-center gap-3 max-w-4xl mx-auto">
            <WifiIcon className="w-6 h-6" />
            <span className="font-bold tracking-tight">
              YOU'RE BACK ONLINE!
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default NetworkStatus
