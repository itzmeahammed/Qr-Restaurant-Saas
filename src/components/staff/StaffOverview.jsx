import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingBagIcon,
  CurrencyRupeeIcon,
  SparklesIcon,
  TrophyIcon,
  StarIcon,
  PlayIcon,
  StopIcon,
  ChartBarIcon,
  ArrowPathIcon,
  BoltIcon,
  ClockIcon,
  FireIcon,
  BuildingStorefrontIcon,
  UserCircleIcon,
  InformationCircleIcon,
  UserIcon
} from '@heroicons/react/24/outline'

const StaffOverview = ({ 
  stats, 
  isOnline, 
  toggleOnlineStatus, 
  setActiveTab, 
  restaurantInfo, 
  staffSession,
  loading = false,
  onRefresh,
  onStartOrdering
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setTimeout(() => setIsRefreshing(false), 1000) // Minimum 1s for visual feedback
      }
    }
  }
  // Skeleton Loading Component
  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-20"></div>
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  )

  const SkeletonBanner = () => (
    <div className="bg-gradient-to-r from-gray-300 to-gray-400 rounded-2xl p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-8 bg-white/20 rounded w-64 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-40"></div>
        </div>
        <div className="text-right">
          <div className="h-4 bg-white/20 rounded w-16 mb-2"></div>
          <div className="h-3 bg-white/20 rounded w-24"></div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonBanner />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Professional Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-1">
              Welcome back, {staffSession?.full_name || 'Staff Member'}
            </h2>
            <p className="text-sm text-gray-600">
              {restaurantInfo?.name} • {staffSession?.position}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Sliding Toggle Switch */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={toggleOnlineStatus}
                className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                  isOnline ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <motion.div
                  animate={{ x: isOnline ? 24 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-md"
                />
              </motion.button>
            </div>
            
            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 text-sm font-medium"
            >
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
              >
                <ArrowPathIcon className="h-4 w-4" />
              </motion.div>
              <span className="hidden sm:inline">
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Professional Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingBagIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Orders</p>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{stats.todayOrders || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <CurrencyRupeeIcon className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Earnings</p>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">₹{stats.todayEarnings || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Tips</p>
          <p className="text-2xl sm:text-3xl font-semibold text-gray-900">₹{stats.todayTips || 0}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <StarIcon className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Rating</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl sm:text-3xl font-semibold text-gray-900">{stats.rating || '4.8'}</p>
            <StarIcon className="h-5 w-5 text-amber-400 fill-amber-400" />
          </div>
        </motion.div>
      </div>

      {/* Professional Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setActiveTab('orders')}
          className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-lg text-left hover:shadow-md hover:border-blue-300 transition-all"
        >
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <ShoppingBagIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-0.5">Manage Orders</p>
            <p className="text-sm text-gray-500">View and update order status</p>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onStartOrdering}
          className="flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-lg text-left hover:shadow-md hover:border-green-300 transition-all"
        >
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
            <UserIcon className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 mb-0.5">Assist Customer</p>
            <p className="text-sm text-gray-500">Help customers place orders</p>
          </div>
        </motion.button>
      </motion.div>

    </div>
  )
}

export default StaffOverview
