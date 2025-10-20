import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrophyIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  CheckCircleIcon,
  StarIcon,
  CalendarIcon,
  ChartBarIcon,
  GiftIcon,
  UserGroupIcon,
  FireIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../config/supabase'

const StaffPerformance = ({ staffId, restaurantId }) => {
  const [performance, setPerformance] = useState({
    todayStats: {
      ordersCompleted: 0,
      earnings: 0,
      tips: 0,
      hoursWorked: 0,
      avgRating: 0
    },
    weeklyStats: {
      ordersCompleted: 0,
      earnings: 0,
      tips: 0,
      hoursWorked: 0,
      avgRating: 0
    },
    monthlyStats: {
      ordersCompleted: 0,
      earnings: 0,
      tips: 0,
      hoursWorked: 0,
      avgRating: 0
    },
    achievements: [],
    recentReviews: [],
    performanceMetrics: {
      orderAcceptanceRate: 0,
      avgOrderTime: 0,
      customerSatisfaction: 0,
      punctuality: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('today')

  useEffect(() => {
    if (staffId && restaurantId) {
      fetchPerformanceData()
    }
  }, [staffId, restaurantId])

  const fetchPerformanceData = async () => {
    try {
      setLoading(true)
      
      // Get date ranges
      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

      // Fetch orders for this staff member (using correct column name)
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('assigned_staff_id', staffId)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false })

      // Fetch reviews for orders handled by this staff (using reviews table from schema)
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          orders!inner (
            assigned_staff_id
          )
        `)
        .eq('orders.assigned_staff_id', staffId)
        .order('created_at', { ascending: false })

      // Note: staff_work_sessions table doesn't exist in schema, using placeholder
      const workSessions = []

      // Calculate stats for different periods
      const todayStats = calculatePeriodStats(ordersData, workSessions, todayStart)
      const weeklyStats = calculatePeriodStats(ordersData, workSessions, weekStart)
      const monthlyStats = calculatePeriodStats(ordersData, workSessions, monthStart)

      // Use the reviews data we already fetched above
      const recentReviews = reviewsData?.slice(0, 10) || []

      // Calculate performance metrics
      const performanceMetrics = calculatePerformanceMetrics(ordersData, workSessions)

      // Generate achievements
      const achievements = generateAchievements(todayStats, weeklyStats, monthlyStats, performanceMetrics)

      setPerformance({
        todayStats,
        weeklyStats,
        monthlyStats,
        achievements,
        recentReviews: recentReviews || [],
        performanceMetrics
      })

    } catch (error) {
      console.error('Error fetching performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePeriodStats = (orders, workSessions, startDate) => {
    const periodOrders = orders?.filter(order => 
      new Date(order.created_at) >= startDate
    ) || []

    const periodSessions = workSessions?.filter(session => 
      new Date(session.login_time) >= startDate
    ) || []

    const ordersCompleted = periodOrders.length
    const earnings = periodOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
    const tips = periodOrders.reduce((sum, order) => sum + parseFloat(order.tip_amount || 0), 0)
    
    // Calculate hours worked
    const hoursWorked = periodSessions.reduce((total, session) => {
      if (session.logout_time) {
        const loginTime = new Date(session.login_time)
        const logoutTime = new Date(session.logout_time)
        return total + (logoutTime - loginTime) / (1000 * 60 * 60)
      }
      return total
    }, 0)

    // Calculate average rating (reviews are fetched separately now)
    const ratingsData = []
    const avgRating = ratingsData.length > 0 
      ? ratingsData.reduce((sum, rating) => sum + rating, 0) / ratingsData.length 
      : 0

    return {
      ordersCompleted,
      earnings,
      tips,
      hoursWorked,
      avgRating
    }
  }

  const calculatePerformanceMetrics = (orders, workSessions) => {
    // Order acceptance rate (placeholder - would need order assignment data)
    const orderAcceptanceRate = 95 // Mock data

    // Average order completion time
    const completedOrders = orders?.filter(order => 
      order.assigned_at && order.delivered_at
    ) || []
    
    const avgOrderTime = completedOrders.length > 0
      ? completedOrders.reduce((sum, order) => {
          const assignedTime = new Date(order.assigned_at)
          const deliveredTime = new Date(order.delivered_at)
          return sum + (deliveredTime - assignedTime) / (1000 * 60) // minutes
        }, 0) / completedOrders.length
      : 0

    // Customer satisfaction (average rating)
    const allRatings = orders?.flatMap(order => 
      order.order_reviews?.map(review => review.rating) || []
    ) || []
    const customerSatisfaction = allRatings.length > 0
      ? (allRatings.reduce((sum, rating) => sum + rating, 0) / allRatings.length) * 20 // Convert to percentage
      : 0

    // Punctuality (mock calculation)
    const punctuality = 88 // Mock data

    return {
      orderAcceptanceRate,
      avgOrderTime,
      customerSatisfaction,
      punctuality
    }
  }

  const generateAchievements = (today, weekly, monthly, metrics) => {
    const achievements = []

    // Daily achievements
    if (today.ordersCompleted >= 10) {
      achievements.push({
        id: 'daily_orders',
        title: 'Order Champion',
        description: 'Completed 10+ orders today',
        icon: TrophyIcon,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-100'
      })
    }

    if (today.tips >= 500) {
      achievements.push({
        id: 'daily_tips',
        title: 'Tip Master',
        description: 'Earned ₹500+ in tips today',
        icon: GiftIcon,
        color: 'text-green-500',
        bgColor: 'bg-green-100'
      })
    }

    // Weekly achievements
    if (weekly.ordersCompleted >= 50) {
      achievements.push({
        id: 'weekly_orders',
        title: 'Weekly Warrior',
        description: 'Completed 50+ orders this week',
        icon: FireIcon,
        color: 'text-red-500',
        bgColor: 'bg-red-100'
      })
    }

    // Performance achievements
    if (metrics.customerSatisfaction >= 90) {
      achievements.push({
        id: 'customer_satisfaction',
        title: 'Customer Favorite',
        description: '90%+ customer satisfaction',
        icon: StarIcon,
        color: 'text-purple-500',
        bgColor: 'bg-purple-100'
      })
    }

    return achievements
  }

  const getCurrentStats = () => {
    switch (selectedPeriod) {
      case 'today': return performance.todayStats
      case 'week': return performance.weeklyStats
      case 'month': return performance.monthlyStats
      default: return performance.todayStats
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="space-y-4 p-2 sm:p-4">
        {/* Loading Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-xl"></div>
              <div>
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-3 sm:h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Loading Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4">
              <div className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-lg"></div>
                  <div className="h-3 sm:h-4 bg-gray-200 rounded w-8"></div>
                </div>
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-16 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading Performance Metrics */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="animate-pulse">
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-40 mb-4"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 sm:h-4 bg-gray-200 rounded w-12"></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentStats = getCurrentStats()

  return (
    <div className="space-y-4 p-2 sm:p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <TrophyIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Performance Dashboard</h2>
              <p className="text-sm sm:text-base text-gray-600">Track your work metrics and achievements</p>
            </div>
          </div>
          
          {/* Period Selector */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'Week' },
              { key: 'month', label: 'Month' }
            ].map(period => (
              <button
                key={period.key}
                onClick={() => setSelectedPeriod(period.key)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  selectedPeriod === period.key
                    ? 'bg-white text-orange-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Performance Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg">
              <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{currentStats.ordersCompleted}</p>
              <p className="text-xs sm:text-sm text-gray-600">Orders Completed</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-green-100 rounded-lg">
              <CurrencyRupeeIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(currentStats.earnings)}</p>
              <p className="text-xs sm:text-sm text-gray-600">Earnings</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-yellow-100 rounded-lg">
              <GiftIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-yellow-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(currentStats.tips)}</p>
              <p className="text-xs sm:text-sm text-gray-600">Tips Received</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 bg-purple-100 rounded-lg">
              <StarIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{currentStats.avgRating.toFixed(1)}</p>
              <p className="text-xs sm:text-sm text-gray-600">Average Rating</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Order Acceptance</span>
              <span className="text-sm font-medium">{performance.performanceMetrics.orderAcceptanceRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${performance.performanceMetrics.orderAcceptanceRate}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Avg Order Time</span>
              <span className="text-sm font-medium">{performance.performanceMetrics.avgOrderTime.toFixed(0)}m</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${Math.min(100, (30 - performance.performanceMetrics.avgOrderTime) / 30 * 100)}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Customer Satisfaction</span>
              <span className="text-sm font-medium">{performance.performanceMetrics.customerSatisfaction.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full" 
                style={{ width: `${performance.performanceMetrics.customerSatisfaction}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Punctuality</span>
              <span className="text-sm font-medium">{performance.performanceMetrics.punctuality}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-orange-500 h-2 rounded-full" 
                style={{ width: `${performance.performanceMetrics.punctuality}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Achievements */}
      {performance.achievements.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {performance.achievements.map((achievement) => {
              const IconComponent = achievement.icon
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-4 rounded-lg border-2 border-dashed ${achievement.bgColor} border-opacity-50`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${achievement.bgColor} rounded-lg`}>
                      <IconComponent className={`h-6 w-6 ${achievement.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                      <p className="text-sm text-gray-600">{achievement.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {performance.recentReviews.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Customer Reviews</h3>
          <div className="space-y-4">
            {performance.recentReviews.slice(0, 5).map((review) => (
              <div key={review.id} className="border-l-4 border-orange-500 pl-4 py-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    Order #{review.orders?.order_number}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.review_text && (
                  <p className="text-gray-700 text-sm">{review.review_text}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default StaffPerformance
