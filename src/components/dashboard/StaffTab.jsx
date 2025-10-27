import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'
import { useConfirmation } from '../../contexts/ConfirmationContext'
import { 
  PlusIcon,
  UsersIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  KeyIcon,
  CheckIcon,
  XMarkIcon,
  StarIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'

function StaffTab({ 
  staff = [], 
  onAddStaff, 
  onUpdateStaff, 
  onDeleteStaff,
  onCreateLoginForStaff,
  restaurant 
}) {
  const { showConfirmation } = useConfirmation()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState(null)
  const [loading, setLoading] = useState(false)
  const [emailChecking, setEmailChecking] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPosition, setFilterPosition] = useState('all')
  const [activeTab, setActiveTab] = useState('staff')
  const [applications, setApplications] = useState([])
  const [processingId, setProcessingId] = useState(null)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [applicationFilter, setApplicationFilter] = useState('all')
  const [showApplicationDetails, setShowApplicationDetails] = useState(false)
  const [applicationStats, setApplicationStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })
  const [currentSignupKey, setCurrentSignupKey] = useState(restaurant?.staff_signup_key || '')
  const [newStaff, setNewStaff] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    hourly_rate: '',
    password: '',
    emailVerified: false,
    emailExists: false
  })

  useEffect(() => {
    if (restaurant?.id && activeTab === 'applications') {
      fetchApplications()
    }
  }, [restaurant?.id, activeTab])

  useEffect(() => {
    if (restaurant?.staff_signup_key) {
      setCurrentSignupKey(restaurant.staff_signup_key)
    }
  }, [restaurant?.staff_signup_key])

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_applications')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('applied_at', { ascending: false })

      if (error) throw error
      
      const apps = data || []
      setApplications(apps)
      
      // Calculate stats
      setApplicationStats({
        total: apps.length,
        pending: apps.filter(app => app.status === 'pending').length,
        approved: apps.filter(app => app.status === 'approved').length,
        rejected: apps.filter(app => app.status === 'rejected').length
      })
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load staff applications')
    }
  }

  const generateSignupKey = async (isRegenerate = false) => {
    try {
      // Show confirmation for regeneration
      if (isRegenerate && restaurant?.staff_signup_key) {
        const confirmed = await showConfirmation({
          title: 'Regenerate Signup Key',
          message: '⚠️ Regenerating the key will invalidate the current key.\n\nStaff who have the old key will not be able to apply.\n\nAre you sure you want to continue?',
          type: 'warning',
          confirmText: 'Regenerate Key',
          cancelText: 'Cancel',
          confirmButtonColor: 'red'
        })
        if (!confirmed) return
      }

      const generateKey = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let key = ''
        for (let i = 0; i < 12; i++) {
          if (i === 4 || i === 8) key += '-'
          else key += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        return key
      }

      const newKey = generateKey()
      const { error } = await supabase
        .from('users')
        .update({ staff_signup_key: newKey })
        .eq('id', restaurant.id)
        .eq('role', 'restaurant_owner')

      if (error) throw error

      const message = isRegenerate 
        ? `🔄 Key regenerated successfully!\n\nNew Key: ${newKey}\n\n⚠️ Share this new key with staff`
        : `✅ Signup key generated!\n\nKey: ${newKey}\n\n📋 Share this with potential staff`

      toast.success(message, {
        duration: 8000,
        style: { maxWidth: '400px', whiteSpace: 'pre-line' }
      })

      // Update restaurant object and state for immediate UI update
      if (restaurant) {
        restaurant.staff_signup_key = newKey
      }
      setCurrentSignupKey(newKey)
    } catch (error) {
      console.error('Error generating signup key:', error)
      toast.error('Failed to generate signup key')
    }
  }

  const handleApproveApplication = async (application) => {
    try {
      setProcessingId(application.id)

      // Update application status
      const { error: updateError } = await supabase
        .from('staff_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: restaurant.owner_id
        })
        .eq('id', application.id)

      if (updateError) throw updateError

      // Create staff record
      const { error: staffError } = await supabase
        .from('staff')
        .insert({
          restaurant_id: restaurant.id,
          user_id: application.user_id,
          position: application.position,
          hourly_rate: application.hourly_rate || 0,
          is_available: true,
          application_id: application.id,
          approved_at: new Date().toISOString(),
          approved_by: restaurant.owner_id,
          hire_date: new Date().toISOString().split('T')[0]
        })

      if (staffError) throw staffError

      toast.success(`✅ ${application.full_name} approved!\n\n🎉 They can now login and access the staff dashboard.`, {
        duration: 6000,
        style: { maxWidth: '400px', whiteSpace: 'pre-line' }
      })
      fetchApplications()
      
      // Refresh staff list in parent component
      if (typeof window !== 'undefined') {
        window.location.reload()
      }

    } catch (error) {
      console.error('Error approving application:', error)
      toast.error('Failed to approve application')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRejectApplication = async (application) => {
    try {
      setProcessingId(application.id)

      const { error } = await supabase
        .from('staff_applications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: restaurant.owner_id
        })
        .eq('id', application.id)

      if (error) throw error

      toast.success(`Application from ${application.full_name} rejected`)
      fetchApplications()

    } catch (error) {
      console.error('Error rejecting application:', error)
      toast.error('Failed to reject application')
    } finally {
      setProcessingId(null)
    }
  }

  // Simple email validation - only check format during typing
  const validateEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Check if email exists in current staff list only
  const checkEmailInCurrentStaff = (email) => {
    return staff.some(member => 
      member.email?.toLowerCase() === email.toLowerCase()
    )
  }

  // Simple email checking using auth system
  const checkEmailExistsBeforeCreation = async (email) => {
    if (!email || !email.includes('@')) return false
    
    try {
      // First check current staff list
      const existsInStaff = checkEmailInCurrentStaff(email)
      if (existsInStaff) {
        return true
      }
      
      // Try a simple auth signup to check if email exists
      // This will fail if email is already registered
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: 'temp-check-password-' + Date.now(),
        options: {
          data: { 
            temp_check: true,
            created_at: new Date().toISOString()
          }
        }
      })
      
      // If signup fails with "User already registered", email exists
      if (error?.message?.includes('User already registered') || 
          error?.message?.includes('already been registered')) {
        return true
      }
      
      // If signup succeeded, we need to clean up the temp user
      if (data?.user && !error) {
        console.log('Temp user created for email check, should be cleaned up by email confirmation')
      }
      
      return false
    } catch (error) {
      console.warn('Email existence check failed:', error)
      return false
    }
  }

  // Enhanced staff creation with validation
  const handleAddStaff = async () => {
    setLoading(true)
    try {
      // Validate required fields
      if (!newStaff.full_name?.trim()) {
        toast.error('Please enter staff member name')
        return
      }
      if (!newStaff.email?.trim()) {
        toast.error('Please enter email address')
        return
      }
      if (!newStaff.position?.trim()) {
        toast.error('Please select a position')
        return
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newStaff.email)) {
        toast.error('Please enter a valid email address')
        return
      }
      
      // Check for duplicate email only when creating staff
      console.log('Checking if email exists before creation...')
      const emailExists = await checkEmailExistsBeforeCreation(newStaff.email)
      if (emailExists) {
        toast.error('This email is already registered. Please use a different email.')
        return
      }
      console.log('Email is available for use')
      
      // Validate phone number if provided
      if (newStaff.phone && !/^\+?[\d\s-()]{10,}$/.test(newStaff.phone)) {
        toast.error('Please enter a valid phone number')
        return
      }
      
      // Check restaurant staff limits (max 50 staff members)
      if (staff.length >= 50) {
        toast.error('Maximum staff limit reached (50 members). Please upgrade your plan.')
        return
      }
      
      console.log('Creating staff with enhanced validation:', newStaff)
      
      // Pass the staff data to parent handler
      await onAddStaff?.(newStaff)
      
      // Reset form and close modal
      setNewStaff({
        full_name: '',
        email: '',
        phone: '',
        position: '',
        hourly_rate: '',
        password: '',
        emailVerified: false,
        emailExists: false
      })
      setShowAddModal(false)
      
    } catch (error) {
      console.error('Error in handleAddStaff:', error)
      toast.error('Failed to create staff member')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStaff = (staffId, updates) => {
    onUpdateStaff?.(staffId, updates)
  }

  const handleDeleteStaff = async (staffId) => {
    const confirmed = await showConfirmation({
      title: 'Remove Staff Member',
      message: 'Are you sure you want to remove this staff member?\n\nThis action cannot be undone.',
      type: 'warning',
      confirmText: 'Remove Staff',
      cancelText: 'Cancel',
      confirmButtonColor: 'red'
    })
    
    if (confirmed) {
      onDeleteStaff?.(staffId)
    }
  }

  const getStatusColor = (isAvailable) => {
    return isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }

  // Enhanced filtering and search
  const filteredStaff = staff.filter(member => {
    const matchesSearch = !searchTerm || 
      member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterPosition === 'all' || member.position === filterPosition
    
    return matchesSearch && matchesFilter
  })

  const positions = ['Waiter', 'Chef', 'Cashier', 'Manager', 'Kitchen Helper', 'Cleaner']
  const staffStats = {
    total: staff.length,
    active: staff.filter(s => s.is_available).length,
    withLogin: staff.filter(s => s.user_id).length
  }

  const pendingCount = applications.filter(app => app.status === 'pending').length

  // Filter applications based on selected filter
  const filteredApplications = applications.filter(app => {
    if (applicationFilter === 'all') return true
    return app.status === applicationFilter
  })

  // Quick actions for applications
  const handleQuickApproveAll = async () => {
    const pendingApps = applications.filter(app => app.status === 'pending')
    if (pendingApps.length === 0) {
      toast.error('No pending applications to approve')
      return
    }

    const confirmed = await showConfirmation({
      title: 'Approve All Applications',
      message: `🚀 Approve all ${pendingApps.length} pending applications?\n\nThis will create staff accounts for all applicants.`,
      type: 'info',
      confirmText: `Approve All (${pendingApps.length})`,
      cancelText: 'Cancel',
      confirmButtonColor: 'green'
    })
    
    if (!confirmed) return

    for (const app of pendingApps) {
      await handleApproveApplication(app)
    }
  }

  const handleBulkReject = async () => {
    const pendingApps = applications.filter(app => app.status === 'pending')
    if (pendingApps.length === 0) {
      toast.error('No pending applications to reject')
      return
    }

    const confirmed = await showConfirmation({
      title: 'Reject All Applications',
      message: `❌ Reject all ${pendingApps.length} pending applications?\n\nThis action cannot be undone.`,
      type: 'error',
      confirmText: `Reject All (${pendingApps.length})`,
      cancelText: 'Cancel',
      confirmButtonColor: 'red'
    })
    
    if (!confirmed) return

    for (const app of pendingApps) {
      await handleRejectApplication(app)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'staff'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            <UsersIcon className="w-5 h-5" />
            Staff ({staff.length})
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'applications'
                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md'
                : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50'
            }`}
          >
            <BellIcon className="w-5 h-5" />
            Applications
            {pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Staff Tab Content */}
      {activeTab === 'staff' && (
        <>
          {/* Enhanced Header with Stats */}
          <div className="bg-gradient-to-r from-white via-orange-50/30 to-white rounded-2xl p-6 shadow-sm border border-orange-100">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg">
              <UsersIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
              <p className="text-gray-600 mt-1">Create and manage your restaurant team</p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="flex gap-4">
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-gray-900">{staffStats.total}</div>
              <div className="text-xs text-gray-500">Total Staff</div>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-green-600">{staffStats.active}</div>
              <div className="text-xs text-gray-500">Available</div>
            </div>
            <div className="bg-white rounded-xl px-4 py-3 border border-gray-200 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">{staffStats.withLogin}</div>
              <div className="text-xs text-gray-500">With Login</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            {/* Filter */}
            <div className="relative">
              <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              >
                <option value="all">All Positions</option>
                {positions.map(position => (
                  <option key={position} value={position}>{position}</option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Add Staff Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            <PlusIcon className="h-5 w-5" />
            Add Staff Member
          </motion.button>
        </div>
      </div>

      {/* Enhanced Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredStaff.length > 0 ? filteredStaff.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-lg hover:border-orange-200 transition-all duration-300"
          >
            {/* Enhanced Staff Header */}
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className={`p-3 rounded-2xl shadow-md ${member.is_available ? 'bg-gradient-to-br from-green-400 to-green-500' : 'bg-gradient-to-br from-gray-400 to-gray-500'}`}>
                    <UsersIcon className="h-7 w-7 text-white" />
                  </div>
                  {member.user_id && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full flex items-center justify-center">
                      <ShieldCheckIcon className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 text-lg truncate">
                    {member.full_name || member.users?.full_name || member.name || 'Staff Member'}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-gray-600">{member.position}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">ID: {member.id.slice(-4)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!member.user_id && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      const email = prompt('Enter email for login account:')
                      if (email) {
                        onCreateLoginForStaff?.(member.id, email, member.full_name, member.phone)
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-xl transition-colors"
                    title="Create login account"
                  >
                    <KeyIcon className="h-4 w-4" />
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setEditingStaff(member)}
                  className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-colors"
                >
                  <PencilIcon className="h-4 w-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDeleteStaff(member.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            {/* Enhanced Contact Info */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <div className="space-y-3">
                {(member.email || member.users?.email) ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <EnvelopeIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                      <p className="text-sm font-medium text-gray-900 truncate">{member.email || member.users?.email}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <EnvelopeIcon className="h-4 w-4" />
                    </div>
                    <span className="text-sm">No email available</span>
                  </div>
                )}
                
                {(member.phone || member.users?.phone) ? (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <PhoneIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{member.phone || member.users?.phone}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <PhoneIcon className="h-4 w-4" />
                    </div>
                    <span className="text-sm">No phone available</span>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Performance Stats */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{member.total_orders_completed || 0}</div>
                <div className="text-xs text-gray-500">Orders</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">₹{member.total_tips_received || 0}</div>
                <div className="text-xs text-gray-500">Tips</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-lg font-bold text-yellow-600">{(member.performance_rating || 5.0).toFixed(1)}</span>
                  <StarIcon className="h-4 w-4 text-yellow-500 fill-current" />
                </div>
                <div className="text-xs text-gray-500">Rating</div>
              </div>
            </div>

            {/* Enhanced Status and Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${member.is_available ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.is_available)}`}>
                  {member.is_available ? 'Available' : 'Busy'}
                </span>
                {member.user_id && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    Login Enabled
                  </span>
                )}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleUpdateStaff(member.id, { is_available: !member.is_available })}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  member.is_available 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 hover:shadow-md' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200 hover:shadow-md'
                }`}
              >
                {member.is_available ? 'Set Busy' : 'Set Available'}
              </motion.button>
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-12 text-center border-2 border-dashed border-gray-300">
              <div className="relative mx-auto w-24 h-24 mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl opacity-20"></div>
                <div className="relative bg-white rounded-2xl p-4 shadow-lg">
                  <UsersIcon className="h-16 w-16 text-gray-400 mx-auto" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {searchTerm || filterPosition !== 'all' ? 'No Staff Found' : 'No Staff Members Yet'}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {searchTerm || filterPosition !== 'all' 
                  ? 'Try adjusting your search or filter criteria to find staff members.'
                  : 'Start building your team by adding your first staff member with login credentials.'
                }
              </p>
              {(!searchTerm && filterPosition === 'all') && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 font-semibold shadow-lg"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add First Staff Member
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Add Staff Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200"
            >
              {/* Enhanced Header */}
              <div className="p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-orange-50 to-red-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg">
                      <UsersIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Add Staff Member</h3>
                      <p className="text-sm text-gray-600">Create a new staff account with login access</p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-500" />
                  </motion.button>
                </div>
              </div>

              {/* Enhanced Form Content */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {/* Staff Limit Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <UsersIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-900">Staff Limit: {staff.length}/50</p>
                      <p className="text-xs text-blue-700">You can add {50 - staff.length} more staff members</p>
                    </div>
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newStaff.full_name}
                    onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                    placeholder="Enter staff member's full name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Email with validation */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={newStaff.email}
                      onChange={(e) => {
                        const email = e.target.value
                        setNewStaff({ ...newStaff, email: email, emailExists: false })
                        
                        // Only show immediate feedback for current staff list
                        if (email && checkEmailInCurrentStaff(email)) {
                          setNewStaff(prev => ({ ...prev, emailExists: true }))
                        }
                      }}
                      placeholder="Enter email address for login"
                      className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                        newStaff.emailExists ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                    />
                    {loading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  {newStaff.emailExists && (
                    <div className="mt-2 flex items-center gap-2 text-red-600">
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <span className="text-sm">This email is already used by another staff member</span>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Email availability will be checked when creating the staff account
                  </p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                    placeholder="Enter phone number (optional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Position <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newStaff.position}
                    onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select position</option>
                    {positions.map(position => (
                      <option key={position} value={position}>{position}</option>
                    ))}
                  </select>
                </div>

                {/* Hourly Rate */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    value={newStaff.hourly_rate}
                    onChange={(e) => setNewStaff({ ...newStaff, hourly_rate: e.target.value })}
                    placeholder="Enter hourly rate (optional)"
                    min="0"
                    step="10"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                      placeholder="Leave empty for auto-generated password"
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    If left empty, a secure password will be generated automatically
                  </p>
                </div>

                {/* Success Info */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <CheckIcon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-green-900 mb-1">What happens next?</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• Staff record will be created in your restaurant</li>
                        <li>• Login account will be created with email verification</li>
                        <li>• Staff member will receive login credentials</li>
                        <li>• They can access the staff portal after email verification</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddStaff}
                    disabled={loading || newStaff.emailExists}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Staff Account'
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
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
                  value={editingStaff.full_name || editingStaff.users?.full_name || ''}
                  onChange={(e) => setEditingStaff({ 
                    ...editingStaff, 
                    full_name: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editingStaff.email || editingStaff.users?.email || ''}
                  onChange={(e) => setEditingStaff({ 
                    ...editingStaff, 
                    email: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={editingStaff.phone || editingStaff.users?.phone || ''}
                  onChange={(e) => setEditingStaff({ 
                    ...editingStaff, 
                    phone: e.target.value
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
        </>
      )}

      {/* Applications Tab Content */}
      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Restaurant Key Section - Mobile Optimized */}
          <div className="bg-gradient-to-r from-orange-50 via-red-50 to-pink-50 rounded-xl p-4 sm:p-6 border border-orange-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                  <QrCodeIcon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Staff Signup Key</h3>
                  <p className="text-xs sm:text-sm text-gray-600">Share with potential staff</p>
                </div>
              </div>
              
              <div className="flex flex-col sm:items-end space-y-2">
                {currentSignupKey ? (
                  <>
                    <div className="text-lg sm:text-xl font-mono font-bold text-orange-600 bg-white px-3 py-2 rounded-lg border-2 border-orange-200 text-center">
                      {currentSignupKey}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentSignupKey)
                          toast.success('Key copied!')
                        }}
                        className="text-xs sm:text-sm bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-lg font-medium transition-colors"
                      >
                        📋 Copy
                      </button>
                      <button
                        onClick={() => generateSignupKey(true)}
                        className="text-xs sm:text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-medium transition-colors"
                      >
                        🔄 Regenerate
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={generateSignupKey}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg"
                  >
                    ✨ Generate Key
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* Applications List - Enhanced */}
          <div className="bg-white rounded-xl border border-orange-200 shadow-sm">
            {/* Header with Filters and Actions */}
            <div className="p-4 sm:p-6 border-b border-orange-100">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Applications</h2>
                    {pendingCount > 0 && (
                      <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center shadow-lg animate-pulse">
                        <BellIcon className="w-3 h-3 mr-1" />
                        {pendingCount} pending
                      </span>
                    )}
                  </div>
                  <button
                    onClick={fetchApplications}
                    className="text-sm bg-orange-100 hover:bg-orange-200 text-orange-700 px-3 py-1 rounded-lg font-medium transition-colors"
                  >
                    🔄 Refresh
                  </button>
                </div>

                {/* Filters and Bulk Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  {/* Filter Tabs */}
                  <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                    {[
                      { id: 'all', label: 'All', count: applicationStats.total },
                      { id: 'pending', label: 'Pending', count: applicationStats.pending },
                      { id: 'approved', label: 'Approved', count: applicationStats.approved },
                      { id: 'rejected', label: 'Rejected', count: applicationStats.rejected }
                    ].map((filter) => (
                      <button
                        key={filter.id}
                        onClick={() => setApplicationFilter(filter.id)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                          applicationFilter === filter.id
                            ? 'bg-white text-orange-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        {filter.label} ({filter.count})
                      </button>
                    ))}
                  </div>

                  {/* Bulk Actions */}
                  {pendingCount > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleQuickApproveAll}
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg font-medium transition-colors shadow-lg"
                      >
                        ✅ Approve All ({pendingCount})
                      </button>
                      <button
                        onClick={handleBulkReject}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg font-medium transition-colors shadow-lg"
                      >
                        ❌ Reject All
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon className="w-8 h-8 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                  <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
                    Share your signup key with potential staff to receive applications
                  </p>
                  {currentSignupKey && (
                    <div className="text-xs sm:text-sm text-orange-600 bg-orange-50 p-3 rounded-lg inline-block border border-orange-200">
                      <strong>Key:</strong> {currentSignupKey}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {filteredApplications.map((application) => (
                    <motion.div
                      key={application.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-orange-50/50 via-white to-red-50/50 rounded-xl border border-orange-200 p-4 sm:p-6 hover:shadow-lg transition-all"
                    >
                      <div className="flex flex-col space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
                              <UserIcon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 cursor-pointer hover:text-orange-600 transition-colors"
                                  onClick={() => {
                                    setSelectedApplication(application)
                                    setShowApplicationDetails(true)
                                  }}>
                                {application.full_name}
                              </h3>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                application.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                application.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {application.status === 'pending' && <ClockIcon className="w-3 h-3 mr-1" />}
                                {application.status === 'approved' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                                {application.status === 'rejected' && <XCircleIcon className="w-3 h-3 mr-1" />}
                                <span className="capitalize">{application.status}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedApplication(application)
                                  setShowApplicationDetails(true)
                                }}
                                className="text-xs text-orange-600 hover:text-orange-700 mt-1 flex items-center space-x-1"
                              >
                                <EyeIcon className="w-3 h-3" />
                                <span>View Details</span>
                              </button>
                            </div>
                          </div>

                          {/* Mobile Action Buttons */}
                          {application.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveApplication(application)}
                                disabled={processingId === application.id}
                                className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors shadow-lg"
                              >
                                {processingId === application.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <CheckCircleIcon className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleRejectApplication(application)}
                                disabled={processingId === application.id}
                                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors shadow-lg"
                              >
                                <XCircleIcon className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center space-x-2 text-gray-600 bg-white/50 p-2 rounded-lg">
                            <EnvelopeIcon className="w-4 h-4 text-orange-500" />
                            <span className="truncate">{application.email}</span>
                          </div>
                          {application.phone && (
                            <div className="flex items-center space-x-2 text-gray-600 bg-white/50 p-2 rounded-lg">
                              <PhoneIcon className="w-4 h-4 text-orange-500" />
                              <span>{application.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2 text-gray-600 bg-white/50 p-2 rounded-lg">
                            <UserIcon className="w-4 h-4 text-orange-500" />
                            <span>{application.position}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-gray-600 bg-white/50 p-2 rounded-lg">
                            <CurrencyRupeeIcon className="w-4 h-4 text-orange-500" />
                            <span>₹{application.hourly_rate}/hr</span>
                          </div>
                        </div>

                        {/* Applied Date */}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <CalendarIcon className="w-4 h-4" />
                          <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
                        </div>

                        {/* Message */}
                        {application.message && (
                          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <div className="flex items-start space-x-2">
                              <ChatBubbleLeftRightIcon className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-orange-800 mb-1">Message:</p>
                                <p className="text-sm text-orange-700 break-words">{application.message}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Desktop Action Buttons */}
                        {application.status === 'pending' && (
                          <div className="hidden sm:flex space-x-3 pt-2">
                            <button
                              onClick={() => handleApproveApplication(application)}
                              disabled={processingId === application.id}
                              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-lg"
                            >
                              {processingId === application.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircleIcon className="w-4 h-4" />
                              )}
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleRejectApplication(application)}
                              disabled={processingId === application.id}
                              className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-lg"
                            >
                              <XCircleIcon className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}

                        {/* Status Info */}
                        {application.status !== 'pending' && (
                          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-lg text-center">
                            {application.status === 'approved' ? '✅ Approved' : '❌ Rejected'} on{' '}
                            {application.reviewed_at && new Date(application.reviewed_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Application Details Modal */}
      <AnimatePresence>
        {showApplicationDetails && selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowApplicationDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Application Details</h2>
                <button
                  onClick={() => setShowApplicationDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Applicant Info */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <UserIcon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedApplication.full_name}</h3>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        selectedApplication.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedApplication.status === 'pending' && <ClockIcon className="w-4 h-4 mr-1" />}
                        {selectedApplication.status === 'approved' && <CheckCircleIcon className="w-4 h-4 mr-1" />}
                        {selectedApplication.status === 'rejected' && <XCircleIcon className="w-4 h-4 mr-1" />}
                        <span className="capitalize">{selectedApplication.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact & Position Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <EnvelopeIcon className="w-5 h-5 text-orange-500" />
                        <span className="text-gray-700">{selectedApplication.email}</span>
                      </div>
                      {selectedApplication.phone && (
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <PhoneIcon className="w-5 h-5 text-orange-500" />
                          <span className="text-gray-700">{selectedApplication.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">Position Details</h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <UserIcon className="w-5 h-5 text-orange-500" />
                        <span className="text-gray-700">{selectedApplication.position}</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <CurrencyRupeeIcon className="w-5 h-5 text-orange-500" />
                        <span className="text-gray-700">₹{selectedApplication.hourly_rate}/hour</span>
                      </div>
                      <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <CalendarIcon className="w-5 h-5 text-orange-500" />
                        <span className="text-gray-700">Applied on {new Date(selectedApplication.applied_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Message */}
                {selectedApplication.message && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Message from Applicant</h4>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <ChatBubbleLeftRightIcon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                        <p className="text-gray-700 leading-relaxed">{selectedApplication.message}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedApplication.status === 'pending' && (
                  <div className="flex space-x-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        handleApproveApplication(selectedApplication)
                        setShowApplicationDetails(false)
                      }}
                      disabled={processingId === selectedApplication.id}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-xl font-medium disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-lg"
                    >
                      {processingId === selectedApplication.id ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircleIcon className="w-5 h-5" />
                      )}
                      <span>Approve Application</span>
                    </button>
                    <button
                      onClick={() => {
                        handleRejectApplication(selectedApplication)
                        setShowApplicationDetails(false)
                      }}
                      disabled={processingId === selectedApplication.id}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl font-medium disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-lg"
                    >
                      <XCircleIcon className="w-5 h-5" />
                      <span>Reject Application</span>
                    </button>
                  </div>
                )}

                {selectedApplication.status !== 'pending' && (
                  <div className="text-center py-4 border-t border-gray-200">
                    <p className="text-gray-600">
                      {selectedApplication.status === 'approved' ? '✅ This application has been approved' : '❌ This application has been rejected'}
                      {selectedApplication.reviewed_at && (
                        <span className="block text-sm text-gray-500 mt-1">
                          on {new Date(selectedApplication.reviewed_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaffTab
