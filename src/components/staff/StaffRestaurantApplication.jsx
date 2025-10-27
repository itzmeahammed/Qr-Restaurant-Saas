import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  QrCodeIcon,
  UserIcon,
  CurrencyRupeeIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const StaffRestaurantApplication = ({ user, onApplicationSubmitted }) => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    restaurantKey: '',
    position: '',
    hourlyRate: '',
    message: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    
    // Format restaurant key as user types
    if (name === 'restaurantKey') {
      // Convert to uppercase and allow only alphanumeric characters and dashes
      let formatted = value.toUpperCase().replace(/[^A-Z0-9-]/g, '')
      
      // If user is typing and we have exactly the right format, keep it as is
      if (formatted.match(/^[A-Z0-9]{1,4}(-[A-Z0-9]{1,4})?(-[A-Z0-9]{1,4})?$/)) {
        // Valid format, keep as is
        setFormData(prev => ({
          ...prev,
          [name]: formatted
        }))
      } else {
        // Remove dashes and reformat
        let cleaned = formatted.replace(/[^A-Z0-9]/g, '')
        
        // Limit to 12 characters max
        cleaned = cleaned.slice(0, 12)
        
        // Auto-format with dashes (XXXX-XXXX-XXXX)
        if (cleaned.length > 8) {
          cleaned = `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8)}`
        } else if (cleaned.length > 4) {
          cleaned = `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`
        }
        
        setFormData(prev => ({
          ...prev,
          [name]: cleaned
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.restaurantKey?.trim()) {
        toast.error('Please enter the restaurant signup key')
        return
      }

      if (!formData.position?.trim()) {
        toast.error('Please select your position')
        return
      }

      // Verify restaurant key exists
      let searchKey = formData.restaurantKey.trim().toUpperCase()
      
      // Auto-format key: add dashes if missing (XXXXXXXXXX -> XXXX-XXXX-XXXX)
      if (searchKey.length === 10 && !searchKey.includes('-')) {
        searchKey = `${searchKey.slice(0, 4)}-${searchKey.slice(4, 8)}-${searchKey.slice(8, 12)}`
      }
      
      console.log('🔍 Looking for restaurant with key:', searchKey)
      
      const { data: restaurant, error: restaurantError } = await supabase
        .from('users')
        .select('id, restaurant_name')
        .eq('staff_signup_key', searchKey)
        .eq('role', 'restaurant_owner')
        .maybeSingle()

      if (restaurantError) {
        console.error('Restaurant key validation error:', restaurantError)
        toast.error('Error validating restaurant key. Please try again.')
        return
      }

      if (!restaurant) {
        console.log('No restaurant found with key:', searchKey)
        toast.error('Invalid restaurant signup key. Please check with your manager.')
        return
      }

      console.log('✅ Restaurant found:', restaurant)

      // Check if user already has an application for this restaurant
      const { data: existingApplication, error: checkError } = await supabase
        .from('staff_applications')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurant.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing application:', checkError)
        toast.error('Error checking existing applications')
        return
      }

      if (existingApplication) {
        toast.error(`You already have a ${existingApplication.status} application for this restaurant`)
        return
      }

      // Create staff application
      const { data: applicationData, error: applicationError } = await supabase
        .from('staff_applications')
        .insert({
          restaurant_id: restaurant.id,
          user_id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          position: formData.position,
          hourly_rate: parseFloat(formData.hourlyRate) || 0,
          message: formData.message,
          status: 'pending'
        })
        .select()
        .single()

      if (applicationError) {
        console.error('Application creation error:', applicationError)
        toast.error('Failed to submit application. Please try again.')
        return
      }

      console.log('✅ Application created:', applicationData)

      toast.success(`🎉 Application submitted successfully!\n\nRestaurant: ${restaurant.name}\nPosition: ${formData.position}\n\nYour application is pending review.`, {
        duration: 8000,
        style: {
          maxWidth: '400px',
          whiteSpace: 'pre-line'
        }
      })

      // Reset form
      setFormData({
        restaurantKey: '',
        position: '',
        hourlyRate: '',
        message: ''
      })

      // Notify parent component
      if (onApplicationSubmitted) {
        onApplicationSubmitted(applicationData)
      }

    } catch (error) {
      console.error('Application submission error:', error)
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <QrCodeIcon className="w-8 h-8 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply to Restaurant</h2>
          <p className="text-gray-600">Enter the restaurant's signup key to submit your application</p>
        </div>

        {/* Application Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Restaurant Key */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Signup Key *
            </label>
            <div className="relative">
              <QrCodeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="restaurantKey"
                value={formData.restaurantKey}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono tracking-wider"
                placeholder="XXXX-XXXX-XXXX"
                required
                maxLength={14}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Get this key from your restaurant manager
            </p>
          </motion.div>

          {/* Position */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position *
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Select your position</option>
                <option value="Waiter">Waiter</option>
                <option value="Chef">Chef</option>
                <option value="Kitchen Helper">Kitchen Helper</option>
                <option value="Cashier">Cashier</option>
                <option value="Manager">Manager</option>
                <option value="Cleaner">Cleaner</option>
                <option value="Delivery">Delivery</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </motion.div>

          {/* Hourly Rate */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expected Hourly Rate (₹)
            </label>
            <div className="relative">
              <CurrencyRupeeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="e.g., 150"
                min="0"
                step="10"
              />
            </div>
          </motion.div>

          {/* Message */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message to Restaurant (Optional)
            </label>
            <div className="relative">
              <ChatBubbleLeftRightIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="Tell them why you want to work here..."
                rows="4"
                maxLength="500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {formData.message.length}/500 characters
            </p>
          </motion.div>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Submitting Application...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircleIcon className="w-5 h-5" />
                <span>Submit Application</span>
              </div>
            )}
          </motion.button>
        </form>

        {/* Info Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-100"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <ExclamationTriangleIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900 mb-1">
                Application Process
              </p>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your application will be reviewed by the restaurant manager</li>
                <li>• You'll receive a notification once it's approved or rejected</li>
                <li>• Only approved staff can access the full dashboard</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default StaffRestaurantApplication
