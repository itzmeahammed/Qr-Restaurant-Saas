import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  TruckIcon,
  UserIcon,
  PhoneIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import { supabase } from '../config/supabase'
import useOrderStore from '../stores/useOrderStore'
import toast from 'react-hot-toast'

const OrderTracking = () => {
  const { orderId } = useParams()
  const { currentOrder, fetchOrderById } = useOrderStore()
  const [loading, setLoading] = useState(true)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [showReview, setShowReview] = useState(false)

  useEffect(() => {
    loadOrder()
    
    // Set up real-time subscription for order updates
    const subscription = supabase
      .channel(`order-${orderId}`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${orderId}`
        }, 
        (payload) => {
          loadOrder()
          if (payload.new.status === 'delivered') {
            toast.success('Your order has been delivered!')
            setShowReview(true)
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [orderId])

  const loadOrder = async () => {
    setLoading(true)
    await fetchOrderById(orderId)
    setLoading(false)
  }

  const getStatusSteps = () => {
    const steps = [
      { key: 'pending', label: 'Order Placed', icon: CheckCircleIcon },
      { key: 'assigned', label: 'Assigned to Staff', icon: UserIcon },
      { key: 'preparing', label: 'Preparing', icon: ClockIcon },
      { key: 'ready', label: 'Ready', icon: CheckCircleIcon },
      { key: 'delivered', label: 'Delivered', icon: TruckIcon }
    ]

    const statusOrder = ['pending', 'assigned', 'preparing', 'ready', 'delivered']
    const currentIndex = statusOrder.indexOf(currentOrder?.status)

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex
    }))
  }

  const submitReview = async () => {
    if (!rating) {
      toast.error('Please provide a rating')
      return
    }

    try {
      const { error } = await supabase
        .from('reviews')
        .insert([{
          order_id: currentOrder.id,
          restaurant_id: currentOrder.restaurant_id,
          staff_id: currentOrder.staff_id,
          overall_rating: rating,
          food_rating: rating,
          service_rating: rating,
          comment: review
        }])

      if (error) throw error
      
      toast.success('Thank you for your review!')
      setShowReview(false)
    } catch (error) {
      toast.error('Failed to submit review')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!currentOrder) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">Order Not Found</h2>
          <p className="text-neutral-600">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const steps = getStatusSteps()

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-neutral-900">Order Tracking</h1>
            <p className="text-neutral-600 mt-1">Order #{currentOrder.order_number}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Order Status */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-6">
          <h2 className="text-lg font-semibold mb-6">Order Status</h2>
          
          <div className="space-y-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-4"
              >
                <div className={`p-3 rounded-full ${
                  step.completed 
                    ? 'bg-primary-500 text-white' 
                    : step.active 
                    ? 'bg-primary-100 text-primary-500' 
                    : 'bg-neutral-100 text-neutral-400'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    step.completed || step.active ? 'text-neutral-900' : 'text-neutral-400'
                  }`}>
                    {step.label}
                  </p>
                  {step.active && (
                    <p className="text-sm text-primary-500 animate-pulse">In progress...</p>
                  )}
                </div>
                {step.completed && (
                  <CheckCircleIcon className="h-5 w-5 text-success" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Staff Info */}
        {currentOrder.users && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Assigned Staff</h3>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-100 rounded-full">
                <UserIcon className="h-6 w-6 text-primary-500" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">{currentOrder.users.full_name}</p>
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <PhoneIcon className="h-4 w-4" />
                  <span>{currentOrder.users.phone}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Order Details</h3>
          <div className="space-y-3">
            {currentOrder.order_items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  {item.menu_items?.image_url && (
                    <img 
                      src={item.menu_items.image_url} 
                      alt={item.menu_items.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{item.menu_items?.name}</p>
                    <p className="text-sm text-neutral-600">Qty: {item.quantity}</p>
                  </div>
                </div>
                <span className="font-medium">₹{item.total_price}</span>
              </div>
            ))}
          </div>
          
          <div className="border-t border-neutral-200 mt-4 pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>₹{currentOrder.total_amount}</span>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Restaurant</h3>
          <div>
            <p className="font-medium text-neutral-900">{currentOrder.restaurants?.name}</p>
            <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
              <PhoneIcon className="h-4 w-4" />
              <span>{currentOrder.restaurants?.phone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold mb-4">Rate Your Experience</h3>
            
            <div className="mb-4">
              <p className="text-sm text-neutral-600 mb-2">Overall Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`p-1 ${rating >= star ? 'text-yellow-400' : 'text-neutral-300'}`}
                  >
                    <StarIcon className={`h-8 w-8 ${rating >= star ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-neutral-600 mb-2">Comments (Optional)</p>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Tell us about your experience..."
                className="w-full p-3 border border-neutral-300 rounded-xl resize-none h-24"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowReview(false)}
                className="flex-1 btn-outline"
              >
                Skip
              </button>
              <button
                onClick={submitReview}
                className="flex-1 btn-primary"
              >
                Submit Review
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default OrderTracking
