import React from 'react'
import { motion } from 'framer-motion'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const ErrorScreen = ({ onRetry }) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md mx-auto"
      >
        {/* Error Icon */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
          className="w-24 h-24 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center"
        >
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500" />
        </motion.div>

        {/* Error Title */}
        <motion.h2 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-2xl font-bold text-gray-900 mb-3"
        >
          Restaurant Not Found
        </motion.h2>

        {/* Error Description */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-gray-600 mb-8 leading-relaxed"
        >
          We couldn't find this restaurant or there might be an issue with your QR code. 
          Please check the code and try again.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="space-y-3"
        >
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="w-full px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors duration-200 shadow-sm hover:shadow-md"
          >
            Try Again
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/'}
            className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors duration-200"
          >
            Go to Homepage
          </motion.button>
        </motion.div>

        {/* Help Text */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-8 p-4 bg-gray-50 rounded-xl"
        >
          <p className="text-sm text-gray-600">
            <strong>Need help?</strong><br />
            Make sure you're scanning the correct QR code from your table. 
            If the problem persists, please ask your server for assistance.
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default ErrorScreen
