import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CurrencyRupeeIcon, 
  CalendarIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const RestaurantRevenueAnalytics = ({ restaurantId = null }) => {
  const [revenueData, setRevenueData] = useState([])
  const [filters, setFilters] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    restaurantId: restaurantId || 'all',
    groupBy: 'day' // day, week, month
  })
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    onlinePayments: 0,
    counterPayments: 0,
    cashPayments: 0,
    averageOrderValue: 0,
    totalOrders: 0,
    totalTips: 0,
    platformCommission: 0
  })
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState([])

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    fetchRevenueData()
  }, [filters])

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, restaurant_name, email')
        .eq('role', 'restaurant_owner')
        .order('restaurant_name')

      if (error) throw error
      setRestaurants(data || [])
    } catch (error) {
      console.error('Error fetching restaurants:', error)
    }
  }

  const fetchRevenueData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          restaurant_id,
          total_amount,
          subtotal,
          tax_amount,
          tip_amount,
          payment_method,
          payment_status,
          created_at,
          completed_at,
          status,
          users!orders_restaurant_id_users_fkey(restaurant_name)
        `)
        .gte('created_at', filters.dateFrom)
        .lte('created_at', filters.dateTo + 'T23:59:59')
        .eq('payment_status', 'completed')

      if (filters.restaurantId !== 'all') {
        query = query.eq('restaurant_id', filters.restaurantId)
      }

      const { data: orders, error } = await query

      if (error) throw error

      // Process data
      const processedData = processRevenueData(orders || [])
      setRevenueData(processedData.chartData)
      setSummary(processedData.summary)

    } catch (error) {
      console.error('Error fetching revenue data:', error)
      toast.error('Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }

  const processRevenueData = (orders) => {
    // Calculate summary
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
    const totalTips = orders.reduce((sum, order) => sum + parseFloat(order.tip_amount || 0), 0)
    const platformCommission = totalRevenue * 0.03 // 3% commission
    
    const onlinePayments = orders
      .filter(o => ['online', 'card', 'upi', 'wallet'].includes(o.payment_method?.toLowerCase()))
      .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
    
    const counterPayments = orders
      .filter(o => ['counter', 'pos'].includes(o.payment_method?.toLowerCase()))
      .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
    
    const cashPayments = orders
      .filter(o => o.payment_method?.toLowerCase() === 'cash')
      .reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)

    // Group by date
    const groupedData = {}
    orders.forEach(order => {
      const date = new Date(order.created_at)
      let key

      if (filters.groupBy === 'day') {
        key = date.toISOString().split('T')[0]
      } else if (filters.groupBy === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().split('T')[0]
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          date: key,
          revenue: 0,
          online: 0,
          counter: 0,
          cash: 0,
          orders: 0,
          tips: 0
        }
      }

      groupedData[key].revenue += parseFloat(order.total_amount || 0)
      groupedData[key].orders += 1
      groupedData[key].tips += parseFloat(order.tip_amount || 0)

      const method = order.payment_method?.toLowerCase()
      if (['online', 'card', 'upi', 'wallet'].includes(method)) {
        groupedData[key].online += parseFloat(order.total_amount || 0)
      } else if (['counter', 'pos'].includes(method)) {
        groupedData[key].counter += parseFloat(order.total_amount || 0)
      } else if (method === 'cash') {
        groupedData[key].cash += parseFloat(order.total_amount || 0)
      }
    })

    const chartData = Object.values(groupedData).sort((a, b) => a.date.localeCompare(b.date))

    return {
      summary: {
        totalRevenue,
        onlinePayments,
        counterPayments,
        cashPayments,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
        totalOrders: orders.length,
        totalTips,
        platformCommission
      },
      chartData
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const StatCard = ({ title, value, icon: Icon, color, subtitle, trend }) => (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl p-6 border-2 border-neutral-200 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600">{title}</p>
          <p className={`text-2xl font-bold mt-2 ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-neutral-500 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend >= 0 ? (
                <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />
              ) : (
                <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {Math.abs(trend).toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color.replace('text', 'bg').replace('600', '100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl p-6 border-2 border-neutral-200">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-neutral-600" />
          <h3 className="text-lg font-bold text-neutral-900">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Restaurant
            </label>
            <select
              value={filters.restaurantId}
              onChange={(e) => setFilters({ ...filters, restaurantId: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Restaurants</option>
              {restaurants.map(restaurant => (
                <option key={restaurant.id} value={restaurant.id}>
                  {restaurant.restaurant_name || restaurant.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Group By
            </label>
            <select
              value={filters.groupBy}
              onChange={(e) => setFilters({ ...filters, groupBy: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
              <option value="month">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-neutral-600 mt-4">Loading revenue data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value={formatCurrency(summary.totalRevenue)}
              icon={CurrencyRupeeIcon}
              color="text-green-600"
              subtitle={`${summary.totalOrders} orders`}
            />
            <StatCard
              title="Online Payments"
              value={formatCurrency(summary.onlinePayments)}
              icon={CurrencyRupeeIcon}
              color="text-blue-600"
              subtitle={`${((summary.onlinePayments / summary.totalRevenue) * 100 || 0).toFixed(1)}% of total`}
            />
            <StatCard
              title="Counter Payments"
              value={formatCurrency(summary.counterPayments)}
              icon={CurrencyRupeeIcon}
              color="text-purple-600"
              subtitle={`${((summary.counterPayments / summary.totalRevenue) * 100 || 0).toFixed(1)}% of total`}
            />
            <StatCard
              title="Cash Payments"
              value={formatCurrency(summary.cashPayments)}
              icon={CurrencyRupeeIcon}
              color="text-orange-600"
              subtitle={`${((summary.cashPayments / summary.totalRevenue) * 100 || 0).toFixed(1)}% of total`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Average Order Value"
              value={formatCurrency(summary.averageOrderValue)}
              icon={CurrencyRupeeIcon}
              color="text-indigo-600"
            />
            <StatCard
              title="Total Tips"
              value={formatCurrency(summary.totalTips)}
              icon={CurrencyRupeeIcon}
              color="text-pink-600"
              subtitle="Staff earnings"
            />
            <StatCard
              title="Platform Commission (3%)"
              value={formatCurrency(summary.platformCommission)}
              icon={CurrencyRupeeIcon}
              color="text-red-600"
              subtitle="Ordyrr earnings"
            />
            <StatCard
              title="Restaurant Net"
              value={formatCurrency(summary.totalRevenue - summary.platformCommission)}
              icon={CurrencyRupeeIcon}
              color="text-teal-600"
              subtitle="After commission"
            />
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl p-6 border-2 border-neutral-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Revenue Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Total Revenue" />
                <Line type="monotone" dataKey="online" stroke="#3b82f6" strokeWidth={2} name="Online" />
                <Line type="monotone" dataKey="counter" stroke="#8b5cf6" strokeWidth={2} name="Counter" />
                <Line type="monotone" dataKey="cash" stroke="#f97316" strokeWidth={2} name="Cash" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-white rounded-xl p-6 border-2 border-neutral-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Payment Method Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="online" fill="#3b82f6" name="Online" />
                <Bar dataKey="counter" fill="#8b5cf6" name="Counter" />
                <Bar dataKey="cash" fill="#f97316" name="Cash" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

export default RestaurantRevenueAnalytics
