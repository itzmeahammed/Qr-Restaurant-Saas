import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

const OrdersTab = ({ orders, onUpdateOrderStatus }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* Orders Grid */}
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
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-neutral-500">Customer:</span>
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Staff:</span>
                    <p className="font-medium">{order.users?.full_name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Amount:</span>
                    <p className="font-bold text-orange-600">₹{order.total_amount}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Time:</span>
                    <p className="font-medium">{new Date(order.created_at).toLocaleString()}</p>
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
                
                {order.status !== 'delivered' && order.status !== 'cancelled' && (
                  <button
                    onClick={() => onUpdateOrderStatus(order.id, getNextStatus(order.status))}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                  >
                    <CheckIcon className="h-4 w-4" />
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
                    onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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
                  <p className="font-medium">{selectedOrder.customer_name}</p>
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
              
              {selectedOrder.notes && (
                <div>
                  <label className="text-sm font-medium text-neutral-500">Notes</label>
                  <p className="text-neutral-700 bg-neutral-50 p-3 rounded-lg">{selectedOrder.notes}</p>
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
