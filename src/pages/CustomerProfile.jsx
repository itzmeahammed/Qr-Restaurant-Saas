import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  HeartIcon,
  ClockIcon,
  CogIcon,
  ArrowRightOnRectangleIcon,
  StarIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  BellIcon
} from '@heroicons/react/24/outline'
import CustomerNavHeader from '../components/customer/CustomerNavHeader'
import MobileMenu from '../components/customer/MobileMenu'
import { useCustomerNavigation } from '../contexts/CustomerNavigationContext'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

const CustomerProfile = () => {
  const { currentUser, signOut } = useCustomerNavigation()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [formData, setFormData] = useState({
    name: 'Ahammed S',
    email: 'sumaiya27khan@gmail.com',
    phone: '+91 9876543210',
    notifications: true,
    emailPreferences: true
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || 'Ahammed S',
        email: currentUser.email || 'sumaiya27khan@gmail.com',
        phone: currentUser.phone || '+91 9876543210',
        notifications: currentUser.notifications !== false,
        emailPreferences: currentUser.emailPreferences !== false
      })
    }
  }, [currentUser])

  const handleSaveField = async (field) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          [field]: formData[field]
        }
      })

      if (error) throw error

      toast.success(`✅ ${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully`)
      setEditingField(null)
    } catch (error) {
      toast.error(`❌ Failed to update ${field}`)
      console.error('Update error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePreference = async (field) => {
    const newValue = !formData[field]
    setFormData(prev => ({ ...prev, [field]: newValue }))
    
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          [field]: newValue
        }
      })

      if (error) throw error

      toast.success(`${field === 'notifications' ? '🔔' : '📧'} ${field.charAt(0).toUpperCase() + field.slice(1)} ${newValue ? 'enabled' : 'disabled'}`)
    } catch (error) {
      toast.error(`❌ Failed to update ${field}`)
      setFormData(prev => ({ ...prev, [field]: !newValue }))
    }
  }

  const handleSignOut = () => {
    signOut()
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavHeader 
          title="Profile" 
          showBackButton={true}
          showMenu={true}
          onMenuClick={() => setShowMobileMenu(true)}
        />
        <div className="p-4">
          <div className="text-center py-12">
            <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Not Signed In</h2>
            <p className="text-gray-600">Please sign in to view your profile</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavHeader 
        title="Profile" 
        showBackButton={true}
        showMenu={true}
        onMenuClick={() => setShowMobileMenu(true)}
      />
      
      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{currentUser.name}</h1>
              <p className="text-gray-600">{currentUser.email}</p>
              <div className="flex items-center gap-1 mt-1">
                <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-500">Customer since 2024</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-4 shadow-sm text-center"
          >
            <ClockIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">12</p>
            <p className="text-sm text-gray-600">Orders</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 shadow-sm text-center"
          >
            <HeartIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">5</p>
            <p className="text-sm text-gray-600">Favorites</p>
          </motion.div>
        </div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Profile Information</h3>
            <p className="text-sm text-gray-600">Update your personal details</p>
          </div>
          
          {/* Editable Fields */}
          <div className="divide-y divide-gray-100">
            {/* Name Field */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <UserIcon className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Full Name</p>
                    {editingField === 'name' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                          placeholder="Enter full name"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSaveField('name')}
                          disabled={loading}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingField(null)}
                          className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    ) : (
                      <p className="text-gray-900 mt-1">{formData.name}</p>
                    )}
                  </div>
                </div>
                {editingField !== 'name' && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingField('name')}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-all"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <EnvelopeIcon className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Email Address</p>
                    {editingField === 'email' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                          placeholder="Enter email address"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSaveField('email')}
                          disabled={loading}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingField(null)}
                          className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    ) : (
                      <p className="text-gray-900 mt-1">{formData.email}</p>
                    )}
                  </div>
                </div>
                {editingField !== 'email' && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingField('email')}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-all"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Phone Field */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <PhoneIcon className="w-5 h-5 text-gray-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Phone Number</p>
                    {editingField === 'phone' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-black"
                          placeholder="Enter phone number"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleSaveField('phone')}
                          disabled={loading}
                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setEditingField(null)}
                          className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </motion.button>
                      </div>
                    ) : (
                      <p className="text-gray-900 mt-1">{formData.phone}</p>
                    )}
                  </div>
                </div>
                {editingField !== 'phone' && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditingField('phone')}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-all"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Preferences</h3>
            <p className="text-sm text-gray-600">Manage your notification settings</p>
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* Notifications Toggle */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BellIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Push Notifications</p>
                    <p className="text-xs text-gray-500">
                      {formData.notifications ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTogglePreference('notifications')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.notifications ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.notifications ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </motion.button>
              </div>
            </div>

            {/* Email Preferences Toggle */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <EnvelopeIcon className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email Preferences</p>
                    <p className="text-xs text-gray-500">
                      {formData.emailPreferences ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTogglePreference('emailPreferences')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.emailPreferences ? 'bg-black' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.emailPreferences ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
          </div>
          
          <div className="divide-y divide-gray-100">
            <motion.button
              whileHover={{ backgroundColor: '#f9fafb' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/customer-orders'}
              className="w-full p-4 flex items-center gap-3 text-left transition-all"
            >
              <ClockIcon className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">My Orders</p>
                <p className="text-sm text-gray-500">View order history</p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ backgroundColor: '#f9fafb' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/customer-favorites'}
              className="w-full p-4 flex items-center gap-3 text-left transition-all"
            >
              <HeartIcon className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Favorites</p>
                <p className="text-sm text-gray-500">Your favorite restaurants</p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ backgroundColor: '#f9fafb' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/customer-settings'}
              className="w-full p-4 flex items-center gap-3 text-left transition-all"
            >
              <CogIcon className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">Settings</p>
                <p className="text-sm text-gray-500">App preferences</p>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-all font-semibold"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          <span>Sign Out</span>
        </motion.button>
      </div>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </div>
  )
}

export default CustomerProfile
