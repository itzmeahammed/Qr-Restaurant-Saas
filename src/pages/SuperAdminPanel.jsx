import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  BuildingStorefrontIcon,
  UsersIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  XMarkIcon,
  PencilIcon,
  TableCellsIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { supabase } from '../config/supabase'
import UnifiedOrderService from '../services/unifiedOrderService'
import useOrderStore from '../stores/useOrderStore'
import useAuthStore from '../stores/useAuthStore'
import toast from 'react-hot-toast'
import { useConfirmation } from '../contexts/ConfirmationContext'
import { MagnifyingGlassIcon, FunnelIcon, ShoppingBagIcon, CalendarIcon, MapPinIcon } from '@heroicons/react/24/outline'

// Customers Tab Component
const CustomersTab = () => {
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    sortBy: 'recent', // recent, orders, spending
    minOrders: 0,
    dateFrom: '',
    dateTo: ''
  })
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchQuery, filters, customers])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      // Fetch all customer sessions with orders
      const { data: sessions, error: sessionsError } = await supabase
        .from('customer_sessions')
        .select(`
          *,
          orders (
            id,
            total_amount,
            created_at,
            payment_status,
            restaurant_id,
            order_items (
              id,
              menu_item_id,
              quantity,
              price,
              menu_items (name, image_url)
            )
          ),
          tables (
            table_number,
            restaurant_id,
            users!tables_restaurant_id_fkey (restaurant_name)
          )
        `)

      if (sessionsError) throw sessionsError

      // Group by customer (email/phone)
      const customerMap = {}
      
      sessions?.forEach(session => {
        const key = session.customer_email || session.customer_phone || session.id
        
        if (!customerMap[key]) {
          customerMap[key] = {
            id: key,
            name: session.customer_name || 'Anonymous',
            email: session.customer_email,
            phone: session.customer_phone,
            sessions: [],
            orders: [],
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: null,
            restaurants: new Set()
          }
        }

        customerMap[key].sessions.push(session)
        
        session.orders?.forEach(order => {
          if (order.payment_status === 'completed') {
            customerMap[key].orders.push({
              ...order,
              restaurantName: session.tables?.users?.restaurant_name || 'Unknown',
              tableNumber: session.tables?.table_number
            })
            customerMap[key].totalOrders++
            customerMap[key].totalSpent += parseFloat(order.total_amount || 0)
            customerMap[key].restaurants.add(session.tables?.users?.restaurant_name || 'Unknown')
            
            const orderDate = new Date(order.created_at)
            if (!customerMap[key].lastOrderDate || orderDate > customerMap[key].lastOrderDate) {
              customerMap[key].lastOrderDate = orderDate
            }
          }
        })
      })

      const customersArray = Object.values(customerMap).map(c => ({
        ...c,
        restaurants: Array.from(c.restaurants),
        orders: c.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      }))

      setCustomers(customersArray)
      setFilteredCustomers(customersArray)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...customers]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone?.includes(searchQuery)
      )
    }

    // Min orders filter
    if (filters.minOrders > 0) {
      filtered = filtered.filter(c => c.totalOrders >= filters.minOrders)
    }

    // Date filter
    if (filters.dateFrom) {
      filtered = filtered.filter(c => 
        c.lastOrderDate && new Date(c.lastOrderDate) >= new Date(filters.dateFrom)
      )
    }

    if (filters.dateTo) {
      filtered = filtered.filter(c => 
        c.lastOrderDate && new Date(c.lastOrderDate) <= new Date(filters.dateTo + 'T23:59:59')
      )
    }

    // Sort
    if (filters.sortBy === 'recent') {
      filtered.sort((a, b) => (b.lastOrderDate || 0) - (a.lastOrderDate || 0))
    } else if (filters.sortBy === 'orders') {
      filtered.sort((a, b) => b.totalOrders - a.totalOrders)
    } else if (filters.sortBy === 'spending') {
      filtered.sort((a, b) => b.totalSpent - a.totalSpent)
    }

    setFilteredCustomers(filtered)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-amber-500 mx-auto"></div>
        <p className="mt-4 text-xl font-black text-black">LOADING CUSTOMERS...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl sm:text-3xl font-black text-black uppercase">Customer Analytics</h2>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-black rounded-full border-4 border-black">
            <span className="text-sm font-black text-amber-400">TOTAL: {customers.length}</span>
          </div>
          <div className="px-4 py-2 bg-white rounded-full border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
            <span className="text-sm font-black text-green-600">ACTIVE: {filteredCustomers.length}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-amber-50 rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-black/60" />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-14 pr-4 py-3 border-4 border-black rounded-full font-bold text-black placeholder-black/40 focus:outline-none focus:ring-4 focus:ring-amber-400"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <FunnelIcon className="h-5 w-5 text-black" />
              <span className="font-black text-black text-sm">FILTERS:</span>
            </div>

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
              className="px-4 py-2 border-4 border-black rounded-full font-bold focus:outline-none focus:ring-4 focus:ring-amber-400"
            >
              <option value="recent">Recent Orders</option>
              <option value="orders">Most Orders</option>
              <option value="spending">Highest Spending</option>
            </select>

            <input
              type="number"
              placeholder="Min Orders"
              value={filters.minOrders || ''}
              onChange={(e) => setFilters({ ...filters, minOrders: parseInt(e.target.value) || 0 })}
              className="px-4 py-2 border-4 border-black rounded-full font-bold w-32 focus:outline-none focus:ring-4 focus:ring-amber-400"
            />

            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="px-4 py-2 border-4 border-black rounded-full font-bold focus:outline-none focus:ring-4 focus:ring-amber-400"
            />

            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="px-4 py-2 border-4 border-black rounded-full font-bold focus:outline-none focus:ring-4 focus:ring-amber-400"
            />

            {(searchQuery || filters.minOrders > 0 || filters.dateFrom || filters.dateTo) && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSearchQuery('')
                  setFilters({ sortBy: 'recent', minOrders: 0, dateFrom: '', dateTo: '' })
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-full font-black border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
              >
                CLEAR
              </motion.button>
            )}
          </div>
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 gap-4">
        {filteredCustomers.map((customer) => (
          <motion.div
            key={customer.id}
            whileHover={{ y: -4, rotate: 0.5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSelectedCustomer(customer)
              setShowCustomerDetails(true)
            }}
            className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              {/* Customer Info */}
              <div className="flex-1">
                <h3 className="text-xl font-black text-black mb-2">{customer.name}</h3>
                <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-black/60 mb-3">
                  {customer.email && <span>📧 {customer.email}</span>}
                  {customer.phone && <span>📱 {customer.phone}</span>}
                </div>
                
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-blue-50 rounded-xl border-4 border-black">
                    <p className="text-xs font-bold text-black/60 uppercase">Lifetime Orders</p>
                    <p className="text-2xl font-black text-blue-600">{customer.totalOrders}</p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-xl border-4 border-black">
                    <p className="text-xs font-bold text-black/60 uppercase">Total Spent</p>
                    <p className="text-2xl font-black text-green-600">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-xl border-4 border-black">
                    <p className="text-xs font-bold text-black/60 uppercase">Avg Order</p>
                    <p className="text-2xl font-black text-purple-600">
                      {formatCurrency(customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0)}
                    </p>
                  </div>
                  
                  <div className="p-3 bg-amber-50 rounded-xl border-4 border-black">
                    <p className="text-xs font-bold text-black/60 uppercase">Last Order</p>
                    <p className="text-sm font-black text-amber-600">{formatDate(customer.lastOrderDate)}</p>
                  </div>
                </div>

                {/* Restaurants */}
                {customer.restaurants.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-black/60">RESTAURANTS:</span>
                    {customer.restaurants.slice(0, 3).map((restaurant, idx) => (
                      <span key={idx} className="px-3 py-1 bg-amber-100 rounded-full text-xs font-black text-black border-2 border-black">
                        {restaurant}
                      </span>
                    ))}
                    {customer.restaurants.length > 3 && (
                      <span className="px-3 py-1 bg-black rounded-full text-xs font-black text-amber-400 border-2 border-black">
                        +{customer.restaurants.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* View Details Button */}
              <motion.button
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedCustomer(customer)
                  setShowCustomerDetails(true)
                }}
                className="px-6 py-3 bg-black text-amber-400 rounded-full font-black border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all whitespace-nowrap"
              >
                VIEW DETAILS
              </motion.button>
            </div>
          </motion.div>
        ))}

        {filteredCustomers.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border-4 border-black">
            <p className="text-xl font-black text-black/60">NO CUSTOMERS FOUND</p>
            <p className="text-sm font-bold text-black/40 mt-2">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      <AnimatePresence>
        {showCustomerDetails && selectedCustomer && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)] max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="bg-black text-white p-6 rounded-t-xl sticky top-0 z-10 border-b-4 border-black">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-amber-400">{selectedCustomer.name}</h2>
                    <p className="text-sm font-bold text-white/70">{selectedCustomer.email || selectedCustomer.phone}</p>
                  </div>
                  <button
                    onClick={() => setShowCustomerDetails(false)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Stats Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-xl border-4 border-black text-center">
                    <ShoppingBagIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-3xl font-black text-blue-600">{selectedCustomer.totalOrders}</p>
                    <p className="text-xs font-bold text-black/60 uppercase">Total Orders</p>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-xl border-4 border-black text-center">
                    <CurrencyRupeeIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-3xl font-black text-green-600">{formatCurrency(selectedCustomer.totalSpent)}</p>
                    <p className="text-xs font-bold text-black/60 uppercase">Total Spent</p>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-xl border-4 border-black text-center">
                    <CalendarIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-lg font-black text-purple-600">{formatDate(selectedCustomer.lastOrderDate)}</p>
                    <p className="text-xs font-bold text-black/60 uppercase">Last Order</p>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-xl border-4 border-black text-center">
                    <MapPinIcon className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                    <p className="text-3xl font-black text-amber-600">{selectedCustomer.restaurants.length}</p>
                    <p className="text-xs font-bold text-black/60 uppercase">Restaurants</p>
                  </div>
                </div>

                {/* Order History */}
                <div>
                  <h3 className="text-xl font-black text-black uppercase mb-4">Order History ({selectedCustomer.orders.length})</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {selectedCustomer.orders.map((order, idx) => (
                      <div key={idx} className="p-4 bg-white rounded-xl border-4 border-black">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-3 py-1 bg-black rounded-full text-xs font-black text-amber-400">
                                #{order.id.slice(0, 8)}
                              </span>
                              <span className="text-xs font-bold text-black/60">
                                {new Date(order.created_at).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <p className="font-black text-black">{order.restaurantName}</p>
                            {order.tableNumber && (
                              <p className="text-sm font-bold text-black/60">Table #{order.tableNumber}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-green-600">{formatCurrency(order.total_amount)}</p>
                          </div>
                        </div>

                        {/* Order Items */}
                        {order.order_items && order.order_items.length > 0 && (
                          <div className="mt-3 pt-3 border-t-2 border-black/10">
                            <p className="text-xs font-bold text-black/60 uppercase mb-2">Items Ordered:</p>
                            <div className="space-y-2">
                              {order.order_items.map((item, itemIdx) => (
                                <div key={itemIdx} className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    {item.menu_items?.image_url && (
                                      <img 
                                        src={item.menu_items.image_url} 
                                        alt={item.menu_items.name}
                                        className="w-10 h-10 object-cover rounded-lg border-2 border-black"
                                      />
                                    )}
                                    <span className="font-bold text-black">
                                      {item.quantity}x {item.menu_items?.name || 'Item'}
                                    </span>
                                  </div>
                                  <span className="font-black text-amber-600">₹{item.price}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

const SuperAdminPanel = () => {
  const navigate = useNavigate()
  const { user, signOut } = useAuthStore()
  const { showConfirmation } = useConfirmation()
  
  // Use enhanced order store for platform analytics
  const {
    fetchPlatformAnalytics,
    loading: ordersLoading,
    error: ordersError
  } = useOrderStore()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [platformAnalytics, setPlatformAnalytics] = useState(null)
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalStaff: 0,
    totalCustomers: 0,
    totalOwners: 0,
    totalSuperAdmins: 0
  })
  const [selectedRestaurant, setSelectedRestaurant] = useState(null)
  const [showRestaurantModal, setShowRestaurantModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [userModalMode, setUserModalMode] = useState('view') // 'view', 'edit', 'create'
  const [userFormData, setUserFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'customer'
  })
  const [restaurants, setRestaurants] = useState([])
  const [users, setUsers] = useState([])
  const [revenueData, setRevenueData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSuperAdminData()
    fetchPlatformOrderAnalytics()
  }, [])

  const fetchPlatformOrderAnalytics = async () => {
    try {
      const analytics = await fetchPlatformAnalytics({
        date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
        date_to: new Date().toISOString()
      })
      setPlatformAnalytics(analytics)
    } catch (error) {
      console.error('Error fetching platform analytics:', error)
      toast.error('Failed to load platform analytics')
    }
  }

  const fetchSuperAdminData = async () => {
    try {
      await Promise.all([
        fetchStats(),
        fetchRestaurants(),
        fetchUsers(),
        fetchRevenueData()
      ])
    } catch (error) {
      console.error('Error fetching super admin data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch restaurants from users table (consistent foreign key)
      const { data: restaurantsData } = await supabase
        .from('users')
        .select('id, is_active')
        .eq('role', 'restaurant_owner')

      // Fetch orders using enhanced service for better analytics
      let ordersData = []
      try {
        const platformData = await OrderService.getPlatformOrderAnalytics()
        ordersData = platformData ? Object.values(platformData.ordersByStatus).map((count, index) => ({
          total_amount: platformData.totalRevenue / platformData.totalOrders || 0,
          status: Object.keys(platformData.ordersByStatus)[index] || 'pending'
        })) : []
        
        // Update stats with platform analytics
        if (platformData) {
          setStats(prevStats => ({
            ...prevStats,
            totalOrders: platformData.totalOrders,
            totalRevenue: platformData.totalRevenue
          }))
        }
      } catch (error) {
        console.warn('Enhanced analytics failed, falling back to basic query:', error)
        const { data } = await supabase
          .from('orders')
          .select('total_amount, status')
        ordersData = data || []
      }

      // Fetch staff count
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
      
      // For now, we'll use basic counts since we don't have a profiles table
      // In a real app, you'd need to create a profiles table or use auth metadata
      const totalRestaurants = restaurantsData?.length || 0
      const activeRestaurants = restaurantsData?.filter(r => r.is_active).length || 0
      const totalRevenue = ordersData?.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0) || 0
      const totalOrders = ordersData?.length || 0
      const totalStaff = staffData?.length || 0
      
      // Fetch customers count from orders
      const { data: customerOrdersData } = await supabase
        .from('orders')
        .select('customer_email')
        .not('customer_email', 'is', null)
      
      // Get unique customer emails
      const uniqueCustomers = new Set(customerOrdersData?.map(order => order.customer_email) || [])
      
      // Fetch super admins count
      const { data: superAdminsData } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'super_admin')
      
      // Calculate real counts
      const totalOwners = totalRestaurants // 1 owner per restaurant
      const totalCustomers = uniqueCustomers.size
      const totalSuperAdmins = superAdminsData?.length || 0
      const totalUsers = totalOwners + totalStaff + totalCustomers + totalSuperAdmins

      setStats({
        totalRestaurants,
        activeRestaurants,
        totalRevenue,
        totalOrders,
        totalUsers,
        totalStaff,
        totalCustomers,
        totalOwners,
        totalSuperAdmins
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchRestaurants = async () => {
    try {
      // Fetch restaurant owners
      const { data: restaurantOwners, error: ownersError } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'restaurant_owner')
        .order('created_at', { ascending: false })

      if (ownersError) throw ownersError

      // Fetch all related data for each restaurant
      const enrichedRestaurants = await Promise.all(
        (restaurantOwners || []).map(async (restaurant) => {
          // Fetch orders
          const { data: orders } = await supabase
            .from('orders')
            .select('total_amount, status, created_at, payment_method, payment_status')
            .eq('restaurant_id', restaurant.id)

          // Fetch tables
          const { data: tables } = await supabase
            .from('tables')
            .select('id, table_number, capacity, is_active')
            .eq('restaurant_id', restaurant.id)

          // Fetch menu items
          const { data: menuItems } = await supabase
            .from('menu_items')
            .select('id, name, price, is_available')
            .eq('restaurant_id', restaurant.id)

          // Fetch categories
          const { data: categories } = await supabase
            .from('categories')
            .select('id, name')
            .eq('restaurant_id', restaurant.id)

          // Fetch staff
          const { data: staff } = await supabase
            .from('users')
            .select('id, full_name, position, is_available')
            .eq('restaurant_id', restaurant.id)
            .eq('role', 'staff')

          // Calculate metrics
          const completedOrders = orders?.filter(o => o.payment_status === 'completed') || []
          const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)
          const platformCommission = totalRevenue * 0.03 // 3% commission
          
          const today = new Date().toDateString()
          const todayOrders = completedOrders.filter(o => new Date(o.created_at).toDateString() === today)
          const todayRevenue = todayOrders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0)

          return {
            id: restaurant.id,
            name: restaurant.restaurant_name || restaurant.full_name || 'Unnamed Restaurant',
            email: restaurant.email,
            phone: restaurant.restaurant_phone || restaurant.phone,
            address: restaurant.restaurant_address || 'No address',
            cuisine_type: restaurant.cuisine_type || 'Multi-cuisine',
            is_active: restaurant.is_active,
            is_open: restaurant.is_open,
            logo_url: restaurant.logo_url,
            created_at: restaurant.created_at,
            totalRevenue,
            platformCommission,
            restaurantEarnings: totalRevenue - platformCommission,
            totalOrders: completedOrders.length,
            totalStaff: staff?.length || 0,
            totalTables: tables?.length || 0,
            totalMenuItems: menuItems?.length || 0,
            totalCategories: categories?.length || 0,
            activeStaff: staff?.filter(s => s.is_available).length || 0,
            availableTables: tables?.filter(t => t.is_active).length || 0,
            availableMenuItems: menuItems?.filter(m => m.is_available).length || 0,
            todayOrders: todayOrders.length,
            todayRevenue,
            todayCommission: todayRevenue * 0.03,
            orders: orders || [],
            tables: tables || [],
            menuItems: menuItems || [],
            categories: categories || [],
            staff: staff || []
          }
        })
      )

      setRestaurants(enrichedRestaurants)
      console.log('Fetched restaurants:', enrichedRestaurants.length)
    } catch (error) {
      console.error('Error fetching restaurants:', error)
      toast.error('Failed to load restaurants')
    }
  }

  const fetchUsers = async () => {
    try {
      // Fetch restaurant owners from users table (consistent foreign key)
      const { data: restaurantsData } = await supabase
        .from('users')
        .select('id, restaurant_name, id as owner_id, email, phone, created_at')
        .eq('role', 'restaurant_owner')
      
      // Fetch staff with restaurant info
      const { data: staffData } = await supabase
        .from('staff')
        .select(`
          id, user_id, position, created_at,
          restaurants(id, name)
        `)
      
      const enrichedUsers = []
      
      // Use a Map to ensure unique user IDs
      const userMap = new Map()
      
      // Add restaurant owners
      restaurantsData?.forEach(restaurant => {
        if (restaurant.owner_id && !userMap.has(restaurant.owner_id)) {
          userMap.set(restaurant.owner_id, {
            id: restaurant.owner_id,
            email: restaurant.email || 'N/A',
            full_name: 'Restaurant Owner',
            phone: restaurant.phone || 'N/A',
            role: 'restaurant_owner',
            created_at: restaurant.created_at,
            restaurant_name: restaurant.name,
            staff_position: 'N/A'
          })
        }
      })
      
      // Add staff members (only if not already added as owner)
      staffData?.forEach(staff => {
        if (staff.user_id && !userMap.has(staff.user_id)) {
          userMap.set(staff.user_id, {
            id: staff.user_id,
            email: 'N/A',
            full_name: 'Staff Member',
            phone: 'N/A',
            role: 'staff',
            created_at: staff.created_at,
            restaurant_name: staff.restaurants?.name || 'N/A',
            staff_position: staff.position || 'N/A'
          })
        }
      })
      
      // Fetch super admins from auth.users using the users view
      const { data: superAdminsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'super_admin')
      
      // Add super admins from database
      superAdminsData?.forEach(admin => {
        if (admin.id && !userMap.has(admin.id)) {
          userMap.set(admin.id, {
            id: admin.id,
            email: admin.email || 'N/A',
            full_name: admin.full_name || 'Super Admin',
            phone: admin.phone || 'N/A',
            role: 'super_admin',
            created_at: admin.created_at,
            restaurant_name: 'Platform Admin',
            staff_position: 'N/A'
          })
        }
      })
      
      // Fetch customers from orders (unique customer emails)
      const { data: customerOrdersData } = await supabase
        .from('orders')
        .select('customer_email, customer_name, customer_phone, created_at')
        .not('customer_email', 'is', null)
      
      // Get unique customers
      customerOrdersData?.forEach(order => {
        if (order.customer_email) {
          const customerId = `customer_${order.customer_email}`
          if (!userMap.has(customerId)) {
            userMap.set(customerId, {
              id: customerId,
              email: order.customer_email,
              full_name: order.customer_name || order.customer_email.split('@')[0],
              phone: order.customer_phone || 'N/A',
              role: 'customer',
              created_at: order.created_at,
              restaurant_name: 'N/A',
              staff_position: 'N/A'
            })
          }
        }
      })
      
      // Convert Map to Array and set users
      setUsers(Array.from(userMap.values()))
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchRevenueData = async () => {
    try {
      // Fetch orders from last 30 days with completed payments
      const { data } = await supabase
        .from('orders')
        .select('total_amount, created_at, payment_status')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .in('status', ['delivered', 'completed'])
        .order('created_at')

      const revenueByDay = {}
      data?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString()
        revenueByDay[date] = (revenueByDay[date] || 0) + parseFloat(order.total_amount || 0)
      })

      const chartData = Object.entries(revenueByDay)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, revenue]) => ({
          date,
          revenue: Math.round(revenue * 100) / 100 // Round to 2 decimal places
        }))

      setRevenueData(chartData)
    } catch (error) {
      console.error('Error fetching revenue data:', error)
      setRevenueData([])
    }
  }

  // User Management Functions
  const handleCreateUser = async () => {
    // For now, just show a toast - in a real app you'd open a modal
    toast.info('User creation feature coming soon. Users are created through restaurant registration.')
  }

  const handleUpdateUser = async (userId) => {
    // For now, just show a toast - in a real app you'd open an edit modal
    toast.info('User editing feature coming soon.')
  }

  const handleEditUser = (user) => {
    // For now, just show a toast - in a real app you'd open an edit modal
    toast.info(`Edit user: ${user.full_name}. Feature coming soon.`)
  }

  const handleDeleteUser = async (userId) => {
    const confirmed = await showConfirmation({
      title: 'Delete User',
      message: 'Are you sure you want to delete this user?\n\nThis action cannot be undone.',
      type: 'error',
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      confirmButtonColor: 'red'
    })
    
    if (!confirmed) return
    
    try {
      // Note: In a real app, you'd need proper user deletion logic
      // This is a placeholder since we're using auth metadata
      toast.info('User deletion requires backend implementation for safety.')
    } catch (error) {
      toast.error('Failed to delete user: ' + error.message)
    }
  }

  const handleBulkDeleteSpecificUsers = async () => {
    const confirmed = await showConfirmation({
      title: 'Bulk Delete Users',
      message: 'Are you sure you want to delete the specific users (sumaiya27khan@gmail.com, givegainz3@gmail.com)?\n\nThis action cannot be undone.',
      type: 'error',
      confirmText: 'Delete Users',
      cancelText: 'Cancel',
      confirmButtonColor: 'red'
    })
    
    if (!confirmed) return
    
    try {
      // This is a placeholder for bulk deletion of specific users
      // In a real app, you'd implement proper bulk deletion logic
      toast.info('Bulk user deletion requires backend implementation for safety. Use the SQL script provided above.')
    } catch (error) {
      toast.error('Failed to delete users: ' + error.message)
    }
  }

  const handleViewUser = (user) => {
    // For now, just show user details in a toast
    toast.info(`Viewing user: ${user.full_name} (${user.email}) - Role: ${user.role}`)
  }

  const handleSaveUser = async () => {
    // For now, just show a toast - in a real app you'd save the user data
    toast.info('Save user functionality coming soon.')
  }

  const toggleRestaurantStatus = async (restaurantId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !currentStatus })
        .eq('role', 'restaurant_owner')
        .eq('id', restaurantId)

      if (error) throw error

      toast.success(`Restaurant ${!currentStatus ? 'activated' : 'deactivated'}`)
      fetchRestaurants()
    } catch (error) {
      toast.error('Failed to update restaurant status')
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'restaurants', name: 'Restaurants', icon: BuildingStorefrontIcon },
    { id: 'customers', name: 'Customers', icon: UsersIcon },
    { id: 'users', name: 'Users', icon: UsersIcon },
    { id: 'analytics', name: 'Analytics', icon: ChartBarIcon },
    { id: 'settings', name: 'Settings', icon: Cog6ToothIcon }
  ]

  const BRAND_ORANGE = '#F59E0B'
  const BRAND_BLACK = '#1F2937'
  const COLORS = [BRAND_ORANGE, '#fb923c', '#fbbf24', '#f97316']

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-xl font-black text-black">LOADING...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Restaurant Landing Page Style */}
      <header className="relative z-40 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            {/* Logo/Title */}
            <motion.div 
              className="relative"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="bg-black rounded-2xl px-6 py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all">
                <h1 className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">SUPER ADMIN</h1>
                <p className="text-xs font-bold text-white/70 mt-1">Platform Control Center</p>
              </div>
            </motion.div>

            {/* User Info & Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="hidden sm:block text-right">
                <p className="font-black text-black text-sm">{user?.user_metadata?.full_name || 'Super Admin'}</p>
                <p className="text-xs font-bold text-black/60">{user?.email}</p>
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05, rotate: 3 }}
                whileTap={{ scale: 0.95 }}
              >
                <button
                  onClick={async () => {
                    try {
                      await signOut()
                      toast.success('Logged out successfully')
                      navigate('/auth')
                    } catch (error) {
                      toast.error('Failed to logout')
                    }
                  }}
                  className="px-4 py-2 sm:px-6 sm:py-3 bg-black rounded-full font-black text-sm border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-1 transition-all text-amber-400 flex items-center gap-2"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                  <span className="hidden sm:block">LOGOUT</span>
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Restaurant Landing Page Style */}
      <div className="bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-center py-4">
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full font-black text-xs sm:text-sm border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] active:translate-y-1 transition-all ${
                    activeTab === tab.id
                      ? 'bg-black text-amber-400'
                      : 'bg-white text-black hover:bg-amber-50'
                  }`}
                >
                  <tab.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:block uppercase">{tab.name}</span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Stats Cards - Restaurant Landing Page Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, rotate: 1 }}
                className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-4 bg-amber-100 rounded-2xl border-4 border-black">
                    <BuildingStorefrontIcon className="h-8 w-8 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-black">{stats.totalRestaurants}</p>
                    <p className="text-xs font-bold text-black/60 uppercase mt-1">Restaurants</p>
                    <p className="text-xs font-bold text-green-600 mt-1">{stats.activeRestaurants} Active</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -4, rotate: -1 }}
                className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-4 bg-green-100 rounded-2xl border-4 border-black">
                    <CurrencyRupeeIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-black">₹{(stats.totalRevenue / 1000).toFixed(0)}K</p>
                    <p className="text-xs font-bold text-black/60 uppercase mt-1">Revenue</p>
                    <p className="text-xs font-bold text-black/40 mt-1">Platform-wide</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -4, rotate: 1 }}
                className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-4 bg-blue-100 rounded-2xl border-4 border-black">
                    <ChartBarIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-black">{stats.totalOrders}</p>
                    <p className="text-xs font-bold text-black/60 uppercase mt-1">Orders</p>
                    <p className="text-xs font-bold text-black/40 mt-1">All Time</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -4, rotate: -1 }}
                className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-4 bg-purple-100 rounded-2xl border-4 border-black">
                    <UsersIcon className="h-8 w-8 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-black">{stats.totalUsers}</p>
                    <p className="text-xs font-bold text-black/60 uppercase mt-1">Users</p>
                    <p className="text-xs font-bold text-black/40 mt-1">{stats.totalOwners} Owners</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -4, rotate: 1 }}
                className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all"
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="p-4 bg-green-100 rounded-2xl border-4 border-black">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-black">99.9%</p>
                    <p className="text-xs font-bold text-black/60 uppercase mt-1">Uptime</p>
                    <p className="text-xs font-bold text-green-600 mt-1">Last 30 Days</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Revenue Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Platform Revenue (Last 30 Days)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
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

            {/* Top Restaurants */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Top Performing Restaurants</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Restaurant</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Revenue</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Orders</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants
                      .sort((a, b) => b.totalRevenue - a.totalRevenue)
                      .slice(0, 10)
                      .map((restaurant) => (
                        <tr key={restaurant.id} className="border-b border-neutral-100">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{restaurant.name}</p>
                              <p className="text-sm text-neutral-600">{restaurant.email}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">₹{restaurant.totalRevenue.toFixed(0)}</td>
                          <td className="py-3 px-4">{restaurant.totalOrders}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              restaurant.is_active 
                                ? 'bg-success/20 text-success' 
                                : 'bg-error/20 text-error'
                            }`}>
                              {restaurant.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => toggleRestaurantStatus(restaurant.id, restaurant.is_active)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                restaurant.is_active
                                  ? 'bg-error/10 text-error hover:bg-error/20'
                                  : 'bg-success/10 text-success hover:bg-success/20'
                              }`}
                            >
                              {restaurant.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-neutral-900">User Management</h2>
              <div className="flex gap-4 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full">
                  Super Admins: {users.filter(u => u.role === 'super_admin').length}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full">
                  Restaurant Owners: {users.filter(u => u.role === 'restaurant_owner').length}
                </span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-600 rounded-full">
                  Staff: {users.filter(u => u.role === 'staff').length}
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full">
                  Customers: {users.filter(u => u.role === 'customer' || !u.role).length}
                </span>
              </div>
            </div>

            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">User</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Restaurant</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Phone</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-neutral-100">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{user.full_name}</p>
                            <p className="text-sm text-neutral-600">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'super_admin' ? 'bg-red-100 text-red-600' :
                            user.role === 'restaurant_owner' ? 'bg-blue-100 text-blue-600' :
                            user.role === 'staff' ? 'bg-green-100 text-green-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {user.role === 'super_admin' ? 'Super Admin' :
                             user.role === 'restaurant_owner' ? 'Restaurant Owner' :
                             user.role === 'staff' ? 'Staff' : 'Customer'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm">
                            <p className="font-medium text-neutral-900">{user.restaurant_name}</p>
                            {user.staff_position !== 'N/A' && (
                              <p className="text-xs text-neutral-500">{user.staff_position}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{user.phone}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-neutral-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Restaurants Tab */}
        {activeTab === 'restaurants' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl sm:text-3xl font-black text-black uppercase">Restaurant Management</h2>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-black rounded-full border-4 border-black">
                  <span className="text-sm font-black text-amber-400">TOTAL: {restaurants.length}</span>
                </div>
                <div className="px-4 py-2 bg-white rounded-full border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]">
                  <span className="text-sm font-black text-green-600">ACTIVE: {restaurants.filter(r => r.is_active).length}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {restaurants.map((restaurant) => (
                <motion.div 
                  key={restaurant.id} 
                  className="bg-white rounded-2xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all cursor-pointer"
                  whileHover={{ y: -4, rotate: 0.5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/admin/restaurant/${restaurant.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary-100 rounded-xl">
                        <BuildingStorefrontIcon className="h-8 w-8 text-primary-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-neutral-900">{restaurant.name}</h3>
                        <p className="text-neutral-600">{restaurant.address}</p>
                        <p className="text-sm text-neutral-500">{restaurant.cuisine_type} • {restaurant.email}</p>
                        
                        {/* Detailed Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3">
                          <div className="text-center p-2 bg-blue-50 rounded-lg">
                            <p className="text-lg font-bold text-blue-600">₹{restaurant.totalRevenue.toFixed(0)}</p>
                            <p className="text-xs text-blue-500">Total Revenue</p>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded-lg">
                            <p className="text-lg font-bold text-red-600">₹{restaurant.platformCommission.toFixed(0)}</p>
                            <p className="text-xs text-red-500">Our Commission (3%)</p>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded-lg">
                            <p className="text-lg font-bold text-green-600">₹{restaurant.restaurantEarnings.toFixed(0)}</p>
                            <p className="text-xs text-green-500">Restaurant Earnings</p>
                          </div>
                          <div className="text-center p-2 bg-purple-50 rounded-lg">
                            <p className="text-lg font-bold text-purple-600">{restaurant.totalOrders}</p>
                            <p className="text-xs text-purple-500">Total Orders</p>
                          </div>
                          <div className="text-center p-2 bg-orange-50 rounded-lg">
                            <p className="text-lg font-bold text-orange-600">{restaurant.totalTables}</p>
                            <p className="text-xs text-orange-500">Tables</p>
                          </div>
                        </div>
                        
                        {/* Today's Stats */}
                        <div className="flex items-center gap-3 mt-3 text-sm flex-wrap">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-medium">
                            Today: {restaurant.todayOrders} orders
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                            ₹{restaurant.todayRevenue.toFixed(0)} revenue
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-medium">
                            ₹{restaurant.todayCommission.toFixed(0)} commission
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                            {restaurant.totalMenuItems} menu items
                          </span>
                          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-medium">
                            {restaurant.totalStaff} staff
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        restaurant.is_active 
                          ? 'bg-success/20 text-success' 
                          : 'bg-error/20 text-error'
                      }`}>
                        {restaurant.is_active ? 'Active' : 'Inactive'}
                      </span>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRestaurant(restaurant)
                            setShowRestaurantModal(true)
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg text-sm transition-colors"
                        >
                          View Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleRestaurantStatus(restaurant.id, restaurant.is_active)
                          }}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            restaurant.is_active
                              ? 'bg-error/10 text-error hover:bg-error/20'
                              : 'bg-success/10 text-success hover:bg-success/20'
                          }`}
                        >
                          {restaurant.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <CustomersTab />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-neutral-900">Platform Analytics</h2>
            </div>

            {/* Revenue Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Revenue Trend (Last 30 Days)</h3>
              {revenueData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-neutral-500">
                  <p>No revenue data available</p>
                </div>
              )}
            </div>

            {/* Platform Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <h4 className="font-medium text-neutral-600 mb-2">Total Platform Revenue</h4>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toFixed(0)}</p>
                <p className="text-sm text-neutral-500">All time</p>
              </div>
              
              <div className="card">
                <h4 className="font-medium text-neutral-600 mb-2">Average Order Value</h4>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{stats.totalOrders > 0 ? (stats.totalRevenue / stats.totalOrders).toFixed(0) : '0'}
                </p>
                <p className="text-sm text-neutral-500">Per order</p>
              </div>
              
              <div className="card">
                <h4 className="font-medium text-neutral-600 mb-2">Active Restaurants</h4>
                <p className="text-2xl font-bold text-purple-600">{stats.activeRestaurants}</p>
                <p className="text-sm text-neutral-500">Out of {stats.totalRestaurants}</p>
              </div>
              
              <div className="card">
                <h4 className="font-medium text-neutral-600 mb-2">Platform Users</h4>
                <p className="text-2xl font-bold text-orange-600">{stats.totalUsers}</p>
                <p className="text-sm text-neutral-500">Total registered</p>
              </div>
            </div>

            {/* User Distribution */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">User Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.totalCustomers}</p>
                  <p className="text-sm text-blue-500">Customers</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{stats.totalOwners}</p>
                  <p className="text-sm text-green-500">Restaurant Owners</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{stats.totalStaff}</p>
                  <p className="text-sm text-purple-500">Staff Members</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{stats.totalSuperAdmins}</p>
                  <p className="text-sm text-orange-500">Super Admins</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-neutral-900">Platform Settings</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* System Information */}
              <div className="card">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">System Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Platform Version</span>
                    <span className="font-medium">v1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Database Status</span>
                    <span className="px-2 py-1 bg-success/20 text-success rounded text-sm">Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Restaurants</span>
                    <span className="font-medium">{stats.totalRestaurants}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Orders</span>
                    <span className="font-medium">{stats.totalOrders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Total Revenue</span>
                    <span className="font-medium">₹{stats.totalRevenue.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Platform Statistics */}
              <div className="card">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Platform Health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Active Restaurants</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="font-medium">{stats.activeRestaurants}/{stats.totalRestaurants}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">User Engagement</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="font-medium">High</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">System Performance</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="font-medium">Optimal</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-600">Data Backup</span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span className="font-medium">Up to date</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* User Management */}
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">User Management</h3>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-colors flex items-center gap-2"
                >
                  <UsersIcon className="h-4 w-4" />
                  Add New User
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">User</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Restaurant</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-neutral-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 10).map((user, index) => (
                      <tr key={index} className="border-b border-neutral-100 hover:bg-neutral-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-neutral-900">{user.full_name}</p>
                            <p className="text-sm text-neutral-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'super_admin' ? 'bg-red-100 text-red-700' :
                            user.role === 'restaurant_owner' ? 'bg-blue-100 text-blue-700' :
                            user.role === 'staff' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role === 'super_admin' ? 'Super Admin' :
                             user.role === 'restaurant_owner' ? 'Owner' :
                             user.role === 'staff' ? 'Staff' : 'Customer'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm text-neutral-600">{user.restaurant_name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                            Active
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewUser(user)}
                              className="px-2 py-1 text-xs bg-blue-100 text-blue-600 hover:bg-blue-200 rounded transition-colors"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditUser(user)}
                              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-600 hover:bg-yellow-200 rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-2 py-1 text-xs bg-red-100 text-red-600 hover:bg-red-200 rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ChartBarIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Export Analytics</p>
                      <p className="text-sm text-neutral-500">Download platform reports</p>
                    </div>
                  </div>
                </button>
                
                <button className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <BuildingStorefrontIcon className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Backup Data</p>
                      <p className="text-sm text-neutral-500">Create system backup</p>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={handleCreateUser}
                  className="p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <UsersIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium">Add New User</p>
                      <p className="text-sm text-neutral-500">Create user account</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Bulk Delete Specific Users */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Admin Actions</h3>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-900">Delete Specific Users</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Delete users: sumaiya27khan@gmail.com, givegainz3@gmail.com
                    </p>
                  </div>
                  <button
                    onClick={handleBulkDeleteSpecificUsers}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Users
                  </button>
                </div>
              </div>
            </div>

            {/* SQL Script Instructions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Manual Deletion (Recommended)</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-3">
                  <p className="text-sm text-blue-900">
                    <strong>For guaranteed deletion, use the SQL script:</strong>
                  </p>
                  <div className="bg-white border rounded p-3 font-mono text-sm">
                    <p className="text-gray-600">File location:</p>
                    <p className="text-blue-600">src/scripts/delete_users.sql</p>
                  </div>
                  <div className="space-y-2 text-sm text-blue-800">
                    <p>1. Open your Supabase Dashboard</p>
                    <p>2. Go to SQL Editor</p>
                    <p>3. Copy and paste the SQL script</p>
                    <p>4. Run the script to delete users permanently</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Details Modal */}
        <AnimatePresence>
          {showRestaurantModal && selectedRestaurant && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{selectedRestaurant.name}</h2>
                      <p className="text-blue-100">{selectedRestaurant.address}</p>
                    </div>
                    <button
                      onClick={() => setShowRestaurantModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-8">
                  {/* Restaurant Info */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                        <BuildingStorefrontIcon className="h-5 w-5" />
                        Restaurant Information
                      </h3>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Name:</span>
                          <span className="font-medium">{selectedRestaurant.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Email:</span>
                          <span className="font-medium">{selectedRestaurant.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Phone:</span>
                          <span className="font-medium">{selectedRestaurant.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Cuisine:</span>
                          <span className="font-medium">{selectedRestaurant.cuisine_type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-600">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedRestaurant.is_active 
                              ? 'bg-success/20 text-success' 
                              : 'bg-error/20 text-error'
                          }`}>
                            {selectedRestaurant.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
                        <ChartBarIcon className="h-5 w-5" />
                        Performance Metrics
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">₹{selectedRestaurant.totalRevenue.toFixed(0)}</p>
                          <p className="text-sm text-blue-500">Total Revenue</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{selectedRestaurant.totalOrders}</p>
                          <p className="text-sm text-green-500">Total Orders</p>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-600">{selectedRestaurant.todayOrders}</p>
                          <p className="text-sm text-yellow-500">Today's Orders</p>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">₹{selectedRestaurant.todayRevenue.toFixed(0)}</p>
                          <p className="text-sm text-purple-500">Today's Revenue</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Staff Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2 mb-4">
                      <UsersIcon className="h-5 w-5" />
                      Staff Members ({selectedRestaurant.totalStaff})
                    </h3>
                    {selectedRestaurant.staff && selectedRestaurant.staff.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedRestaurant.staff.map((staff, index) => (
                          <div key={index} className="p-4 border border-neutral-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserCircleIcon className="h-6 w-6 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium">Staff Member #{staff.id.slice(-4)}</p>
                                <p className="text-sm text-neutral-600">{staff.position || 'Staff'}</p>
                                <p className="text-xs text-neutral-500">User ID: {staff.user_id?.slice(-8) || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500 text-center py-8">No staff members found</p>
                    )}
                  </div>

                  {/* Tables Details */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2 mb-4">
                      <TableCellsIcon className="h-5 w-5" />
                      Tables ({selectedRestaurant.totalTables})
                    </h3>
                    {selectedRestaurant.tables && selectedRestaurant.tables.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {selectedRestaurant.tables.map((table, index) => (
                          <div key={index} className="p-3 border border-neutral-200 rounded-lg text-center">
                            <p className="font-medium">Table {table.table_number}</p>
                            <p className="text-sm text-neutral-600">{table.capacity} seats</p>
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 bg-success/20 text-success">
                              Available
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500 text-center py-8">No tables found</p>
                    )}
                  </div>

                  {/* Menu Items */}
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2 mb-4">
                      <ClipboardDocumentListIcon className="h-5 w-5" />
                      Menu Items ({selectedRestaurant.totalMenuItems})
                    </h3>
                    {selectedRestaurant.menu_items && selectedRestaurant.menu_items.length > 0 ? (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
                        {selectedRestaurant.menu_items.map((item, index) => (
                          <div key={index} className="p-3 border border-neutral-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-lg font-bold text-green-600">₹{item.price}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                item.is_available 
                                  ? 'bg-success/20 text-success' 
                                  : 'bg-error/20 text-error'
                              }`}>
                                {item.is_available ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-neutral-500 text-center py-8">No menu items found</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-4 pt-6 border-t border-neutral-200">
                    <button
                      onClick={() => setShowRestaurantModal(false)}
                      className="px-6 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => toggleRestaurantStatus(selectedRestaurant.id, selectedRestaurant.is_active)}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        selectedRestaurant.is_active
                          ? 'bg-error text-white hover:bg-error/90'
                          : 'bg-success text-white hover:bg-success/90'
                      }`}
                    >
                      {selectedRestaurant.is_active ? 'Deactivate Restaurant' : 'Activate Restaurant'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* User CRUD Modal */}
        <AnimatePresence>
          {showUserModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                      {userModalMode === 'create' ? 'Add New User' :
                       userModalMode === 'edit' ? 'Edit User' : 'User Details'}
                    </h2>
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={userFormData.full_name}
                      onChange={(e) => setUserFormData({...userFormData, full_name: e.target.value})}
                      disabled={userModalMode === 'view'}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-neutral-100"
                      placeholder="Enter full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData({...userFormData, email: e.target.value})}
                      disabled={userModalMode === 'view' || userModalMode === 'edit'}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-neutral-100"
                      placeholder="Enter email address"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={userFormData.phone}
                      onChange={(e) => setUserFormData({...userFormData, phone: e.target.value})}
                      disabled={userModalMode === 'view'}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-neutral-100"
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Role
                    </label>
                    <select
                      value={userFormData.role}
                      onChange={(e) => setUserFormData({...userFormData, role: e.target.value})}
                      disabled={userModalMode === 'view'}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:bg-neutral-100"
                    >
                      <option value="customer">Customer</option>
                      <option value="staff">Staff</option>
                      <option value="restaurant_owner">Restaurant Owner</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>

                  {userModalMode === 'create' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Note:</strong> A temporary password will be sent to the user's email address.
                      </p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-neutral-200">
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    {userModalMode === 'view' ? 'Close' : 'Cancel'}
                  </button>
                  {userModalMode !== 'view' && (
                    <button
                      onClick={handleSaveUser}
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg hover:from-red-600 hover:to-orange-600 transition-colors"
                    >
                      {userModalMode === 'create' ? 'Create User' : 'Save Changes'}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default SuperAdminPanel
