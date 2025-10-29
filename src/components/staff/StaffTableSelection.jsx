import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TableCellsIcon,
  UserIcon,
  PhoneIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import tableService from '../../services/tableService'
import toast from 'react-hot-toast'

const StaffTableSelection = ({ restaurantId, staffId, onTableReserved, onClose }) => {
  console.log('🪑 StaffTableSelection props:', { restaurantId, staffId })
  const [allTables, setAllTables] = useState([])
  const [availableTables, setAvailableTables] = useState([])
  const [reservedTables, setReservedTables] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [activeTab, setActiveTab] = useState('available') // 'available' or 'reserved'

  useEffect(() => {
    loadAllTables()
  }, [restaurantId])

  const loadAllTables = async () => {
    try {
      setLoading(true)
      console.log('🔍 Loading tables for restaurant:', restaurantId)
      
      // Load all tables with their current status
      const tables = await tableService.getRestaurantTables(restaurantId)
      console.log('✅ Tables loaded:', tables)
      setAllTables(tables)
      
      // Separate available and reserved tables
      const available = tables.filter(table => table.reservation_status === 'available')
      const reserved = tables.filter(table => table.reservation_status === 'reserved')
      
      setAvailableTables(available)
      setReservedTables(reserved)
    } catch (error) {
      console.error('❌ Error loading tables:', error)
      toast.error('Failed to load tables')
    } finally {
      setLoading(false)
    }
  }

  const handleTableSelect = (table) => {
    setSelectedTable(table)
    setShowCustomerForm(true)
  }

  const handleReserveTable = async () => {
    if (!selectedTable || !customerInfo.name.trim()) {
      toast.error('Please provide customer name')
      return
    }

    try {
      setSubmitting(true)
      
      const result = await tableService.reserveTableByStaff(
        selectedTable.id,
        restaurantId,
        staffId,
        {
          name: customerInfo.name.trim(),
          phone: customerInfo.phone.trim() || null,
          email: customerInfo.email.trim() || null
        }
      )

      toast.success(`Table ${selectedTable.table_number} reserved for ${customerInfo.name}`)
      
      // Notify parent component
      if (onTableReserved) {
        onTableReserved({
          table: selectedTable,
          customer: customerInfo,
          sessionId: result.sessionId
        })
      }

      // Reset form
      setSelectedTable(null)
      setCustomerInfo({ name: '', phone: '', email: '' })
      setShowCustomerForm(false)
      
      // Reload all tables
      await loadAllTables()
      
    } catch (error) {
      console.error('Error reserving table:', error)
      toast.error(error.message || 'Failed to reserve table')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnreserveTable = async (table) => {
    if (!table.current_session) {
      toast.error('No active session found for this table')
      return
    }

    try {
      setSubmitting(true)
      
      await tableService.releaseTable(table.id, table.current_session.session_id)
      
      toast.success(`Table ${table.table_number} is now available`, {
        icon: '✅',
        duration: 3000
      })
      
      // Reload all tables
      await loadAllTables()
      
    } catch (error) {
      console.error('Error unreserving table:', error)
      toast.error(error.message || 'Failed to unreserve table')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    setSelectedTable(null)
    setCustomerInfo({ name: '', phone: '', email: '' })
    setShowCustomerForm(false)
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Table Management</h2>
            <p className="text-orange-100 text-sm">Reserve tables and manage customer seating</p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setActiveTab('available')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'available'
                ? 'bg-white text-orange-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Available ({availableTables.length})
          </button>
          <button
            onClick={() => setActiveTab('reserved')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'reserved'
                ? 'bg-white text-orange-600'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            Reserved ({reservedTables.length})
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-neutral-600">Loading available tables...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!showCustomerForm ? (
              <motion.div
                key="table-selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    {activeTab === 'available' ? 'Available Tables' : 'Reserved Tables'}
                  </h3>
                  <button
                    onClick={loadAllTables}
                    className="text-sm text-orange-600 hover:text-orange-800 font-medium"
                  >
                    Refresh
                  </button>
                </div>

                {/* Available Tables View */}
                {activeTab === 'available' && (
                  <>
                    {availableTables.length === 0 ? (
                      <div className="text-center py-12">
                        <TableCellsIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">No Available Tables</h3>
                        <p className="text-neutral-600">All tables are currently reserved. Please check back later.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {availableTables.map((table) => (
                          <motion.button
                            key={table.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleTableSelect(table)}
                            className="bg-green-50 border-2 border-green-200 rounded-lg p-4 text-left hover:bg-green-100 hover:border-green-300 transition-all"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-neutral-900">Table {table.table_number}</h4>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                {table.capacity} seats
                              </span>
                            </div>
                            <p className="text-sm text-neutral-700">{table.location}</p>
                            <div className="mt-2 flex items-center gap-1">
                              <CheckIcon className="h-4 w-4 text-green-600" />
                              <span className="text-xs font-medium text-green-700">Available</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Reserved Tables View */}
                {activeTab === 'reserved' && (
                  <>
                    {reservedTables.length === 0 ? (
                      <div className="text-center py-12">
                        <TableCellsIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-neutral-900 mb-2">No Reserved Tables</h3>
                        <p className="text-neutral-600">All tables are currently available for reservation.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {reservedTables.map((table) => (
                          <motion.div
                            key={table.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-neutral-900">Table {table.table_number}</h4>
                              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
                                {table.capacity} seats
                              </span>
                            </div>
                            <p className="text-sm text-neutral-700 mb-2">{table.location}</p>
                            
                            {/* Customer Info */}
                            {table.current_session && (
                              <div className="bg-white rounded-lg p-3 mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <UserIcon className="h-4 w-4 text-neutral-500" />
                                  <span className="text-sm font-medium text-neutral-900">
                                    {table.current_session.customer_name}
                                  </span>
                                </div>
                                {table.current_session.customer_phone && (
                                  <p className="text-xs text-neutral-600">
                                    📞 {table.current_session.customer_phone}
                                  </p>
                                )}
                                <p className="text-xs text-neutral-500 mt-1">
                                  Reserved: {new Date(table.current_session.started_at).toLocaleTimeString()}
                                </p>
                              </div>
                            )}

                            {/* Status and Actions */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <ClockIcon className="h-4 w-4 text-orange-600" />
                                <span className="text-xs font-medium text-orange-700">Reserved</span>
                              </div>
                              
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleUnreserveTable(table)}
                                disabled={submitting}
                                className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors disabled:opacity-50"
                              >
                                {submitting ? 'Releasing...' : 'Release Table'}
                              </motion.button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="customer-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Selected Table Info */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <TableCellsIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-900">Table {selectedTable.table_number}</h4>
                      <p className="text-sm text-neutral-600">{selectedTable.capacity} seats • {selectedTable.location}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Information Form */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-4">Customer Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter customer name"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                        className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Enter email address"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCancel}
                    className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReserveTable}
                    disabled={submitting || !customerInfo.name.trim()}
                    className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Reserving...' : 'Reserve Table'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default StaffTableSelection
