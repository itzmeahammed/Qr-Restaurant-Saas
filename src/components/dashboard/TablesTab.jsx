import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon,
  QrCodeIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  TableCellsIcon
} from '@heroicons/react/24/outline'

const TablesTab = ({ restaurant, onAddTable, onUpdateTable, onDeleteTable }) => {
  const [tables, setTables] = useState([
    { id: 1, table_number: 'T001', capacity: 4, is_active: true, location: 'Ground Floor - Window Side' },
    { id: 2, table_number: 'T002', capacity: 2, is_active: true, location: 'Ground Floor - Center' },
    { id: 3, table_number: 'T003', capacity: 6, is_active: false, location: 'First Floor - Corner' },
    { id: 4, table_number: 'T004', capacity: 4, is_active: true, location: 'Ground Floor - Near Bar' }
  ])
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [selectedTable, setSelectedTable] = useState(null)
  const [editingTable, setEditingTable] = useState(null)
  const [newTable, setNewTable] = useState({ table_number: '', capacity: 2, location: '' })
  const qrRef = useRef()

  // Generate QR Code (Simple implementation - in production use a proper QR library)
  const generateQRCode = (tableId, tableNumber) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 300
    canvas.height = 300
    
    // Background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 300, 300)
    
    // QR Pattern (simplified)
    ctx.fillStyle = '#000000'
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(i * 20, j * 20, 18, 18)
        }
      }
    }
    
    // Center logo area
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(120, 120, 60, 60)
    ctx.fillStyle = '#f97316'
    ctx.fillRect(125, 125, 50, 50)
    
    // Text
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`Table ${tableNumber}`, 150, 280)
    
    return canvas.toDataURL()
  }

  const downloadQR = (table) => {
    const qrDataUrl = generateQRCode(table.id, table.table_number)
    const link = document.createElement('a')
    link.download = `table-${table.table_number}-qr.png`
    link.href = qrDataUrl
    link.click()
  }

  const handleAddTable = () => {
    if (newTable.table_number && newTable.location) {
      const table = {
        id: Date.now(),
        ...newTable,
        is_active: true
      }
      setTables([...tables, table])
      setNewTable({ table_number: '', capacity: 2, location: '' })
      setShowAddModal(false)
      onAddTable?.(table)
    }
  }

  const handleUpdateTable = (tableId, updates) => {
    setTables(tables.map(table => 
      table.id === tableId ? { ...table, ...updates } : table
    ))
    onUpdateTable?.(tableId, updates)
  }

  const handleDeleteTable = (tableId) => {
    setTables(tables.filter(table => table.id !== tableId))
    onDeleteTable?.(tableId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Table Management</h2>
            <p className="text-neutral-600 text-sm mt-1">Manage your restaurant tables and generate QR codes</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            Add Table
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {tables.map((table, index) => (
          <motion.div
            key={table.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${table.is_active ? 'bg-green-100' : 'bg-neutral-100'}`}>
                  <TableCellsIcon className={`h-6 w-6 ${table.is_active ? 'text-green-600' : 'text-neutral-400'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-neutral-900">{table.table_number}</h3>
                  <p className="text-sm text-neutral-500">{table.capacity} seats</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingTable(table)}
                  className="p-2 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-neutral-500">Location</span>
                <p className="text-sm text-neutral-700">{table.location}</p>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  table.is_active ? 'bg-green-100 text-green-800' : 'bg-neutral-100 text-neutral-600'
                }`}>
                  {table.is_active ? 'Active' : 'Inactive'}
                </span>
                
                <button
                  onClick={() => handleUpdateTable(table.id, { is_active: !table.is_active })}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
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
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <EyeIcon className="h-4 w-4" />
                  View QR
                </button>
                <button
                  onClick={() => downloadQR(table)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Table Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900">Add New Table</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
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
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddTable}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add Table
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900">QR Code - {selectedTable.table_number}</h3>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 text-center space-y-4">
              <div className="bg-neutral-50 p-6 rounded-xl">
                <img
                  ref={qrRef}
                  src={generateQRCode(selectedTable.id, selectedTable.table_number)}
                  alt={`QR Code for ${selectedTable.table_number}`}
                  className="mx-auto w-64 h-64"
                />
              </div>
              
              <div className="text-sm text-neutral-600">
                <p className="font-medium">Table: {selectedTable.table_number}</p>
                <p>Capacity: {selectedTable.capacity} seats</p>
                <p>Location: {selectedTable.location}</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => downloadQR(selectedTable)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  <ArrowDownTrayIcon className="h-4 w-4" />
                  Download QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Table Modal */}
      {editingTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900">Edit Table</h3>
                <button
                  onClick={() => setEditingTable(null)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Table Number</label>
                <input
                  type="text"
                  value={editingTable.table_number}
                  onChange={(e) => setEditingTable({ ...editingTable, table_number: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Capacity</label>
                <select
                  value={editingTable.capacity}
                  onChange={(e) => setEditingTable({ ...editingTable, capacity: parseInt(e.target.value) })}
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
                  value={editingTable.location}
                  onChange={(e) => setEditingTable({ ...editingTable, location: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingTable(null)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUpdateTable(editingTable.id, editingTable)
                    setEditingTable(null)
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
