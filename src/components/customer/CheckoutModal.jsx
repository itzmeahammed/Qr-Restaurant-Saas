import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCardIcon,
  BanknotesIcon,
  GiftIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import useCartStore from '../../stores/useCartStore'
import LoyaltyService from '../../services/loyaltyService'
import toast from 'react-hot-toast'

const CheckoutModal = ({ isOpen, onClose, onConfirm }) => {
  const { getCartTotal } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [selectedTip, setSelectedTip] = useState(0)
  const [loyaltyInfo, setLoyaltyInfo] = useState(null)
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    paymentMethod: 'cash',
    specialInstructions: ''
  })

  const subtotal = getCartTotal()
  const tax = subtotal * 0.18
  const discount = loyaltyInfo?.discountAvailable || 0
  const total = subtotal + tax + selectedTip - discount

  const tipAmounts = [10, 20, 30, 50, 100, 200]

  const handleApplyLoyalty = async () => {
    if (!customerInfo.email) {
      toast.error('Please enter your email to use loyalty points')
      return
    }

    try {
      setLoading(true)
      // Mock loyalty check - in production, this would check against actual customer data
      const mockLoyalty = {
        currentBalance: 500,
        discountAvailable: Math.min(50, total * 0.1), // Max 10% discount
        tier: 'silver'
      }
      setLoyaltyInfo(mockLoyalty)
      toast.success(`You have ${mockLoyalty.currentBalance} points!`)
    } catch (error) {
      toast.error('Failed to check loyalty points')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!customerInfo.name || !customerInfo.phone) {
      toast.error('Please fill in required fields')
      return
    }

    const orderData = {
      customerInfo,
      selectedTip,
      loyaltyDiscount: discount,
      total
    }

    onConfirm(orderData)
  }

  if (!isOpen) return null

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
          className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900">Complete Your Order</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column - Customer Details */}
            <div className="space-y-6">
              {/* Customer Information */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Customer Details</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      placeholder="Your phone number"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (for loyalty points)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                        className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="Your email address"
                      />
                      <button
                        onClick={handleApplyLoyalty}
                        disabled={loading || !customerInfo.email}
                        className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
                      >
                        <GiftIcon className="h-5 w-5" />
                      </button>
                    </div>
                    {loyaltyInfo && (
                      <p className="text-sm text-green-600 mt-1">
                        ✨ {loyaltyInfo.tier.charAt(0).toUpperCase() + loyaltyInfo.tier.slice(1)} member - 
                        {loyaltyInfo.currentBalance} points (₹{loyaltyInfo.discountAvailable} discount applied)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Instructions
                    </label>
                    <textarea
                      value={customerInfo.specialInstructions}
                      onChange={(e) => setCustomerInfo({...customerInfo, specialInstructions: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      rows="3"
                      placeholder="Any special requests or dietary requirements?"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Payment Method</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'cash'})}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      customerInfo.paymentMethod === 'cash'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <BanknotesIcon className="h-8 w-8 mx-auto mb-2" />
                    <span className="block text-sm font-medium">Cash</span>
                  </button>
                  <button
                    onClick={() => setCustomerInfo({...customerInfo, paymentMethod: 'online'})}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      customerInfo.paymentMethod === 'online'
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCardIcon className="h-8 w-8 mx-auto mb-2" />
                    <span className="block text-sm font-medium">Online</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              {/* Add Tip */}
              <div>
                <h4 className="font-semibold text-gray-700 mb-4">Add Tip (Optional)</h4>
                <div className="grid grid-cols-3 gap-2">
                  {tipAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedTip(selectedTip === amount ? 0 : amount)}
                      className={`py-2 px-3 rounded-lg border-2 transition-all ${
                        selectedTip === amount
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  💚 100% of the tip goes to your service staff
                </p>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3">Order Summary</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (18%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  {selectedTip > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Tip</span>
                      <span>+₹{selectedTip}</span>
                    </div>
                  )}
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-purple-600">
                      <span>Loyalty Discount</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-orange-500">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default CheckoutModal
