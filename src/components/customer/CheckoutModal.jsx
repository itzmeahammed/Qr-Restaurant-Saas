import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCardIcon,
  BanknotesIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import CartService from '../../services/cartService'
import OrderService from '../../services/orderService'
import PaymentService from '../../services/paymentService'
import customerService from '../../services/customerService'
import realtimeService from '../../services/realtimeService'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

const CheckoutModal = ({ isOpen, onClose, restaurantId, tableId, sessionId }) => {
  const [loading, setLoading] = useState(false)
  const [selectedTip, setSelectedTip] = useState(0)
  const [cartSummary, setCartSummary] = useState(null)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderData, setOrderData] = useState(null)
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    paymentMethod: 'cash',
    specialInstructions: ''
  })

  const tipAmounts = [10, 20, 30, 50, 100, 200]

  // Load cart summary when modal opens
  React.useEffect(() => {
    if (isOpen && sessionId) {
      loadCartSummary()
    }
  }, [isOpen, sessionId])

  const loadCartSummary = async () => {
    try {
      const summary = await CartService.getCartSummary(sessionId)
      setCartSummary(summary)
    } catch (error) {
      console.error('Error loading cart:', error)
      toast.error('Failed to load cart')
    }
  }

  const handleSubmit = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Please fill in required fields')
      return
    }

    if (!cartSummary || cartSummary.isEmpty) {
      toast.error('Your cart is empty')
      return
    }

    setLoading(true)

    try {
      console.log('🛒 Starting complete checkout workflow...')

      // Step 1: Update customer session with customer info
      await customerService.updateCustomerSession(sessionId, {
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone,
        customer_email: customerInfo.email
      })

      // Step 2: Create order with complete workflow (includes staff assignment)
      const orderResult = await OrderService.createOrder({
        restaurantId,
        tableId,
        sessionId,
        specialInstructions: customerInfo.specialInstructions,
        paymentMethod: customerInfo.paymentMethod,
        tipAmount: selectedTip
      })

      if (!orderResult || !orderResult.id) {
        throw new Error('Failed to create order')
      }

      console.log('✅ Order created successfully:', orderResult.order_number)

      // Step 3: Process payment based on method
      let paymentResult = null
      if (customerInfo.paymentMethod === 'online') {
        // Online payment processing
        paymentResult = await PaymentService.processPayment({
          orderId: orderResult.id,
          amount: total,
          paymentMethod: 'online',
          transactionId: `TXN_${Date.now()}`
        })

        if (!paymentResult.success) {
          throw new Error(paymentResult.error || 'Payment processing failed')
        }
      } else {
        // Cash payment - notify staff for collection
        paymentResult = await PaymentService.processPayment({
          orderId: orderResult.id,
          amount: total,
          paymentMethod: 'cash',
          staffId: orderResult.assigned_staff_id
        })
      }

      // Step 4: Set success state with complete order data
      setOrderData({
        ...orderResult,
        payment: paymentResult.data,
        customerInfo,
        total,
        paymentMethod: customerInfo.paymentMethod
      })
      setOrderSuccess(true)

      // Step 5: Show appropriate success message
      if (customerInfo.paymentMethod === 'cash') {
        toast.success(`Order ${orderResult.order_number} placed! Staff will collect payment when ready.`)
      } else {
        toast.success(`Order ${orderResult.order_number} placed and payment processed!`)
      }

      // Step 6: Start real-time order tracking
      customerService.trackSessionOrder(sessionId, orderResult.id, {
        onOrderAssigned: (data) => {
          toast.success(`Order assigned to ${data.staffName}`)
        },
        onStatusUpdate: (data) => {
          toast.success(`Order status: ${data.status}`)
        },
        onPaymentConfirmed: (data) => {
          toast.success('Payment confirmed!')
        }
      })

      // Auto-close after 5 seconds for cash, 3 seconds for online
      const closeDelay = customerInfo.paymentMethod === 'cash' ? 5000 : 3000
      setTimeout(() => {
        onClose()
        setOrderSuccess(false)
        setOrderData(null)
      }, closeDelay)

    } catch (error) {
      console.error('❌ Complete checkout workflow failed:', error)
      toast.error(error.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const updateCustomerSession = async () => {
    try {
      // Update customer session with customer details
      await supabase
        .from('customer_sessions')
        .update({
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId)
    } catch (error) {
      console.warn('Failed to update customer session:', error)
    }
  }

  // Calculate totals
  const subtotal = cartSummary?.subtotal || 0
  const tax = cartSummary?.taxAmount || 0
  const total = subtotal + tax + selectedTip

  if (!isOpen) return null

  // Show success screen if order was placed
  if (orderSuccess && orderData) {
    const isOnlinePayment = orderData.paymentMethod === 'online'
    const isCashPayment = orderData.paymentMethod === 'cash'
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-6 w-full max-w-lg text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </motion.div>
            
            <h3 className="text-xl font-bold text-black mb-2">
              {isOnlinePayment ? 'Order Placed & Paid!' : 'Order Placed Successfully!'}
            </h3>
            
            <p className="text-gray-600 mb-4">
              Order #{orderData.order_number} has been placed and assigned to our staff.
            </p>
            
            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Order Number</span>
                <span className="font-bold text-black">#{orderData.order_number}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Amount</span>
                <span className="font-bold text-lg text-black">₹{orderData.total.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Method</span>
                <div className="flex items-center gap-2">
                  {isOnlinePayment ? (
                    <>
                      <CreditCardIcon className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Paid Online</span>
                    </>
                  ) : (
                    <>
                      <BanknotesIcon className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-orange-600">Pay with Cash</span>
                    </>
                  )}
                </div>
              </div>
              
              {orderData.assigned_staff_name && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Assigned Staff</span>
                  <span className="text-sm font-medium text-black">{orderData.assigned_staff_name}</span>
                </div>
              )}
            </div>
            
            {/* Payment-specific messages */}
            {isOnlinePayment && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-green-800">
                  ✅ Payment confirmed! Your order is being prepared.
                </p>
              </div>
            )}
            
            {isCashPayment && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-800">
                  💰 Please have ₹{orderData.total.toFixed(2)} ready. Our staff will collect payment when your order is ready.
                </p>
              </div>
            )}
            
            <p className="text-sm text-gray-500">
              🔔 You'll receive real-time updates as your order progresses from preparation to ready for pickup!
            </p>
            
            {/* Quick action button */}
            <button
              onClick={() => {
                onClose()
                setOrderSuccess(false)
                setOrderData(null)
              }}
              className="mt-4 px-6 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
            >
              Continue Tracking
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black">Complete Your Order</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-black" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Customer Details */}
            <div>
              <h4 className="font-semibold text-black mb-4">Customer Details</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Your phone number"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Email (for loyalty points)
                  </label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Your email address"
                  />
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-medium text-black mb-2">
                Special Instructions
              </label>
              <textarea
                value={customerInfo.specialInstructions}
                onChange={(e) => setCustomerInfo({...customerInfo, specialInstructions: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                rows={3}
                placeholder="Any special requests or dietary requirements?"
              />
            </div>

            {/* Payment Method */}
            <div>
              <h4 className="font-semibold text-black mb-4">Payment Method</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'cash'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    customerInfo.paymentMethod === 'cash'
                      ? 'border-black bg-gray-100'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <BanknotesIcon className="h-6 w-6 mx-auto mb-2 text-black" />
                  <span className="block text-sm font-medium text-black">Cash</span>
                </button>
                <button
                  onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'online'})}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    customerInfo.paymentMethod === 'online'
                      ? 'border-black bg-gray-100'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <CreditCardIcon className="h-6 w-6 mx-auto mb-2 text-black" />
                  <span className="block text-sm font-medium text-black">Online</span>
                </button>
              </div>
            </div>

            {/* Add Tip */}
            <div>
              <h4 className="font-semibold text-black mb-4">Add Tip (Optional)</h4>
              <div className="grid grid-cols-3 gap-2">
                {tipAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedTip(selectedTip === amount ? 0 : amount)}
                    className={`py-2 px-3 rounded-lg border-2 transition-all ${
                      selectedTip === amount
                        ? 'border-black bg-gray-100 text-black'
                        : 'border-gray-300 hover:border-gray-400 text-black'
                    }`}
                  >
                    ₹{amount}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                💚 100% of the tip goes to your service staff
              </p>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-black mb-3">Order Summary</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-black">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-black">
                  <span>Tax (18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                {selectedTip > 0 && (
                  <div className="flex justify-between text-sm text-black">
                    <span>Tip</span>
                    <span>+₹{selectedTip}</span>
                  </div>
                )}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg text-black">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-black rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CheckoutModal
