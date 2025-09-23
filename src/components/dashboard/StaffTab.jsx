import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  PhoneIcon,
  EnvelopeIcon,
  StarIcon
} from '@heroicons/react/24/outline'

const StaffTab = ({ staff, onAddStaff, onUpdateStaff, onDeleteStaff }) => {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [newStaff, setNewStaff] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    hourly_rate: ''
  })

  const handleAddStaff = () => {
    if (newStaff.full_name && newStaff.email && newStaff.position) {
      const staffMember = {
        id: Date.now(),
        ...newStaff,
        is_available: true,
        total_orders_completed: 0,
        total_tips_received: 0,
        performance_rating: 5.0,
        users: {
          full_name: newStaff.full_name,
          email: newStaff.email,
          phone: newStaff.phone
        }
      }
      onAddStaff?.(staffMember)
      setNewStaff({ full_name: '', email: '', phone: '', position: '', hourly_rate: '' })
      setShowAddModal(false)
    }
  }

  const handleUpdateStaff = (staffId, updates) => {
    onUpdateStaff?.(staffId, updates)
  }

  const handleDeleteStaff = (staffId) => {
    if (window.confirm('Are you sure you want to remove this staff member?')) {
      onDeleteStaff?.(staffId)
    }
  }

  const getStatusColor = (isAvailable) => {
    return isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Staff Management</h2>
            <p className="text-neutral-600 text-sm mt-1">Manage your restaurant staff and their performance</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            <PlusIcon className="h-4 w-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {staff.length > 0 ? staff.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow"
          >
            {/* Staff Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${member.is_available ? 'bg-green-100' : 'bg-neutral-100'}`}>
                  <UsersIcon className={`h-6 w-6 ${member.is_available ? 'text-green-600' : 'text-neutral-400'}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-neutral-900 truncate">
                    {member.users?.full_name || member.full_name || member.name || 'Staff Member'}
                  </h3>
                  <p className="text-sm text-neutral-600">{member.position}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditingStaff(member)}
                  className="p-2 text-neutral-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteStaff(member.id)}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 mb-4">
              {(member.users?.email || member.email) && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <EnvelopeIcon className="h-4 w-4" />
                  <span className="truncate">{member.users?.email || member.email}</span>
                </div>
              )}
              {(member.users?.phone || member.phone) && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <PhoneIcon className="h-4 w-4" />
                  <span>{member.users?.phone || member.phone}</span>
                </div>
              )}
            </div>

            {/* Performance Stats */}
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Orders Completed:</span>
                <span className="font-medium">{member.total_orders_completed || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Tips Received:</span>
                <span className="font-medium text-green-600">₹{member.total_tips_received || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Rating:</span>
                <div className="flex items-center gap-1">
                  <span className="font-medium">{(member.performance_rating || 5.0).toFixed(1)}</span>
                  <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                </div>
              </div>
            </div>

            {/* Status and Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-200">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.is_available)}`}>
                {member.is_available ? 'Available' : 'Busy'}
              </span>
              
              <button
                onClick={() => handleUpdateStaff(member.id, { is_available: !member.is_available })}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  member.is_available 
                    ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
              >
                {member.is_available ? 'Set Busy' : 'Set Available'}
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full bg-white rounded-xl p-8 md:p-12 shadow-sm border border-neutral-200 text-center">
            <UsersIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Staff Members</h3>
            <p className="text-neutral-500 mb-4">Add your first staff member to get started.</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Staff Member
            </button>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Add Staff Member</h3>
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={newStaff.full_name}
                  onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  placeholder="Enter phone number"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Position</label>
                <select
                  value={newStaff.position}
                  onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select position</option>
                  <option value="Waiter">Waiter</option>
                  <option value="Chef">Chef</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                  <option value="Kitchen Helper">Kitchen Helper</option>
                  <option value="Cleaner">Cleaner</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Hourly Rate (₹)</label>
                <input
                  type="number"
                  value={newStaff.hourly_rate}
                  onChange={(e) => setNewStaff({ ...newStaff, hourly_rate: e.target.value })}
                  placeholder="Enter hourly rate"
                  min="0"
                  step="0.01"
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
                  onClick={handleAddStaff}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Add Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Edit Staff Member</h3>
                <button
                  onClick={() => setEditingStaff(null)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={editingStaff.users?.full_name || ''}
                  onChange={(e) => setEditingStaff({ 
                    ...editingStaff, 
                    users: { ...editingStaff.users, full_name: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editingStaff.users?.email || ''}
                  onChange={(e) => setEditingStaff({ 
                    ...editingStaff, 
                    users: { ...editingStaff.users, email: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editingStaff.users?.phone || ''}
                  onChange={(e) => setEditingStaff({ 
                    ...editingStaff, 
                    users: { ...editingStaff.users, phone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Position</label>
                <select
                  value={editingStaff.position}
                  onChange={(e) => setEditingStaff({ ...editingStaff, position: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="Waiter">Waiter</option>
                  <option value="Chef">Chef</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Manager">Manager</option>
                  <option value="Kitchen Helper">Kitchen Helper</option>
                  <option value="Cleaner">Cleaner</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Hourly Rate (₹)</label>
                <input
                  type="number"
                  value={editingStaff.hourly_rate || ''}
                  onChange={(e) => setEditingStaff({ ...editingStaff, hourly_rate: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
            </div>
            
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingStaff(null)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUpdateStaff(editingStaff.id, editingStaff)
                    setEditingStaff(null)
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

export default StaffTab
