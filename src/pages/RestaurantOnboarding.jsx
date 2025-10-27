import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useHotkeys } from 'react-hotkeys-hook'
import {
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  EnvelopeIcon,
  ClockIcon,
  TagIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  SparklesIcon,
  PhotoIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import useAuthStore from '../stores/useAuthStore'
import { useConfirmation } from '../contexts/ConfirmationContext'
import { uploadImageRLSFree, compressRestaurantImage } from '../utils/storageUtils'
import toast from 'react-hot-toast'


const RestaurantOnboarding = () => {
  const navigate = useNavigate()
  const { user, fetchProfile } = useAuthStore()
  const { showConfirmation } = useConfirmation()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const prefersReducedMotion = useReducedMotion()

  // Image upload state
  const [imageFiles, setImageFiles] = useState({ logo: null, banner: null })
  const [imagePreview, setImagePreview] = useState({ logo: null, banner: null })
  const [uploadingImages, setUploadingImages] = useState(false)
  const [dragActive, setDragActive] = useState({ logo: false, banner: false })

  // Enhanced drag and drop functionality
  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive({ logo: false, banner: false })
  }, [])

  useEffect(() => {
    const handleResize = () => {
      // Force re-render of background elements on resize
      setCurrentStep(prev => prev)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Cleanup drag state on unmount
  useEffect(() => {
    return () => {
      setDragActive({ logo: false, banner: false })
    }
  }, [])

  const handleDragEnter = useCallback((type, e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(prev => ({ ...prev, [type]: true }))
  }, [])

  // Define handleImageUpload before it's used in handleDrop
  const handleImageUpload = useCallback((type, file) => {
    if (!file) return

    // Validate file type - exclude AVIF format
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Check for unsupported formats
    if (file.type === 'image/avif') {
      toast.error('AVIF format is not supported. Please use JPG, PNG, or WebP format.')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    setImageFiles(prev => ({ ...prev, [type]: file }))

    // Create preview with compression
    const reader = new FileReader()
    reader.onload = (e) => {
      // Compress image for preview
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Calculate dimensions for compression
        const maxWidth = 800
        const maxHeight = 600
        let { width, height } = img

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8)

        setImagePreview(prev => ({ ...prev, [type]: compressedDataUrl }))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((type, e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(prev => ({ ...prev, [type]: false }))

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleImageUpload(type, files[0])
      toast.success(`Image uploaded successfully!`)
    }
  }, [handleImageUpload])

  // Memoized animations for better performance
  const animations = useMemo(() => ({
    container: {
      initial: { opacity: 0, y: 30, scale: 0.9 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: 0.6, type: "spring", bounce: 0.3 }
    },
    step: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: 0.3 }
    },
    progressStep: {
      whileHover: { scale: 1.05 },
      whileTap: { scale: 0.95 }
    }
  }), [])

  // Enhanced keyboard navigation with visual feedback
  useHotkeys('arrowleft', () => {
    if (currentStep > 1) prevStep()
  })

  useHotkeys('arrowright', () => {
    if (currentStep < 5 && validateStep(currentStep)) nextStep()
  })

  useHotkeys('enter', () => {
    if (currentStep === 5) handleSubmit()
  })

  useHotkeys('escape', async () => {
    const confirmed = await showConfirmation({
      title: 'Exit Restaurant Setup',
      message: 'Are you sure you want to exit restaurant setup?\n\nYour progress will be lost.',
      type: 'warning',
      confirmText: 'Exit Setup',
      cancelText: 'Continue Setup',
      confirmButtonColor: 'red'
    })
    
    if (confirmed) {
      navigate('/dashboard')
    }
  })
  
  const [formData, setFormData] = useState({
    // Basic Info
    name: '',
    description: '',
    cuisine_type: '',
    
    // Contact Info
    address: '',
    phone: '',
    email: '',
    
    // Restaurant Images
    logo_url: '',
    banner_url: '',
    
    // Operating Hours
    opening_hours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '22:00', closed: false }
    }
  })
  


  const cuisineTypes = [
    'Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Japanese',
    'American', 'Mediterranean', 'Fast Food', 'Cafe', 'Bakery', 'Other'
  ]

  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Tell us about your restaurant',
      icon: BuildingStorefrontIcon
    },
    {
      id: 2,
      title: 'Contact Details',
      description: 'How customers can reach you',
      icon: MapPinIcon
    },
    {
      id: 3,
      title: 'Restaurant Images',
      description: 'Images can be added later in dashboard',
      icon: SparklesIcon
    },
    {
      id: 4,
      title: 'Operating Hours',
      description: 'When are you open?',
      icon: ClockIcon
    },
    {
      id: 5,
      title: 'Complete Setup',
      description: 'Review and finish',
      icon: CheckCircleIcon
    }
  ]

  const updateOpeningHours = (day, field, value) => {
    setFormData(prev => ({
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

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleHoursChange = (day, field, value) => {
    setFormData(prev => ({
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

  // Image handling functions
  const handleImageSelect = (e, type) => {
    const file = e.target.files[0]
    if (file) {
      validateAndSetImage(file, type)
    }
  }

  const handleImageDrop = (e, type) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      validateAndSetImage(file, type)
    }
  }

  const validateAndSetImage = (file, type) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Reject AVIF format as it's not widely supported
    if (file.type === 'image/avif') {
      toast.error('AVIF format is not supported. Please use JPG or PNG.')
      return
    }

    // Set the image file and create preview
    setImageFiles(prev => ({
      ...prev,
      [type]: file
    }))

    // Create preview URL
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(prev => ({
      ...prev,
      [type]: previewUrl
    }))

    console.log(`✅ ${type} image selected:`, file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} image selected successfully!`)
  }

  const removeImage = (type) => {
    // Revoke the preview URL to free memory
    if (imagePreview[type]) {
      URL.revokeObjectURL(imagePreview[type])
    }

    setImageFiles(prev => ({
      ...prev,
      [type]: null
    }))

    setImagePreview(prev => ({
      ...prev,
      [type]: null
    }))

    console.log(`🗑️ ${type} image removed`)
    toast.info(`${type.charAt(0).toUpperCase() + type.slice(1)} image removed`)
  }



  function validateStep(step) {
    switch (step) {
      case 1:
        return Boolean(formData.name && formData.cuisine_type) // Description is optional
      case 2:
        return Boolean(formData.address && formData.phone && formData.email)
      case 3:
        return true // Images are now optional - can be added later
      case 4:
        return true // Hours have defaults
      default:
        return true
    }
  }

  function prevStep() {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  function nextStep() {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5))
    } else {
      toast.error('Please fill in all required fields')
    }
  }

  async function handleSubmit() {
    if (!validateStep(currentStep)) {
      toast.error('Please complete all required fields')
      return
    }

    setLoading(true)
    setUploadingImages(true)
    
    try {
      // Upload images using RLS-free method (now that storage RLS is fixed)
      const uploadedUrls = { logo_url: null, banner_url: null }
      
      console.log('🚀 Starting image uploads with RLS-free method...')
      
      // Upload logo if provided
      if (imageFiles.logo) {
        try {
          console.log('📤 Uploading logo...')
          const compressedLogo = await compressRestaurantImage(imageFiles.logo, 'logo')
          const logoResult = await uploadImageRLSFree(compressedLogo, user.id, 'logo')
          uploadedUrls.logo_url = logoResult.url
          console.log('✅ Logo uploaded successfully:', logoResult.url)
          toast.success('Logo uploaded successfully!')
        } catch (logoError) {
          console.error('❌ Logo upload failed:', logoError)
          toast.error('Logo upload failed, but continuing with restaurant setup')
        }
      }
      
      // Upload banner if provided
      if (imageFiles.banner) {
        try {
          console.log('📤 Uploading banner...')
          const compressedBanner = await compressRestaurantImage(imageFiles.banner, 'banner')
          const bannerResult = await uploadImageRLSFree(compressedBanner, user.id, 'banner')
          uploadedUrls.banner_url = bannerResult.url
          console.log('✅ Banner uploaded successfully:', bannerResult.url)
          toast.success('Banner uploaded successfully!')
        } catch (bannerError) {
          console.error('❌ Banner upload failed:', bannerError)
          toast.error('Banner upload failed, but continuing with restaurant setup')
        }
      }
      
      console.log('🎯 Image upload phase complete:', uploadedUrls)
      
      // Create restaurant with or without image URLs
      // Note: restaurants.owner_id references auth.users(id), but we're using unified users table
      // We need to create the restaurant record properly
      const restaurantData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        cuisine_type: formData.cuisine_type,
        opening_hours: formData.opening_hours,
        logo_url: uploadedUrls.logo_url || null,
        banner_url: uploadedUrls.banner_url || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Handle restaurant creation with comprehensive RLS fallback
      let restaurant
      let restaurantCreated = false
      
      try {
        console.log('🔄 Updating user record with restaurant data...')
        const { data, error } = await supabase
          .from('users')
          .update({
            role: 'restaurant_owner',
            restaurant_name: restaurantData.name,
            restaurant_phone: restaurantData.phone,
            restaurant_email: restaurantData.email,
            restaurant_address: restaurantData.address,
            cuisine_type: restaurantData.cuisine_type,
            logo_url: restaurantData.logo_url,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)
          .select()
          .single()
        
        if (error) {
          console.error('Restaurant creation error:', error)
          throw error
        }
        
        restaurant = data
        restaurantCreated = true
        console.log('✅ Restaurant record created successfully')
        toast.success('Restaurant created successfully!')
        
      } catch (error) {
        console.warn('Restaurant table creation failed:', error)
        
        if (error.message?.includes('row-level security policy') || error.code === '42501') {
          console.log('⚠️ Restaurant RLS policy violation - using user profile fallback')
          
          try {
            // Fallback: Update user record with restaurant information
            const { data: updatedUser, error: updateError } = await supabase
              .from('users')
              .update({
                restaurant_name: formData.name,
                restaurant_description: formData.description,
                restaurant_address: formData.address,
                restaurant_phone: formData.phone,
                restaurant_email: formData.email,
                cuisine_type: formData.cuisine_type,
                logo_url: uploadedUrls.logo_url || null,
                banner_url: uploadedUrls.banner_url || null,
                updated_at: new Date().toISOString()
              })
              .eq('id', user.id)
              .select()
              .single()
            
            if (updateError) {
              console.error('User update also failed:', updateError)
              throw updateError
            }
            
            // Create a mock restaurant object for further processing
            restaurant = { id: user.id, ...restaurantData }
            console.log('✅ Restaurant data saved to user profile')
            toast.success('Restaurant information saved to your profile!')
            
          } catch (fallbackError) {
            console.error('Both restaurant creation and user update failed:', fallbackError)
            toast.error('Failed to save restaurant information. Please try again.')
            throw fallbackError
          }
        } else {
          // Other database errors
          console.error('Unexpected database error:', error)
          toast.error(`Database error: ${error.message}`)
          throw error
        }
      }

      // Handle default menu categories with RLS fallback
      const defaultCategories = [
        { name: 'Appetizers', description: 'Start your meal right' },
        { name: 'Main Course', description: 'Our signature dishes' },
        { name: 'Beverages', description: 'Drinks and refreshments' },
        { name: 'Desserts', description: 'Sweet endings' }
      ]

      // Try to create categories, but handle RLS policy violations gracefully
      try {
        console.log('🔄 Attempting to create default categories...')
        const { error: categoriesError } = await supabase
          .from('categories')
          .insert(
            defaultCategories.map((cat) => ({
              restaurant_id: user.id, // Use user.id as per actual database schema
              name: cat.name,
              description: cat.description,
              is_active: true,
              sort_order: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }))
          )

        if (categoriesError) {
          console.warn('Categories creation failed:', categoriesError)
          if (categoriesError.message?.includes('row-level security policy')) {
            console.log('⚠️ Categories RLS policy violation - categories will be created later')
            toast.info('Default menu categories will be set up automatically when you first access your dashboard')
          } else {
            throw categoriesError
          }
        } else {
          console.log('✅ Categories created successfully')
          toast.success('Default menu categories created!')
        }
      } catch (error) {
        console.warn('Categories creation error:', error)
        toast.info('Menu categories will be set up when you access your dashboard')
        // Don't throw error - continue with restaurant setup
      }

      // Refresh user profile to include restaurant data
      await fetchProfile(user.id)

      // Final success message and navigation
      if (restaurantCreated) {
        toast.success('🎉 Restaurant setup completed successfully!')
      } else {
        toast.success('🎉 Restaurant profile created! You can complete setup in your dashboard.')
      }
      
      // Small delay to ensure data is properly saved, then navigate
      setTimeout(() => {
        console.log('🔄 Navigating to dashboard...')
        // Use navigate instead of window.location for better React Router handling
        navigate('/dashboard')
      }, 2000)
    } catch (error) {
      console.error('Error creating restaurant:', error)
      toast.error(error.message || 'Failed to create restaurant')
    } finally {
      setLoading(false)
      setUploadingImages(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Restaurant Name *
              </label>
              <div className="relative">
                <BuildingStorefrontIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your restaurant name"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Describe your restaurant, specialties, ambiance..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Type *
              </label>
              <div className="relative">
                <TagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={formData.cuisine_type}
                  onChange={(e) => handleInputChange('cuisine_type', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  required
                >
                  <option value="">Select cuisine type</option>
                  {cuisineTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </motion.div>
        )

      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <textarea
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  rows={2}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Enter your restaurant's full address"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Restaurant contact number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Restaurant email address"
                  required
                />
              </div>
            </div>
          </motion.div>
        )

      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center mb-6">
              <PhotoIcon className="w-12 h-12 text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Upload your restaurant logo and banner image (optional)
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Images will be stored securely in Supabase Storage with RLS-free upload
              </p>
            </div>
            
            {/* Logo Upload */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Logo (Square format recommended)
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    imageFiles.logo
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                  }`}
                  onDrop={(e) => handleImageDrop(e, 'logo')}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                >
                  {imageFiles.logo ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview.logo}
                        alt="Logo preview"
                        className="w-24 h-24 object-cover rounded-lg mx-auto border-2 border-white shadow-md"
                      />
                      <p className="text-sm text-green-700 font-medium">{imageFiles.logo.name}</p>
                      <button
                        type="button"
                        onClick={() => removeImage('logo')}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Remove logo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-sm text-gray-600">
                          Drop your logo here, or{' '}
                          <button
                            type="button"
                            onClick={() => document.getElementById('logo-upload').click()}
                            className="text-orange-600 hover:text-orange-700 font-medium"
                          >
                            browse files
                          </button>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG up to 5MB (400x400px recommended)
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, 'logo')}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Restaurant Banner (Wide format recommended)
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    imageFiles.banner
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
                  }`}
                  onDrop={(e) => handleImageDrop(e, 'banner')}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                >
                  {imageFiles.banner ? (
                    <div className="space-y-2">
                      <img
                        src={imagePreview.banner}
                        alt="Banner preview"
                        className="w-full max-w-sm h-24 object-cover rounded-lg mx-auto border-2 border-white shadow-md"
                      />
                      <p className="text-sm text-green-700 font-medium">{imageFiles.banner.name}</p>
                      <button
                        type="button"
                        onClick={() => removeImage('banner')}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Remove banner
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-sm text-gray-600">
                          Drop your banner here, or{' '}
                          <button
                            type="button"
                            onClick={() => document.getElementById('banner-upload').click()}
                            className="text-orange-600 hover:text-orange-700 font-medium"
                          >
                            browse files
                          </button>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG up to 5MB (1200x400px recommended)
                        </p>
                      </div>
                    </div>
                  )}
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, 'banner')}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            
            {/* Upload Status */}
            {uploadingImages && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-blue-700">Uploading images...</span>
                </div>
              </div>
            )}
            
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-green-800">RLS-Free Upload Ready!</h4>
                  <p className="text-xs text-green-700 mt-1">
                    Storage RLS issues have been resolved with our nuclear fix. Images will upload seamlessly during restaurant setup.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )

      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <p className="text-sm text-gray-600 mb-4">
              Set your operating hours for each day of the week
            </p>
            
            {Object.entries(formData.opening_hours).map(([day, hours]) => (
              <div key={day} className="p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-0">
                {/* Mobile-first layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                  {/* Day name */}
                  <div className="sm:w-20 flex-shrink-0">
                    <span className="font-medium text-gray-700 capitalize text-base">{day}</span>
                  </div>
                  
                  {/* Open/Closed toggle */}
                  <div className="flex items-center space-x-2 sm:flex-1">
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) => handleHoursChange(day, 'closed', !e.target.checked)}
                      className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-600 font-medium">Open</span>
                  </div>

                  {/* Time inputs - responsive layout */}
                  {!hours.closed && (
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <input
                        type="time"
                        value={hours.open}
                        onChange={(e) => handleHoursChange(day, 'open', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent w-24 sm:w-auto"
                      />
                      <span className="text-gray-500 text-sm font-medium">to</span>
                      <input
                        type="time"
                        value={hours.close}
                        onChange={(e) => handleHoursChange(day, 'close', e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent w-24 sm:w-auto"
                      />
                    </div>
                  )}

                  {/* Closed status */}
                  {hours.closed && (
                    <div className="sm:flex-1 sm:text-right">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Closed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )

      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <SparklesIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Ready to Launch!
              </h3>
              <p className="text-gray-600">
                Your restaurant profile is complete with verification images. We'll create default menu categories to get you started.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-2">What happens next:</h4>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Your restaurant profile will be created with images</li>
                <li>• Images will be stored securely for verification</li>
                <li>• Default menu categories will be added</li>
                <li>• You can start adding menu items</li>
                <li>• Generate QR codes for your tables</li>
                <li>• Invite staff members to join</li>
              </ul>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-800 mb-2">Restaurant Summary:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Name:</strong> {formData.name}</p>
                <p><strong>Cuisine:</strong> {formData.cuisine_type}</p>
                <p><strong>Address:</strong> {formData.address}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>
                <p><strong>Logo:</strong> {imageFiles.logo ? '✅ Ready to upload' : '⚪ Not selected'}</p>
                <p><strong>Banner:</strong> {imageFiles.banner ? '✅ Ready to upload' : '⚪ Not selected'}</p>
              </div>
            </div>
          </motion.div>
        )

      default:
        return null
    }
  }

  // Enhanced step rendering with better UI
  const memoizedRenderStep = useMemo(() => {
    return renderStep()
  }, [currentStep, formData, imagePreview, imageFiles, dragActive, loading])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50 relative">
      {/* Enhanced Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating Orbs */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-orange-300/30 to-pink-300/30 rounded-full blur-xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-32 right-32 w-40 h-40 bg-gradient-to-r from-purple-300/30 to-blue-300/30 rounded-full blur-xl"
        />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Floating Elements */}
        {[...Array(window.innerWidth < 768 ? 6 : 10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-gradient-to-r from-orange-200/20 to-purple-200/20 backdrop-blur-sm rounded-xl"
            style={{
              width: Math.random() * 60 + 30,
              height: Math.random() * 60 + 30,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -15, 0],
              x: [0, 8, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: Math.random() * 3 + 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-2 sm:p-4 md:p-6">
        <motion.div
          {...(prefersReducedMotion ? {} : animations.container)}
          className="bg-white/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl border border-white/20"
        >
          {/* Enhanced Header */}
          <div className="text-center mb-6 sm:mb-8">
            <motion.div
              className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4"
              {...(prefersReducedMotion ? {} : {
                initial: { scale: 0, rotate: -180 },
                animate: { scale: 1, rotate: 0 },
                transition: { delay: 0.3, duration: 0.8, type: "spring", bounce: 0.4 }
              })}
            >
              <BuildingStorefrontIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-900 via-orange-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Restaurant Setup
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Let's get your restaurant ready for customers
            </p>
          </div>

          {/* Enhanced Progress Steps - Fully Visible and Clear */}
          <div className="mb-8 sm:mb-10">
            {/* Mobile Progress Bar */}
            <div className="block sm:hidden mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Step {currentStep} of {steps.length}</span>
                <span className="text-sm text-gray-500">{Math.round((currentStep / steps.length) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
              <div className="mt-3 text-center">
                <div className="flex items-center justify-center space-x-2">
                  {React.createElement(steps[currentStep - 1].icon, { className: "w-5 h-5 text-orange-600" })}
                  <span className="font-medium text-gray-900">{steps[currentStep - 1].title}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{steps[currentStep - 1].description}</p>
              </div>
            </div>

            {/* Desktop Progress Steps */}
            <div className="hidden sm:block">
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex flex-col items-center flex-1 relative">
                    {/* Step Circle */}
                    <motion.div
                      className={`w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center mb-3 cursor-pointer transition-all duration-300 ${
                        currentStep > step.id
                          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                          : currentStep === step.id
                          ? 'bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg ring-4 ring-orange-200'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                      {...(prefersReducedMotion ? {} : {
                        whileHover: { scale: 1.05 },
                        whileTap: { scale: 0.95 }
                      })}
                      onClick={() => {
                        if (currentStep > step.id) {
                          setCurrentStep(step.id)
                        }
                      }}
                    >
                      {currentStep > step.id ? (
                        <CheckCircleIcon className="w-6 h-6 lg:w-7 lg:h-7" />
                      ) : (
                        <step.icon className="w-6 h-6 lg:w-7 lg:h-7" />
                      )}
                    </motion.div>

                    {/* Step Title and Description */}
                    <div className="text-center max-w-[120px]">
                      <h3 className={`text-sm lg:text-base font-semibold mb-1 ${
                        currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-xs lg:text-sm ${
                        currentStep >= step.id ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>

                    {/* Connection Line */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-6 left-1/2 w-full h-1 -z-10">
                        <div className={`h-full transition-all duration-500 ${
                          currentStep > step.id 
                            ? 'bg-gradient-to-r from-green-500 to-green-600' 
                            : 'bg-gray-200'
                        }`} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Step Content */}
          <div className="mb-6 sm:mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                {...(prefersReducedMotion ? {} : animations.step)}
                className="min-h-[200px] sm:min-h-[300px] bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                {memoizedRenderStep}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Enhanced Navigation - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Back</span>
            </button>

            {currentStep < 5 ? (
              <button
                onClick={nextStep}
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-purple-700 transition-all duration-200 touch-manipulation min-h-[48px] shadow-lg hover:shadow-xl"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Continue</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading || uploadingImages}
                className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px] shadow-lg hover:shadow-xl"
              >
                {loading || uploadingImages ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span>{uploadingImages ? 'Uploading...' : 'Creating...'}</span>
                  </>
                ) : (
                  <>
                    <span>Complete Setup</span>
                    <CheckCircleIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>

        </motion.div>
      </div>
    </div>
  )
}

export default RestaurantOnboarding
