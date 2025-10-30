import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  KeyIcon,
  DocumentTextIcon,
  EyeIcon,
  TrashIcon,
  SparklesIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  QrCodeIcon,
  BellIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

// Brand colors to match Auth.jsx
const BRAND_ORANGE = '#F59E0B'
const BRAND_BLACK = '#1F2937'

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
      
      // First get applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('staff_applications')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('applied_at', { ascending: false })

      if (applicationsError) throw applicationsError

      // Applications already have all the data we need from staff_applications table
      // No need to fetch user details separately since staff_applications has full_name, email, phone
      console.log('✅ Applications fetched:', applicationsData)
      setApplications(applicationsData || [])
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

      // Update restaurant with new key in users table (unified approach)
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

    // Prevent double-clicking
    if (processingId === application.id) {
      console.log('⚠️ Already processing this application, ignoring duplicate request')
      return
    }

    try {
      setProcessingId(application.id)
      console.log('🚀 Starting approval process for application:', application.id)

      // UNIFIED USERS TABLE APPROACH - NO SEPARATE STAFF TABLE NEEDED
      console.log('🔄 Step 1: Updating user in unified users table...')
      
      // Check if user exists
      const { data: existingUser, error: userCheckError } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('id', application.user_id)
        .maybeSingle() // FIXED: Use maybeSingle() to avoid PGRST116

      if (userCheckError) {
        console.error('❌ Error checking user:', userCheckError)
        throw userCheckError
      }

      let finalUserId = application.user_id
      let tempPassword = null

      if (!existingUser) {
        // Create new user if doesn't exist
        tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase()
        
        const { data: newUser, error: createUserError } = await supabase
          .from('users')
          .insert({
            id: application.user_id,
            full_name: application.full_name,
            email: application.email,
            phone: application.phone,
            role: 'staff',
            restaurant_id: application.restaurant_id,
            position: application.position,
            hourly_rate: parseFloat(application.hourly_rate) || 0.00,
            approved_at: new Date().toISOString(),
            approved_by: restaurant.owner_id,
            is_available: true,
            password_hash: tempPassword // Store temp password for sharing
          })
          .select()
          .single()

        if (createUserError) throw createUserError
        console.log('✅ New user created and approved')
      } else {
        // Update existing user with approval data (main workflow)
        console.log('🔄 Updating existing user with approval data...')
        
        const { error: userUpdateError } = await supabase
          .from('users')
          .update({
            restaurant_id: application.restaurant_id,
            position: application.position,
            hourly_rate: parseFloat(application.hourly_rate) || 0.00,
            approved_at: new Date().toISOString(),
            approved_by: restaurant.owner_id,
            is_available: true
          })
          .eq('id', application.user_id)

        if (userUpdateError) {
          console.error('❌ Failed to update existing user:', userUpdateError)
          throw new Error(`User update failed: ${userUpdateError.message}`)
        }

        console.log('✅ Existing user updated with approval data')
      }

      // Step 2: Update application status to approved
      console.log('🔄 Step 2: Updating application status to approved...')
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

      console.log('✅ Application approved successfully - UNIFIED USERS TABLE APPROACH')

      // Update the local applications state instead of refetching
      setApplications(prev => prev.map(app => 
        app.id === application.id 
          ? { ...app, status: 'approved', reviewed_at: new Date().toISOString() }
          : app
      ))

      console.log('✅ Local state updated, no page refresh needed')

      // Show success message
      if (tempPassword) {
        toast.success(
          `🔑 Staff Account Created & Approved!\n\n` +
          `👤 Name: ${application.full_name}\n` +
          `📧 Email: ${application.email}\n` +
          `🔒 Temporary Password: ${tempPassword}\n\n` +
          `✅ Account created in unified users table\n` +
          `✅ Application approved\n` +
          `🚫 NO separate staff table needed!\n\n` +
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
          `✅ Application approved in unified users table\n` +
          `🚫 NO separate staff table needed!\n\n` +
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
      console.error('❌ Error approving application:', error)
      toast.error(`Failed to approve application: ${error.message}`)
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

      // Update local state
      setApplications(prev => prev.map(app => 
        app.id === application.id 
          ? { ...app, status: 'rejected', reviewed_at: new Date().toISOString() }
          : app
      ))

      toast.success(`Application from ${application.full_name} has been rejected.`)
    } catch (error) {
      console.error('Error rejecting application:', error)
      toast.error('Failed to reject application')
    } finally {
      setProcessingId(null)
    }
  }

  const pendingCount = applications.filter(app => app.status === 'pending').length

  if (loading) {
    return (
      <div className="relative min-h-screen" style={{ backgroundColor: BRAND_ORANGE }}>
        <div className="relative z-10 p-6 flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-black border-t-transparent rounded-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen" style={{ backgroundColor: BRAND_ORANGE }}>
      {/* Animated Background - Match Auth.jsx */}
      <div className="absolute inset-0">
        <motion.div 
          className="absolute top-20 right-10 w-24 h-24 rounded-full border-4 border-black/10"
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-32 left-16 w-16 h-16 rounded-full bg-black/5"
          animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Dot Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%23000000'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-6">
        {/* Header Card - Match Auth.jsx styling */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
          className="bg-white rounded-3xl p-8 mb-8 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
        >
          {/* Header with Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.4 }}
              className="mb-6"
            >
              <div className="bg-white rounded-2xl px-4 py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] inline-block">
                <UserGroupIcon className="h-12 w-12 text-black" />
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-3xl sm:text-4xl font-black text-black mb-2 tracking-tight"
            >
              STAFF APPLICATIONS
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-black/70 font-bold"
            >
              Review and manage staff applications
            </motion.p>
          </div>

          {/* Action Button */}
          <div className="flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowKeyModal(true)}
              className="bg-black text-white px-8 py-4 rounded-2xl font-black text-lg border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.3)] transition-all flex items-center gap-3"
            >
              <KeyIcon className="w-6 h-6" />
              MANAGE SIGNUP KEY
            </motion.button>
          </div>
        </motion.div>

        {/* Restaurant Key Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 mb-8 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                <QrCodeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black text-black">Staff Signup Key</h3>
                <p className="text-sm text-black/70 font-bold">Share this key with potential staff members</p>
              </div>
            </div>
            <div className="text-right">
              {restaurant?.staff_signup_key ? (
                <>
                  <div className="text-2xl font-mono font-black text-black bg-orange-100 px-4 py-2 rounded-2xl border-4 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    {restaurant.staff_signup_key}
                  </div>
                  <button
                    onClick={() => setShowKeyModal(true)}
                    className="text-sm text-black/70 hover:text-black mt-1 font-bold"
                  >
                    View Instructions
                  </button>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-sm text-black/70 mb-2 font-bold">No signup key generated</div>
                  <button
                    onClick={generateSignupKey}
                    className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-black transition-colors border-2 border-black"
                  >
                    Generate Key
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Applications List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-3xl p-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-black text-black">Applications</h2>
              {pendingCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-black px-3 py-1 rounded-full flex items-center border-2 border-black">
                  <BellIcon className="w-3 h-3 mr-1" />
                  {pendingCount} PENDING
                </span>
              )}
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12">
              <UserGroupIcon className="w-16 h-16 text-black/30 mx-auto mb-4" />
              <h3 className="text-lg font-black text-black/70 mb-2">No Applications Yet</h3>
              <p className="text-black/50 font-bold">Share your signup key to receive staff applications</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application, index) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-orange-50 rounded-2xl p-6 border-4 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-black">{application.full_name}</h3>
                        <p className="text-sm text-black/70 font-bold">{application.position} • ₹{application.hourly_rate}/hr</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-black/60 font-bold flex items-center">
                            <EnvelopeIcon className="w-3 h-3 mr-1" />
                            {application.email}
                          </span>
                          <span className="text-xs text-black/60 font-bold flex items-center">
                            <PhoneIcon className="w-3 h-3 mr-1" />
                            {application.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {application.status === 'pending' ? (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => handleApproveApplication(application, e)}
                            disabled={processingId === application.id}
                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl font-black text-sm border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            {processingId === application.id ? 'APPROVING...' : 'APPROVE'}
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRejectApplication(application)}
                            disabled={processingId === application.id}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-black text-sm border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all flex items-center gap-2"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            REJECT
                          </motion.button>
                        </>
                      ) : (
                        <span className={`px-4 py-2 rounded-xl font-black text-sm border-2 border-black ${
                          application.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {application.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Key Modal */}
      <AnimatePresence>
        {showKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <KeyIcon className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-black text-black mb-2">STAFF SIGNUP KEY</h2>
                <p className="text-black/70 font-bold">Share this key with potential staff members</p>
              </div>

              {restaurant?.staff_signup_key ? (
                <div className="text-center mb-6">
                  <div className="text-3xl font-mono font-black text-black bg-orange-100 px-6 py-4 rounded-2xl border-4 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] mb-4">
                    {restaurant.staff_signup_key}
                  </div>
                  <p className="text-sm text-black/70 font-bold">
                    Staff can use this key during signup to apply to your restaurant
                  </p>
                </div>
              ) : (
                <div className="text-center mb-6">
                  <button
                    onClick={generateSignupKey}
                    className="bg-black text-white px-6 py-3 rounded-2xl font-black border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.3)] transition-all"
                  >
                    GENERATE KEY
                  </button>
                </div>
              )}

              <button
                onClick={() => setShowKeyModal(false)}
                className="w-full bg-orange-100 text-black px-6 py-3 rounded-2xl font-black border-4 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-[3px_3px_0_0_rgba(0,0,0,1)] transition-all"
              >
                CLOSE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaffApplicationsTab
