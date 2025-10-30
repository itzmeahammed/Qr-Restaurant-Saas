import React from 'react'
import { motion } from 'framer-motion'
import logo from '../../assets/logo green.png'

const CustomerLoader = ({ message = "Loading...", showLogo = true }) => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        {showLogo && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="mb-8"
          >
            <img src={logo} alt="Ordyrr" className="h-20 w-auto mx-auto" />
          </motion.div>
        )}
        
        {/* Loading Animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex justify-center items-center gap-2">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: 0
              }}
              className="w-3 h-3 bg-black rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: 0.2
              }}
              className="w-3 h-3 bg-black rounded-full"
            />
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                delay: 0.4
              }}
              className="w-3 h-3 bg-black rounded-full"
            />
          </div>
        </motion.div>
        
        {/* Loading Message */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-lg font-medium text-gray-700"
        >
          {message}
        </motion.p>
        
        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 w-48 mx-auto"
        >
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="h-full bg-black rounded-full"
            />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CustomerLoader
