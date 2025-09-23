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
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

const TablesTab = ({ restaurant, tables = [], onAddTable, onUpdateTable, onDeleteTable }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [editingTable, setEditingTable] = useState(null)
  const [newTable, setNewTable] = useState({ table_number: '', capacity: 2, location: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const qrRef = useRef(null)
  
  // Tables are managed by parent component (OwnerDashboard)

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
            <p className="text-neutral-600 text-sm mt-1">Manage your restaurant tables and generate QR codes</p>
            {tables.length > 0 && (
              <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                <span>{tables.length} total tables</span>
                <span>{tables.filter(t => t.is_active).length} active</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
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

      {/* Empty State */}
      {!error && tables.length === 0 && (
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
      )}

      {/* Tables Grid */}
      {!error && tables.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <AnimatePresence>
            {tables.map((table, index) => (
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
                  
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                      table.is_active ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {table.is_active ? 'Active' : 'Inactive'}
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
    </div>
  )
}

export default TablesTab
