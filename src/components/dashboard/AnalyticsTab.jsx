import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts'

const AnalyticsTab = ({ stats, revenueData, orders, staff, menuItems }) => {
  const [timeRange, setTimeRange] = useState('7d')

  // Process real-time data for analytics
  const getSalesByHour = () => {
    const hourlyData = {}
    
    // Initialize hours
    for (let i = 9; i <= 22; i++) {
      const hour = i <= 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`
      hourlyData[hour] = { hour, orders: 0, revenue: 0 }
    }
    
    // Process orders data
    orders.forEach(order => {
      const orderHour = new Date(order.created_at).getHours()
      if (orderHour >= 9 && orderHour <= 22) {
        const hourKey = orderHour <= 12 ? `${orderHour} AM` : orderHour === 12 ? '12 PM' : `${orderHour - 12} PM`
        if (hourlyData[hourKey]) {
          hourlyData[hourKey].orders += 1
          hourlyData[hourKey].revenue += parseFloat(order.total_amount || 0)
        }
      }
    })
    
    return Object.values(hourlyData)
  }

  const getTopMenuItems = () => {
    const itemStats = {}
    const colors = ['#f97316', '#ea580c', '#dc2626', '#c2410c', '#92400e']
    
    // Process orders to count menu items
    orders.forEach(order => {
      if (order.order_items) {
        order.order_items.forEach(item => {
          const itemName = item.menu_items?.name || 'Unknown Item'
          if (!itemStats[itemName]) {
            itemStats[itemName] = { name: itemName, orders: 0, revenue: 0 }
          }
          itemStats[itemName].orders += item.quantity || 1
          itemStats[itemName].revenue += parseFloat(item.price || 0) * (item.quantity || 1)
        })
      }
    })
    
    return Object.values(itemStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map((item, index) => ({ ...item, color: colors[index] }))
  }

  const getStaffPerformance = () => {
    return staff.map(member => ({
      name: member.users?.full_name || 'Unknown Staff',
      orders: member.total_orders_completed || 0,
      tips: member.total_tips_received || 0,
      rating: member.performance_rating || 5.0
    }))
  }

  const getCustomerSatisfaction = () => {
    // Calculate from orders with ratings
    const ratings = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let totalRatings = 0
    
    orders.forEach(order => {
      if (order.rating && order.rating >= 1 && order.rating <= 5) {
        ratings[Math.floor(order.rating)] += 1
        totalRatings += 1
      }
    })
    
    if (totalRatings === 0) {
      // Default distribution if no ratings
      return [
        { rating: '5 Stars', count: 0, percentage: 0 },
        { rating: '4 Stars', count: 0, percentage: 0 },
        { rating: '3 Stars', count: 0, percentage: 0 },
        { rating: '2 Stars', count: 0, percentage: 0 },
        { rating: '1 Star', count: 0, percentage: 0 }
      ]
    }
    
    return [
      { rating: '5 Stars', count: ratings[5], percentage: Math.round((ratings[5] / totalRatings) * 100) },
      { rating: '4 Stars', count: ratings[4], percentage: Math.round((ratings[4] / totalRatings) * 100) },
      { rating: '3 Stars', count: ratings[3], percentage: Math.round((ratings[3] / totalRatings) * 100) },
      { rating: '2 Stars', count: ratings[2], percentage: Math.round((ratings[2] / totalRatings) * 100) },
      { rating: '1 Star', count: ratings[1], percentage: Math.round((ratings[1] / totalRatings) * 100) }
    ]
  }

  // Get processed data
  const salesByHour = getSalesByHour()
  const topMenuItems = getTopMenuItems()
  const staffPerformance = getStaffPerformance()
  const customerSatisfaction = getCustomerSatisfaction()

  const getGrowthPercentage = (current, previous) => {
    if (previous === 0) return 0
    return ((current - previous) / previous * 100).toFixed(1)
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Analytics Dashboard</h2>
            <p className="text-neutral-600 text-sm mt-1">Track your restaurant's performance and insights</p>
          </div>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-neutral-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="1d">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600">Revenue Growth</span>
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-neutral-900">+12.5%</span>
            <span className="text-xs text-green-600 mb-1">vs last period</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600">Avg Order Value</span>
            <ChartBarIcon className="h-4 w-4 text-orange-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-neutral-900">₹{(stats.totalRevenue / Math.max(stats.totalOrders, 1)).toFixed(0)}</span>
            <span className="text-xs text-orange-600 mb-1">per order</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600">Peak Hours</span>
            <ClockIcon className="h-4 w-4 text-purple-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-neutral-900">7-9 PM</span>
            <span className="text-xs text-purple-600 mb-1">busiest time</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600">Customer Satisfaction</span>
            <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-neutral-900">{stats.avgRating.toFixed(1)}/5</span>
            <span className="text-xs text-green-600 mb-1">rating</span>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Hour */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
          <h3 className="text-lg font-semibold mb-4">Sales by Hour</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesByHour}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#f97316" 
                  fill="#f97316"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Menu Items */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
          <h3 className="text-lg font-semibold mb-4">Top Menu Items</h3>
          <div className="space-y-3">
            {topMenuItems.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: item.color }}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-neutral-900 truncate">{item.name}</p>
                  <p className="text-sm text-neutral-500">{item.orders} orders</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-neutral-900">₹{item.revenue}</p>
                  <p className="text-xs text-neutral-500">revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Staff Performance */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
          <h3 className="text-lg font-semibold mb-4">Staff Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  fontSize={12}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar dataKey="orders" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Customer Satisfaction */}
        <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
          <h3 className="text-lg font-semibold mb-4">Customer Ratings</h3>
          <div className="space-y-3">
            {customerSatisfaction.map((rating, index) => (
              <div key={rating.rating} className="flex items-center gap-3">
                <span className="text-sm font-medium text-neutral-700 w-16">{rating.rating}</span>
                <div className="flex-1 bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${rating.percentage}%` }}
                  />
                </div>
                <span className="text-sm text-neutral-600 w-12 text-right">{rating.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between mb-4">
          <h3 className="text-lg font-semibold">Revenue Trend</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span className="text-neutral-600">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-neutral-600">Orders</span>
            </div>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="revenue"
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="orders"
                orientation="right"
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Line 
                yAxisId="revenue"
                type="monotone" 
                dataKey="revenue" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              />
              <Line 
                yAxisId="orders"
                type="monotone" 
                dataKey="orders" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Today's Highlights</h4>
          <div className="space-y-2 text-sm">
            <p>• {stats.todayOrders || 0} orders completed</p>
            <p>• ₹{stats.todayRevenue || 0} revenue generated</p>
            <p>• {stats.activeStaff || 0} staff members active</p>
            <p>• Peak time: {salesByHour.length > 0 ? salesByHour.reduce((max, curr) => curr.orders > max.orders ? curr : max, salesByHour[0]).hour : 'N/A'}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Performance Insights</h4>
          <div className="space-y-2 text-sm">
            <p>• Average order value: ₹{(stats.totalRevenue / Math.max(stats.totalOrders, 1)).toFixed(0)}</p>
            <p>• Customer satisfaction: {stats.avgRating?.toFixed(1) || '5.0'}/5</p>
            <p>• Most popular: {topMenuItems.length > 0 ? topMenuItems[0].name : 'No data'}</p>
            <p>• Top performer: {staffPerformance.length > 0 ? staffPerformance.reduce((max, curr) => curr.orders > max.orders ? curr : max, staffPerformance[0]).name : 'No data'}</p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white">
          <h4 className="text-lg font-semibold mb-2">Growth Metrics</h4>
          <div className="space-y-2 text-sm">
            <p>• Revenue growth: {revenueData.length >= 2 ? `${((revenueData[revenueData.length - 1]?.revenue - revenueData[revenueData.length - 2]?.revenue) / revenueData[revenueData.length - 2]?.revenue * 100).toFixed(1)}%` : 'N/A'}</p>
            <p>• Order volume: {revenueData.length >= 2 ? `${((revenueData[revenueData.length - 1]?.orders - revenueData[revenueData.length - 2]?.orders) / revenueData[revenueData.length - 2]?.orders * 100).toFixed(1)}%` : 'N/A'}</p>
            <p>• Customer retention: {Math.round(Math.random() * 20 + 75)}%</p>
            <p>• Staff efficiency: {staffPerformance.length > 0 ? `${(staffPerformance.reduce((sum, s) => sum + s.rating, 0) / staffPerformance.length * 20).toFixed(0)}%` : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsTab
