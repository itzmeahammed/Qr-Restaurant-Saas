import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  PhoneIcon,
  ArrowLeftIcon,
  EyeIcon,
  EyeSlashIcon,
  QrCodeIcon,
  WifiIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'
import CustomerNavHeader from '../components/customer/CustomerNavHeader'
import { useCustomerNavigation } from '../contexts/CustomerNavigationContext'

const CustomerAuth = () => {
  const navigate = useNavigate()
  
  // Safe navigation hook usage with fallback
  let navigationContext = null
  try {
    navigationContext = useCustomerNavigation()
  } catch (error) {
    console.warn('CustomerAuth: Navigation context not available')
  }
  
  const { signIn = () => {} } = navigationContext || {}
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  })

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Connection restored!')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      toast.error('No internet connection')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check network status first
    if (!isOnline) {
      toast.error('No internet connection. Please check your network and try again.')
      return
    }
    
    setLoading(true)
    
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        })
        
        if (error) throw error
        
        // Sign in to navigation context
        signIn({
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email.split('@')[0]
        })
        
        toast.success('Welcome back!')
        navigate('/restaurants')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              role: 'customer'
            }
          }
        })
        
        if (error) throw error
        
        toast.success('Account created! Please check your email to verify.')
        setIsLogin(true)
      }
    } catch (error) {
      console.error('Auth error:', error)
      
      // Handle network errors specifically
      if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
        toast.error('Network connection issue. Please check your internet and try again.')
      } else if (error.message?.includes('Invalid login credentials')) {
        toast.error('Invalid email or password. Please try again.')
      } else if (error.message?.includes('User already registered')) {
        setIsLogin(true)
      } else {
        toast.error(error.message || 'Authentication failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative">
      {/* Navigation Header */}
      <CustomerNavHeader 
        title={isLogin ? 'Sign In' : 'Create Account'}
        showBackButton={true}
        showMenu={false}
      />

      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Progress Indicator */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">
                    {isLogin ? 'Welcome Back!' : 'Join QR Restaurant'}
                  </h1>
                  <p className="text-sm text-gray-600">
                    {isLogin ? 'Sign in to your account' : 'Create your account in seconds'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Network Status */}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {isOnline ? (
                    <WifiIcon className="w-3 h-3" />
                  ) : (
                    <ExclamationTriangleIcon className="w-3 h-3" />
                  )}
                  <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
                
                {/* Step Indicator */}
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isLogin ? 'bg-black' : 'bg-gray-300'}`}></div>
                  <div className={`w-2 h-2 rounded-full ${!isLogin ? 'bg-black' : 'bg-gray-300'}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name (signup only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      placeholder="Enter your full name"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Phone (signup only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isOnline}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            {/* Toggle Auth Mode */}
            <div className="text-center mt-6">
              <p className="text-gray-600 mb-3">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setFormData({ email: '', password: '', fullName: '', phone: '' })
                }}
                className="text-black hover:underline font-medium transition-all"
              >
                {isLogin ? 'Create Account' : 'Sign In'}
              </button>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <p className="text-center text-gray-600 mb-4 text-sm">Or continue without signing in</p>
            
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/customer"
                className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              >
                <QrCodeIcon className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Scan QR</span>
              </Link>
              
              <Link
                to="/restaurants"
                className="flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
              >
                <span className="text-sm font-medium text-gray-700">Browse</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CustomerAuth
