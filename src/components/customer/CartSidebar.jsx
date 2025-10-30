import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCartIcon, 
  PlusIcon, 
  MinusIcon,
  XMarkIcon,
  TrashIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import useCartStore from '../../stores/useCartStore'
import { supabase } from '../../config/supabase'

// Ordyrr Brand Colors
const BRAND_GREEN = '#00E676'
const ACTION_GREEN = '#00C853'
const DARK_TEXT = '#212121'
const MEDIUM_GRAY = '#666666'

const CartSidebar = ({ isOpen, onClose, onCheckout, selectedTip = 0, currentCustomer, isAuthenticated, restaurantId, allMenuItems = [] }) => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount, addToCart } = useCartStore()
  const [hasUsedFirstOrderDiscount, setHasUsedFirstOrderDiscount] = useState(false)
  const [showDiscountPopup, setShowDiscountPopup] = useState(false)
  const [currentOffer, setCurrentOffer] = useState(null)
  const hasShownPopup = useRef(false)
  const popupTimeout = useRef(null)

  // Check if customer has used the first order offer
  useEffect(() => {
    const checkOfferEligibility = async () => {
      if (currentCustomer?.id) {
        try {
          console.log('🔍 Checking offer eligibility for customer:', currentCustomer.id)
          
          // Get the first order offer
          const { data: offer, error: offerError } = await supabase
            .from('offers')
            .select('*')
            .eq('offer_code', 'FIRST_ORDER_10')
            .eq('is_active', true)
            .single()
          
          if (offerError || !offer) {
            console.log('❌ First order offer not found or inactive')
            return
          }
          
          console.log('✅ Found offer:', offer.offer_code, 'Offer ID:', offer.id)
          setCurrentOffer(offer)
          
          // Check if customer has already used this offer
          const { data: usageData, error: usageError } = await supabase
            .from('customer_offers')
            .select('*')
            .eq('customer_id', currentCustomer.id)
            .eq('offer_id', offer.id)
          
          console.log('📊 Customer offer usage check:', {
            customer_id: currentCustomer.id,
            offer_id: offer.id,
            usageData,
            usageError,
            hasUsed: usageData && usageData.length > 0
          })
          
          if (!usageError && usageData && usageData.length > 0) {
            // Customer has already used this offer
            console.log('🚫 Customer has already used this offer')
            setHasUsedFirstOrderDiscount(true)
          } else {
            console.log('✅ Customer eligible for first order discount')
            setHasUsedFirstOrderDiscount(false)
          }
        } catch (error) {
          console.error('❌ Error checking offer eligibility:', error)
        }
      }
    }
    checkOfferEligibility()
  }, [currentCustomer])

  const subtotal = getCartTotal()
  
  // Calculate automatic discount based on offer
  let discount = 0
  if (isAuthenticated && !hasUsedFirstOrderDiscount && currentOffer && subtotal >= (currentOffer.min_order_amount || 0)) {
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
  
  // Reset popup flag when cart sidebar opens
  useEffect(() => {
    if (isOpen) {
      hasShownPopup.current = false
    }
  }, [isOpen])

  // Show celebratory popup when discount is applied
  useEffect(() => {
    if (discount > 0 && !hasShownPopup.current && isOpen && isAuthenticated) {
      hasShownPopup.current = true
      setShowDiscountPopup(true)
      // Auto-dismiss after 4 seconds
      popupTimeout.current = setTimeout(() => {
        setShowDiscountPopup(false)
      }, 4000)
    }
  }, [discount, isOpen, isAuthenticated])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (popupTimeout.current) {
        clearTimeout(popupTimeout.current)
      }
    }
  }, [])
  
  const platformFee = subtotal * 0.015 // 1.5% platform fee
  const total = subtotal + platformFee - discount + selectedTip

  // Get suggested items (items not in cart)
  const cartItemIds = cart.map(item => item.id)
  const suggestedItems = allMenuItems
    .filter(item => !cartItemIds.includes(item.id) && item.is_available)
    .slice(0, 6)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Cart Sidebar */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >

            {/* Header - Clean White Style */}
            <div className="bg-white border-b border-gray-200">
              <div className="p-4 flex items-center gap-4">
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center"
                >
                  <ArrowLeftIcon className="w-6 h-6" style={{ color: DARK_TEXT }} />
                </motion.button>
                <h2 className="text-xl font-bold" style={{ color: DARK_TEXT }}>Checkout</h2>
              </div>
            </div>

            {/* Cart Items - Scrollable */}
            <div className="flex-1 overflow-y-auto bg-white">
              {cart.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16 px-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
                    className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${BRAND_GREEN} 0%, ${ACTION_GREEN} 100%)` }}
                  >
                    <ShoppingCartIcon className="w-12 h-12 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-black mb-2" style={{ color: DARK_TEXT }}>Your cart is empty</h3>
                  <p className="mb-6" style={{ color: MEDIUM_GRAY }}>Add some delicious items to get started!</p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-8 py-3 text-white rounded-xl font-bold shadow-lg"
                    style={{ backgroundColor: ACTION_GREEN }}
                  >
                    Browse Menu
                  </motion.button>
                </motion.div>
              ) : (
                <>
                  {/* Delivery Info */}
                  <div className="p-4 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-sm">⏱</span>
                      </div>
                      <div>
                        <p className="font-bold text-sm" style={{ color: DARK_TEXT }}>Delivery in 17 minutes</p>
                        <p className="text-xs" style={{ color: MEDIUM_GRAY }}>{cart.length} items</p>
                      </div>
                    </div>
                  </div>

                  {/* Cart Items List */}
                  <div className="p-4 space-y-3">
                    {cart.map((item, index) => (
                      <div key={item.id} className="flex gap-3">
                        {/* Item Image */}
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">🍽️</span>
                          )}
                        </div>
                        
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm mb-0.5" style={{ color: DARK_TEXT }}>{item.name}</h4>
                          <p className="text-xs mb-1" style={{ color: MEDIUM_GRAY }}>1 piece</p>
                          <div className="flex items-center gap-1 text-xs mb-2" style={{ color: MEDIUM_GRAY }}>
                            <span>⏱</span>
                            <span>15 mins</span>
                          </div>
                        </div>

                        {/* Quantity & Price */}
                        <div className="flex flex-col items-end justify-between">
                          <div 
                            className="flex items-center justify-between"
                            style={{ 
                              backgroundColor: '#00C853',
                              borderRadius: '8px',
                              padding: '4px 10px',
                              minWidth: '75px',
                              boxShadow: '0 3px 0 0 #000000'
                            }}
                          >
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                              className="text-black font-bold text-base leading-none"
                            >
                              −
                            </button>
                            <span className="text-black font-bold text-base px-1.5">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="text-black font-bold text-base leading-none"
                            >
                              +
                            </button>
                          </div>
                          <p className="font-bold text-sm mt-1" style={{ color: DARK_TEXT }}>₹{(item.price * item.quantity).toFixed(0)}</p>
                        </div>
                      </div>
                    ))}

                    {/* Add More Items */}
                    <button
                      onClick={onClose}
                      className="w-full py-2 text-center font-semibold text-sm"
                      style={{ color: ACTION_GREEN }}
                    >
                      + Add more items
                    </button>
                  </div>

                  {/* You Might Also Like - Horizontal Scrolling */}
                  <div className="border-t">
                    <h4 className="px-4 pt-4 mb-3 font-black italic uppercase text-base" style={{ color: DARK_TEXT }}>
                      MORE DELICIOUS ITEMS<span style={{ color: ACTION_GREEN }}>.</span>
                    </h4>
                    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4 pb-4">
                      {suggestedItems.map((item) => (
                        <div 
                          key={item.id} 
                          className="bg-white rounded-2xl overflow-hidden flex-shrink-0"
                          style={{ boxShadow: '0px 2px 8px rgba(0,0,0,0.08)', width: '160px' }}
                        >
                          {/* Food Image */}
                          <div className="relative bg-gray-100" style={{ height: '110px', borderRadius: '16px 16px 0 0' }}>
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-4xl">🍽️</span>
                              </div>
                            )}
                          </div>

                          {/* Card Content */}
                          <div className="p-2.5">
                            <div className="flex items-center gap-1 mb-1.5">
                              <div className="w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: '#4CAF50' }}>
                                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#4CAF50' }}></div>
                              </div>
                              <span className="text-[10px] font-medium" style={{ color: DARK_TEXT }}>⏱ 16 mins</span>
                              <span className="text-[10px] font-medium" style={{ color: MEDIUM_GRAY }}>2 cups</span>
                            </div>

                            <h5 className="font-bold text-xs mb-1.5 line-clamp-2" style={{ color: DARK_TEXT }}>{item.name}</h5>

                            <div className="flex items-center justify-between">
                              <p className="font-bold text-sm" style={{ color: DARK_TEXT }}>₹{item.price}</p>
                              <button
                                onClick={() => addToCart(item)}
                                className="px-3 py-1 text-xs font-bold text-black"
                                style={{ 
                                  backgroundColor: '#00C853',
                                  borderRadius: '6px',
                                  boxShadow: '0 2px 0 0 #000000'
                                }}
                              >
                                ADD
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Checkout Section */}
            {cart.length > 0 && (
              <div className="bg-white border-t p-4">
                {/* Bill Summary */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-xs" style={{ color: MEDIUM_GRAY }}>
                    <span>Subtotal</span>
                    <span style={{ color: DARK_TEXT }}>₹{subtotal.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-xs" style={{ color: MEDIUM_GRAY }}>
                    <span>Platform Fee (1.5%)</span>
                    <span style={{ color: DARK_TEXT }}>₹{platformFee.toFixed(0)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs font-semibold" style={{ color: ACTION_GREEN }}>
                      <span>🎉 First Order Discount (10%)</span>
                      <span>-₹{discount.toFixed(0)}</span>
                    </div>
                  )}
                  {selectedTip > 0 && (
                    <div className="flex justify-between text-xs" style={{ color: MEDIUM_GRAY }}>
                      <span>Tip</span>
                      <span style={{ color: DARK_TEXT }}>₹{selectedTip}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-black text-lg" style={{ color: DARK_TEXT }}>
                      <span>Total</span>
                      <span>₹{total.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onCheckout}
                  className="w-full text-black py-3.5 font-bold text-sm uppercase flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: '#00C853',
                    borderRadius: '12px',
                    boxShadow: '0 4px 0 0 #000000'
                  }}
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  <span>{isAuthenticated ? 'Select payment option' : 'Proceed to Checkout'}</span>
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </motion.button>
              </div>
            )}
          </motion.div>

          {/* Celebratory Discount Popup - Minimal Design */}
          <AnimatePresence>
            {showDiscountPopup && discount > 0 && (
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
                      ₹{discount.toFixed(0)}
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
        </>
      )}
    </AnimatePresence>
  )
}

export default CartSidebar
