import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  EnvelopeIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import useAuthStore from '../stores/useAuthStore'
import toast from 'react-hot-toast'

const EmailVerification = () => {
  const [resending, setResending] = useState(false)
  const { user, signOut } = useAuthStore()

  const handleResendVerification = async () => {
    if (!user?.email) return
    
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      })
      
      if (error) throw error
      
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      toast.error(error.message || 'Failed to resend verification email')
    } finally {
      setResending(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-r from-orange-200/20 to-purple-200/20 backdrop-blur-sm rounded-xl"
            style={{
              width: Math.random() * 60 + 30,
              height: Math.random() * 60 + 30,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -15, 0],
              x: [0, 8, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: Math.random() * 3 + 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
        className="relative z-10 bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.4 }}
            className="relative mb-6"
          >
            <motion.div
              className="w-20 h-20 bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
              }}
            >
              <EnvelopeIcon className="w-10 h-10 text-white" />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-purple-600 bg-clip-text text-transparent mb-2"
          >
            Verify Your Email
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-gray-600 mb-4"
          >
            We've sent a verification link to:
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-6"
          >
            <p className="font-medium text-orange-800">{user?.email}</p>
          </motion.div>
        </div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="space-y-4 mb-8"
        >
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              Check your email inbox for the verification link
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              Click the verification link to activate your account
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-600">
              Check your spam folder if you don't see the email
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-4"
        >
          <button
            onClick={handleResendVerification}
            disabled={resending}
            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {resending ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <EnvelopeIcon className="w-4 h-4" />
                <span>Resend Verification Email</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Sign Out & Try Different Email
          </button>
        </motion.div>

        {/* Help Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-6 text-center"
        >
          <p className="text-xs text-gray-500">
            Having trouble? Contact support at{' '}
            <a href="mailto:support@qrrestaurant.com" className="text-orange-600 hover:text-orange-700">
              support@qrrestaurant.com
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default EmailVerification
