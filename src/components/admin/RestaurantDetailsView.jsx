import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  TableCellsIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const RestaurantDetailsView = ({ restaurantId, onClose }) => {
  const [restaurant, setRestaurant] = useState(null)
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalTables: 0,
    totalMenuItems: 0,
    totalStaff: 0,
    totalCategories: 0,
    averageRating: 0,
    totalReviews: 0,
    activeOrders: 0,
    completedOrders: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [tables, setTables] = useState([])
  const [staff, setStaff] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantDetails()
    }
  }, [restaurantId])

  const fetchRestaurantDetails = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchRestaurantInfo(),
        fetchRestaurantStats(),
        fetchRecentOrders(),
        fetchMenuItems(),
        fetchTables(),
        fetchStaff(),
        fetchReviews()
      ])
    } catch (error) {
      console.error('Error fetching restaurant details:', error)
      toast.error('Failed to load restaurant details')
    } finally {
      setLoading(false)
    }
  }

  const fetchRestaurantInfo = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', restaurantId)
      .eq('role', 'restaurant_owner')
      .single()

    if (error) throw error
    setRestaurant(data)
  }

  const fetchRestaurantStats = async () => {
    // Fetch orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id, total_amount, status')
      .eq('restaurant_id', restaurantId)

    // Fetch tables
    const { data: tablesData } = await supabase
      .from('tables')
      .select('id')
      .eq('restaurant_id', restaurantId)

    // Fetch menu items
    const { data: menuData } = await supabase
      .from('menu_items')
      .select('id')
      .eq('restaurant_id', restaurantId)

    // Fetch staff
    const { data: staffData } = await supabase
      .from('users')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .eq('role', 'staff')

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id')
      .eq('restaurant_id', restaurantId)

    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('overall_rating')
      .eq('restaurant_id', restaurantId)

    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0
    const activeOrders = orders?.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length || 0
    const completedOrders = orders?.filter(o => o.status === 'completed').length || 0
    const averageRating = reviewsData?.length > 0
      ? reviewsData.reduce((sum, r) => sum + r.overall_rating, 0) / reviewsData.length
      : 0

    setStats({
      totalOrders: orders?.length || 0,
      totalRevenue,
      totalTables: tablesData?.length || 0,
      totalMenuItems: menuData?.length || 0,
      totalStaff: staffData?.length || 0,
      totalCategories: categoriesData?.length || 0,
      averageRating,
      totalReviews: reviewsData?.length || 0,
      activeOrders,
      completedOrders
    })
  }

  const fetchRecentOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error) setRecentOrders(data || [])
  }

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select(`
        *,
        categories(name)
      `)
      .eq('restaurant_id', restaurantId)
      .order('sort_order')

    if (!error) setMenuItems(data || [])
  }

  const fetchTables = async () => {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('table_number')

    if (!error) setTables(data || [])
  }

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('role', 'staff')
      .order('full_name')

    if (!error) setStaff(data || [])
  }

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error) setReviews(data || [])
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const StatCard = ({ icon: Icon, label, value, color = 'text-blue-600' }) => (
    <div className="bg-white rounded-lg p-4 border border-neutral-200">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color.replace('text', 'bg').replace('600', '100')}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="text-lg font-bold text-neutral-900">{value}</p>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="text-neutral-600 mt-4">Loading restaurant details...</p>
        </div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-600">Restaurant not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {restaurant.logo_url ? (
              <img src={restaurant.logo_url} alt={restaurant.restaurant_name} className="w-16 h-16 rounded-lg object-cover border-2 border-white" />
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                <BuildingStorefrontIcon className="w-8 h-8" />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">{restaurant.restaurant_name || 'Unnamed Restaurant'}</h2>
              <p className="text-white/80 mt-1">{restaurant.cuisine_type || 'Multi-cuisine'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${restaurant.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                  {restaurant.is_active ? 'Active' : 'Inactive'}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${restaurant.is_open ? 'bg-blue-500' : 'bg-gray-500'}`}>
                  {restaurant.is_open ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard icon={CurrencyRupeeIcon} label="Total Revenue" value={formatCurrency(stats.totalRevenue)} color="text-green-600" />
        <StatCard icon={ClipboardDocumentListIcon} label="Total Orders" value={stats.totalOrders} color="text-blue-600" />
        <StatCard icon={TableCellsIcon} label="Tables" value={stats.totalTables} color="text-purple-600" />
        <StatCard icon={ClipboardDocumentListIcon} label="Menu Items" value={stats.totalMenuItems} color="text-orange-600" />
        <StatCard icon={UserGroupIcon} label="Staff" value={stats.totalStaff} color="text-indigo-600" />
        <StatCard icon={ChartBarIcon} label="Active Orders" value={stats.activeOrders} color="text-yellow-600" />
        <StatCard icon={CheckCircleIcon} label="Completed" value={stats.completedOrders} color="text-teal-600" />
        <StatCard icon={StarIcon} label="Avg Rating" value={stats.averageRating.toFixed(1)} color="text-pink-600" />
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl p-6 border-2 border-neutral-200">
        <h3 className="text-lg font-bold text-neutral-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <MapPinIcon className="w-5 h-5 text-neutral-500" />
            <div>
              <p className="text-xs text-neutral-500">Address</p>
              <p className="text-sm font-medium text-neutral-900">{restaurant.restaurant_address || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <PhoneIcon className="w-5 h-5 text-neutral-500" />
            <div>
              <p className="text-xs text-neutral-500">Phone</p>
              <p className="text-sm font-medium text-neutral-900">{restaurant.restaurant_phone || restaurant.phone || 'Not provided'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <EnvelopeIcon className="w-5 h-5 text-neutral-500" />
            <div>
              <p className="text-xs text-neutral-500">Email</p>
              <p className="text-sm font-medium text-neutral-900">{restaurant.restaurant_email || restaurant.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ClockIcon className="w-5 h-5 text-neutral-500" />
            <div>
              <p className="text-xs text-neutral-500">Member Since</p>
              <p className="text-sm font-medium text-neutral-900">{formatDate(restaurant.created_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border-2 border-neutral-200 overflow-hidden">
        <div className="border-b border-neutral-200">
          <div className="flex gap-4 px-6">
            {['overview', 'menu', 'tables', 'staff', 'orders', 'reviews'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-4 font-medium capitalize transition-colors border-b-2 ${
                  activeTab === tab
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-neutral-900 mb-2">Description</h4>
                <p className="text-neutral-600">{restaurant.restaurant_description || 'No description available'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-bold text-neutral-900 mb-2">Categories</h4>
                  <p className="text-2xl font-bold text-blue-600">{stats.totalCategories}</p>
                </div>
                <div>
                  <h4 className="font-bold text-neutral-900 mb-2">Reviews</h4>
                  <p className="text-2xl font-bold text-pink-600">{stats.totalReviews}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <div className="space-y-3">
              <h4 className="font-bold text-neutral-900">Menu Items ({menuItems.length})</h4>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {menuItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.image_url && (
                        <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded object-cover" />
                      )}
                      <div>
                        <p className="font-medium text-neutral-900">{item.name}</p>
                        <p className="text-xs text-neutral-500">{item.categories?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-900">{formatCurrency(item.price)}</p>
                      <span className={`text-xs ${item.is_available ? 'text-green-600' : 'text-red-600'}`}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-3">
              <h4 className="font-bold text-neutral-900">Tables ({tables.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {tables.map((table) => (
                  <div key={table.id} className="p-4 bg-neutral-50 rounded-lg text-center">
                    <TableCellsIcon className="w-8 h-8 mx-auto text-neutral-600 mb-2" />
                    <p className="font-bold text-neutral-900">Table {table.table_number}</p>
                    <p className="text-xs text-neutral-500">Capacity: {table.capacity}</p>
                    <p className="text-xs text-neutral-500">{table.location || 'No location'}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded text-xs ${table.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {table.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-3">
              <h4 className="font-bold text-neutral-900">Staff Members ({staff.length})</h4>
              <div className="space-y-2">
                {staff.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">{member.full_name}</p>
                      <p className="text-xs text-neutral-500">{member.position || 'Staff'}</p>
                      <p className="text-xs text-neutral-500">{member.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-neutral-900">{formatCurrency(member.hourly_rate || 0)}/hr</p>
                      <p className="text-xs text-neutral-500">{member.total_orders_completed || 0} orders</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${member.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {member.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-3">
              <h4 className="font-bold text-neutral-900">Recent Orders ({recentOrders.length})</h4>
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                    <div>
                      <p className="font-medium text-neutral-900">#{order.order_number}</p>
                      <p className="text-xs text-neutral-500">{formatDate(order.created_at)}</p>
                      <p className="text-xs text-neutral-500">{order.payment_method || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-neutral-900">{formatCurrency(order.total_amount)}</p>
                      <span className={`inline-block mt-1 px-2 py-1 rounded text-xs ${
                        order.status === 'completed' ? 'bg-green-100 text-green-700' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-3">
              <h4 className="font-bold text-neutral-900">Customer Reviews ({reviews.length})</h4>
              <div className="space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-neutral-900">{review.customer_name || 'Anonymous'}</p>
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-neutral-900">{review.overall_rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-neutral-600">{review.comment}</p>
                    <p className="text-xs text-neutral-500 mt-2">{formatDate(review.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RestaurantDetailsView
