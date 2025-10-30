import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CreditCardIcon,
  BanknotesIcon,
  XMarkIcon,
  CheckCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import UnifiedOrderService from '../../services/unifiedOrderService'
import customerService from '../../services/customerService'
import realtimeService from '../../services/realtimeService'
import useCartStore from '../../stores/useCartStore'
import { supabase } from '../../config/supabase'
import toast from 'react-hot-toast'

// Ordyrr Brand Colors
const BRAND_GREEN = '#00E676'
const ACTION_GREEN = '#00C853'
const DARK_TEXT = '#212121'
const MEDIUM_GRAY = '#666666'

const CheckoutModal = ({ isOpen, onClose, onSuccess, restaurantId, tableId, sessionId, currentCustomer }) => {
  const [loading, setLoading] = useState(false)
  const [selectedTip, setSelectedTip] = useState(0)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderData, setOrderData] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState('cash')
  const [showDiscountPopup, setShowDiscountPopup] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [hasUsedFirstOrderDiscount, setHasUsedFirstOrderDiscount] = useState(false)
  const [currentOffer, setCurrentOffer] = useState(null)
  const hasShownPopup = useRef(false)
  const popupTimeout = useRef(null)
  
  // Use cart store instead of separate cart service
  const { cart, getCartTotal, getCartWithTax, clearCart } = useCartStore()
  
  const [customerInfo, setCustomerInfo] = useState({
    name: currentCustomer?.name || '',
    phone: currentCustomer?.phone || '',
    email: currentCustomer?.email || '',
    paymentMethod: 'cash',
    specialInstructions: ''
  })

  // Update customer info when currentCustomer changes
  React.useEffect(() => {
    if (currentCustomer) {
      setCustomerInfo(prev => ({
        ...prev,
        name: currentCustomer.name || '',
        phone: currentCustomer.phone || '',
        email: currentCustomer.email || ''
      }))
    }
  }, [currentCustomer])

  const tipAmounts = [10, 20, 30, 50, 100, 200]
  
  // Check if user is logged in
  const isLoggedIn = !!currentCustomer

  // Check if customer has used the first order offer
  React.useEffect(() => {
    const checkOfferEligibility = async () => {
      if (currentCustomer?.id) {
        try {
          console.log('🔍 [CheckoutModal] Checking offer eligibility for customer:', currentCustomer.id)
          
          // Get the first order offer
          const { data: offer, error: offerError } = await supabase
            .from('offers')
            .select('*')
            .eq('offer_code', 'FIRST_ORDER_10')
            .eq('is_active', true)
            .single()
          
          if (offerError || !offer) {
            console.log('❌ [CheckoutModal] First order offer not found or inactive')
            return
          }
          
          console.log('✅ [CheckoutModal] Found offer:', offer.offer_code, 'Offer ID:', offer.id)
          setCurrentOffer(offer)
          
          // Check if customer has already used this offer
          const { data: usageData, error: usageError } = await supabase
            .from('customer_offers')
            .select('*')
            .eq('customer_id', currentCustomer.id)
            .eq('offer_id', offer.id)
          
          console.log('📊 [CheckoutModal] Customer offer usage check:', {
            customer_id: currentCustomer.id,
            offer_id: offer.id,
            usageData,
            usageError,
            hasUsed: usageData && usageData.length > 0
          })
          
          if (!usageError && usageData && usageData.length > 0) {
            // Customer has already used this offer
            console.log('🚫 [CheckoutModal] Customer has already used this offer')
            setHasUsedFirstOrderDiscount(true)
          } else {
            console.log('✅ [CheckoutModal] Customer eligible for first order discount')
            setHasUsedFirstOrderDiscount(false)
          }
        } catch (error) {
          console.error('❌ [CheckoutModal] Error checking offer eligibility:', error)
        }
      }
    }
    checkOfferEligibility()
  }, [currentCustomer])

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (popupTimeout.current) {
        clearTimeout(popupTimeout.current)
      }
    }
  }, [])

  // Reset popup flag when modal opens
  React.useEffect(() => {
    if (isOpen) {
      hasShownPopup.current = false
    }
  }, [isOpen])

  // Cart summary with automatic discount calculation
  const cartSummary = React.useMemo(() => {
    if (!cart || cart.length === 0) {
      return { isEmpty: true, subtotal: 0, platformFee: 0, total: 0, discount: 0 }
    }
    
    const subtotal = getCartTotal()
    const platformFee = subtotal * 0.015 // 1.5% platform fee (same as CartSidebar)
    
    // Calculate automatic discount based on offer
    let discount = 0
    if (isLoggedIn && !hasUsedFirstOrderDiscount && currentOffer && subtotal >= (currentOffer.min_order_amount || 0)) {
      // Calculate discount based on offer type
      if (currentOffer.discount_type === 'percentage') {
        discount = subtotal * (currentOffer.discount_value / 100)
        // Apply max discount cap if specified
        if (currentOffer.max_discount_amount) {
          discount = Math.min(discount, currentOffer.max_discount_amount)
        }
      } else if (currentOffer.discount_type === 'fixed') {
        discount = currentOffer.discount_value
      }
    }
    
    const total = subtotal + platformFee - discount
    
    return {
      isEmpty: false,
      subtotal,
      platformFee,
      discount,
      total,
      items: cart
    }
  }, [cart, getCartTotal, isLoggedIn, hasUsedFirstOrderDiscount, currentOffer])

  // Show celebratory popup when discount is applied
  React.useEffect(() => {
    const discount = cartSummary?.discount || 0
    if (discount > 0 && !hasShownPopup.current && isOpen && isLoggedIn) {
      hasShownPopup.current = true
      setDiscountAmount(discount)
      setShowDiscountPopup(true)
      // Auto-dismiss after 4 seconds
      popupTimeout.current = setTimeout(() => {
        setShowDiscountPopup(false)
      }, 4000)
    }
  }, [cartSummary, isOpen, isLoggedIn])

  const handleSubmit = async () => {
    // For logged-in users, use their stored information
    const finalCustomerInfo = isLoggedIn ? {
      name: currentCustomer?.full_name || currentCustomer?.name || currentCustomer?.customer_name || '',
      phone: currentCustomer?.phone || currentCustomer?.customer_phone || '',
      email: currentCustomer?.email || currentCustomer?.customer_email || '',
      paymentMethod: selectedPayment || 'cash',
      specialInstructions: ''
    } : customerInfo

    // Validate required fields
    if (!finalCustomerInfo.name || !finalCustomerInfo.phone) {
      toast.error('Customer information is missing. Please try logging in again.')
      console.error('Missing customer info:', { currentCustomer, finalCustomerInfo })
      return
    }

    if (!cart || cart.length === 0) {
      toast.error('Your cart is empty')
      return
    }

    setLoading(true)

    try {
      console.log('🛒 Starting complete checkout workflow...')
      console.log('Customer info:', finalCustomerInfo)

      // Step 1: Update customer session with customer info
      await customerService.updateCustomerSession(sessionId, {
        customer_name: finalCustomerInfo.name,
        customer_phone: finalCustomerInfo.phone,
        customer_email: finalCustomerInfo.email
      })

      // Step 2: Create order using UnifiedOrderService with cart items
      const orderResult = await UnifiedOrderService.createOrder({
        source: 'customer',
        restaurantId,
        tableId,
        cartItems: cart,
        customerInfo: {
          name: finalCustomerInfo.name,
          phone: finalCustomerInfo.phone,
          email: finalCustomerInfo.email,
          customerId: isLoggedIn ? currentCustomer?.id : null // Pass customer ID for logged-in users
        },
        specialInstructions: finalCustomerInfo.specialInstructions,
        paymentMethod: finalCustomerInfo.paymentMethod,
        tipAmount: selectedTip,
        discountAmount: discount,
        firstOrderDiscountApplied: discount > 0
      })

      if (!orderResult || !orderResult.id) {
        throw new Error('Failed to create order')
      }

      console.log('✅ Order created successfully:', orderResult.order_number)
      
      // Clear cart only after successful order creation
      clearCart()
      
      // Payment is handled within UnifiedOrderService
      // For cash payments, staff will collect when ready
      // For online payments, additional processing can be added here if needed

      // Step 3: Set success state with complete order data
      setOrderData({
        ...orderResult,
        customerInfo,
        total: cartSummary.total + selectedTip,
        paymentMethod: customerInfo.paymentMethod
      })
      setOrderSuccess(true)

      // Step 4: Show appropriate success message
      if (customerInfo.paymentMethod === 'cash') {
        toast.success(`Order #${orderResult.order_number} placed! Staff will collect payment when ready.`, {
          icon: '🛎️',
          duration: 4000
        })
      } else {
        toast.success(`Order #${orderResult.order_number} placed successfully!`, {
          icon: '✅',
          duration: 4000
        })
      }

      // Step 5: Start real-time order tracking
      try {
        realtimeService.subscribeToOrderUpdates(orderResult.id, {
          onStatusUpdate: (data) => {
            toast.success(`Order status updated: ${data.status}`, {
              icon: '📋'
            })
          },
          onStaffAssigned: (data) => {
            toast.success(`Order assigned to staff member`, {
              icon: '👨‍🍳'
            })
          }
        })
      } catch (realtimeError) {
        console.warn('Real-time tracking setup failed:', realtimeError)
        // Continue without real-time updates
      }

      // Call success callback with order data
      if (onSuccess) {
        onSuccess(orderResult)
      }
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose()
        setOrderSuccess(false)
        setOrderData(null)
      }, 3000)

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

  // Calculate totals from cart summary
  const subtotal = cartSummary?.subtotal || 0
  const platformFee = cartSummary?.platformFee || 0
  const discount = cartSummary?.discount || 0
  const total = cartSummary?.total || 0

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

  // If user is logged in, show minimal payment selection
  if (isLoggedIn) {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="p-4 border-b flex items-center gap-3">
                <button onClick={onClose} className="p-2">
                  <ArrowLeftIcon className="w-5 h-5" style={{ color: DARK_TEXT }} />
                </button>
                <h3 className="text-base font-bold" style={{ color: DARK_TEXT }}>
                  Bill total: ₹{(cartSummary.total + selectedTip).toFixed(0)}
                </h3>
              </div>

              {/* Payment Options */}
              <div className="p-4">
                {/* Pay at Counter */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold mb-3" style={{ color: DARK_TEXT }}>Recommended</h4>
                  <button
                    onClick={() => setSelectedPayment('cash')}
                    className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition-all ${
                      selectedPayment === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <BanknotesIcon className="w-6 h-6" style={{ color: ACTION_GREEN }} />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: DARK_TEXT }}>Pay at Counter</span>
                    </div>
                    <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center" 
                      style={{ borderColor: selectedPayment === 'cash' ? ACTION_GREEN : '#E0E0E0' }}>
                      {selectedPayment === 'cash' && (
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ACTION_GREEN }}></div>
                      )}
                    </div>
                  </button>
                </div>

                {/* UPI Options - Coming Soon */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold mb-3" style={{ color: DARK_TEXT }}>UPI</h4>
                  <div className="space-y-2 opacity-50 pointer-events-none">
                    {['Paytm UPI', 'Google Pay UPI', 'PhonePe UPI'].map((option) => (
                      <div key={option} className="w-full p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                        <span className="text-sm" style={{ color: DARK_TEXT }}>{option}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded" style={{ color: MEDIUM_GRAY }}>
                          Coming Soon
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cards - Coming Soon */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold mb-3" style={{ color: DARK_TEXT }}>Cards</h4>
                  <div className="w-full p-3 rounded-xl border border-gray-200 flex items-center justify-between opacity-50">
                    <span className="text-sm" style={{ color: DARK_TEXT }}>Add credit or debit cards</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded" style={{ color: MEDIUM_GRAY }}>
                      Coming Soon
                    </span>
                  </div>
                </div>

                {/* Wallets - Coming Soon */}
                <div>
                  <h4 className="text-sm font-bold mb-3" style={{ color: DARK_TEXT }}>Wallets</h4>
                  <div className="space-y-2 opacity-50 pointer-events-none">
                    {['Blinkit Money', 'Amazon Pay Balance', 'Mobikwik'].map((option) => (
                      <div key={option} className="w-full p-3 rounded-xl border border-gray-200 flex items-center justify-between">
                        <span className="text-sm" style={{ color: DARK_TEXT }}>{option}</span>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded" style={{ color: MEDIUM_GRAY }}>
                          Coming Soon
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Place Order Button */}
              <div className="p-4 border-t">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full py-3.5 text-black font-bold text-sm uppercase rounded-xl disabled:opacity-50"
                  style={{ 
                    backgroundColor: '#00C853',
                    boxShadow: '0 4px 0 0 #000000'
                  }}
                >
                  {loading ? 'Processing...' : 'Place Order'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  // For non-logged-in users, show full form
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
                {discount > 0 && (
                  <div className="flex justify-between text-sm font-semibold" style={{ color: ACTION_GREEN }}>
                    <span>🎉 First Order Discount (10%)</span>
                    <span>-₹{discount.toFixed(2)}</span>
                  </div>
                )}
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

        {/* Celebratory Discount Popup - Minimal Design */}
        <AnimatePresence>
          {showDiscountPopup && discountAmount > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-sm"
              onClick={() => setShowDiscountPopup(false)}
            >
              {/* Outer Sparkles - Burst Effect */}
              {[...Array(30)].map((_, i) => {
                const angle = (i / 30) * 360
                const distance = 150 + Math.random() * 100
                return (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      scale: 0, 
                      opacity: 0,
                      rotate: 0
                    }}
                    animate={{
                      x: Math.cos(angle * Math.PI / 180) * distance,
                      y: Math.sin(angle * Math.PI / 180) * distance,
                      scale: [0, 1.5, 1],
                      opacity: [0, 1, 0],
                      rotate: [0, 360]
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.02,
                      ease: "easeOut"
                    }}
                    className="absolute"
                    style={{ pointerEvents: 'none' }}
                  >
                    <span className="text-yellow-400 text-2xl">✨</span>
                  </motion.div>
                )
              })}

              {/* Popup Card - Minimal Design */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="bg-white rounded-2xl p-6 max-w-xs w-full mx-4 relative z-10"
                style={{ boxShadow: '0 0 0 3px #000000' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Simple Content */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  >
                    <span className="text-6xl block mb-3">🎉</span>
                  </motion.div>
                  
                  <h3 className="text-xl font-black mb-2" style={{ color: '#00C853' }}>
                    YAY!
                  </h3>
                  
                  <p className="text-sm mb-2 font-semibold" style={{ color: '#00C853' }}>
                    You saved
                  </p>
                  
                  <p className="text-4xl font-black mb-2" style={{ color: '#00C853' }}>
                    ₹{discountAmount.toFixed(0)}
                  </p>
                  
                  <p className="text-xs mb-5 font-medium" style={{ color: '#00C853' }}>
                    First order discount applied! 🎊
                  </p>
                  
                  {/* Playful Boxy Button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (popupTimeout.current) {
                        clearTimeout(popupTimeout.current)
                      }
                      setShowDiscountPopup(false)
                    }}
                    className="w-full py-3.5 font-black text-black text-sm uppercase rounded-xl"
                    style={{ 
                      backgroundColor: '#00C853',
                      boxShadow: '0 4px 0 0 #000000'
                    }}
                  >
                    AWESOME! 🎉
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}

export default CheckoutModal
