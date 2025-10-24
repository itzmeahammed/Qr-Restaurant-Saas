import { supabase } from '../config/supabase'

/**
 * Customer Cart Management Service
 * Handles persistent cart storage for customers across sessions
 */
class CartService {
  /**
   * Get customer cart by session
   * @param {string} sessionId - Customer session ID
   * @returns {Promise<Array>} - Cart items
   */
  static async getCart(sessionId) {
    try {
      const { data: cartItems, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          menu_items (
            id,
            name,
            price,
            image_url,
            description,
            is_available
          )
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

      if (error) throw error

      return cartItems?.map(item => ({
        id: item.menu_item_id,
        cartItemId: item.id,
        name: item.menu_items.name,
        price: item.menu_items.price,
        image_url: item.menu_items.image_url,
        description: item.menu_items.description,
        quantity: item.quantity,
        specialInstructions: item.special_instructions,
        isAvailable: item.menu_items.is_available,
        totalPrice: item.menu_items.price * item.quantity
      })) || []
    } catch (error) {
      console.error('Error getting cart:', error)
      return []
    }
  }

  /**
   * Add item to cart
   * @param {string} sessionId - Customer session ID
   * @param {Object} item - Menu item to add
   * @returns {Promise<Object>} - Added cart item
   */
  static async addToCart(sessionId, item) {
    try {
      const { menuItemId, quantity = 1, specialInstructions = '' } = item

      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('menu_item_id', menuItemId)
        .single()

      if (existingItem) {
        // Update quantity if item exists
        const { data: updatedItem, error } = await supabase
          .from('cart_items')
          .update({
            quantity: existingItem.quantity + quantity,
            special_instructions: specialInstructions,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingItem.id)
          .select()
          .single()

        if (error) throw error
        return updatedItem
      } else {
        // Add new item to cart
        const { data: newItem, error } = await supabase
          .from('cart_items')
          .insert({
            session_id: sessionId,
            menu_item_id: menuItemId,
            quantity,
            special_instructions: specialInstructions
          })
          .select()
          .single()

        if (error) throw error
        return newItem
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      throw error
    }
  }

  /**
   * Update cart item quantity
   * @param {string} cartItemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Promise<Object>} - Updated cart item
   */
  static async updateCartItem(cartItemId, quantity) {
    try {
      if (quantity <= 0) {
        return await this.removeFromCart(cartItemId)
      }

      const { data: updatedItem, error } = await supabase
        .from('cart_items')
        .update({
          quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', cartItemId)
        .select()
        .single()

      if (error) throw error
      return updatedItem
    } catch (error) {
      console.error('Error updating cart item:', error)
      throw error
    }
  }

  /**
   * Remove item from cart
   * @param {string} cartItemId - Cart item ID
   * @returns {Promise<boolean>} - Success status
   */
  static async removeFromCart(cartItemId) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', cartItemId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error removing from cart:', error)
      throw error
    }
  }

  /**
   * Clear entire cart
   * @param {string} sessionId - Customer session ID
   * @returns {Promise<boolean>} - Success status
   */
  static async clearCart(sessionId) {
    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error clearing cart:', error)
      throw error
    }
  }

  /**
   * Get cart summary
   * @param {string} sessionId - Customer session ID
   * @returns {Promise<Object>} - Cart summary
   */
  static async getCartSummary(sessionId) {
    try {
      const cartItems = await this.getCart(sessionId)
      
      const subtotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0)
      const taxRate = 0.18 // 18% GST
      const taxAmount = subtotal * taxRate
      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

      return {
        items: cartItems,
        itemCount: totalItems,
        subtotal,
        taxAmount,
        total: subtotal + taxAmount,
        isEmpty: cartItems.length === 0
      }
    } catch (error) {
      console.error('Error getting cart summary:', error)
      return {
        items: [],
        itemCount: 0,
        subtotal: 0,
        taxAmount: 0,
        total: 0,
        isEmpty: true
      }
    }
  }

  /**
   * Validate cart items availability
   * @param {string} sessionId - Customer session ID
   * @returns {Promise<Object>} - Validation result
   */
  static async validateCart(sessionId) {
    try {
      const cartItems = await this.getCart(sessionId)
      const unavailableItems = cartItems.filter(item => !item.isAvailable)
      
      return {
        isValid: unavailableItems.length === 0,
        unavailableItems,
        availableItems: cartItems.filter(item => item.isAvailable)
      }
    } catch (error) {
      console.error('Error validating cart:', error)
      return {
        isValid: false,
        unavailableItems: [],
        availableItems: []
      }
    }
  }
}

export default CartService
