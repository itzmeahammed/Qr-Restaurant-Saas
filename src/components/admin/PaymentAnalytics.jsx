import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  ChartPieIcon,
  CalendarIcon
} from '@heroicons/react/24/outline'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const PaymentAnalytics = ({ restaurantId = null }) => {
  const [paymentData, setPaymentData] = useState({
    byMethod: [],
    byRestaurant: [],
    timeline: []
  })
  const [filters, setFilters] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    restaurantId: restaurantId || 'all'
  })
  const [summary, setSummary] = useState({
    totalTransactions: 0,
    totalAmount: 0,
    onlineCount: 0,
    onlineAmount: 0,
    cashCount: 0,
    cashAmount: 0,
    counterCount: 0,
    counterAmount: 0,
    upiCount: 0,
    upiAmount: 0,
    cardCount: 0,
    cardAmount: 0,
    averageTransactionValue: 0,
    platformEarnings: 0,
    restaurantEarnings: 0
  })
  const [loading, setLoading] = useState(true)
  const [restaurants, setRestaurants] = useState([])

  const COLORS = {
    online: '#3b82f6',
    cash: '#10b981',
    counter: '#8b5cf6',
    upi: '#f59e0b',
    card: '#ec4899',
    wallet: '#06b6d4'
  }

  useEffect(() => {
    fetchRestaurants()
  }, [])

  useEffect(() => {
    fetchPaymentData()
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

  const fetchPaymentData = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          restaurant_id,
          total_amount,
          payment_method,
          payment_status,
          created_at,
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

      processPaymentData(orders || [])
    } catch (error) {
      console.error('Error fetching payment data:', error)
      toast.error('Failed to load payment analytics')
    } finally {
      setLoading(false)
    }
  }

  const processPaymentData = (orders) => {
    const methodStats = {}
    const restaurantStats = {}
    const timelineData = {}

    let totalAmount = 0
    const commissionRate = 0.03 // 3% platform commission

    orders.forEach(order => {
      const method = (order.payment_method || 'unknown').toLowerCase()
      const amount = parseFloat(order.total_amount || 0)
      const restaurantName = order.users?.restaurant_name || 'Unknown'
      const date = new Date(order.created_at).toISOString().split('T')[0]

      totalAmount += amount

      // By method
      if (!methodStats[method]) {
        methodStats[method] = { count: 0, amount: 0 }
      }
      methodStats[method].count++
      methodStats[method].amount += amount

      // By restaurant
      if (!restaurantStats[restaurantName]) {
        restaurantStats[restaurantName] = { count: 0, amount: 0 }
      }
      restaurantStats[restaurantName].count++
      restaurantStats[restaurantName].amount += amount

      // Timeline
      if (!timelineData[date]) {
        timelineData[date] = { date, online: 0, cash: 0, counter: 0, upi: 0, card: 0 }
      }
      if (['online', 'card', 'upi', 'wallet'].includes(method)) {
        timelineData[date][method] = (timelineData[date][method] || 0) + amount
      } else {
        timelineData[date][method] = (timelineData[date][method] || 0) + amount
      }
    })

    // Format data for charts
    const byMethod = Object.entries(methodStats).map(([method, stats]) => ({
      name: method.charAt(0).toUpperCase() + method.slice(1),
      value: stats.amount,
      count: stats.count,
      percentage: ((stats.amount / totalAmount) * 100).toFixed(1)
    }))

    const byRestaurant = Object.entries(restaurantStats)
      .map(([name, stats]) => ({
        name,
        amount: stats.amount,
        count: stats.count
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10)

    const timeline = Object.values(timelineData).sort((a, b) => a.date.localeCompare(b.date))

    // Calculate summary
    const onlineOrders = orders.filter(o => ['online', 'card', 'upi', 'wallet'].includes(o.payment_method?.toLowerCase()))
    const cashOrders = orders.filter(o => o.payment_method?.toLowerCase() === 'cash')
    const counterOrders = orders.filter(o => ['counter', 'pos'].includes(o.payment_method?.toLowerCase()))
    const upiOrders = orders.filter(o => o.payment_method?.toLowerCase() === 'upi')
    const cardOrders = orders.filter(o => o.payment_method?.toLowerCase() === 'card')

    const platformEarnings = totalAmount * commissionRate
    const restaurantEarnings = totalAmount - platformEarnings

    setSummary({
      totalTransactions: orders.length,
      totalAmount,
      onlineCount: onlineOrders.length,
      onlineAmount: onlineOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
      cashCount: cashOrders.length,
      cashAmount: cashOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
      counterCount: counterOrders.length,
      counterAmount: counterOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
      upiCount: upiOrders.length,
      upiAmount: upiOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
      cardCount: cardOrders.length,
      cardAmount: cardOrders.reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0),
      averageTransactionValue: orders.length > 0 ? totalAmount / orders.length : 0,
      platformEarnings,
      restaurantEarnings
    })

    setPaymentData({
      byMethod,
      byRestaurant,
      timeline
    })
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const PaymentMethodCard = ({ icon: Icon, method, count, amount, color }) => (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl p-6 border-2 border-neutral-200 shadow-sm"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`w-5 h-5 ${color}`} />
            <p className="text-sm font-medium text-neutral-600">{method}</p>
          </div>
          <p className={`text-2xl font-bold ${color}`}>{formatCurrency(amount)}</p>
          <p className="text-xs text-neutral-500 mt-1">{count} transactions</p>
          <p className="text-xs text-neutral-500">
            Avg: {formatCurrency(count > 0 ? amount / count : 0)}
          </p>
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
        <h3 className="text-lg font-bold text-neutral-900 mb-4">Payment Analytics Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Restaurant
            </label>
            <select
              value={filters.restaurantId}
              onChange={(e) => setFilters({ ...filters, restaurantId: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Restaurants</option>
              {restaurants.map(r => (
                <option key={r.id} value={r.id}>{r.restaurant_name || r.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-neutral-600 mt-4">Loading payment analytics...</p>
        </div>
      ) : (
        <>
          {/* Payment Method Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PaymentMethodCard
              icon={DevicePhoneMobileIcon}
              method="UPI Payments"
              count={summary.upiCount}
              amount={summary.upiAmount}
              color="text-orange-600"
            />
            <PaymentMethodCard
              icon={CreditCardIcon}
              method="Card Payments"
              count={summary.cardCount}
              amount={summary.cardAmount}
              color="text-pink-600"
            />
            <PaymentMethodCard
              icon={BanknotesIcon}
              method="Cash Payments"
              count={summary.cashCount}
              amount={summary.cashAmount}
              color="text-green-600"
            />
            <PaymentMethodCard
              icon={BuildingLibraryIcon}
              method="Counter/POS"
              count={summary.counterCount}
              amount={summary.counterAmount}
              color="text-purple-600"
            />
            <PaymentMethodCard
              icon={DevicePhoneMobileIcon}
              method="Online Total"
              count={summary.onlineCount}
              amount={summary.onlineAmount}
              color="text-blue-600"
            />
            <PaymentMethodCard
              icon={ChartPieIcon}
              method="All Payments"
              count={summary.totalTransactions}
              amount={summary.totalAmount}
              color="text-indigo-600"
            />
          </div>

          {/* Earnings Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white">
              <p className="text-sm opacity-90">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(summary.totalAmount)}</p>
              <p className="text-xs opacity-75 mt-1">{summary.totalTransactions} transactions</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-orange-600 rounded-xl p-6 text-white">
              <p className="text-sm opacity-90">Platform Earnings (3%)</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(summary.platformEarnings)}</p>
              <p className="text-xs opacity-75 mt-1">Commission from orders</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-6 text-white">
              <p className="text-sm opacity-90">Restaurant Earnings</p>
              <p className="text-3xl font-bold mt-2">{formatCurrency(summary.restaurantEarnings)}</p>
              <p className="text-xs opacity-75 mt-1">After commission</p>
            </div>
          </div>

          {/* Payment Method Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border-2 border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Payment Method Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={paymentData.byMethod}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentData.byMethod.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()] || '#999'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-6 border-2 border-neutral-200">
              <h3 className="text-lg font-bold text-neutral-900 mb-4">Top Restaurants by Revenue</h3>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {paymentData.byRestaurant.map((restaurant, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-neutral-900">{restaurant.name}</p>
                        <p className="text-xs text-neutral-500">{restaurant.count} orders</p>
                      </div>
                    </div>
                    <p className="font-bold text-neutral-900">{formatCurrency(restaurant.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Timeline */}
          <div className="bg-white rounded-xl p-6 border-2 border-neutral-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Payment Timeline</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentData.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="upi" stackId="a" fill={COLORS.upi} name="UPI" />
                <Bar dataKey="card" stackId="a" fill={COLORS.card} name="Card" />
                <Bar dataKey="cash" stackId="a" fill={COLORS.cash} name="Cash" />
                <Bar dataKey="counter" stackId="a" fill={COLORS.counter} name="Counter" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Average Transaction Value */}
          <div className="bg-white rounded-xl p-6 border-2 border-neutral-200">
            <h3 className="text-lg font-bold text-neutral-900 mb-4">Transaction Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Average Transaction</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{formatCurrency(summary.averageTransactionValue)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Online Payment Rate</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {((summary.onlineCount / summary.totalTransactions) * 100 || 0).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Cash Payment Rate</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {((summary.cashCount / summary.totalTransactions) * 100 || 0).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default PaymentAnalytics
