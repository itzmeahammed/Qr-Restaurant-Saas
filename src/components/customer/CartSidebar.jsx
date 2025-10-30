import React, { useState, useEffect } from 'react'
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

  const subtotal = getCartTotal()
  const platformFee = subtotal * 0.015 // 1.5% platform fee
  const total = subtotal + platformFee + selectedTip

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
        </>
      )}
    </AnimatePresence>
  )
}

export default CartSidebar
