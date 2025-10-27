import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeftIcon,
  UserCircleIcon,
  CameraIcon,
  BuildingStorefrontIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ClockIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  PhotoIcon,
  CloudArrowUpIcon,
  CogIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import { uploadRestaurantImage, compressRestaurantImage } from '../utils/storageUtils'
import useAuthStore from '../stores/useAuthStore'
import toast from 'react-hot-toast'

const OwnerSettings = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)
  
  // Profile data
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    restaurant_name: '',
    restaurant_description: '',
    restaurant_address: '',
    restaurant_phone: '',
    restaurant_email: '',
    cuisine_type: '',
    logo_url: '',
    banner_url: '',
    opening_hours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '22:00', closed: false },
      sunday: { open: '09:00', close: '22:00', closed: false }
    }
  })

  const logoInputRef = useRef(null)
  const bannerInputRef = useRef(null)

  // Fetch profile data
  useEffect(() => {
    fetchProfile()
  }, [user])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      // Fetch user profile from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (userError && userError.code !== 'PGRST116') {
        throw userError
      }

      // Fetch restaurant data
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (restaurantError && restaurantError.code !== 'PGRST116') {
        throw restaurantError
      }

      // Merge data
      const mergedProfile = {
        full_name: userData?.full_name || user?.user_metadata?.full_name || '',
        email: userData?.email || user?.email || '',
        phone: userData?.phone || user?.user_metadata?.phone || '',
        restaurant_name: restaurantData?.name || userData?.restaurant_name || '',
        restaurant_description: restaurantData?.description || userData?.restaurant_description || '',
        restaurant_address: restaurantData?.address || userData?.restaurant_address || '',
        restaurant_phone: restaurantData?.phone || userData?.restaurant_phone || '',
        restaurant_email: restaurantData?.email || userData?.restaurant_email || '',
        cuisine_type: restaurantData?.cuisine_type || userData?.cuisine_type || '',
        logo_url: restaurantData?.logo_url || userData?.logo_url || '',
        banner_url: restaurantData?.banner_url || userData?.banner_url || '',
        opening_hours: restaurantData?.opening_hours || userData?.opening_hours || profile.opening_hours
      }

      setProfile(mergedProfile)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleHoursChange = (day, field, value) => {
    setProfile(prev => ({
      ...prev,
      opening_hours: {
        ...prev.opening_hours,
        [day]: {
          ...prev.opening_hours[day],
          [field]: value
        }
      }
    }))
  }

  const handleImageUpload = async (file, type) => {
    try {
      if (type === 'logo') {
        setUploadingLogo(true)
      } else {
        setUploadingBanner(true)
      }

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file')
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB')
      }

      // Compress image
      const compressedFile = await compressRestaurantImage(file, type)
      
      // Upload to storage
      const { url } = await uploadRestaurantImage(
        compressedFile,
        user.id,
        type,
        'restaurant-images'
      )

      // Update profile
      setProfile(prev => ({
        ...prev,
        [`${type}_url`]: url
      }))

      toast.success(`${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully!`)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload image')
    } finally {
      if (type === 'logo') {
        setUploadingLogo(false)
      } else {
        setUploadingBanner(false)
      }
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Try to update users table (fallback approach)
      try {
        const { error: userError } = await supabase
          .from('users')
          .update({
            full_name: profile.full_name,
            phone: profile.phone,
            restaurant_name: profile.restaurant_name,
            restaurant_description: profile.restaurant_description,
            restaurant_address: profile.restaurant_address,
            restaurant_phone: profile.restaurant_phone,
            restaurant_email: profile.restaurant_email,
            cuisine_type: profile.cuisine_type,
            logo_url: profile.logo_url,
            banner_url: profile.banner_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        if (userError) {
          console.warn('Users table update failed:', userError)
        }
      } catch (userUpdateError) {
        console.warn('Users table update error:', userUpdateError)
      }

      // Update or create restaurant record using auth.users ID
      const { data: existingRestaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (existingRestaurant) {
        // Update existing restaurant
        const { error: restaurantError } = await supabase
          .from('restaurants')
          .update({
            name: profile.restaurant_name,
            description: profile.restaurant_description,
            address: profile.restaurant_address,
            phone: profile.restaurant_phone,
            email: profile.restaurant_email,
            cuisine_type: profile.cuisine_type,
            logo_url: profile.logo_url,
            banner_url: profile.banner_url,
            opening_hours: profile.opening_hours,
            updated_at: new Date().toISOString()
          })
          .eq('owner_id', user.id)

        if (restaurantError) {
          console.error('Restaurant update error:', restaurantError)
          // Try fallback: update users table only
          throw new Error('Failed to update restaurant information. Please try again.')
        }
      } else {
        // Create new restaurant record - use auth user ID directly
        const { error: restaurantError } = await supabase
          .from('restaurants')
          .insert({
            owner_id: user.id, // This should be the auth.users ID
            name: profile.restaurant_name,
            description: profile.restaurant_description,
            address: profile.restaurant_address,
            phone: profile.restaurant_phone,
            email: profile.restaurant_email,
            cuisine_type: profile.cuisine_type,
            logo_url: profile.logo_url,
            banner_url: profile.banner_url,
            opening_hours: profile.opening_hours
          })

        if (restaurantError) {
          console.error('Restaurant creation error:', restaurantError)
          // If restaurant creation fails due to RLS, still show success for user data
          toast.success('Profile updated successfully! Restaurant setup may require additional permissions.')
          return
        }
      }

      toast.success('Settings saved successfully!')
    } catch (error) {
      console.error('Save error:', error)
      if (error.message.includes('row-level security')) {
        toast.error('Permission error: Please contact support for restaurant setup assistance.')
      } else {
        toast.error(error.message || 'Failed to save settings')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Simple Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/owner')}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-5 w-5 text-white" />
                <span className="text-white font-medium">Back to Dashboard</span>
              </motion.button>
            </div>
            
            <h1 className="text-xl font-bold text-white">Settings</h1>
            
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-right text-white">
                <p className="text-sm font-medium">{profile.full_name || 'Owner'}</p>
              </div>
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <UserCircleIcon className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <UserCircleIcon className="h-6 w-6 text-orange-500 mr-2" />
              Personal Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </motion.div>

          {/* Restaurant Information */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BuildingStorefrontIcon className="h-6 w-6 text-orange-500 mr-2" />
              Restaurant Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  value={profile.restaurant_name}
                  onChange={(e) => handleInputChange('restaurant_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter restaurant name"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={profile.restaurant_description}
                  onChange={(e) => handleInputChange('restaurant_description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Describe your restaurant"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  value={profile.restaurant_address}
                  onChange={(e) => handleInputChange('restaurant_address', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter restaurant address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Phone
                </label>
                <input
                  type="tel"
                  value={profile.restaurant_phone}
                  onChange={(e) => handleInputChange('restaurant_phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Restaurant phone number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Email
                </label>
                <input
                  type="email"
                  value={profile.restaurant_email}
                  onChange={(e) => handleInputChange('restaurant_email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Restaurant email"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cuisine Type
                </label>
                <select
                  value={profile.cuisine_type}
                  onChange={(e) => handleInputChange('cuisine_type', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select cuisine type</option>
                  <option value="Indian">Indian</option>
                  <option value="Chinese">Chinese</option>
                  <option value="Italian">Italian</option>
                  <option value="Mexican">Mexican</option>
                  <option value="Thai">Thai</option>
                  <option value="Japanese">Japanese</option>
                  <option value="American">American</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Continental">Continental</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Images Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <PhotoIcon className="h-6 w-6 text-orange-500 mr-2" />
              Restaurant Images
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Restaurant Logo
                </label>
                <div className="relative">
                  <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    {profile.logo_url ? (
                      <img
                        src={profile.logo_url}
                        alt="Restaurant Logo"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No logo uploaded</p>
                      </div>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute bottom-2 right-2 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg disabled:opacity-50"
                  >
                    {uploadingLogo ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <CameraIcon className="h-5 w-5" />
                    )}
                  </motion.button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'logo')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Restaurant Banner
                </label>
                <div className="relative">
                  <div className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                    {profile.banner_url ? (
                      <img
                        src={profile.banner_url}
                        alt="Restaurant Banner"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <div className="text-center">
                        <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No banner uploaded</p>
                      </div>
                    )}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="absolute bottom-2 right-2 bg-orange-500 hover:bg-orange-600 text-white p-2 rounded-full shadow-lg disabled:opacity-50"
                  >
                    {uploadingBanner ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      <CameraIcon className="h-5 w-5" />
                    )}
                  </motion.button>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0], 'banner')}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Operating Hours */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <ClockIcon className="h-6 w-6 text-orange-500 mr-2" />
              Operating Hours
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                const hours = profile.opening_hours[day]
                const dayNames = {
                  monday: 'Monday',
                  tuesday: 'Tuesday', 
                  wednesday: 'Wednesday',
                  thursday: 'Thursday',
                  friday: 'Friday',
                  saturday: 'Saturday',
                  sunday: 'Sunday'
                }
                
                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].indexOf(day)) }}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      hours.closed 
                        ? 'border-gray-200 bg-gray-50' 
                        : 'border-orange-200 bg-gradient-to-br from-orange-50 to-red-50 hover:border-orange-300'
                    }`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dayNames[day]}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`${day}-open`}
                          checked={!hours.closed}
                          onChange={(e) => handleHoursChange(day, 'closed', !e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 focus:ring-2"
                        />
                        <label 
                          htmlFor={`${day}-open`}
                          className={`text-sm font-medium cursor-pointer ${
                            hours.closed ? 'text-gray-500' : 'text-orange-600'
                          }`}
                        >
                          {hours.closed ? 'Closed' : 'Open'}
                        </label>
                      </div>
                    </div>
                    
                    {/* Time Inputs */}
                    {!hours.closed ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Opening Time
                            </label>
                            <input
                              type="time"
                              value={hours.open}
                              onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                            />
                          </div>
                          <div className="flex items-center justify-center mt-6">
                            <span className="text-gray-400 font-medium">to</span>
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Closing Time
                            </label>
                            <input
                              type="time"
                              value={hours.close}
                              onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                            />
                          </div>
                        </div>
                        
                        {/* Display formatted time */}
                        <div className="text-center">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            {new Date(`2000-01-01T${hours.open}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })} - {new Date(`2000-01-01T${hours.close}`).toLocaleTimeString('en-US', {
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                          <XMarkIcon className="w-4 h-4 mr-1" />
                          Closed All Day
                        </span>
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const newHours = { ...profile.opening_hours }
                    Object.keys(newHours).forEach(day => {
                      newHours[day] = { open: '09:00', close: '22:00', closed: false }
                    })
                    setProfile({ ...profile, opening_hours: newHours })
                  }}
                  className="px-4 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  Set All Days 9 AM - 10 PM
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const newHours = { ...profile.opening_hours }
                    Object.keys(newHours).forEach(day => {
                      newHours[day] = { ...newHours[day], closed: false }
                    })
                    setProfile({ ...profile, opening_hours: newHours })
                  }}
                  className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                  Open All Days
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const newHours = { ...profile.opening_hours }
                    newHours.sunday = { ...newHours.sunday, closed: true }
                    setProfile({ ...profile, opening_hours: newHours })
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Close Sundays
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-end"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckIcon className="h-5 w-5" />
                  <span>Save Settings</span>
                </>
              )}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default OwnerSettings
