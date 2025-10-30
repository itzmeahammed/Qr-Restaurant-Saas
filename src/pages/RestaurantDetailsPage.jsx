import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeftIcon,
  BuildingStorefrontIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  ClockIcon,
  ShoppingBagIcon,
  CalendarIcon,
  FunnelIcon,
  SparklesIcon,
  FireIcon,
  TrophyIcon,
  UserGroupIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

const RestaurantDetailsPage = () => {
  const { restaurantId } = useParams()
  const navigate = useNavigate()
  
  const [restaurant, setRestaurant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0]
  })
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    platformCommission: 0,
    restaurantEarnings: 0,
    averageOrderValue: 0,
    peakHours: [],
    revenueTimeline: [],
    topMenuItems: [],
    paymentMethodBreakdown: []
  })
  const [menuItems, setMenuItems] = useState([])
  const [tables, setTables] = useState([])
  const [staff, setStaff] = useState([])

  const BRAND_ORANGE = '#F59E0B'
  const BRAND_BLACK = '#1F2937'

  useEffect(() => {
    fetchRestaurantDetails()
  }, [restaurantId, filters])

  const fetchRestaurantDetails = async () => {
    setLoading(true)
    try {
      // Fetch restaurant info
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('users')
        .select('*')
        .eq('id', restaurantId)
        .eq('role', 'restaurant_owner')
        .single()

      if (restaurantError) throw restaurantError

      // Fetch orders with date filter
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('payment_status', 'completed')
        .gte('created_at', filters.dateFrom)
        .lte('created_at', filters.dateTo + 'T23:59:59')

      if (ordersError) throw ordersError

      // Fetch menu items
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*, categories(name)')
        .eq('restaurant_id', restaurantId)
        .order('name')

      if (menuError) throw menuError

      // Fetch tables
      const { data: tablesData, error: tablesError } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', restaurantId)

      if (tablesError) throw tablesError

      // Fetch staff
      const { data: staffData, error: staffError } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('role', 'staff')

      if (staffError) throw staffError

      // Process analytics
      const processedAnalytics = processOrderAnalytics(orders || [])
      const topItems = processTopMenuItems(orders || [], menuData || [])

      setRestaurant(restaurantData)
      setAnalytics(processedAnalytics)
      setMenuItems(menuData || [])
      setTables(tablesData || [])
      setStaff(staffData || [])
      
      // Process top menu items
      const menuItemsWithOrders = (menuData || []).map(item => {
        const itemOrders = (orders || []).filter(order => 
          order.order_items?.some(oi => oi.menu_item_id === item.id)
        )
        return {
          ...item,
          orderCount: itemOrders.length,
          revenue: itemOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
        }
      }).sort((a, b) => b.orderCount - a.orderCount)

      setMenuItems(menuItemsWithOrders)

    } catch (error) {
      console.error('Error fetching restaurant details:', error)
      toast.error('Failed to load restaurant details')
    } finally {
      setLoading(false)
    }
  }

  const processOrderAnalytics = (orders) => {
    const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
    const platformCommission = totalRevenue * 0.03
    const restaurantEarnings = totalRevenue - platformCommission

    // Peak hours analysis
    const hourlyOrders = {}
    orders.forEach(order => {
      const hour = new Date(order.created_at).getHours()
      if (!hourlyOrders[hour]) {
        hourlyOrders[hour] = { hour, orders: 0, revenue: 0 }
      }
      hourlyOrders[hour].orders++
      hourlyOrders[hour].revenue += parseFloat(order.total_amount || 0)
    })

    const peakHours = Object.values(hourlyOrders)
      .sort((a, b) => b.orders - a.orders)
      .map(h => ({
        hour: `${h.hour}:00 - ${h.hour + 1}:00`,
        orders: h.orders,
        revenue: h.revenue
      }))

    // Revenue timeline
    const dailyRevenue = {}
    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0]
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = { date, revenue: 0, orders: 0 }
      }
      dailyRevenue[date].revenue += parseFloat(order.total_amount || 0)
      dailyRevenue[date].orders++
    })

    const revenueTimeline = Object.values(dailyRevenue).sort((a, b) => a.date.localeCompare(b.date))

    // Payment method breakdown
    const paymentMethods = {}
    orders.forEach(order => {
      const method = order.payment_method || 'unknown'
      if (!paymentMethods[method]) {
        paymentMethods[method] = { name: method, value: 0, count: 0 }
      }
      paymentMethods[method].value += parseFloat(order.total_amount || 0)
      paymentMethods[method].count++
    })

    const paymentMethodBreakdown = Object.values(paymentMethods)

    return {
      totalRevenue,
      totalOrders: orders.length,
      platformCommission,
      restaurantEarnings,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0,
      peakHours,
      revenueTimeline,
      paymentMethodBreakdown
    }
  }

  const processTopMenuItems = (orders, menuItems) => {
    const itemStats = {}
    
    orders.forEach(order => {
      order.order_items?.forEach(item => {
        if (!itemStats[item.menu_item_id]) {
          itemStats[item.menu_item_id] = {
            count: 0,
            revenue: 0
          }
        }
        itemStats[item.menu_item_id].count += item.quantity
        itemStats[item.menu_item_id].revenue += parseFloat(item.price) * item.quantity
      })
    })

    return menuItems
      .map(item => ({
        ...item,
        orderCount: itemStats[item.id]?.count || 0,
        revenue: itemStats[item.id]?.revenue || 0
      }))
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 10)
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-xl font-black text-black">LOADING RESTAURANT...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-black text-black">RESTAURANT NOT FOUND</p>
          <button
            onClick={() => navigate('/admin')}
            className="mt-4 px-6 py-3 bg-black text-amber-400 rounded-full font-black border-4 border-black"
          >
            GO BACK
          </button>
        </div>
      </div>
    )
  }

  const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b-4 border-black sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1, rotate: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin')}
                className="p-3 bg-black rounded-full border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
              >
                <ArrowLeftIcon className="h-6 w-6 text-amber-400" />
              </motion.button>
              
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-black uppercase">
                  {restaurant.restaurant_name || restaurant.full_name}
                </h1>
                <p className="text-sm font-bold text-black/60">{restaurant.restaurant_address || 'No address'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-4 py-2 rounded-full font-black text-sm border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
                restaurant.is_active 
                  ? 'bg-green-400 text-black' 
                  : 'bg-red-400 text-white'
              }`}>
                {restaurant.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-amber-50 border-b-4 border-black py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-6 w-6 text-black" />
              <span className="font-black text-black uppercase">Filters:</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-black">FROM:</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="px-4 py-2 border-4 border-black rounded-full font-bold focus:outline-none focus:ring-4 focus:ring-amber-400"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-bold text-black">TO:</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="px-4 py-2 border-4 border-black rounded-full font-bold focus:outline-none focus:ring-4 focus:ring-amber-400"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fetchRestaurantDetails()}
                className="px-6 py-2 bg-black text-amber-400 rounded-full font-black border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
              >
                APPLY
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Revenue Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <motion.div
            whileHover={{ y: -4, rotate: 1 }}
            className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-green-100 rounded-2xl border-4 border-black">
                <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-black">{formatCurrency(analytics.totalRevenue)}</p>
                <p className="text-xs font-bold text-black/60 uppercase mt-1">Total Revenue</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, rotate: -1 }}
            className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-red-100 rounded-2xl border-4 border-black">
                <SparklesIcon className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-black">{formatCurrency(analytics.platformCommission)}</p>
                <p className="text-xs font-bold text-black/60 uppercase mt-1">Commission (3%)</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, rotate: 1 }}
            className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-amber-100 rounded-2xl border-4 border-black">
                <TrophyIcon className="h-8 w-8 text-amber-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-black">{formatCurrency(analytics.restaurantEarnings)}</p>
                <p className="text-xs font-bold text-black/60 uppercase mt-1">Restaurant Earnings</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -4, rotate: -1 }}
            className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
          >
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-4 bg-blue-100 rounded-2xl border-4 border-black">
                <ShoppingBagIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-black text-black">{analytics.totalOrders}</p>
                <p className="text-xs font-bold text-black/60 uppercase mt-1">Total Orders</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Revenue Timeline */}
        <div className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black text-black uppercase mb-6 flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6" />
            REVENUE TIMELINE
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.revenueTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeWidth={2} />
              <XAxis dataKey="date" stroke="#000" style={{ fontWeight: 'bold' }} />
              <YAxis stroke="#000" style={{ fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ 
                  border: '4px solid #000', 
                  borderRadius: '12px',
                  fontWeight: 'bold'
                }}
                formatter={(value) => formatCurrency(value)}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke={BRAND_ORANGE} 
                strokeWidth={4}
                dot={{ fill: BRAND_ORANGE, strokeWidth: 4, r: 6, stroke: '#000' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Hours */}
        <div className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black text-black uppercase mb-6 flex items-center gap-2">
            <FireIcon className="h-6 w-6 text-red-600" />
            PEAK HOURS ANALYSIS
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.peakHours.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeWidth={2} />
              <XAxis dataKey="hour" stroke="#000" style={{ fontWeight: 'bold', fontSize: '12px' }} />
              <YAxis stroke="#000" style={{ fontWeight: 'bold' }} />
              <Tooltip 
                contentStyle={{ 
                  border: '4px solid #000', 
                  borderRadius: '12px',
                  fontWeight: 'bold'
                }}
              />
              <Bar dataKey="orders" fill={BRAND_ORANGE} stroke="#000" strokeWidth={2} />
            </BarChart>
          </ResponsiveContainer>
          
          {/* Peak Hours Summary */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {analytics.peakHours.slice(0, 3).map((peak, index) => (
              <div key={index} className="p-4 bg-amber-50 rounded-xl border-4 border-black">
                <div className="flex items-center gap-2 mb-2">
                  <ClockIcon className="h-5 w-5 text-amber-600" />
                  <span className="font-black text-black">{peak.hour}</span>
                </div>
                <p className="text-2xl font-black text-amber-600">{peak.orders} Orders</p>
                <p className="text-sm font-bold text-black/60">{formatCurrency(peak.revenue)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods & Menu Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payment Method Breakdown */}
          <div className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <h2 className="text-xl font-black text-black uppercase mb-6">PAYMENT METHODS</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.paymentMethodBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  stroke="#000"
                  strokeWidth={3}
                >
                  {analytics.paymentMethodBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <h2 className="text-xl font-black text-black uppercase mb-6">QUICK STATS</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border-4 border-black">
                <div className="flex items-center gap-3">
                  <UserGroupIcon className="h-6 w-6 text-blue-600" />
                  <span className="font-bold text-black">Staff Members</span>
                </div>
                <span className="text-2xl font-black text-blue-600">{staff.length}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border-4 border-black">
                <div className="flex items-center gap-3">
                  <TableCellsIcon className="h-6 w-6 text-purple-600" />
                  <span className="font-bold text-black">Tables</span>
                </div>
                <span className="text-2xl font-black text-purple-600">{tables.length}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border-4 border-black">
                <div className="flex items-center gap-3">
                  <ShoppingBagIcon className="h-6 w-6 text-green-600" />
                  <span className="font-bold text-black">Menu Items</span>
                </div>
                <span className="text-2xl font-black text-green-600">{menuItems.length}</span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border-4 border-black">
                <div className="flex items-center gap-3">
                  <CurrencyRupeeIcon className="h-6 w-6 text-amber-600" />
                  <span className="font-bold text-black">Avg Order Value</span>
                </div>
                <span className="text-2xl font-black text-amber-600">{formatCurrency(analytics.averageOrderValue)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
          <h2 className="text-2xl font-black text-black uppercase mb-6 flex items-center gap-2">
            <ShoppingBagIcon className="h-6 w-6" />
            MENU ITEMS ({menuItems.length})
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ y: -4, rotate: 0.5 }}
                className="bg-white rounded-xl p-4 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
              >
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-32 object-cover rounded-lg border-4 border-black mb-3"
                  />
                )}
                
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-black text-black text-sm line-clamp-2">{item.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-black border-2 border-black ${
                    item.is_available 
                      ? 'bg-green-400 text-black' 
                      : 'bg-red-400 text-white'
                  }`}>
                    {item.is_available ? 'AVAILABLE' : 'OUT'}
                  </span>
                </div>
                
                <p className="text-xs font-bold text-black/60 mb-2 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-amber-600">₹{item.price}</span>
                  {item.orderCount > 0 && (
                    <span className="text-xs font-bold text-black/60">
                      {item.orderCount} orders
                    </span>
                  )}
                </div>
                
                {item.categories && (
                  <span className="inline-block mt-2 px-2 py-1 bg-amber-100 rounded-full text-xs font-bold text-black border-2 border-black">
                    {item.categories.name}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RestaurantDetailsPage
