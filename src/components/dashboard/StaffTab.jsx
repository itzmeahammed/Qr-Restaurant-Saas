import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UsersIcon, 
  MagnifyingGlassIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarIcon,
  ClockIcon,
  StarIcon,
  BellIcon,
  KeyIcon,
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon,
  UserIcon,
  DocumentTextIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { CurrencyRupeeIcon } from '@heroicons/react/24/solid'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

function StaffTab({ restaurant }) {
  const [staff, setStaff] = useState([])
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPosition, setFilterPosition] = useState('all')
  const [activeTab, setActiveTab] = useState('staff')
  const [processingId, setProcessingId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [generatingKey, setGeneratingKey] = useState(false)
  const [showKeyModal, setShowKeyModal] = useState(false)

  useEffect(() => {
    if (restaurant?.id) {
      fetchStaffMembers()
      if (activeTab === 'applications') {
        fetchApplications()
      }
    }
  }, [restaurant?.id, activeTab])

  const fetchStaffMembers = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching staff members for restaurant:', restaurant.id)
      
      // Fetch approved staff from unified users table
      const { data: staffData, error } = await supabase
        .from('users')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .eq('role', 'staff')
        .not('approved_at', 'is', null) // Only approved staff
        .order('created_at', { ascending: false })

      if (error) throw error
      
      console.log('✅ Staff members fetched:', staffData)
      setStaff(staffData || [])
    } catch (error) {
      console.error('❌ Error fetching staff members:', error)
      toast.error('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  const fetchApplications = async () => {
    try {
      setLoading(true)
      
      const { data: applicationsData, error } = await supabase
        .from('staff_applications')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('applied_at', { ascending: false })

      if (error) throw error

      console.log('✅ Applications fetched:', applicationsData)
      setApplications(applicationsData || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load staff applications')
    } finally {
      setLoading(false)
    }
  }

  const handleApproveApplication = async (application) => {
    try {
      setProcessingId(application.id)

      // Update application status to approved
      const { error: updateError } = await supabase
        .from('staff_applications')
        .update({ 
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: restaurant.owner_id
        })
        .eq('id', application.id)

      if (updateError) throw updateError

      // Update user record in unified users table with approval data
      const { error: userError } = await supabase
        .from('users')
        .update({
          restaurant_id: restaurant.id,
          position: application.position,
          hourly_rate: application.hourly_rate || 0,
          approved_at: new Date().toISOString(),
          approved_by: restaurant.owner_id
        })
        .eq('id', application.user_id)

      if (userError) throw userError

      toast.success(`✅ ${application.full_name} approved!\n\n🎉 They can now login and access the staff dashboard.`, {
        duration: 6000,
        style: { maxWidth: '400px', whiteSpace: 'pre-line' }
      })

      fetchApplications()
      fetchStaffMembers() // Refresh staff list
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

  const generateSignupKey = async () => {
    try {
      setGeneratingKey(true)
      
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

      toast.success(`🎉 New signup key generated!\n\n🔑 Key: ${newKey}\n\n📤 Share this with potential staff members to apply.`, {
        duration: 10000,
        style: { 
          maxWidth: '450px', 
          whiteSpace: 'pre-line',
          background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
          color: 'white',
          fontWeight: '500'
        }
      })

      // Update restaurant object to reflect the new key
      restaurant.staff_signup_key = newKey
      
      // Copy to clipboard automatically
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(newKey)
        setTimeout(() => {
          toast.success('📋 Key copied to clipboard!', { duration: 3000 })
        }, 1000)
      }
    } catch (error) {
      console.error('Error generating signup key:', error)
      toast.error('❌ Failed to generate signup key. Please try again.')
    } finally {
      setGeneratingKey(false)
    }
  }

  const regenerateSignupKey = async () => {
    if (!confirm('🔄 Generate a new signup key?\n\n⚠️ The current key will stop working and staff using it won\'t be able to apply.\n\nContinue?')) {
      return
    }
    await generateSignupKey()
  }

  const refreshData = async () => {
    try {
      setRefreshing(true)
      
      // Refresh both staff and applications data
      await Promise.all([
        fetchStaffMembers(),
        activeTab === 'applications' ? fetchApplications() : Promise.resolve()
      ])
      
      toast.success('🔄 Data refreshed successfully!', {
        duration: 3000,
        style: {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white'
        }
      })
    } catch (error) {
      console.error('Error refreshing data:', error)
      toast.error('❌ Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  // Filter staff based on search and position
  const filteredStaff = staff.filter(member => {
    const matchesSearch = member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone?.includes(searchTerm)
    const matchesPosition = filterPosition === 'all' || member.position === filterPosition
    return matchesSearch && matchesPosition
  })

  // Get unique positions for filter
  const positions = [...new Set(staff.map(member => member.position).filter(Boolean))]
  
  // Filter applications
  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.position?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const pendingCount = applications.filter(app => app.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    )
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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UsersIcon className="h-6 w-6 text-orange-500" />
                Staff Members
              </h2>
              <p className="text-gray-600 mt-1">
                {staff.length} approved staff member{staff.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <SparklesIcon className="h-4 w-4" />
              )}
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search staff members..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          />
        </div>
        <div className="relative">
          <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <select
            value={filterPosition}
            onChange={(e) => setFilterPosition(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
          >
            <option value="all">All Positions</option>
            {positions.map(position => (
              <option key={position} value={position}>{position}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Staff List */}
      {filteredStaff.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {staff.length === 0 ? 'No Staff Members Yet' : 'No Staff Found'}
          </h3>
          <p className="text-gray-600">
            {staff.length === 0 
              ? 'Staff members will appear here once they are approved through the Applications tab.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredStaff.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                {/* Staff Avatar and Name */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {member.full_name?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {member.full_name || 'Staff Member'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <BriefcaseIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {member.position || 'Staff'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600 truncate">
                      {member.email || 'No email'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      {member.phone || 'No phone'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm text-gray-600">
                      Joined {new Date(member.approved_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Status and Performance */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium text-green-600">
                        {member.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    {member.hourly_rate && (
                      <div className="flex items-center gap-1">
                        <CurrencyRupeeIcon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          ₹{member.hourly_rate}/hr
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Performance Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-semibold text-gray-900">
                        {member.total_orders_completed || 0}
                      </div>
                      <div className="text-xs text-gray-500">Orders</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-lg font-semibold text-gray-900 flex items-center justify-center gap-1">
                        <StarIcon className="h-4 w-4 text-yellow-500" />
                        {member.performance_rating || '5.0'}
                      </div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
        </>
      )}

      {/* Applications Tab Content */}
      {activeTab === 'applications' && (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <BellIcon className="h-6 w-6 text-orange-500" />
                Staff Applications
              </h2>
              <p className="text-gray-600 mt-1">
                {applications.length} application{applications.length !== 1 ? 's' : ''} 
                {pendingCount > 0 && ` • ${pendingCount} pending`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {refreshing ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <SparklesIcon className="h-4 w-4" />
                )}
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              {!restaurant?.staff_signup_key ? (
                <button
                  onClick={generateSignupKey}
                  disabled={generatingKey}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingKey ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <KeyIcon className="h-4 w-4" />
                  )}
                  {generatingKey ? 'Generating...' : 'Generate Key'}
                </button>
              ) : (
                <button
                  onClick={regenerateSignupKey}
                  disabled={generatingKey}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingKey ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <KeyIcon className="h-4 w-4" />
                  )}
                  {generatingKey ? 'Generating...' : 'New Key'}
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Signup Key Display */}
          {restaurant?.staff_signup_key && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-orange-50 via-amber-50 to-red-50 border-2 border-orange-200 rounded-xl p-6 shadow-lg"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                    <QrCodeIcon className="h-6 w-6 text-orange-500" />
                    Staff Signup Key
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">Active</span>
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                    📤 Share this key with potential staff members to apply<br/>
                    🔗 They can use this at: <span className="font-mono text-orange-600">yourapp.com/signup</span>
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="bg-white border-2 border-orange-300 rounded-lg p-3 shadow-inner">
                    <code className="font-mono text-xl font-bold text-gray-900 tracking-wider">
                      {restaurant.staff_signup_key}
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(restaurant.staff_signup_key)
                        toast.success('📋 Key copied to clipboard!', {
                          style: {
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white'
                          }
                        })
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:from-blue-600 hover:to-cyan-700 transition-all shadow-md"
                    >
                      <DocumentTextIcon className="h-4 w-4" />
                      Copy
                    </button>
                    <button
                      onClick={regenerateSignupKey}
                      disabled={generatingKey}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingKey ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <KeyIcon className="h-4 w-4" />
                      )}
                      New
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>

          {/* Applications List */}
          {filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <BellIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {applications.length === 0 ? 'No Applications Yet' : 'No Applications Found'}
              </h3>
              <p className="text-gray-600">
                {applications.length === 0 
                  ? 'Staff applications will appear here when people apply using your signup key.'
                  : 'Try adjusting your search criteria.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredApplications.map((application, index) => (
                  <motion.div
                    key={application.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-lg">
                              {application.full_name?.charAt(0)?.toUpperCase() || 'A'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{application.full_name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <BriefcaseIcon className="h-4 w-4" />
                                {application.position}
                              </span>
                              <span className="flex items-center gap-1">
                                <CurrencyRupeeIcon className="h-4 w-4" />
                                ₹{application.hourly_rate}/hr
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              application.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              application.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(application.applied_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{application.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">{application.phone || 'No phone'}</span>
                          </div>
                        </div>

                        {application.message && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                              "{application.message}"
                            </p>
                          </div>
                        )}

                        {application.status === 'pending' && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => handleApproveApplication(application)}
                              disabled={processingId === application.id}
                              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                              {processingId === application.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <CheckCircleIcon className="h-4 w-4" />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => handleRejectApplication(application)}
                              disabled={processingId === application.id}
                              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                            >
                              {processingId === application.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <XCircleIcon className="h-4 w-4" />
                              )}
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default StaffTab
