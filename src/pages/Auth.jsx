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
import toast from 'react-hot-toast'

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
      const { data, error } = await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        phone: formData.phone,
        role: 'staff'
      })

      if (error) {
        toast.error(error.message || 'Signup failed')
        return
      }

      toast.success('Account created successfully! You can now login.')
      setIsLogin(true)
      setFormData({ email: formData.email, password: '', fullName: '', phone: '' })
    } catch (error) {
      console.error('Staff signup error:', error)
      toast.error(error.message || 'An unexpected error occurred. Please try again.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // Handle login for all roles
        const { data, error } = await signIn(formData.email, formData.password)
        
        if (error) {
          toast.error(error.message || 'Login failed')
          return
        }

        if (data?.user) {
          toast.success('Login successful!')
          redirectToRoleDashboard(data.user.role)
        }
      } else {
        // Handle signup for all roles (including staff)
        if (selectedRole === 'staff') {
          await handleStaffSignup()
        } else {
          // Regular signup for restaurant_owner and super_admin
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        {/* Floating 3D Boxes */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-r from-orange-200/30 to-purple-200/30 backdrop-blur-sm rounded-xl shadow-lg"
            style={{
              width: Math.random() * 80 + 40,
              height: Math.random() * 80 + 40,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, 0],
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 4 + 6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Large Gradient Orbs */}
        <motion.div
          className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-r from-orange-300/40 to-pink-300/40 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 w-64 h-64 bg-gradient-to-r from-purple-300/40 to-blue-300/40 rounded-full blur-3xl"
          animate={{
            scale: [1.3, 1, 1.3],
            opacity: [0.6, 0.4, 0.6],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Geometric Shapes */}
        <motion.div
          className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-orange-400/20 to-purple-400/20 rounded-lg"
          animate={{
            rotate: [0, 180, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-12 h-12 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full"
          animate={{
            y: [0, -30, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-50 bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-full shadow-xl transition-all duration-300 hover:scale-110 group"
      >
        <ArrowLeftIcon className="w-6 h-6 text-gray-700 group-hover:text-orange-600 transition-colors" />
      </motion.button>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 w-full max-w-md border border-white/20"
        >
          {/* Header with 3D Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.4 }}
              className="relative mb-6"
            >
              <motion.div
                className="w-20 h-20 bg-gradient-to-r from-orange-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl transform rotate-6"
                whileHover={{ 
                  scale: 1.1, 
                  rotate: 12,
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
                }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <QrCodeIcon className="w-10 h-10 text-white" />
              </motion.div>
              <motion.div
                className="absolute -inset-4 bg-gradient-to-r from-orange-400 to-purple-500 rounded-2xl opacity-20 blur-xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-purple-600 bg-clip-text text-transparent mb-2"
            >
              {isLogin ? 'QR Restaurant Login' : 'Join QR Restaurant'}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-gray-600"
            >
              {isLogin ? 'Staff • Restaurant Owner • Super Admin' : 'Start your digital restaurant journey'}
            </motion.p>
          </div>

        {/* Role Selection (only for signup) */}
        {!isLogin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6"
          >
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Your Role
            </label>
            <div className="space-y-2">
              {roles.map((role) => {
                const IconComponent = role.icon
                return (
                  <motion.div
                    key={role.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedRole === role.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedRole(role.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${role.color} rounded-lg flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{role.name}</h3>
                        <p className="text-sm text-gray-600">{role.description}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        selectedRole === role.id
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedRole === role.id && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required={!isLogin}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your phone number"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-orange-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
              </div>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
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
          <p className="text-gray-600">
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
              className="ml-2 text-orange-600 hover:text-orange-700 font-medium"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </motion.div>

        {/* Business Note */}
        {!isLogin && selectedRole === 'restaurant_owner' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <BuildingStorefrontIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  For Restaurant Business
                </p>
                <p className="text-sm text-blue-700">
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
            className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-100"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-900 mb-1">
                  Staff Account
                </p>
                <p className="text-sm text-green-700">
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
            className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl border border-blue-100"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserCircleIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">
                  Welcome Back
                </p>
                <p className="text-sm text-blue-700">
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
