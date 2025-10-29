import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QRCodeSVG } from 'qrcode.react'
import { 
  PlusIcon,
  QrCodeIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  TableCellsIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  UserIcon,
  ClockIcon,
  PhoneIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline'
import tableService from '../../services/tableService'
import UnifiedOrderService from '../../services/unifiedOrderService'
import toast from 'react-hot-toast'

const TablesTab = ({ restaurant, tables = [], onAddTable, onUpdateTable, onDeleteTable }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [editingTable, setEditingTable] = useState(null)
  const [newTable, setNewTable] = useState({ table_number: '', capacity: 2, location: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tablesWithStatus, setTablesWithStatus] = useState([])
  const [showTableDetails, setShowTableDetails] = useState(false)
  const [selectedTableDetails, setSelectedTableDetails] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const qrRef = useRef(null)
  
  // Load tables with reservation status
  useEffect(() => {
    if (restaurant?.id) {
      loadTablesWithStatus()
      // Set up real-time updates every 30 seconds
      const interval = setInterval(loadTablesWithStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [restaurant?.id, tables])

  const loadTablesWithStatus = async () => {
    try {
      if (!restaurant?.id) return
      
      const enrichedTables = await tableService.getRestaurantTables(restaurant.id)
      setTablesWithStatus(enrichedTables)
    } catch (error) {
      console.error('Error loading table status:', error)
    }
  }

  const handleRefreshTables = async () => {
    setRefreshing(true)
    try {
      await loadTablesWithStatus()
      toast.success('Table status updated')
    } catch (error) {
      toast.error('Failed to refresh table status')
    } finally {
      setRefreshing(false)
    }
  }

  const handleReleaseTable = async (tableId, sessionId) => {
    try {
      await tableService.releaseTable(tableId, sessionId)
      await loadTablesWithStatus()
      toast.success('Table released successfully')
      setShowTableDetails(false)
    } catch (error) {
      toast.error('Failed to release table')
      console.error('Error releasing table:', error)
    }
  }

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'reserved':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTableStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <CheckIcon className="h-4 w-4" />
      case 'reserved':
        return <UserIcon className="h-4 w-4" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />
    }
  }

  // Generate QR Code URL for table
  const generateQRValue = (tableId, tableNumber) => {
    const baseUrl = window.location.origin
    return `${baseUrl}/menu/${restaurant?.id}?table=${tableNumber}&tableId=${tableId}`
  }

  const downloadQR = (table) => {
    const canvas = document.createElement('canvas')
    const qrValue = generateQRValue(table.id, table.table_number)
    
    // Create QR code using qrcode.js
    import('qrcode').then(QRCode => {
      QRCode.toCanvas(canvas, qrValue, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }, (error) => {
        if (error) {
          console.error('QR Code generation error:', error)
          return
        }
        
        const link = document.createElement('a')
        link.download = `table-${table.table_number}-qr.png`
        link.href = canvas.toDataURL()
        link.click()
      })
    })
  }

  const handleAddTable = async () => {
    if (!newTable.table_number || !newTable.location) {
      return
    }
    
    try {
      setIsSubmitting(true)
      
      // Call parent's onAddTable function which handles the API call
      await onAddTable?.(newTable)
      
      // Reset form and close modal
      setNewTable({ table_number: '', capacity: 2, location: '' })
      setShowAddModal(false)
    } catch (err) {
      console.error('Error adding table:', err)
      setError('Failed to add table. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateTable = (tableId, updates) => {
    onUpdateTable?.(tableId, updates)
  }

  const handleDeleteTable = (tableId) => {
    onDeleteTable?.(tableId)
  }



  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900">Table Management</h2>
            <p className="text-neutral-600 text-sm mt-1">Manage your restaurant tables and track reservations</p>
            {tablesWithStatus.length > 0 && (
              <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                <span>{tablesWithStatus.length} total tables</span>
                <span>{tablesWithStatus.filter(t => t.is_active).length} active</span>
                <span className="text-green-600">{tablesWithStatus.filter(t => t.reservation_status === 'available').length} available</span>
                <span className="text-orange-600">{tablesWithStatus.filter(t => t.reservation_status === 'reserved').length} reserved</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRefreshTables}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            {error && (
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-3 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors font-medium text-sm"
              >
                <ArrowPathIcon className="h-4 w-4" />
                Retry
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm sm:text-base"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add Table</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 md:p-6">
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-900">Error Loading Tables</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-neutral-600">Loading tables...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl p-8 shadow-sm border border-neutral-200">
          <div className="text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">Error Loading Tables</h3>
            <p className="text-neutral-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      ) : tablesWithStatus.length === 0 ? (
        <div className="bg-white rounded-xl p-8 md:p-12 shadow-sm border border-neutral-200 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TableCellsIcon className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">No Tables Yet</h3>
            <p className="text-neutral-600 mb-6">Get started by adding your first table. You can generate QR codes for each table to streamline customer ordering.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Add Your First Table
            </button>
          </div>
        </div>
      ) : (
        /* Tables Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <AnimatePresence>
            {tablesWithStatus.map((table, index) => (
              <motion.div
                key={table.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`p-2 sm:p-3 rounded-xl flex-shrink-0 ${table.is_active ? 'bg-green-100' : 'bg-neutral-100'}`}>
                      <TableCellsIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${table.is_active ? 'text-green-600' : 'text-neutral-400'}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-base sm:text-lg text-neutral-900 truncate">{table.table_number}</h3>
                      <p className="text-xs sm:text-sm text-neutral-500">{table.capacity} seats</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditingTable(table)}
                      className="p-1.5 sm:p-2 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-1.5 sm:p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Location</span>
                    <p className="text-sm text-neutral-700 mt-1 break-words">{table.location}</p>
                  </div>
                  
                  {/* Reservation Status */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${getTableStatusColor(table.reservation_status)}`}>
                        {getTableStatusIcon(table.reservation_status)}
                        {table.reservation_status === 'available' ? 'Available' : 'Reserved'}
                      </span>
                      
                      <button
                        onClick={() => handleUpdateTable(table.id, { is_active: !table.is_active })}
                        className={`px-2 sm:px-3 py-1 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                          table.is_active 
                            ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' 
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {table.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>

                    {/* Customer Information for Reserved Tables */}
                    {table.current_session && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-orange-800 uppercase tracking-wide">Current Customer</span>
                          <button
                            onClick={() => {
                              setSelectedTableDetails(table)
                              setShowTableDetails(true)
                            }}
                            className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                          >
                            View Details
                          </button>
                        </div>
                        <div className="space-y-1">
                          {table.current_session.customer_name && (
                            <div className="flex items-center gap-2 text-sm">
                              <UserIcon className="h-3 w-3 text-orange-600" />
                              <span className="text-orange-800">{table.current_session.customer_name}</span>
                            </div>
                          )}
                          {table.current_session.customer_phone && (
                            <div className="flex items-center gap-2 text-sm">
                              <PhoneIcon className="h-3 w-3 text-orange-600" />
                              <span className="text-orange-800">{table.current_session.customer_phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-xs">
                            <ClockIcon className="h-3 w-3 text-orange-600" />
                            <span className="text-orange-700">
                              Reserved {new Date(table.current_session.started_at).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Actions */}
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedTable(table)
                        setShowQRModal(true)
                      }}
                      className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="hidden sm:inline">View QR</span>
                      <span className="sm:hidden">View</span>
                    </button>
                    <button
                      onClick={() => downloadQR(table)}
                      className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="hidden sm:inline">Download</span>
                      <span className="sm:hidden">Save</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Add New Table</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Table Number</label>
                <input
                  type="text"
                  value={newTable.table_number}
                  onChange={(e) => setNewTable({ ...newTable, table_number: e.target.value })}
                  placeholder="e.g., T005"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Capacity</label>
                <select
                  value={newTable.capacity}
                  onChange={(e) => setNewTable({ ...newTable, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num} seats</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newTable.location}
                  onChange={(e) => setNewTable({ ...newTable, location: e.target.value })}
                  placeholder="e.g., Ground Floor - Window Side"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
            </div>
            
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTable}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
                >
                  {isSubmitting && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
                  {isSubmitting ? 'Adding...' : 'Add Table'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">QR Code - {selectedTable.table_number}</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 text-center space-y-4 flex-1 overflow-y-auto">
              <div className="bg-neutral-50 p-4 sm:p-6 rounded-xl">
                <QRCodeSVG
                  value={generateQRValue(selectedTable.id, selectedTable.table_number)}
                  size={200}
                  level="M"
                  includeMargin={true}
                  className="mx-auto"
                />
              </div>
              
              <div className="text-sm text-neutral-600 space-y-1">
                <p className="font-medium text-neutral-900">Table: {selectedTable.table_number}</p>
                <p>Capacity: {selectedTable.capacity} seats</p>
                <p className="break-words">Location: {selectedTable.location}</p>
                <p className="text-xs text-neutral-500 mt-2">Scan to view menu and place orders</p>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => downloadQR(selectedTable)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {editingTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Edit Table</h3>
                <button
                  onClick={() => setEditingTable(null)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Table Number</label>
                <input
                  type="text"
                  value={editingTable.table_number}
                  onChange={(e) => setEditingTable({ ...editingTable, table_number: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., T005"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Capacity</label>
                <select
                  value={editingTable.capacity}
                  onChange={(e) => setEditingTable({ ...editingTable, capacity: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(num => (
                    <option key={num} value={num}>{num} seats</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Location</label>
                <input
                  type="text"
                  value={editingTable.location}
                  onChange={(e) => setEditingTable({ ...editingTable, location: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="e.g., Ground Floor - Window Side"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={editingTable.is_active}
                      onChange={() => setEditingTable({ ...editingTable, is_active: true })}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-neutral-700">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={!editingTable.is_active}
                      onChange={() => setEditingTable({ ...editingTable, is_active: false })}
                      className="text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm text-neutral-700">Inactive</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingTable(null)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUpdateTable(editingTable.id, editingTable)
                    setEditingTable(null)
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Details Modal */}
      {showTableDetails && selectedTableDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">
                  Table {selectedTableDetails.table_number} Details
                </h3>
                <button
                  onClick={() => setShowTableDetails(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className="space-y-6">
                {/* Table Information */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 mb-3">Table Information</h4>
                  <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600">Capacity:</span>
                      <span className="text-sm font-medium text-neutral-900">
                        {selectedTableDetails.capacity} seats
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600">Location:</span>
                      <span className="text-sm font-medium text-neutral-900">
                        {selectedTableDetails.location}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-neutral-600">Status:</span>
                      <span className={`text-sm font-medium px-2 py-1 rounded-full ${getTableStatusColor(selectedTableDetails.reservation_status)}`}>
                        {selectedTableDetails.reservation_status === 'available' ? 'Available' : 'Reserved'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Current Reservation */}
                {selectedTableDetails.current_session && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 mb-3">Current Reservation</h4>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                      {selectedTableDetails.current_session.customer_name && (
                        <div className="flex items-center gap-3">
                          <UserIcon className="h-5 w-5 text-orange-600" />
                          <div>
                            <span className="text-sm text-neutral-600">Customer Name:</span>
                            <p className="font-medium text-neutral-900">
                              {selectedTableDetails.current_session.customer_name}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedTableDetails.current_session.customer_phone && (
                        <div className="flex items-center gap-3">
                          <PhoneIcon className="h-5 w-5 text-orange-600" />
                          <div>
                            <span className="text-sm text-neutral-600">Phone:</span>
                            <p className="font-medium text-neutral-900">
                              {selectedTableDetails.current_session.customer_phone}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedTableDetails.current_session.customer_email && (
                        <div className="flex items-center gap-3">
                          <UserIcon className="h-5 w-5 text-orange-600" />
                          <div>
                            <span className="text-sm text-neutral-600">Email:</span>
                            <p className="font-medium text-neutral-900">
                              {selectedTableDetails.current_session.customer_email}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3">
                        <ClockIcon className="h-5 w-5 text-orange-600" />
                        <div>
                          <span className="text-sm text-neutral-600">Reserved At:</span>
                          <p className="font-medium text-neutral-900">
                            {new Date(selectedTableDetails.current_session.started_at).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <UserGroupIcon className="h-5 w-5 text-orange-600" />
                        <div>
                          <span className="text-sm text-neutral-600">Reservation Type:</span>
                          <p className="font-medium text-neutral-900">
                            {selectedTableDetails.current_session.session_id.startsWith('staff_') ? 'Staff Assisted' : 'Customer QR Scan'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code Section */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-900 mb-3">QR Code</h4>
                  <div className="bg-neutral-50 rounded-lg p-4 text-center">
                    <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                      <QRCodeSVG
                        value={generateQRValue(selectedTableDetails.id, selectedTableDetails.table_number)}
                        size={120}
                        level="M"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-xs text-neutral-600 mt-2">
                      Customers can scan this QR code to access the menu
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTableDetails(false)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  Close
                </button>
                {selectedTableDetails.current_session && (
                  <button
                    onClick={() => handleReleaseTable(selectedTableDetails.id, selectedTableDetails.current_session.session_id)}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Release Table
                  </button>
                )}
                <button
                  onClick={() => downloadQR(selectedTableDetails)}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Download QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TablesTab
