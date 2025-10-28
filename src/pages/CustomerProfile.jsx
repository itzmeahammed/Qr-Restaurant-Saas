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
  BellIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import CustomerNavHeader from '../components/customer/CustomerNavHeader'
import MobileMenu from '../components/customer/MobileMenu'
import { useCustomerNavigation } from '../contexts/CustomerNavigationContext'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

// Brand colors
const BRAND_LIME = '#C6FF3D'
const BRAND_BLACK = '#2D2D2D'

const CustomerProfile = () => {
  const navigate = useNavigate()
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
    <div className="min-h-screen" style={{ backgroundColor: BRAND_LIME }}>
      {/* Playful Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-20 right-10 w-32 h-32 rounded-full border-4 border-black/5"
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-32 left-10 w-24 h-24 rounded-full bg-black/5"
          animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Dot Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%232D2D2D'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-black border-b-4 border-black"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.1, rotate: -10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/customer')}
              className="w-12 h-12 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(198,255,61,1)] hover:shadow-[4px_4px_0_0_rgba(198,255,61,1)] transition-all"
            >
              <ArrowLeftIcon className="w-5 h-5 text-black" />
            </motion.button>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            >
              <img src={logo} alt="Ordyrr" className="h-10 w-auto" />
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(true)}
              className="w-12 h-12 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(198,255,61,1)] hover:shadow-[4px_4px_0_0_rgba(198,255,61,1)] transition-all"
            >
              <CogIcon className="w-5 h-5 text-black" />
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      <div className="relative z-10 p-4 space-y-4 max-w-4xl mx-auto">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)]"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-black" 
              style={{ backgroundColor: BRAND_LIME }}
            >
              <UserIcon className="w-10 h-10 text-black" />
            </motion.div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-black tracking-tight mb-1">{formData.name.toUpperCase()}</h2>
              <p className="text-black/70 font-bold text-sm mb-2">{formData.email}</p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border-3 border-black" style={{ backgroundColor: BRAND_LIME }}>
                <StarIcon className="w-4 h-4 text-black fill-current" />
                <span className="text-xs font-black text-black">PREMIUM MEMBER</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-6 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] text-center cursor-pointer"
            onClick={() => window.location.href = '/customer-orders'}
          >
            <ClockIcon className="w-12 h-12 text-black mx-auto mb-3" />
            <p className="text-4xl font-black text-black mb-1">12</p>
            <p className="text-sm font-black text-black/70">ORDERS</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-2xl p-6 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] text-center cursor-pointer"
            onClick={() => window.location.href = '/customer-favorites'}
          >
            <HeartIcon className="w-12 h-12 text-black mx-auto mb-3" />
            <p className="text-4xl font-black text-black mb-1">5</p>
            <p className="text-sm font-black text-black/70">FAVORITES</p>
          </motion.div>
        </div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden"
        >
          <div className="px-6 py-4 border-b-4 border-black">
            <h3 className="text-xl font-black text-black">PROFILE INFORMATION</h3>
            <p className="text-sm font-bold text-black/70">Update your personal details</p>
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
          className="bg-white rounded-2xl border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden"
        >
          <div className="px-6 py-4 border-b-4 border-black">
            <h3 className="text-xl font-black text-black">PREFERENCES</h3>
            <p className="text-sm font-bold text-black/70">Manage your notification settings</p>
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
          className="bg-white rounded-2xl border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden"
        >
          <div className="px-6 py-4 border-b-4 border-black">
            <h3 className="text-xl font-black text-black">QUICK ACTIONS</h3>
          </div>
          
          <div className="p-4 space-y-2">
            <motion.button
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/customer-orders'}
              className="w-full p-4 flex items-center gap-3 text-left rounded-xl border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
              style={{ backgroundColor: BRAND_LIME }}
            >
              <ClockIcon className="w-6 h-6 text-black" />
              <div className="flex-1">
                <p className="font-black text-black">MY ORDERS</p>
                <p className="text-xs font-bold text-black/70">View order history</p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/customer-favorites'}
              className="w-full p-4 flex items-center gap-3 text-left rounded-xl border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
              style={{ backgroundColor: BRAND_LIME }}
            >
              <HeartIcon className="w-6 h-6 text-black" />
              <div className="flex-1">
                <p className="font-black text-black">FAVORITES</p>
                <p className="text-xs font-bold text-black/70">Your favorite restaurants</p>
              </div>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => window.location.href = '/customer-settings'}
              className="w-full p-4 flex items-center gap-3 text-left rounded-xl border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
              style={{ backgroundColor: BRAND_LIME }}
            >
              <CogIcon className="w-6 h-6 text-black" />
              <div className="flex-1">
                <p className="font-black text-black">SETTINGS</p>
                <p className="text-xs font-bold text-black/70">App preferences</p>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-500 text-white rounded-2xl border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] hover:shadow-[8px_8px_0_0_rgba(0,0,0,1)] transition-all font-black"
        >
          <ArrowRightOnRectangleIcon className="w-6 h-6" />
          <span>SIGN OUT</span>
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
