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
  onRefresh
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
      {/* Mobile-Optimized Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden"
      >
        {/* Background Pattern - Hidden on mobile */}
        <div className="absolute inset-0 opacity-10 hidden sm:block">
          <div className="absolute top-4 right-4 w-20 sm:w-32 h-20 sm:h-32 bg-white rounded-full -translate-y-10 sm:-translate-y-16 translate-x-10 sm:translate-x-16"></div>
          <div className="absolute bottom-4 left-4 w-16 sm:w-24 h-16 sm:h-24 bg-white rounded-full translate-y-8 sm:translate-y-12 -translate-x-8 sm:-translate-x-12"></div>
        </div>
        
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <motion.div
                animate={{ rotate: isOnline ? 360 : 0 }}
                transition={{ duration: 2, repeat: isOnline ? Infinity : 0, ease: "linear" }}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
              >
                <FireIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </motion.div>
              <h2 className="text-lg sm:text-2xl font-bold leading-tight">
                Welcome back, {staffSession?.full_name || 'Staff Member'}! 👋
              </h2>
            </div>
            <p className="text-white/90 font-medium text-sm sm:text-base mb-1 sm:mb-0">
              {restaurantInfo?.name} • {staffSession?.position}
            </p>
            <div className="flex items-center gap-2 mt-1 sm:mt-2">
              <BoltIcon className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-300 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-white/80">
                {isOnline ? 'Ready to serve customers' : 'Currently offline'}
              </span>
            </div>
          </div>
          
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3">
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                isOnline ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-gray-300'
              }`}></div>
              <span className="text-xs sm:text-sm font-semibold">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {/* Refresh Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/20 hover:bg-white/30 rounded-lg sm:rounded-xl backdrop-blur-sm transition-all duration-200 disabled:opacity-50"
            >
              <motion.div
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
              >
                <ArrowPathIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              </motion.div>
              <span className="text-xs sm:text-sm font-medium">
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Mobile-Optimized Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -2, scale: 1.01 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-blue-200 p-3 sm:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 sm:w-20 h-12 sm:h-20 bg-blue-500/10 rounded-full -translate-y-6 sm:-translate-y-10 translate-x-6 sm:translate-x-10"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-semibold text-blue-700 mb-1 flex items-center gap-1">
                <ClockIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Today's Orders</span>
              </p>
              <p className="text-xl sm:text-3xl font-bold text-blue-900 mb-1">{stats.todayOrders || 0}</p>
              <p className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                +12%
              </p>
            </div>
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg mt-2 sm:mt-0 self-end sm:self-auto">
              <ShoppingBagIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -2, scale: 1.01 }}
          className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-emerald-200 p-3 sm:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 sm:w-20 h-12 sm:h-20 bg-emerald-500/10 rounded-full -translate-y-6 sm:-translate-y-10 translate-x-6 sm:translate-x-10"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                <CurrencyRupeeIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Earnings</span>
              </p>
              <p className="text-xl sm:text-3xl font-bold text-emerald-900 mb-1">₹{stats.todayEarnings || 0}</p>
              <p className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                +8%
              </p>
            </div>
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg mt-2 sm:mt-0 self-end sm:self-auto">
              <CurrencyRupeeIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -2, scale: 1.01 }}
          className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-amber-200 p-3 sm:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 sm:w-20 h-12 sm:h-20 bg-amber-500/10 rounded-full -translate-y-6 sm:-translate-y-10 translate-x-6 sm:translate-x-10"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-semibold text-amber-700 mb-1 flex items-center gap-1">
                <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Tips</span>
              </p>
              <p className="text-xl sm:text-3xl font-bold text-amber-900 mb-1">₹{stats.todayTips || 0}</p>
              <p className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                +15%
              </p>
            </div>
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg mt-2 sm:mt-0 self-end sm:self-auto">
              <SparklesIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ y: -2, scale: 1.01 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg border border-purple-200 p-3 sm:p-6 hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-12 sm:w-20 h-12 sm:h-20 bg-purple-500/10 rounded-full -translate-y-6 sm:-translate-y-10 translate-x-6 sm:translate-x-10"></div>
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-semibold text-purple-700 mb-1 flex items-center gap-1">
                <TrophyIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">Rating</span>
              </p>
              <div className="flex items-center gap-1 sm:gap-2 mb-1">
                <p className="text-xl sm:text-3xl font-bold text-purple-900">{stats.rating || '4.8'}</p>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                Excellent!
              </p>
            </div>
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg mt-2 sm:mt-0 self-end sm:self-auto">
              <TrophyIcon className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Mobile-Optimized Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleOnlineStatus}
          className={`relative flex flex-col items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg transition-all duration-300 overflow-hidden ${
            isOnline
              ? 'bg-gradient-to-br from-red-500 to-pink-600 text-white hover:shadow-red-500/25'
              : 'bg-gradient-to-br from-emerald-500 to-green-600 text-white hover:shadow-emerald-500/25'
          }`}
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <motion.div 
            animate={{ 
              scale: isOnline ? [1, 1.05, 1] : 1,
              rotate: isOnline ? [0, 3, -3, 0] : 0
            }}
            transition={{ duration: 2, repeat: isOnline ? Infinity : 0 }}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${
              isOnline ? 'bg-white/20' : 'bg-white/20'
            }`}
          >
            {isOnline ? (
              <StopIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            ) : (
              <PlayIcon className="h-6 w-6 sm:h-8 sm:w-8" />
            )}
          </motion.div>
          <div className="text-center relative z-10">
            <p className="font-bold text-lg sm:text-xl mb-1">
              {isOnline ? 'Go Offline' : 'Go Online'}
            </p>
            <p className="text-xs sm:text-sm opacity-90 font-medium">
              {isOnline ? 'Stop orders' : 'Start orders'}
            </p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('orders')}
          className="relative flex flex-col items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md sm:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute top-0 right-0 w-12 sm:w-20 h-12 sm:h-20 bg-white/10 rounded-full -translate-y-6 sm:-translate-y-10 translate-x-6 sm:translate-x-10"></div>
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg relative z-10"
          >
            <ShoppingBagIcon className="h-6 w-6 sm:h-8 sm:w-8" />
          </motion.div>
          <div className="text-center relative z-10">
            <p className="font-bold text-lg sm:text-xl mb-1">Orders</p>
            <p className="text-xs sm:text-sm opacity-90 font-medium">View & update</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveTab('performance')}
          className="relative flex flex-col items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md sm:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          <div className="absolute top-0 right-0 w-12 sm:w-20 h-12 sm:h-20 bg-white/10 rounded-full -translate-y-6 sm:-translate-y-10 translate-x-6 sm:translate-x-10"></div>
          <motion.div
            whileHover={{ y: -1 }}
            transition={{ duration: 0.2 }}
            className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg relative z-10"
          >
            <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8" />
          </motion.div>
          <div className="text-center relative z-10">
            <p className="font-bold text-lg sm:text-xl mb-1">Performance</p>
            <p className="text-xs sm:text-sm opacity-90 font-medium">Stats & analytics</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"></div>
        </motion.button>
      </motion.div>

      {/* Current Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-md sm:shadow-lg border border-slate-200 relative overflow-hidden"
      >
        <div className="hidden sm:block absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
        <div className="hidden sm:block absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-100 to-pink-100 rounded-full translate-y-12 -translate-x-12 opacity-50"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <InformationCircleIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-800">Current Status</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Status</p>
                <p className="text-sm sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  {isOnline ? (
                    <>
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Online
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      Offline
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                <BuildingStorefrontIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-slate-600">Restaurant</p>
                <p className="text-sm sm:text-lg font-bold text-slate-800 truncate">{restaurantInfo?.name || 'Loading...'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Position</p>
                <p className="text-sm sm:text-lg font-bold text-slate-800">{staffSession?.position || 'Staff'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-100">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-600">Shift Time</p>
                <p className="text-sm sm:text-lg font-bold text-slate-800">
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default StaffOverview
