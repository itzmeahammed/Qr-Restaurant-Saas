import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ShoppingCartIcon, 
  PlusIcon, 
  MinusIcon,
  XMarkIcon
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
            className="fixed inset-0 bg-black/50 z-50"
            onClick={onClose}
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="p-4 border-b bg-gradient-to-r from-orange-500 to-purple-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold">Your Cart</h2>
                    <p className="text-sm opacity-90">{getCartCount()} items</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <ShoppingCartIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Your cart is empty</p>
                    <p className="text-sm mt-2">Add items to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        className="bg-gray-50 rounded-lg p-3"
                      >
                        <div className="flex items-start gap-3">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-600">₹{item.price} each</p>
                            
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="p-1 bg-white rounded hover:bg-gray-100 transition-colors"
                              >
                                <MinusIcon className="h-4 w-4" />
                              </button>
                              <span className="w-8 text-center font-medium">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="p-1 bg-white rounded hover:bg-gray-100 transition-colors"
                              >
                                <PlusIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              ₹{(item.price * item.quantity).toFixed(2)}
                            </p>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 text-sm hover:text-red-700 mt-1"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with totals */}
              {cart.length > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="space-y-2 mb-4">
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
                        <span>₹{selectedTip}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total</span>
                      <span className="text-orange-500">₹{total.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={onCheckout}
                    className="w-full bg-gradient-to-r from-orange-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:shadow-lg transition-all"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CartSidebar
