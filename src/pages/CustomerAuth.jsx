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
import logo from '../assets/logo.png'

// Brand colors
const BRAND_LIME = '#C6FF3D'
const BRAND_BLACK = '#2D2D2D'

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
    <div className="min-h-screen" style={{ backgroundColor: BRAND_LIME }}>
      {/* Navigation Header */}
      <CustomerNavHeader 
        title={isLogin ? 'Sign In' : 'Create Account'}
        showBackButton={true}
        showMenu={false}
      />

      {/* Offline Warning Banner */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white py-3 px-4 shadow-lg border-b-4 border-black"
        >
          <div className="max-w-md mx-auto flex items-center justify-center gap-2">
            <WifiIcon className="w-5 h-5" />
            <span className="font-black">NO INTERNET CONNECTION</span>
          </div>
        </motion.div>
      )}

      {/* Playful Background */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-20 right-10 w-24 h-24 rounded-full border-4 border-black/10"
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-32 left-16 w-16 h-16 rounded-full bg-black/5"
          animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Dot Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%232D2D2D'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Back Button */}
      <Link
        to="/customer"
        className="fixed top-6 left-6 z-50 bg-white p-3 rounded-full border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all hover:scale-110"
      >
        <ArrowLeftIcon className="w-6 h-6 text-black" />
      </Link>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className="bg-white rounded-3xl overflow-hidden border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
        >
          {/* Header */}
          <div className="text-white p-8 text-center" style={{ backgroundColor: BRAND_BLACK }}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.4 }}
              className="mb-6"
            >
              <div className="bg-white rounded-2xl px-4 py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(198,255,61,1)] inline-block">
                <img src={logo} alt="Ordyrr" className="h-12 w-auto" />
              </div>
            </motion.div>
            <h1 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
              {isLogin ? 'WELCOME BACK!' : 'JOIN ORDYRR'}
            </h1>
            <p className="font-bold" style={{ color: BRAND_LIME, opacity: 0.9 }}>
              {isLogin ? 'Sign in to continue your food journey' : 'Create an account to get started'}
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Form Fields */}
              {/* Full Name (signup only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-black text-black mb-2">FULL NAME</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black/60" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none transition-all"
                      style={{ boxShadow: '0 0 0 0 rgba(198,255,61,1)', transition: 'box-shadow 0.2s' }}
                      onFocus={(e) => e.target.style.boxShadow = '4px 4px 0 0 rgba(198,255,61,1)'}
                      onBlur={(e) => e.target.style.boxShadow = '0 0 0 0 rgba(198,255,61,1)'}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-black text-black mb-2">EMAIL</label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black/60" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none transition-all"
                    style={{ boxShadow: '0 0 0 0 rgba(198,255,61,1)', transition: 'box-shadow 0.2s' }}
                    onFocus={(e) => e.target.style.boxShadow = '4px 4px 0 0 rgba(198,255,61,1)'}
                    onBlur={(e) => e.target.style.boxShadow = '0 0 0 0 rgba(198,255,61,1)'}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {/* Phone (signup only) */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-black text-black mb-2">PHONE NUMBER</label>
                  <div className="relative">
                    <PhoneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black/60" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full pl-12 pr-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none transition-all"
                      style={{ boxShadow: '0 0 0 0 rgba(198,255,61,1)', transition: 'box-shadow 0.2s' }}
                      onFocus={(e) => e.target.style.boxShadow = '4px 4px 0 0 rgba(198,255,61,1)'}
                      onBlur={(e) => e.target.style.boxShadow = '0 0 0 0 rgba(198,255,61,1)'}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-black text-black mb-2">PASSWORD</label>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-12 py-3 border-4 border-black rounded-xl font-bold focus:outline-none transition-all"
                    style={{ boxShadow: '0 0 0 0 rgba(198,255,61,1)', transition: 'box-shadow 0.2s' }}
                    onFocus={(e) => e.target.style.boxShadow = '4px 4px 0 0 rgba(198,255,61,1)'}
                    onBlur={(e) => e.target.style.boxShadow = '0 0 0 0 rgba(198,255,61,1)'}
                    placeholder="Enter your password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black/60 hover:text-black transition-colors"
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
              <motion.button
                type="submit"
                disabled={loading || !isOnline}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="w-full py-4 rounded-full font-black text-lg border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:shadow-[0_8px_0_0_rgba(0,0,0,1)] active:shadow-[0_3px_0_0_rgba(0,0,0,1)] active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6 text-black"
                style={{ backgroundColor: BRAND_LIME }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span>{isLogin ? 'SIGNING IN...' : 'CREATING ACCOUNT...'}</span>
                  </div>
                ) : (
                  isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'
                )}
              </motion.button>
            </form>

            {/* Toggle Auth Mode */}
            <div className="text-center mt-6">
              <p className="text-black/70 font-bold">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setFormData({ email: '', password: '', fullName: '', phone: '' })
                  }}
                  className="ml-2 font-black hover:underline"
                  style={{ color: BRAND_BLACK }}
                >
                  {isLogin ? 'CREATE ACCOUNT' : 'SIGN IN'}
                </button>
              </p>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="px-8 py-6 border-t-4 border-black" style={{ backgroundColor: BRAND_LIME }}>
            <p className="text-center text-black font-black mb-4 text-sm">OR CONTINUE WITHOUT SIGNING IN</p>
            
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/customer"
                className="flex items-center justify-center gap-2 py-3 bg-white border-4 border-black rounded-xl hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all font-black text-sm"
              >
                <QrCodeIcon className="w-4 h-4 text-black" />
                <span>SCAN QR</span>
              </Link>
              
              <Link
                to="/restaurants"
                className="flex items-center justify-center gap-2 py-3 bg-white border-4 border-black rounded-xl hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all font-black text-sm"
              >
                <span>BROWSE</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default CustomerAuth
