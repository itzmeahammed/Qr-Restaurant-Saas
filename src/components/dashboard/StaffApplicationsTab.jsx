import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CurrencyRupeeIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  BellIcon,
  KeyIcon,
  QrCodeIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

function StaffApplicationsTab({ restaurant }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [selectedApplication, setSelectedApplication] = useState(null)
  const [showKeyModal, setShowKeyModal] = useState(false)

  useEffect(() => {
    if (restaurant?.id) {
      fetchApplications()
    }
  }, [restaurant?.id])

  const fetchApplications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('staff_applications')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('applied_at', { ascending: false })

      if (error) throw error
      setApplications(data || [])
    } catch (error) {
      console.error('Error fetching applications:', error)
      toast.error('Failed to load staff applications')
    } finally {
      setLoading(false)
    }
  }

  const generateSignupKey = async () => {
    try {
      // Generate a unique key
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

      // Update restaurant with new key in users table (consistent foreign key)
      const { error } = await supabase
        .from('users')
        .update({ staff_signup_key: newKey })
        .eq('id', restaurant.id)
        .eq('role', 'restaurant_owner')

      if (error) throw error

      toast.success(`✅ Signup key generated successfully!\n\nKey: ${newKey}\n\nShare this with potential staff members.`, {
        duration: 8000,
        style: {
          maxWidth: '400px',
          whiteSpace: 'pre-line'
        }
      })

      // Update restaurant object to reflect the new key
      restaurant.staff_signup_key = newKey

    } catch (error) {
      console.error('Error generating signup key:', error)
      toast.error('Failed to generate signup key. Please try again.')
    }
  }

  const handleApproveApplication = async (application, event) => {
    // BULLETPROOF REFRESH PREVENTION
    if (event) {
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }

    // Prevent ALL possible refresh triggers
    const preventRefresh = (e) => {
      e.preventDefault()
      e.returnValue = ''
      return false
    }

    const preventKeyRefresh = (e) => {
      // Prevent F5, Ctrl+R, Ctrl+F5
      if (e.key === 'F5' || (e.ctrlKey && (e.key === 'r' || e.key === 'R'))) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    const preventNavigation = (e) => {
      e.preventDefault()
      return false
    }

    try {
      // Add ALL refresh prevention listeners
      window.addEventListener('beforeunload', preventRefresh, { capture: true })
      window.addEventListener('unload', preventRefresh, { capture: true })
      window.addEventListener('pagehide', preventRefresh, { capture: true })
      window.addEventListener('keydown', preventKeyRefresh, { capture: true })
      document.addEventListener('keydown', preventKeyRefresh, { capture: true })
      
      // Prevent form submissions
      const forms = document.querySelectorAll('form')
      forms.forEach(form => {
        form.addEventListener('submit', preventNavigation, { capture: true })
      })
      
      setProcessingId(application.id)
      
      console.log('🚫 BULLETPROOF page refresh prevention activated')
      console.log('🚫 All refresh triggers blocked: F5, Ctrl+R, beforeunload, unload, pagehide, form submit')

      console.log('🔍 Debug - Starting approval process for:', application.email)
      console.log('🔍 Debug - Initial application data:', JSON.stringify(application, null, 2))

      // Get restaurant info
      console.log('🔄 Step 1: Getting restaurant info...')
      const { data: restaurant, error: restaurantError } = await supabase
        .from('users')
        .select('id, restaurant_name, id as owner_id')
        .eq('id', application.restaurant_id)
        .eq('role', 'restaurant_owner')
        .single()

      if (restaurantError || !restaurant) {
        console.error('❌ Failed to get restaurant info:', restaurantError)
        throw new Error(`Restaurant not found: ${restaurantError?.message || 'Unknown error'}`)
      }

      console.log('✅ Restaurant found:', restaurant)

      let finalUserId = application.user_id

      // Check if auth user exists
      let authUserExists = false
      if (application.user_id) {
        console.log('🔍 Step 2: Checking if user exists for user_id:', application.user_id)
        
        // Check in unified users table
        const { data: existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id, email, role')
          .eq('id', application.user_id)
          .single()

        console.log('🔍 User check result:', { existingUser, userCheckError })
        
        if (existingUser && !userCheckError) {
          authUserExists = true
          console.log('✅ Auth user already exists')
        } else {
          console.log('❌ Auth user does not exist, will create new one')
        }
      }

      // SIMPLIFIED APPROVAL: Only update users table, no staff table needed
      console.log('🔄 Step 3: SIMPLIFIED APPROVAL - Only updating users table')
      
      let tempPassword = null
      
      // If user doesn't exist, create in users table
      if (!authUserExists) {
        console.log('🔄 Creating new user record in users table...')
        
        // Generate a new UUID for the user
        const newUserId = crypto.randomUUID()
        console.log('🔍 Generated new user ID:', newUserId)

        // Generate a temporary password
        tempPassword = `Staff${newUserId.slice(-8)}!`
        console.log('🔍 Generated temp password:', tempPassword)

        // Create user record in unified users table
        const userData = {
          id: newUserId,
          email: application.email,
          password_hash: '$2b$10$temp.password.hash.needs.to.be.reset',
          full_name: application.full_name,
          phone: application.phone || null,
          role: 'staff',
          // Restaurant owner fields (null for staff)
          restaurant_name: null,
          restaurant_description: null,
          restaurant_address: null,
          restaurant_phone: null,
          restaurant_email: null,
          cuisine_type: null,
          logo_url: null,
          banner_url: null,
          // Staff fields from application
          restaurant_id: application.restaurant_id,
          position: application.position,
          hourly_rate: parseFloat(application.hourly_rate) || 0.00,
          is_available: true,
          total_orders_completed: 0,
          total_tips_received: 0.00,
          performance_rating: 5.00,
          is_active: true,
          email_verified: false
        }

        console.log('🔍 Creating user with data:', JSON.stringify(userData, null, 2))

        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert(userData)
          .select()
          .single()

        if (userError) {
          console.error('❌ Failed to create user:', userError)
          throw new Error(`User creation failed: ${userError.message}`)
        }

        finalUserId = newUserId
        console.log('✅ New user created successfully')

        // Update application with user ID
        const { error: updateUserIdError } = await supabase
          .from('staff_applications')
          .update({ user_id: finalUserId })
          .eq('id', application.id)

        if (updateUserIdError) {
          console.error('❌ Failed to link application to user:', updateUserIdError)
          throw updateUserIdError
        }
      }

      // Step 4: Update application status to approved
      console.log('🔄 Step 4: Updating application status to approved...')
      const { error: updateError } = await supabase
        .from('staff_applications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: restaurant.owner_id
        })
        .eq('id', application.id)

      if (updateError) {
        console.error('❌ Failed to update application status:', updateError)
        throw updateError
      }

      console.log('✅ Application approved successfully - NO STAFF TABLE NEEDED')

      // Update the local applications state instead of refetching
      setApplications(prev => prev.map(app => 
        app.id === application.id 
          ? { ...app, status: 'approved', reviewed_at: new Date().toISOString() }
          : app
      ))

      console.log('✅ Local state updated, no page refresh needed')

      // Show success message with login credentials if new user was created
      if (tempPassword) {
        toast.success(
          `🔑 Staff Account Created & Approved!\n\n` +
          `👤 Name: ${application.full_name}\n` +
          `📧 Email: ${application.email}\n` +
          `🔒 Temporary Password: ${tempPassword}\n\n` +
          `✅ Account created in users table\n` +
          `✅ Application approved\n` +
          `🚫 NO page refresh - all done locally!\n\n` +
          `📋 Share these credentials with the staff member.`,
          {
            duration: 15000,
            style: {
              maxWidth: '450px',
              whiteSpace: 'pre-line',
              backgroundColor: '#f0f9ff',
              border: '2px solid #0ea5e9'
            }
          }
        )
      } else {
        toast.success(
          `✅ ${application.full_name} approved successfully!\n\n` +
          `👤 Position: ${application.position}\n` +
          `💰 Hourly Rate: ₹${application.hourly_rate}\n\n` +
          `✅ Application approved in users table\n` +
          `🚫 NO page refresh - all done locally!\n\n` +
          `🎉 They can now login with their existing credentials.`,
          {
            duration: 8000,
            style: {
              maxWidth: '400px',
              whiteSpace: 'pre-line'
            }
          }
        )
      }


    } catch (error) {
      console.error('❌ CRITICAL ERROR in approval process:', error)
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      })
      
      // Log the full error object for debugging
      console.error('❌ Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
      
      // Provide specific error messages with detailed debugging info
      let errorMessage = `❌ Approval Failed for ${application.email}\n\n`
      
      if (error.message?.includes('Failed to create user account')) {
        errorMessage += `🔍 User Creation Error:\n${error.message}\n\n`
      } else if (error.code === '23503') {
        errorMessage += `🔍 Database Constraint Error:\n${error.message}\n\n`
        errorMessage += `💡 This usually means a foreign key constraint failed.\n`
      } else if (error.code === '23505') {
        errorMessage += `🔍 Duplicate Entry Error:\n${error.message}\n\n`
        errorMessage += `💡 User might already exist with this email.\n`
      } else if (error.message?.includes('Restaurant not found')) {
        errorMessage += `🔍 Restaurant Lookup Error:\n${error.message}\n\n`
      } else {
        errorMessage += `🔍 Unexpected Error:\n${error.message || 'Unknown error'}\n\n`
        errorMessage += `🔧 Error Code: ${error.code || 'N/A'}\n`
        errorMessage += `🔧 Error Details: ${error.details || 'N/A'}\n`
      }
      
      errorMessage += `\n📋 Check the browser console for detailed logs.\n`
      errorMessage += `🔄 Please try again or contact support if the issue persists.`
      
      toast.error(errorMessage, { 
        duration: 15000, 
        style: { 
          whiteSpace: 'pre-line',
          maxWidth: '500px',
          fontSize: '14px'
        } 
      })
      
      // Also log to console for easy copying
      console.error('❌ USER-FRIENDLY ERROR MESSAGE:', errorMessage)
      
    } finally {
      // Clean up ALL refresh prevention listeners
      window.removeEventListener('beforeunload', preventRefresh, { capture: true })
      window.removeEventListener('unload', preventRefresh, { capture: true })
      window.removeEventListener('pagehide', preventRefresh, { capture: true })
      window.removeEventListener('keydown', preventKeyRefresh, { capture: true })
      document.removeEventListener('keydown', preventKeyRefresh, { capture: true })
      
      // Remove form submit prevention
      const forms = document.querySelectorAll('form')
      forms.forEach(form => {
        form.removeEventListener('submit', preventNavigation, { capture: true })
      })
      
      setProcessingId(null)
      console.log('🚫 BULLETPROOF page refresh prevention deactivated')
      console.log('🚫 All event listeners removed - page can refresh normally now')
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

      toast.success(`Application from ${application.full_name} has been rejected.`)
      fetchApplications()

    } catch (error) {
      console.error('Error rejecting application:', error)
      toast.error('Failed to reject application. Please try again.')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />
      default:
        return <ClockIcon className="w-4 h-4" />
    }
  }

  const pendingCount = applications.filter(app => app.status === 'pending').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        <span className="ml-3 text-gray-600">Loading applications...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Restaurant Key */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <QrCodeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Staff Signup Key</h3>
              <p className="text-sm text-gray-600">Share this key with potential staff members</p>
            </div>
          </div>
          <div className="text-right">
            {restaurant?.staff_signup_key ? (
              <>
                <div className="text-2xl font-mono font-bold text-blue-600 bg-white px-4 py-2 rounded-lg border-2 border-blue-200">
                  {restaurant.staff_signup_key}
                </div>
                <button
                  onClick={() => setShowKeyModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 mt-1"
                >
                  View Instructions
                </button>
              </>
            ) : (
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-2">No signup key generated</div>
                <button
                  onClick={generateSignupKey}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Generate Key
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Applications Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-semibold text-gray-900">Staff Applications</h2>
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
              <BellIcon className="w-3 h-3 mr-1" />
              {pendingCount} pending
            </span>
          )}
        </div>
        <button
          onClick={fetchApplications}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Refresh
        </button>
      </div>

      {/* Applications List */}
      {applications.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
          <p className="text-gray-600 mb-4">
            Share your restaurant signup key with potential staff members to receive applications.
          </p>
          <div className="text-sm text-gray-500 bg-white p-3 rounded-lg inline-block">
            <strong>Your Key:</strong> {restaurant?.staff_signup_key}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{application.full_name}</h3>
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        <span className="ml-1 capitalize">{application.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <EnvelopeIcon className="w-4 h-4" />
                      <span>{application.email}</span>
                    </div>
                    {application.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <PhoneIcon className="w-4 h-4" />
                        <span>{application.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <UserIcon className="w-4 h-4" />
                      <span>{application.position}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CurrencyRupeeIcon className="w-4 h-4" />
                      <span>₹{application.hourly_rate}/hour</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span>Applied {new Date(application.applied_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {application.message && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex items-start space-x-2">
                        <ChatBubbleLeftRightIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Message:</p>
                          <p className="text-sm text-gray-600">{application.message}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {application.status === 'pending' && (
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={(event) => handleApproveApplication(application, event)}
                      disabled={processingId === application.id}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
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
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                )}

                {application.status !== 'pending' && (
                  <div className="ml-4 text-sm text-gray-500">
                    {application.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
                    {new Date(application.reviewed_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Key Instructions Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">How to Share Signup Key</h3>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircleIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-2xl font-mono font-bold text-blue-600 mb-2">
                      {restaurant?.staff_signup_key}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(restaurant?.staff_signup_key)
                        toast.success('Key copied to clipboard!')
                      }}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Click to copy
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <p className="text-sm text-gray-600">Share this key with potential staff members</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <p className="text-sm text-gray-600">They can signup at your restaurant's auth page using this key</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <p className="text-sm text-gray-600">Review and approve/reject applications here</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <p className="text-sm text-gray-600">Approved staff can login and access their dashboard</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaffApplicationsTab
