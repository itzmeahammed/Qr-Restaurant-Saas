import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserIcon,
  MapPinIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  ShoppingBagIcon,
  PhoneIcon
} from '@heroicons/react/24/outline'
import UnifiedOrderService from '../../services/unifiedOrderService'
import useAuthStore from '../../stores/useAuthStore'
import toast from 'react-hot-toast'

const OrdersTab = () => {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updatingOrder, setUpdatingOrder] = useState(null)

  // Fetch orders on component mount
  useEffect(() => {
    if (user?.id) {
      fetchOrders()
    }
  }, [user?.id])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      console.log('🔄 Fetching restaurant orders for owner:', user.id)
      
      const fetchedOrders = await UnifiedOrderService.getRestaurantOrders(user.id)
      console.log('📋 Fetched orders:', fetchedOrders)
      
      setOrders(fetchedOrders || [])
    } catch (error) {
      console.error('❌ Error fetching orders:', error)
      toast.error('Failed to load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId)
      console.log('🔄 Updating order status:', { orderId, newStatus })
      
      await UnifiedOrderService.updateOrderStatus(orderId, newStatus, user.id, 'owner')
      
      // Refresh orders after update
      await fetchOrders()
      
      toast.success(`Order ${newStatus} successfully`)
    } catch (error) {
      console.error('❌ Error updating order:', error)
      toast.error('Failed to update order status')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const filteredOrders = orders.filter(order => {
    const customerName = order.customers?.full_name || order.customer_name || ''
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customerName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'preparing': return 'bg-orange-100 text-orange-800'
      case 'ready': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-neutral-100 text-neutral-800'
    }
  }

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'assigned',
      'assigned': 'preparing',
      'preparing': 'ready',
      'ready': 'delivered'
    }
    return statusFlow[currentStatus]
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <h2 className="text-xl font-bold text-neutral-900">Order Management</h2>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm w-full sm:w-64"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading orders...</p>
        </div>
      ) : (
        /* Orders Grid */
        <div className="grid gap-4 md:gap-6">
          {filteredOrders.length > 0 ? filteredOrders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Order Info */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h3 className="text-lg font-semibold text-neutral-900">#{order.order_number}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  {/* Customer Info */}
                  <div className="flex items-start gap-2">
                    <UserIcon className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-neutral-500 text-xs">Customer:</span>
                      <p className="font-medium">{order.customers?.full_name || order.customer_name || 'Guest'}</p>
                      {order.customers?.phone && (
                        <div className="flex items-center gap-1 mt-1">
                          <PhoneIcon className="h-3 w-3 text-neutral-400" />
                          <p className="text-xs text-neutral-400">{order.customers.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Table Info */}
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-neutral-500 text-xs">Table:</span>
                      <p className="font-medium text-blue-600">
                        {order.tables?.table_number ? `Table ${order.tables.table_number}` : 'No Table'}
                      </p>
                      {order.tables?.location && (
                        <p className="text-xs text-neutral-400">{order.tables.location}</p>
                      )}
                      {order.tables?.capacity && (
                        <p className="text-xs text-neutral-400">Capacity: {order.tables.capacity}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Staff Info */}
                  <div className="flex items-start gap-2">
                    <UserIcon className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-neutral-500 text-xs">Assigned Staff:</span>
                      <p className="font-medium">
                        {order.assigned_staff?.full_name || order.users?.full_name || 'Unassigned'}
                      </p>
                      {order.assigned_staff?.position && (
                        <p className="text-xs text-neutral-400">{order.assigned_staff.position}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Details */}
                  <div className="flex items-start gap-2">
                    <CurrencyRupeeIcon className="h-4 w-4 text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-neutral-500 text-xs">Amount:</span>
                      <p className="font-bold text-orange-600">₹{order.total_amount}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <CalendarIcon className="h-3 w-3 text-neutral-400" />
                        <p className="text-xs text-neutral-400">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Order Items Preview */}
                {order.order_items && order.order_items.length > 0 && (
                  <div className="mt-3 p-3 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <ShoppingBagIcon className="h-4 w-4 text-neutral-500" />
                      <span className="text-sm font-medium text-neutral-700">
                        {order.order_items.length} item{order.order_items.length > 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {order.order_items.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs">
                          <span className="text-neutral-600">
                            {item.quantity}x {item.item_name}
                          </span>
                          <span className="text-neutral-500">₹{item.total_price}</span>
                        </div>
                      ))}
                      {order.order_items.length > 3 && (
                        <p className="text-xs text-neutral-400">+{order.order_items.length - 3} more items</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Order Tracking Timeline */}
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Order Timeline</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Created:</span>
                      <span className="text-blue-600">{new Date(order.created_at).toLocaleTimeString()}</span>
                    </div>
                    {order.assigned_at && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Assigned:</span>
                        <span className="text-blue-600">{new Date(order.assigned_at).toLocaleTimeString()}</span>
                      </div>
                    )}
                    {order.started_at && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Started:</span>
                        <span className="text-blue-600">{new Date(order.started_at).toLocaleTimeString()}</span>
                      </div>
                    )}
                    {order.ready_at && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Ready:</span>
                        <span className="text-blue-600">{new Date(order.ready_at).toLocaleTimeString()}</span>
                      </div>
                    )}
                    {order.completed_at && (
                      <div className="flex justify-between">
                        <span className="text-blue-700">Completed:</span>
                        <span className="text-blue-600">{new Date(order.completed_at).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-row lg:flex-col gap-2">
                <button
                  onClick={() => setSelectedOrder(order)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">View</span>
                </button>
                
                {order.status !== 'delivered' && order.status !== 'cancelled' && order.status !== 'completed' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, getNextStatus(order.status))}
                    disabled={updatingOrder === order.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 rounded-lg transition-colors"
                  >
                    {updatingOrder === order.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckIcon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {getNextStatus(order.status) === 'assigned' && 'Assign'}
                      {getNextStatus(order.status) === 'preparing' && 'Start Prep'}
                      {getNextStatus(order.status) === 'ready' && 'Mark Ready'}
                      {getNextStatus(order.status) === 'delivered' && 'Deliver'}
                    </span>
                  </button>
                )}
                
                {order.status === 'pending' && (
                  <button
                    onClick={() => handleUpdateOrderStatus(order.id, 'cancelled')}
                    disabled={updatingOrder === order.id}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 disabled:text-red-400 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">Cancel</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="bg-white rounded-xl p-8 md:p-12 shadow-sm border border-neutral-200 text-center">
            <ClockIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Orders Found</h3>
            <p className="text-neutral-500">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Orders will appear here once customers start placing them.'}
            </p>
          </div>
        )}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Order Details</h3>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-neutral-500">Order Number</label>
                  <p className="text-lg font-semibold">#{selectedOrder.order_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-1 ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">Customer</label>
                  <p className="font-medium">{selectedOrder.customers?.full_name || selectedOrder.customer_name || 'Guest'}</p>
                  {selectedOrder.customers?.phone && (
                    <p className="text-sm text-neutral-600">{selectedOrder.customers.phone}</p>
                  )}
                  {selectedOrder.customers?.email && (
                    <p className="text-sm text-neutral-600">{selectedOrder.customers.email}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-500">Total Amount</label>
                  <p className="text-lg font-bold text-orange-600">₹{selectedOrder.total_amount}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-neutral-500">Order Time</label>
                <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
              
              {/* Table Information */}
              {selectedOrder.tables && (
                <div>
                  <label className="text-sm font-medium text-neutral-500">Table Information</label>
                  <div className="bg-neutral-50 p-3 rounded-lg">
                    <p className="font-medium">Table {selectedOrder.tables.table_number}</p>
                    {selectedOrder.tables.location && (
                      <p className="text-sm text-neutral-600">Location: {selectedOrder.tables.location}</p>
                    )}
                    {selectedOrder.tables.capacity && (
                      <p className="text-sm text-neutral-600">Capacity: {selectedOrder.tables.capacity} people</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Staff Information */}
              {(selectedOrder.assigned_staff || selectedOrder.users) && (
                <div>
                  <label className="text-sm font-medium text-neutral-500">Assigned Staff</label>
                  <div className="bg-neutral-50 p-3 rounded-lg">
                    <p className="font-medium">{selectedOrder.assigned_staff?.full_name || selectedOrder.users?.full_name}</p>
                    {selectedOrder.assigned_staff?.position && (
                      <p className="text-sm text-neutral-600">Position: {selectedOrder.assigned_staff.position}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Order Items */}
              {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-neutral-500">Order Items</label>
                  <div className="bg-neutral-50 p-3 rounded-lg space-y-2">
                    {selectedOrder.order_items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-sm text-neutral-600">Quantity: {item.quantity}</p>
                          {item.special_instructions && (
                            <p className="text-xs text-neutral-500">Note: {item.special_instructions}</p>
                          )}
                        </div>
                        <p className="font-medium">₹{item.total_price}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedOrder.special_instructions && (
                <div>
                  <label className="text-sm font-medium text-neutral-500">Special Instructions</label>
                  <p className="text-neutral-700 bg-neutral-50 p-3 rounded-lg">{selectedOrder.special_instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersTab
