import React from 'react'
import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  WifiIcon 
} from '@heroicons/react/24/outline'

const NetworkErrorFallback = ({ onRetry, message = "Network connection issue" }) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
          className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
        </motion.div>

        {/* Error Message */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Connection Problem
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="text-gray-600 mb-8 leading-relaxed"
        >
          {message}. Please check your internet connection and try again.
        </motion.p>

        {/* Network Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="bg-gray-50 rounded-xl p-4 mb-8"
        >
          <div className="flex items-center gap-3 mb-3">
            <WifiIcon className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700">Quick fixes:</span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 text-left">
            <li>• Check your WiFi or mobile data connection</li>
            <li>• Try switching between WiFi and mobile data</li>
            <li>• Move to an area with better signal</li>
            <li>• Refresh the page or restart the app</li>
          </ul>
        </motion.div>

        {/* Retry Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRetry}
          className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-all shadow-lg mx-auto"
        >
          <ArrowPathIcon className="w-5 h-5" />
          <span>Try Again</span>
        </motion.button>

        {/* Additional Help */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="text-xs text-gray-500 mt-6"
        >
          If the problem persists, please contact support
        </motion.p>
      </motion.div>
    </div>
  )
}

export default NetworkErrorFallback
