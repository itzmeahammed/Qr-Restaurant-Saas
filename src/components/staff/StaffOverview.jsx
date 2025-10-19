import React from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingBagIcon,
  CurrencyRupeeIcon,
  SparklesIcon,
  TrophyIcon,
  StarIcon,
  PlayIcon,
  StopIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

const StaffOverview = ({ 
  stats, 
  isOnline, 
  toggleOnlineStatus, 
  setActiveTab, 
  restaurantInfo, 
  staffSession 
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Welcome back, {staffSession?.full_name || 'Staff Member'}! 👋
            </h2>
            <p className="text-orange-100">
              {restaurantInfo?.name} • {staffSession?.position}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <div className={`w-3 h-3 rounded-full ${
                isOnline ? 'bg-green-400 animate-pulse' : 'bg-gray-300'
              }`}></div>
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <p className="text-xs text-orange-200">
              {isOnline ? 'Ready for orders' : 'Not receiving orders'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Today's Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayOrders}</p>
              <p className="text-xs text-green-600 font-medium">+12% from yesterday</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <ShoppingBagIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Today's Earnings</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.todayEarnings}</p>
              <p className="text-xs text-green-600 font-medium">+8% from yesterday</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <CurrencyRupeeIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Tips Earned</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.todayTips}</p>
              <p className="text-xs text-green-600 font-medium">+15% from yesterday</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
              <SparklesIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Rating</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rating}/5</p>
              <div className="flex items-center gap-1 mt-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-3 w-3 ${
                      i < Math.floor(stats.rating)
                        ? 'text-yellow-400 fill-current'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <TrophyIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-orange-500" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={toggleOnlineStatus}
            className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 ${
              isOnline
                ? 'border-red-200 bg-gradient-to-br from-red-50 to-red-100 text-red-700 hover:border-red-300'
                : 'border-green-200 bg-gradient-to-br from-green-50 to-green-100 text-green-700 hover:border-green-300'
            }`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isOnline ? 'bg-red-200' : 'bg-green-200'
            }`}>
              {isOnline ? (
                <StopIcon className="h-6 w-6" />
              ) : (
                <PlayIcon className="h-6 w-6" />
              )}
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">
                {isOnline ? 'Go Offline' : 'Go Online'}
              </p>
              <p className="text-sm opacity-75">
                {isOnline ? 'Stop receiving orders' : 'Start receiving orders'}
              </p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('orders')}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 hover:border-blue-300 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
              <ShoppingBagIcon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">Manage Orders</p>
              <p className="text-sm opacity-75">View and update orders</p>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('performance')}
            className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 hover:border-purple-300 transition-all duration-200"
          >
            <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
              <ChartBarIcon className="h-6 w-6" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-lg">View Performance</p>
              <p className="text-sm opacity-75">Check your stats</p>
            </div>
          </motion.button>
        </div>
      </motion.div>

      {/* Current Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Current Status</h3>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${
                isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}></div>
              <span className="text-lg font-medium text-gray-700">
                You are {isOnline ? 'online and ready for orders' : 'offline'}
              </span>
            </div>
            <p className="text-gray-500 mt-1">
              Working at <span className="font-medium text-orange-600">{restaurantInfo?.name}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Position</p>
            <p className="text-lg font-semibold text-gray-900">{staffSession?.position}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default StaffOverview
