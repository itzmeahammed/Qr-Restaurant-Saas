import { supabase } from '../config/supabase'
import realtimeService from './realtimeService'

/**
 * Enhanced Payment Service for Complete Restaurant Workflow
 * Handles both "pay now" and "pay later" payment methods
 * 
 * PAYMENT WORKFLOW:
 * 1. Customer chooses payment method during order
 * 2. Pay Now: Online payment processing (UPI, Card, etc.)
 * 3. Pay Later: Cash payment collected by staff
 * 4. Staff payment collection interface
 * 5. Real-time payment confirmations
 * 6. Payment tracking and reconciliation
 */
class PaymentService {
  /**
   * Process payment for an order
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} - Payment result
   */
  static async processPayment(paymentData) {
    try {
      const {
        orderId,
        amount,
        paymentMethod, // 'cash', 'card', 'upi', 'online'
        staffId = null,
        transactionId = null,
        gatewayResponse = null
      } = paymentData

      console.log('💳 Processing payment:', { orderId, amount, paymentMethod })

      // Create payment transaction record
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          order_id: orderId,
          staff_id: staffId,
          amount,
          payment_method: paymentMethod,
          payment_status: paymentMethod === 'cash' ? 'pending' : 'processing',
          transaction_id: transactionId,
          gateway_response: gatewayResponse,
          collected_by_staff: paymentMethod === 'cash'
        })
        .select()
        .single()

      if (transactionError) throw transactionError

      // Update order payment status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: paymentMethod === 'cash' ? 'pending' : 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (orderError) throw orderError

      // Handle different payment methods
      let paymentResult = { success: true, data: transaction }

      if (paymentMethod === 'cash') {
        // Cash payment - notify staff to collect
        paymentResult = await this.handleCashPayment(orderId, amount, staffId)
      } else {
        // Online payment - process through gateway
        paymentResult = await this.handleOnlinePayment(orderId, amount, paymentMethod, transactionId)
      }

      return paymentResult
    } catch (error) {
      console.error('❌ Error processing payment:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Handle cash payment collection by staff
   * @param {string} orderId - Order ID
   * @param {number} amount - Payment amount
   * @param {string} staffId - Staff ID collecting payment
   * @returns {Promise<Object>} - Payment result
   */
  static async handleCashPayment(orderId, amount, staffId) {
    try {
      console.log('💵 Setting up cash payment collection...')

      // Get order details for notification
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          customer_sessions (
            session_id,
            customer_name
          )
        `)
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // Notify staff about cash collection
      if (staffId) {
        await realtimeService.notifyStaffPaymentCollection(staffId, order, 'cash')
      }

      // Notify customer about payment pending
      if (order.customer_sessions?.session_id) {
        await realtimeService.notifyCustomer(
          order.customer_sessions.session_id,
          'payment_pending',
          {
            orderId,
            orderNumber: order.order_number,
            amount,
            paymentMethod: 'cash',
            message: 'Please prepare cash payment. Staff will collect when order is ready.',
            timestamp: new Date().toISOString()
          }
        )
      }

      return {
        success: true,
        data: {
          paymentMethod: 'cash',
          status: 'pending_collection',
          message: 'Cash payment will be collected by staff'
        }
      }
    } catch (error) {
      console.error('❌ Error handling cash payment:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Handle online payment processing
   * @param {string} orderId - Order ID
   * @param {number} amount - Payment amount
   * @param {string} paymentMethod - Payment method
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Payment result
   */
  static async handleOnlinePayment(orderId, amount, paymentMethod, transactionId) {
    try {
      console.log('🌐 Processing online payment...')

      // Simulate payment gateway processing
      // In real implementation, integrate with Razorpay, Stripe, etc.
      const paymentSuccess = await this.simulatePaymentGateway(amount, paymentMethod)

      if (paymentSuccess.success) {
        // Update payment status to completed
        await this.confirmPayment(orderId, {
          transactionId: paymentSuccess.transactionId,
          gatewayResponse: paymentSuccess.response
        })

        return {
          success: true,
          data: {
            paymentMethod,
            status: 'completed',
            transactionId: paymentSuccess.transactionId,
            message: 'Payment completed successfully'
          }
        }
      } else {
        // Payment failed
        await this.failPayment(orderId, paymentSuccess.error)
        
        return {
          success: false,
          error: paymentSuccess.error,
          message: 'Payment failed. Please try again.'
        }
      }
    } catch (error) {
      console.error('❌ Error handling online payment:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Confirm payment completion
   * @param {string} orderId - Order ID
   * @param {Object} paymentDetails - Payment confirmation details
   * @returns {Promise<Object>} - Confirmation result
   */
  static async confirmPayment(orderId, paymentDetails = {}) {
    try {
      const { transactionId, gatewayResponse, staffId } = paymentDetails

      console.log('✅ Confirming payment for order:', orderId)

      // Update payment transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .update({
          payment_status: 'completed',
          transaction_id: transactionId,
          gateway_response: gatewayResponse,
          collected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .select()
        .single()

      if (transactionError) throw transactionError

      // Update order payment status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select(`
          *,
          customer_sessions (
            session_id,
            customer_name
          )
        `)
        .single()

      if (orderError) throw orderError

      // Update staff tips if applicable
      if (staffId && transaction.amount > order.total_amount) {
        const tipAmount = transaction.amount - order.total_amount
        await this.addStaffTip(staffId, tipAmount)
      }

      // Notify customer about payment confirmation
      if (order.customer_sessions?.session_id) {
        await realtimeService.notifyCustomer(
          order.customer_sessions.session_id,
          'payment_confirmed',
          {
            orderId,
            orderNumber: order.order_number,
            amount: transaction.amount,
            paymentMethod: transaction.payment_method,
            transactionId: transaction.transaction_id,
            timestamp: new Date().toISOString()
          }
        )
      }

      // Notify staff about payment confirmation
      if (order.assigned_staff_id) {
        await realtimeService.notifyStaff(
          order.assigned_staff_id,
          'payment_confirmed',
          {
            orderId,
            orderNumber: order.order_number,
            amount: transaction.amount,
            paymentMethod: transaction.payment_method
          }
        )
      }

      return { success: true, data: { transaction, order } }
    } catch (error) {
      console.error('❌ Error confirming payment:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Handle payment failure
   * @param {string} orderId - Order ID
   * @param {string} errorMessage - Error message
   * @returns {Promise<Object>} - Failure handling result
   */
  static async failPayment(orderId, errorMessage) {
    try {
      console.log('❌ Payment failed for order:', orderId)

      // Update payment transaction status
      await supabase
        .from('payment_transactions')
        .update({
          payment_status: 'failed',
          gateway_response: { error: errorMessage },
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)

      // Update order payment status
      const { data: order } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select(`
          *,
          customer_sessions (
            session_id
          )
        `)
        .single()

      // Notify customer about payment failure
      if (order?.customer_sessions?.session_id) {
        await realtimeService.notifyCustomer(
          order.customer_sessions.session_id,
          'payment_failed',
          {
            orderId,
            orderNumber: order.order_number,
            error: errorMessage,
            message: 'Payment failed. Please try again or choose a different payment method.',
            timestamp: new Date().toISOString()
          }
        )
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Error handling payment failure:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Staff cash collection interface
   * @param {string} orderId - Order ID
   * @param {string} staffId - Staff ID
   * @param {number} amountReceived - Amount received from customer
   * @returns {Promise<Object>} - Collection result
   */
  static async collectCashPayment(orderId, staffId, amountReceived) {
    try {
      console.log('💵 Staff collecting cash payment:', { orderId, staffId, amountReceived })

      // Get order details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError) throw orderError

      // Validate amount
      if (amountReceived < order.total_amount) {
        throw new Error(`Insufficient amount. Required: ₹${order.total_amount}, Received: ₹${amountReceived}`)
      }

      // Calculate change and tip
      const changeAmount = amountReceived - order.total_amount
      const tipAmount = changeAmount > 0 ? 0 : 0 // Customer can choose to give tip

      // Confirm payment
      const result = await this.confirmPayment(orderId, {
        staffId,
        transactionId: `CASH_${Date.now()}`,
        gatewayResponse: {
          method: 'cash',
          amountReceived,
          changeAmount,
          collectedBy: staffId,
          collectedAt: new Date().toISOString()
        }
      })

      return {
        success: true,
        data: {
          ...result.data,
          amountReceived,
          changeAmount,
          tipAmount
        }
      }
    } catch (error) {
      console.error('❌ Error collecting cash payment:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Add tip to staff earnings
   * @param {string} staffId - Staff ID
   * @param {number} tipAmount - Tip amount
   * @returns {Promise<Object>} - Tip addition result
   */
  static async addStaffTip(staffId, tipAmount) {
    try {
      // Update staff total tips
      await supabase
        .from('staff')
        .update({
          total_tips_received: supabase.raw(`total_tips_received + ${tipAmount}`),
          updated_at: new Date().toISOString()
        })
        .eq('id', staffId)

      // Update daily performance
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('staff_performance')
        .upsert({
          staff_id: staffId,
          date: today,
          total_tips: supabase.raw(`COALESCE(total_tips, 0) + ${tipAmount}`),
          updated_at: new Date().toISOString()
        })

      // Notify staff about tip
      await realtimeService.notifyStaff(staffId, 'tip_received', {
        amount: tipAmount,
        message: `You received a tip of ₹${tipAmount}!`,
        timestamp: new Date().toISOString()
      })

      return { success: true }
    } catch (error) {
      console.error('❌ Error adding staff tip:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get payment history for an order
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} - Payment history
   */
  static async getPaymentHistory(orderId) {
    try {
      const { data: transactions, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          staff (
            id,
            position,
            users (
              full_name
            )
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: transactions || [] }
    } catch (error) {
      console.error('❌ Error getting payment history:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Simulate payment gateway (replace with real gateway integration)
   * @param {number} amount - Payment amount
   * @param {string} paymentMethod - Payment method
   * @returns {Promise<Object>} - Gateway response
   */
  static async simulatePaymentGateway(amount, paymentMethod) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate 95% success rate
    const success = Math.random() > 0.05

    if (success) {
      return {
        success: true,
        transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        response: {
          status: 'success',
          amount,
          paymentMethod,
          gateway: 'razorpay', // or stripe, payu, etc.
          timestamp: new Date().toISOString()
        }
      }
    } else {
      return {
        success: false,
        error: 'Payment gateway error. Please try again.'
      }
    }
  }

  /**
   * Get payment analytics for restaurant
   * @param {string} restaurantId - Restaurant ID
   * @param {Object} filters - Date filters
   * @returns {Promise<Object>} - Payment analytics
   */
  static async getPaymentAnalytics(restaurantId, filters = {}) {
    try {
      const { startDate, endDate } = filters
      let query = supabase
        .from('payment_transactions')
        .select(`
          *,
          orders!inner (
            restaurant_id,
            total_amount
          )
        `)
        .eq('orders.restaurant_id', restaurantId)

      if (startDate) {
        query = query.gte('created_at', startDate)
      }
      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data: transactions, error } = await query

      if (error) throw error

      // Calculate analytics
      const analytics = {
        totalTransactions: transactions.length,
        totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
        completedTransactions: transactions.filter(t => t.payment_status === 'completed').length,
        pendingTransactions: transactions.filter(t => t.payment_status === 'pending').length,
        failedTransactions: transactions.filter(t => t.payment_status === 'failed').length,
        paymentMethods: transactions.reduce((acc, t) => {
          acc[t.payment_method] = (acc[t.payment_method] || 0) + 1
          return acc
        }, {}),
        averageTransactionValue: transactions.length > 0 ? 
          transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length : 0
      }

      return { success: true, data: analytics }
    } catch (error) {
      console.error('❌ Error getting payment analytics:', error)
      return { success: false, error: error.message }
    }
  }
}

export default PaymentService
