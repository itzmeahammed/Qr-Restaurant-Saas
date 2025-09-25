import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCartIcon, 
  PlusIcon, 
  MinusIcon,
  XMarkIcon,
  TrashIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import useCartStore from '../../stores/useCartStore'

const CartSidebar = ({ isOpen, onClose, onCheckout, selectedTip = 0 }) => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount } = useCartStore()

  const subtotal = getCartTotal()
  const tax = subtotal * 0.18
  const total = subtotal + tax + selectedTip

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

          {/* Awesome Mobile Cart Sidebar */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white z-50 shadow-2xl flex flex-col"
          >
            {/* Swipe Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Awesome Header */}
            <div className="bg-gradient-to-r from-black to-gray-800 text-white p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                    >
                      <ShoppingCartIcon className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-black tracking-tight">YOUR CART</h2>
                      <p className="text-white/80 font-medium">{getCartCount()} delicious items</p>
                    </div>
                  </div>
                  
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-all"
                  >
                    <XMarkIcon className="w-5 h-5 text-white" />
                  </motion.button>
                </div>
                
                {subtotal > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="bg-white/10 backdrop-blur-md rounded-2xl p-3 mt-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white/80">Subtotal</span>
                      <span className="text-xl font-bold text-white">₹{subtotal.toFixed(2)}</span>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Decorative Elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
              {cart.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", bounce: 0.4 }}
                    className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg"
                  >
                    <ShoppingCartIcon className="w-12 h-12 text-gray-400" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
                  <p className="text-gray-600 mb-6">Add some delicious items to get started!</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="px-6 py-3 bg-black text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all"
                  >
                    Browse Menu
                  </motion.button>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4">
                        {/* Item Image */}
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover rounded-2xl" />
                          ) : (
                            <SparklesIcon className="w-8 h-8 text-gray-400" />
                          )}
                        </div>
                        
                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
                          <p className="text-sm text-gray-600 truncate">{item.description}</p>
                          <p className="text-lg font-bold text-black mt-1">₹{item.price}</p>
                        </div>
                        
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 bg-gray-100 rounded-2xl p-1">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                              className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all"
                            >
                              <MinusIcon className="w-4 h-4 text-gray-600" />
                            </motion.button>
                            
                            <span className="w-8 text-center font-bold text-gray-900">{item.quantity}</span>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-8 h-8 bg-black rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all"
                            >
                              <PlusIcon className="w-4 h-4 text-white" />
                            </motion.button>
                          </div>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => removeFromCart(item.id)}
                            className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center hover:bg-red-200 transition-all"
                          >
                            <TrashIcon className="w-4 h-4 text-red-500" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Checkout Section */}
            {cart.length > 0 && (
              <div className="bg-white border-t border-gray-200 p-6">
                {/* Bill Summary */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Tax (18%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  {selectedTip > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tip</span>
                      <span>₹{selectedTip.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-xl font-bold text-black">
                      <span>Total</span>
                      <span>₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCheckout}
                  className="w-full bg-gradient-to-r from-black to-gray-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <SparklesIcon className="w-6 h-6" />
                  <span>Proceed to Checkout</span>
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
