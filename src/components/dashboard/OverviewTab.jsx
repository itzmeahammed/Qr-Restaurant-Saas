import React from 'react'
import { motion } from 'framer-motion'
import { 
  CurrencyRupeeIcon,
  ShoppingBagIcon,
  UsersIcon,
  StarIcon
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
  Bar
} from 'recharts'

const OverviewTab = ({ stats, revenueData, orders }) => {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-orange-100 rounded-xl">
              <CurrencyRupeeIcon className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg md:text-2xl font-bold text-neutral-900 truncate">₹{stats.totalRevenue.toFixed(0)}</p>
              <p className="text-xs md:text-sm text-neutral-600">Total Revenue</p>
              <p className="text-xs text-green-600">+₹{stats.todayRevenue.toFixed(0)} today</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-blue-100 rounded-xl">
              <ShoppingBagIcon className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg md:text-2xl font-bold text-neutral-900">{stats.totalOrders}</p>
              <p className="text-xs md:text-sm text-neutral-600">Total Orders</p>
              <p className="text-xs text-green-600">+{stats.todayOrders} today</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-purple-100 rounded-xl">
              <UsersIcon className="h-5 w-5 md:h-6 md:w-6 text-purple-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg md:text-2xl font-bold text-neutral-900">{stats.activeStaff}</p>
              <p className="text-xs md:text-sm text-neutral-600">Active Staff</p>
              <p className="text-xs text-neutral-500">Online now</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 md:p-3 bg-yellow-100 rounded-xl">
              <StarIcon className="h-5 w-5 md:h-6 md:w-6 text-yellow-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg md:text-2xl font-bold text-neutral-900">{stats.avgRating.toFixed(1)}</p>
              <p className="text-xs md:text-sm text-neutral-600">Avg Rating</p>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon
                    key={star}
                    className={`h-3 w-3 ${
                      star <= Math.round(stats.avgRating)
                        ? 'text-yellow-500 fill-current'
                        : 'text-neutral-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
        <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last 7 Days)</h3>
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="#f97316" 
                strokeWidth={3}
                dot={{ fill: '#f97316', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
        <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left py-3 px-2 md:px-4 font-medium text-neutral-600 text-sm">Order #</th>
                <th className="text-left py-3 px-2 md:px-4 font-medium text-neutral-600 text-sm">Customer</th>
                <th className="text-left py-3 px-2 md:px-4 font-medium text-neutral-600 text-sm">Staff</th>
                <th className="text-left py-3 px-2 md:px-4 font-medium text-neutral-600 text-sm">Amount</th>
                <th className="text-left py-3 px-2 md:px-4 font-medium text-neutral-600 text-sm">Status</th>
                <th className="text-left py-3 px-2 md:px-4 font-medium text-neutral-600 text-sm">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? orders.map((order) => (
                <tr key={order.id} className="border-b border-neutral-100">
                  <td className="py-3 px-2 md:px-4 font-medium text-sm">#{order.order_number}</td>
                  <td className="py-3 px-2 md:px-4 text-sm">{order.customer_name}</td>
                  <td className="py-3 px-2 md:px-4 text-sm">{order.users?.full_name || 'Unassigned'}</td>
                  <td className="py-3 px-2 md:px-4 font-medium text-sm">₹{order.total_amount}</td>
                  <td className="py-3 px-2 md:px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      order.status === 'preparing' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'ready' ? 'bg-blue-100 text-blue-800' :
                      'bg-neutral-200 text-neutral-600'
                    }`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-2 md:px-4 text-sm text-neutral-500">
                    {new Date(order.created_at).toLocaleTimeString()}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-neutral-500">
                    No orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default OverviewTab
