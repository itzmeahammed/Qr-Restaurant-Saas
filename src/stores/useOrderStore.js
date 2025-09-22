import { create } from 'zustand'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

const useOrderStore = create((set, get) => ({
  orders: [],
  currentOrder: null,
  cart: [],
  loading: false,

  // Cart management
  addToCart: (item, quantity = 1) => {
    const cart = get().cart
    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    
    if (existingItem) {
      set({
        cart: cart.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        )
      })
    } else {
      set({ cart: [...cart, { ...item, quantity }] })
    }
    toast.success(`${item.name} added to cart`)
  },

  removeFromCart: (itemId) => {
    set({ cart: get().cart.filter(item => item.id !== itemId) })
    toast.success('Item removed from cart')
  },

  updateCartQuantity: (itemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(itemId)
      return
    }
    
    set({
      cart: get().cart.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    })
  },

  clearCart: () => {
    set({ cart: [] })
  },

  getCartTotal: () => {
    return get().cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  },

  // Order management
  createOrder: async (orderData) => {
    set({ loading: true })
    try {
      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          order_number: orderNumber,
          restaurant_id: orderData.restaurant_id,
          customer_name: orderData.customer_name,
          customer_phone: orderData.customer_phone,
          table_number: orderData.table_number,
          subtotal: orderData.subtotal,
          tax_amount: orderData.tax_amount || 0,
          tip_amount: orderData.tip_amount || 0,
          total_amount: orderData.total_amount,
          special_instructions: orderData.special_instructions,
          status: 'pending'
        }])
        .select()
        .single()

      if (orderError) throw orderError

      // Add order items
      const orderItems = get().cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        special_instructions: item.special_instructions || null
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      set({ currentOrder: order })
      get().clearCart()
      toast.success('Order placed successfully!')
      
      return { data: order, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    } finally {
      set({ loading: false })
    }
  },

  fetchOrders: async (restaurantId, filters = {}) => {
    set({ loading: true })
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            menu_items(name, price, image_url)
          ),
          users!orders_customer_id_fkey(full_name, phone),
          users!orders_staff_id_fkey(full_name)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.staff_id) {
        query = query.eq('staff_id', filters.staff_id)
      }

      const { data, error } = await query

      if (error) throw error
      set({ orders: data })
    } catch (error) {
      toast.error(error.message)
    } finally {
      set({ loading: false })
    }
  },

  updateOrderStatus: async (orderId, status, staffId = null) => {
    try {
      const updates = { status }
      
      if (status === 'assigned' && staffId) {
        updates.staff_id = staffId
        updates.assigned_at = new Date().toISOString()
      } else if (status === 'ready') {
        updates.prepared_at = new Date().toISOString()
      } else if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      set({
        orders: get().orders.map(order =>
          order.id === orderId ? { ...order, ...updates } : order
        )
      })

      toast.success(`Order ${status}`)
      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  },

  fetchOrderById: async (orderId) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            *,
            menu_items(name, price, image_url)
          ),
          restaurants(name, phone),
          users!orders_staff_id_fkey(full_name, phone)
        `)
        .eq('id', orderId)
        .single()

      if (error) throw error
      set({ currentOrder: data })
      return { data, error: null }
    } catch (error) {
      toast.error(error.message)
      return { data: null, error }
    }
  }
}))

export default useOrderStore
