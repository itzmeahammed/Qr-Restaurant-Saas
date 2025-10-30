import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TableCellsIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  ShoppingCartIcon,
  CreditCardIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  StarIcon,
  GiftIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import tableService from '../../services/tableService'
import UnifiedOrderService from '../../services/unifiedOrderService'
import { supabase } from '../../config/supabase'
import useCartStore from '../../stores/useCartStore'
import toast from 'react-hot-toast'

const StaffOrderingFlow = ({ restaurantId, staffId, onClose }) => {
  const [currentStep, setCurrentStep] = useState('table') // table -> customer -> menu -> cart -> payment -> complete
  const [selectedTable, setSelectedTable] = useState(null)
  const [availableTables, setAvailableTables] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: ''
  })
  const [menuCategories, setMenuCategories] = useState([])
  const [menuItems, setMenuItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loyaltyInfo, setLoyaltyInfo] = useState(null)
  const [sessionId, setSessionId] = useState(null)

  // Cart store integration
  const { 
    cart, 
    addToCart, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    getCartTotal,
    initializeSession 
  } = useCartStore()

  // No longer need order store - using unified service

  useEffect(() => {
    loadAvailableTables()
    loadMenuData()
  }, [restaurantId])

  const loadAvailableTables = async () => {
    try {
      // Load all tables with their status for staff view
      const tables = await tableService.getRestaurantTables(restaurantId)
      console.log('📋 Loaded tables for staff:', tables)
      setAvailableTables(tables)
    } catch (error) {
      console.error('Error loading tables:', error)
      toast.error('Failed to load tables')
    }
  }

  const loadMenuData = async () => {
    try {
      // Load categories
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('sort_order')

      if (catError) throw catError
      setMenuCategories(categories)

      // Load all menu items
      const { data: items, error: itemsError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_available', true)
        .order('sort_order')

      if (itemsError) throw itemsError
      setMenuItems(items)

      if (categories.length > 0) {
        setSelectedCategory(categories[0].id)
      }
    } catch (error) {
      console.error('Error loading menu:', error)
      toast.error('Failed to load menu')
    }
  }

  const handleTableSelect = (table) => {
    setSelectedTable(table)
    setCurrentStep('customer')
  }

  const handleCustomerInfoSubmit = async () => {
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) {
      toast.error('Please enter customer name and phone number')
      return
    }

    try {
      setLoading(true)

      // Don't create customer session yet - just save info and proceed to menu
      // Session will be created when order is placed
      
      // Initialize cart session for menu browsing
      initializeSession(restaurantId, selectedTable.id)

      // Check loyalty points if email provided
      if (customerInfo.email) {
        await checkLoyaltyPoints()
      }

      // Just proceed to menu selection - no session or reservation yet
      toast.success(`Customer info saved for Table ${selectedTable.table_number}`)
      setCurrentStep('menu')
    } catch (error) {
      console.error('Error creating customer session:', error)
      toast.error('Failed to create customer session')
    } finally {
      setLoading(false)
    }
  }

  const checkLoyaltyPoints = async () => {
    try {
      // First, try to find existing customer by email in customer_sessions or orders
      const { data: existingCustomer, error: customerError } = await supabase
        .from('customer_sessions')
        .select('customer_id')
        .eq('customer_email', customerInfo.email)
        .eq('restaurant_id', restaurantId)
        .not('customer_id', 'is', null)
        .limit(1)
        .maybeSingle() // Use maybeSingle to avoid PGRST116 error

      let customerId = null
      if (!customerError && existingCustomer?.customer_id) {
        customerId = existingCustomer.customer_id
        
        // Check if customer has existing loyalty account
        const { data: loyaltyData, error: loyaltyError } = await supabase
          .from('loyalty_points')
          .select('*')
          .eq('restaurant_id', restaurantId)
          .eq('customer_id', customerId)
          .maybeSingle() // Use maybeSingle to avoid PGRST116 error

        if (!loyaltyError && loyaltyData) {
          setLoyaltyInfo(loyaltyData)
          toast.success(`Welcome back! You have ${loyaltyData.current_balance} loyalty points`)
          return
        }
      }
      
      // New customer - will create loyalty account after order
      setLoyaltyInfo({ isNew: true, points: 0, email: customerInfo.email })
    } catch (error) {
      console.error('Error checking loyalty:', error)
    }
  }

  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      category_id: item.category_id
    })
    toast.success(`${item.name} added to cart`)
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      toast.error('Please add items to cart')
      return
    }

    try {
      setLoading(true)

      // Check if table is still available before placing order
      try {
        const availableTables = await tableService.getAvailableTables(restaurantId)
        const isTableStillAvailable = availableTables.some(table => table.id === selectedTable.id)
        
        if (!isTableStillAvailable) {
          toast.error('This table is no longer available. Please select another table.')
          setCurrentStep('table')
          await loadAvailableTables()
          return
        }
      } catch (availabilityError) {
        console.warn('Could not check table availability, proceeding with order:', availabilityError)
        // Continue with order placement even if availability check fails
      }

      // Create customer session and reserve table NOW when placing the order
      const newSessionId = `staff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      console.log('🔄 Creating complete staff-assisted order:', {
        sessionId: newSessionId,
        tableId: selectedTable.id,
        tableName: selectedTable.table_number,
        customerInfo: customerInfo,
        cartItems: cart,
        restaurantId,
        staffId
      })

      // Debug cart items structure
      console.log('🛒 Cart items being passed to UnifiedOrderService:', cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        priceType: typeof item.price,
        quantityType: typeof item.quantity,
        hasPrice: item.price !== undefined && item.price !== null,
        hasQuantity: item.quantity !== undefined && item.quantity !== null
      })))

      // Use unified order service for staff-assisted orders
      console.log('🔄 Creating staff-assisted order with unified service')
      
      const order = await UnifiedOrderService.createOrder({
        source: 'staff',
        restaurantId: restaurantId,
        tableId: selectedTable.id,
        cartItems: cart,
        customerInfo: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email || null
        },
        staffId: staffId,
        specialInstructions: '',
        paymentMethod: 'cash',
        tipAmount: 0
      })

      console.log('✅ Staff-assisted order created successfully:', order)
      setSessionId(order.session_id)

      // Create loyalty points if email provided
      if (customerInfo.email && order) {
        await createLoyaltyTransaction(order)
      }

      // Clear the cart after successful order
      clearCart()

      setCurrentStep('payment')
      toast.success(`Order #${order.order_number} placed successfully!`)
    } catch (error) {
      console.error('❌ Error placing order:', error)
      toast.error(`Failed to place order: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const createLoyaltyTransaction = async (order) => {
    try {
      // Only create loyalty points if customer provided email
      if (!customerInfo.email) return

      const pointsEarned = Math.floor(order.total_amount * 0.1) // 10% of order value as points
      
      // Get customer ID from the order (should be set by UnifiedOrderService)
      let customerId = order.customer_id
      
      // If no customer_id in order, try to create customer record
      if (!customerId && customerInfo.email) {
        try {
          console.log('👤 Creating customer record for loyalty points:', customerInfo)
          
          const { data: customerResult, error: customerError } = await supabase
            .rpc('get_or_create_guest_customer', {
              p_email: customerInfo.email,
              p_phone: customerInfo.phone,
              p_full_name: customerInfo.name
            })
          
          if (!customerError && customerResult) {
            customerId = customerResult
            console.log('✅ Customer record created for loyalty:', customerId)
          } else {
            console.warn('⚠️ Could not create customer for loyalty points:', customerError)
            return // Skip loyalty points if no customer
          }
        } catch (error) {
          console.warn('⚠️ Error creating customer for loyalty points:', error)
          return // Skip loyalty points if error
        }
      }
      
      if (!customerId) {
        console.log('ℹ️ No customer ID available, skipping loyalty points')
        return
      }

      // Check if loyalty account exists
      const { data: existingLoyalty } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('customer_id', customerId)
        .maybeSingle() // Use maybeSingle to avoid PGRST116 error

      if (existingLoyalty) {
        // Update existing loyalty account
        const { error } = await supabase
          .from('loyalty_points')
          .update({
            points_earned: existingLoyalty.points_earned + pointsEarned,
            current_balance: existingLoyalty.current_balance + pointsEarned,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingLoyalty.id)

        if (!error) {
          toast.success(`Customer earned ${pointsEarned} loyalty points! Total: ${existingLoyalty.current_balance + pointsEarned}`)
        }
      } else {
        // Create new loyalty account with proper error handling
        console.log('🎯 Creating new loyalty account:', {
          customer_id: customerId,
          restaurant_id: restaurantId,
          points_earned: pointsEarned,
          current_balance: pointsEarned,
          tier: 'bronze'
        })
        
        const { error } = await supabase
          .from('loyalty_points')
          .insert({
            customer_id: customerId,
            restaurant_id: restaurantId,
            points_earned: pointsEarned,
            current_balance: pointsEarned,
            tier: 'bronze'
          })

        if (error) {
          console.error('❌ Loyalty points creation error:', error)
          toast.error(`Failed to create loyalty account: ${error.message}`)
        } else {
          toast.success(`Customer earned ${pointsEarned} loyalty points!`)
        }
      }
    } catch (error) {
      console.error('❌ Error in loyalty points process:', error)
      toast.error(`Loyalty points error: ${error.message}`)
    }
  }

  const handlePaymentComplete = () => {
    clearCart()
    setCurrentStep('complete')
    toast.success('Payment completed successfully!')
  }

  const handleStartNewOrder = () => {
    setCurrentStep('table')
    setSelectedTable(null)
    setCustomerInfo({ name: '', phone: '', email: '' })
    setLoyaltyInfo(null)
    setSessionId(null)
    clearCart()
  }

  const filteredMenuItems = selectedCategory 
    ? menuItems.filter(item => item.category_id === selectedCategory)
    : menuItems

  const cartTotal = getCartTotal()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Staff Assisted Ordering</h2>
              <p className="text-orange-100">
                {currentStep === 'table' && 'Select a table for the customer'}
                {currentStep === 'customer' && 'Enter customer information'}
                {currentStep === 'menu' && 'Browse menu and add items'}
                {currentStep === 'cart' && 'Review order and proceed to payment'}
                {currentStep === 'payment' && 'Process payment'}
                {currentStep === 'complete' && 'Order completed successfully'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-4">
            {['table', 'customer', 'menu', 'payment', 'complete'].map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep === step 
                    ? 'bg-white text-orange-500' 
                    : index < ['table', 'customer', 'menu', 'payment', 'complete'].indexOf(currentStep)
                    ? 'bg-orange-300 text-orange-700'
                    : 'bg-orange-600 text-orange-200'
                }`}>
                  {index + 1}
                </div>
                {index < 4 && (
                  <div className={`w-8 h-1 mx-2 ${
                    index < ['table', 'customer', 'menu', 'payment', 'complete'].indexOf(currentStep)
                      ? 'bg-orange-300'
                      : 'bg-orange-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <AnimatePresence mode="wait">
            {/* Step 1: Table Selection */}
            {currentStep === 'table' && (
              <motion.div
                key="table"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4">Select Table</h3>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Available tables</span> can be reserved immediately. 
                    <span className="font-medium text-red-600"> Occupied tables</span> are currently in use.
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableTables.map((table) => {
                    const isAvailable = table.reservation_status === 'available'
                    return (
                      <motion.button
                        key={table.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => isAvailable ? handleTableSelect(table) : toast.error(`Table ${table.table_number} is currently occupied`)}
                        className={`p-4 border-2 rounded-xl transition-all ${
                          isAvailable 
                            ? 'border-green-200 bg-green-50 hover:border-green-500 hover:bg-green-100' 
                            : 'border-red-200 bg-red-50 opacity-75 cursor-not-allowed'
                        }`}
                      >
                        <TableCellsIcon className={`h-8 w-8 mx-auto mb-2 ${
                          isAvailable ? 'text-green-500' : 'text-red-500'
                        }`} />
                        <div className="font-bold text-gray-900">Table {table.table_number}</div>
                        <div className="text-sm text-gray-600">Capacity: {table.capacity}</div>
                        {table.location && (
                          <div className="text-xs text-gray-500 mt-1">{table.location}</div>
                        )}
                        <div className={`text-xs font-medium mt-2 px-2 py-1 rounded-full ${
                          isAvailable 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {isAvailable ? '✅ Available' : '🔴 Occupied'}
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
                {availableTables.length === 0 && (
                  <div className="text-center py-8">
                    <TableCellsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tables found. Please check your restaurant setup.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Customer Information */}
            {currentStep === 'customer' && (
              <motion.div
                key="customer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Customer Information</h3>
                  <div className="bg-orange-50 p-4 rounded-xl mb-6">
                    <div className="flex items-center text-orange-700">
                      <TableCellsIcon className="h-5 w-5 mr-2" />
                      <span className="font-medium">Table {selectedTable?.table_number}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Customer Name *
                      </label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter customer name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <div className="relative">
                        <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email (Optional - for loyalty points)
                      </label>
                      <div className="relative">
                        <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Enter email for loyalty points"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        <GiftIcon className="h-4 w-4 inline mr-1" />
                        Earn loyalty points with every order
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={() => setCurrentStep('table')}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <ArrowLeftIcon className="h-5 w-5 inline mr-2" />
                      Back
                    </button>
                    <button
                      onClick={handleCustomerInfoSubmit}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Continue'}
                      <ArrowRightIcon className="h-5 w-5 inline ml-2" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Menu Selection */}
            {currentStep === 'menu' && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Categories Sidebar */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Categories</h3>
                  <div className="space-y-2">
                    {menuCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left p-3 rounded-xl transition-all ${
                          selectedCategory === category.id
                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>

                  {/* Cart Summary */}
                  {cart.length > 0 && (
                    <div className="mt-6 p-4 bg-orange-50 rounded-xl">
                      <h4 className="font-bold text-gray-900 mb-2">Cart Summary</h4>
                      <div className="space-y-2">
                        {cart.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name} x{item.quantity}</span>
                            <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-orange-200 mt-2 pt-2">
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span>₹{cartTotal.toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        onClick={handlePlaceOrder}
                        disabled={loading}
                        className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
                      >
                        {loading ? 'Placing Order...' : 'Place Order'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Menu Items */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Menu Items</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMenuItems.map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all"
                      >
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-32 object-cover rounded-lg mb-3"
                          />
                        )}
                        <h4 className="font-bold text-gray-900 mb-1">{item.name}</h4>
                        {item.description && (
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-orange-600">₹{item.price}</span>
                          <div className="flex items-center space-x-2">
                            {cart.find(cartItem => cartItem.id === item.id) ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => updateQuantity(item.id, cart.find(cartItem => cartItem.id === item.id).quantity - 1)}
                                  className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                >
                                  <MinusIcon className="h-4 w-4" />
                                </button>
                                <span className="font-bold">
                                  {cart.find(cartItem => cartItem.id === item.id)?.quantity || 0}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.id, cart.find(cartItem => cartItem.id === item.id).quantity + 1)}
                                  className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleAddToCart(item)}
                                className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:from-orange-600 hover:to-red-600 transition-all"
                              >
                                <PlusIcon className="h-4 w-4 inline mr-1" />
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Payment */}
            {currentStep === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="max-w-md mx-auto text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Collection</h3>
                  <div className="bg-green-50 p-6 rounded-xl mb-6">
                    <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-green-700 font-medium">Order placed successfully!</p>
                    <p className="text-green-600 text-sm mt-1">Total Amount: ₹{cartTotal.toFixed(2)}</p>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handlePaymentComplete}
                      className="w-full p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all"
                    >
                      <BanknotesIcon className="h-6 w-6 inline mr-2" />
                      Cash Payment Collected
                    </button>
                    <button
                      onClick={handlePaymentComplete}
                      className="w-full p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all"
                    >
                      <CreditCardIcon className="h-6 w-6 inline mr-2" />
                      Card Payment Processed
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: Complete */}
            {currentStep === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="max-w-md mx-auto text-center">
                  <div className="bg-green-50 p-8 rounded-xl mb-6">
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-green-700 mb-2">Order Complete!</h3>
                    <p className="text-green-600">Payment collected successfully</p>
                    {loyaltyInfo && customerInfo.email && (
                      <div className="mt-4 p-3 bg-orange-100 rounded-lg">
                        <StarIcon className="h-5 w-5 text-orange-500 inline mr-2" />
                        <span className="text-orange-700 font-medium">
                          Loyalty points earned!
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleStartNewOrder}
                      className="w-full p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all"
                    >
                      Start New Order
                    </button>
                    <button
                      onClick={onClose}
                      className="w-full p-4 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default StaffOrderingFlow
