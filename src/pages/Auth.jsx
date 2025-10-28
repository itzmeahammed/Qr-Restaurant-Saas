import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  PhoneIcon,
  BuildingStorefrontIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  CheckCircleIcon,
  CurrencyRupeeIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import useAuthStore from '../stores/useAuthStore'
import enhancedAuthService from '../services/enhancedAuthService'
import toast from 'react-hot-toast'
import restaurantLogo from '../assets/restaurant-logo.png'

// Brand colors
const BRAND_ORANGE = '#F59E0B'
const BRAND_BLACK = '#1F2937'

const Auth = () => {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuthStore()
  const [isLogin, setIsLogin] = useState(true)
  const [selectedRole, setSelectedRole] = useState('restaurant_owner')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: ''
  })

  // This will be handled by the unified login logic

  const roles = [
    {
      id: 'restaurant_owner',
      name: 'Restaurant Owner',
      description: 'Manage restaurant, menu, and staff',
      icon: BuildingStorefrontIcon,
      color: 'from-purple-400 to-purple-600'
    },
    {
      id: 'staff',
      name: 'Restaurant Staff',
      description: 'Apply to work at a restaurant',
      icon: UserGroupIcon,
      color: 'from-blue-400 to-blue-600'
    },
    {
      id: 'super_admin',
      name: 'Super Admin',
      description: 'Platform administration',
      icon: ShieldCheckIcon,
      color: 'from-red-400 to-red-600'
    }
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const redirectToRoleDashboard = (role) => {
    switch (role) {
      case 'staff':
        navigate('/staff')
        break
      case 'restaurant_owner':
        navigate('/dashboard')
        break
      case 'super_admin':
        navigate('/admin')
        break
      default:
        navigate('/dashboard')
    }
  }

  const handleStaffSignup = async () => {
    try {
      const result = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone,
        role: 'staff'
      })

      if (result.success) {
        toast.success('Staff account created successfully! Please login with your credentials.')
        setIsLogin(true) // Switch to login mode
      } else {
        console.error('Staff signup error:', result.error)
        toast.error(result.error || 'Failed to create staff account')
      }
    } catch (error) {
      console.error('Staff signup error:', error)
      toast.error(error.message || 'An unexpected error occurred. Please try again.')
    }
  }

  const handleRestaurantOwnerSignup = async () => {
    try {
      const result = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone,
        role: 'restaurant_owner'
      })

      if (result.success) {
        toast.success('Restaurant owner account created successfully! Please login to continue.')
        setIsLogin(true) // Switch to login mode
      } else {
        console.error('Restaurant owner signup error:', result.error)
        toast.error(result.error || 'Failed to create restaurant owner account')
      }
    } catch (error) {
      console.error('Restaurant owner signup error:', error)
      toast.error(error.message || 'An unexpected error occurred. Please try again.')
    }
  }

  const handleSuperAdminSignup = async () => {
    try {
      const result = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone,
        role: 'super_admin'
      })

      if (result.success) {
        toast.success('Super admin account created successfully! Please login to continue.')
        setIsLogin(true) // Switch to login mode
      } else {
        console.error('Super admin signup error:', result.error)
        toast.error(result.error || 'Failed to create super admin account')
      }
    } catch (error) {
      console.error('Super admin signup error:', error)
      toast.error(error.message || 'An unexpected error occurred. Please try again.')
    }
  }

  const handleLogin = async () => {
    try {
      const result = await signIn(formData.email, formData.password)

      if (result.error) {
        console.error('Login error:', result.error)
        toast.error(result.error.message || 'Login failed')
        return
      }

      if (result.data && result.data.user) {
        toast.success('Login successful!')
        redirectToRoleDashboard(result.data.user.role)
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error(error.message || 'An unexpected error occurred. Please try again.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // Handle login for all roles
        await handleLogin()
      } else {
        // Handle signup for all roles (including staff)
        if (selectedRole === 'staff') {
          await handleStaffSignup()
        } else if (selectedRole === 'restaurant_owner') {
          await handleRestaurantOwnerSignup()
        } else if (selectedRole === 'super_admin') {
          await handleSuperAdminSignup()
        } else {
          // Regular signup for super_admin
          const { data, error } = await signUp(formData.email, formData.password, {
            full_name: formData.fullName,
            phone: formData.phone,
            role: selectedRole
          })

          if (error) {
            toast.error(error.message || 'Signup failed')
            return
          }

          toast.success('Account created successfully! You can now login.')
          setIsLogin(true)
          setFormData({ email: formData.email, password: '', fullName: '', phone: '' })
        }
      }
    } catch (error) {
      console.error('Auth error:', error)
      toast.error(error.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: BRAND_ORANGE }}>
      {/* Animated Background */}
      <div className="absolute inset-0">
        {/* Playful Background Elements */}
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
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%23000000'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 bg-white p-3 rounded-full border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all hover:scale-110 group"
      >
        <ArrowLeftIcon className="w-6 h-6 text-black group-hover:text-amber-500 transition-colors" />
      </motion.button>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className="bg-white rounded-3xl p-8 w-full max-w-md border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
        >
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.4 }}
              className="mb-6"
            >
              <div className="bg-white rounded-2xl px-4 py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] inline-block">
                <img src={restaurantLogo} alt="Ordyrr Restaurant" className="h-12 w-auto" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl sm:text-4xl font-black text-black mb-2 tracking-tight"
            >
              {isLogin ? 'WELCOME BACK' : 'JOIN ORDYRR'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-black/70 font-bold"
            >
              {isLogin ? 'Sign in to your account' : 'Start your digital restaurant journey'}
            </motion.p>
          </div>

        {/* Role Selection (only for signup) */}
        {!isLogin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <label className="block text-sm font-black text-black mb-3">
              SELECT YOUR ROLE
            </label>
            <div className="space-y-2">
              {roles.map((role) => {
                const IconComponent = role.icon
                return (
                  <motion.div
                    key={role.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-xl border-4 border-black cursor-pointer transition-all shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
                      selectedRole === role.id
                        ? 'bg-amber-500'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center border-2 border-black">
                        <IconComponent className="w-5 h-5" style={{ color: BRAND_ORANGE }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-black">{role.name}</h3>
                        <p className="text-sm font-bold text-black/70">{role.description}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-3 border-black ${
                        selectedRole === role.id
                          ? 'bg-black'
                          : 'bg-white'
                      }`}>
                        {selectedRole === role.id && (
                          <CheckCircleIcon className="w-full h-full text-amber-400" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name (signup only) */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-black text-black mb-2">
                FULL NAME
              </label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black/60" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(245,158,11,1)] transition-all"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </motion.div>
          )}

          {/* Email */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-black text-black mb-2">
              EMAIL
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black/60" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(245,158,11,1)] transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
          </motion.div>

          {/* Phone (signup only) */}
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-black text-black mb-2">
                PHONE NUMBER
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black/60" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(245,158,11,1)] transition-all"
                  placeholder="Enter your phone number"
                  required
                />
              </div>
            </motion.div>
          )}

          {/* Password */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-sm font-black text-black mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black/60" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-12 pr-4 py-3 border-4 border-black rounded-xl font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(245,158,11,1)] transition-all"
                placeholder="Enter your password"
                required
                minLength={6}
              />
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-full font-black text-lg border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:shadow-[0_8px_0_0_rgba(0,0,0,1)] active:shadow-[0_3px_0_0_rgba(0,0,0,1)] active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
            style={{ backgroundColor: BRAND_ORANGE }}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isLogin ? 'SIGNING IN...' : 'CREATING ACCOUNT...'}</span>
              </div>
            ) : (
              isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'
            )}
          </motion.button>
        </form>

        {/* Toggle Login/Signup */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-6"
        >
          <p className="text-black/70 font-bold">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setFormData({ 
                  email: '', 
                  password: '', 
                  fullName: '', 
                  phone: ''
                })
              }}
              className="ml-2 font-black hover:underline"
              style={{ color: BRAND_ORANGE }}
            >
              {isLogin ? 'SIGN UP' : 'SIGN IN'}
            </button>
          </p>
        </motion.div>

        {/* Business Note */}
        {!isLogin && selectedRole === 'restaurant_owner' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-4 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
            style={{ backgroundColor: BRAND_ORANGE }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <BuildingStorefrontIcon className="w-5 h-5" style={{ color: BRAND_ORANGE }} />
              </div>
              <div>
                <p className="text-sm font-black text-black mb-1">
                  FOR RESTAURANT BUSINESS
                </p>
                <p className="text-sm font-bold text-black/90">
                  Create your restaurant account to manage menu, orders, and staff applications.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Staff Note */}
        {!isLogin && selectedRole === 'staff' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-4 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
            style={{ backgroundColor: BRAND_ORANGE }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="w-5 h-5" style={{ color: BRAND_ORANGE }} />
              </div>
              <div>
                <p className="text-sm font-black text-black mb-1">
                  STAFF ACCOUNT
                </p>
                <p className="text-sm font-bold text-black/90">
                  Create your staff account. After login, you can apply to restaurants using their signup key.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Login Note */}
        {isLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-4 p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
            style={{ backgroundColor: BRAND_ORANGE }}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <UserCircleIcon className="w-5 h-5" style={{ color: BRAND_ORANGE }} />
              </div>
              <div>
                <p className="text-sm font-black text-black mb-1">
                  WELCOME BACK
                </p>
                <p className="text-sm font-bold text-black/90">
                  Login with your account credentials to access your dashboard.
                </p>
              </div>
            </div>
          </motion.div>
        )}
        </motion.div>
      </div>
    </div>
  )
}

export default Auth
