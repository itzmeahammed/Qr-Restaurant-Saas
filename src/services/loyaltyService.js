import { supabase } from '../config/supabase'

/**
 * Loyalty Points Service
 * Manages customer loyalty points and rewards
 */
class LoyaltyService {
  // Points configuration
  static SIGNUP_BONUS = 100 // ₹10 worth
  static POINTS_TO_RUPEE_RATIO = 0.1 // 1 point = ₹0.10
  static MIN_ORDER_FOR_POINTS = 100 // Minimum order value to earn points
  static POINTS_EXPIRY_DAYS = 365 // Points expire after 1 year

  // Tier configuration
  static TIERS = {
    BRONZE: { name: 'Bronze', minPoints: 0, multiplier: 1 },
    SILVER: { name: 'Silver', minPoints: 1000, multiplier: 1.2 },
    GOLD: { name: 'Gold', minPoints: 5000, multiplier: 1.5 },
    PLATINUM: { name: 'Platinum', minPoints: 10000, multiplier: 2 }
  }

  /**
   * Initialize loyalty account for new customer
   * @param {string} customerId - Customer UUID
   * @param {string} restaurantId - Restaurant UUID
   * @returns {Promise<Object>} - Loyalty account
   */
  static async createLoyaltyAccount(customerId, restaurantId) {
    try {
      // Handle restaurant_id conversion for database schema compatibility
      // loyalty_points.restaurant_id references restaurants(id), not users(id)
      let actualRestaurantId = restaurantId
      
      // Check if restaurantId is owner_id, convert to restaurant.id
      const { data: restaurantData } = await supabase
        .from('restaurants')
        .select('id, owner_id')
        .eq('owner_id', restaurantId)
        .maybeSingle()
      
      if (restaurantData?.id) {
        actualRestaurantId = restaurantData.id
      } else {
        // Check if restaurantId is already a restaurant.id
        const { data: directRestaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('id', restaurantId)
          .maybeSingle()
        
        if (directRestaurant?.id) {
          actualRestaurantId = restaurantId
        }
      }

      // Check if account already exists
      const { data: existing } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('customer_id', customerId)
        .eq('restaurant_id', actualRestaurantId)
        .single()

      if (existing) return existing

      // Create new loyalty account
      const { data: account, error } = await supabase
        .from('loyalty_points')
        .insert({
          customer_id: customerId,
          restaurant_id: actualRestaurantId, // Use correct restaurant.id
          points_earned: this.SIGNUP_BONUS,
          current_balance: this.SIGNUP_BONUS,
          tier: 'bronze'
        })
        .select()
        .single()

      if (error) throw error

      // Record signup bonus transaction
      await this.recordTransaction(
        customerId,
        restaurantId,
        null,
        'bonus',
        this.SIGNUP_BONUS,
        'Welcome bonus for signing up!'
      )

      return account
    } catch (error) {
      console.error('Error initializing loyalty account:', error)
      throw error
    }
  }

  /**
   * Calculate points to earn for an order
   * @param {number} orderAmount - Order total amount
   * @param {string} tier - Customer tier
   * @returns {number} - Points to earn
   */
  static calculatePointsToEarn(orderAmount, tier = 'bronze') {
    if (orderAmount < this.MIN_ORDER_FOR_POINTS) return 0

    // Random 2-10% of order value
    const basePercentage = Math.random() * 0.08 + 0.02 // 2-10%
    const tierMultiplier = this.getTierMultiplier(tier)
    
    const points = Math.floor(orderAmount * basePercentage * tierMultiplier)
    return points
  }

  /**
   * Get tier multiplier
   * @param {string} tier - Tier name
   * @returns {number} - Multiplier
   */
  static getTierMultiplier(tier) {
    const tierConfig = Object.values(this.TIERS).find(
      t => t.name.toLowerCase() === tier.toLowerCase()
    )
    return tierConfig?.multiplier || 1
  }

  /**
   * Award points for an order
   * @param {string} customerId - Customer UUID
   * @param {string} restaurantId - Restaurant UUID
   * @param {string} orderId - Order UUID
   * @param {number} orderAmount - Order total amount
   * @returns {Promise<Object>} - Points awarded
   */
  static async awardPoints(customerId, restaurantId, orderId, orderAmount) {
    try {
      // Get customer's loyalty account
      const { data: account } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('customer_id', customerId)
        .eq('restaurant_id', restaurantId)
        .single()

      if (!account) {
        // Initialize account if doesn't exist
        await this.initializeLoyaltyAccount(customerId, restaurantId)
      }

      // Calculate points to award
      const pointsToAward = this.calculatePointsToEarn(
        orderAmount,
        account?.tier || 'bronze'
      )

      if (pointsToAward === 0) {
        return { pointsAwarded: 0, message: 'Order amount too low for points' }
      }

      // Update loyalty account
      const newBalance = (account?.current_balance || 0) + pointsToAward
      const totalEarned = (account?.points_earned || 0) + pointsToAward

      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({
          points_earned: totalEarned,
          current_balance: newBalance,
          tier: this.calculateTier(totalEarned)
        })
        .eq('customer_id', customerId)
        .eq('restaurant_id', restaurantId)

      if (updateError) throw updateError

      // Record transaction
      await this.recordTransaction(
        customerId,
        restaurantId,
        orderId,
        'earned',
        pointsToAward,
        `Points earned for order #${orderId}`
      )

      return {
        pointsAwarded: pointsToAward,
        newBalance,
        tier: this.calculateTier(totalEarned),
        message: `You earned ${pointsToAward} points!`
      }
    } catch (error) {
      console.error('Error awarding points:', error)
      throw error
    }
  }

  /**
   * Redeem points for discount
   * @param {string} customerId - Customer UUID
   * @param {string} restaurantId - Restaurant UUID
   * @param {number} pointsToRedeem - Points to redeem
   * @param {string} orderId - Order UUID
   * @returns {Promise<Object>} - Redemption result
   */
  static async redeemPoints(customerId, restaurantId, pointsToRedeem, orderId) {
    try {
      // Get customer's loyalty account
      const { data: account, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('customer_id', customerId)
        .eq('restaurant_id', restaurantId)
        .single()

      if (error) throw error

      if (!account || account.current_balance < pointsToRedeem) {
        throw new Error('Insufficient points balance')
      }

      // Calculate discount amount
      const discountAmount = pointsToRedeem * this.POINTS_TO_RUPEE_RATIO

      // Update loyalty account
      const newBalance = account.current_balance - pointsToRedeem
      const totalRedeemed = account.points_redeemed + pointsToRedeem

      const { error: updateError } = await supabase
        .from('loyalty_points')
        .update({
          points_redeemed: totalRedeemed,
          current_balance: newBalance
        })
        .eq('customer_id', customerId)
        .eq('restaurant_id', restaurantId)

      if (updateError) throw updateError

      // Record transaction
      await this.recordTransaction(
        customerId,
        restaurantId,
        orderId,
        'redeemed',
        -pointsToRedeem,
        `Points redeemed for ₹${discountAmount} discount`
      )

      return {
        pointsRedeemed: pointsToRedeem,
        discountAmount,
        newBalance,
        message: `Redeemed ${pointsToRedeem} points for ₹${discountAmount} discount`
      }
    } catch (error) {
      console.error('Error redeeming points:', error)
      throw error
    }
  }

  /**
   * Record loyalty transaction
   * @param {string} customerId - Customer UUID
   * @param {string} restaurantId - Restaurant UUID
   * @param {string} orderId - Order UUID (optional)
   * @param {string} type - Transaction type
   * @param {number} points - Points amount
   * @param {string} description - Transaction description
   */
  static async recordTransaction(customerId, restaurantId, orderId, type, points, description) {
    try {
      const expiresAt = type === 'earned' || type === 'bonus'
        ? new Date(Date.now() + this.POINTS_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
        : null

      await supabase
        .from('loyalty_transactions')
        .insert({
          customer_id: customerId,
          restaurant_id: restaurantId,
          order_id: orderId,
          transaction_type: type,
          points,
          description,
          expires_at: expiresAt
        })
    } catch (error) {
      console.error('Error recording transaction:', error)
    }
  }

  /**
   * Calculate customer tier based on total points earned
   * @param {number} totalPoints - Total points earned
   * @returns {string} - Tier name
   */
  static calculateTier(totalPoints) {
    if (totalPoints >= this.TIERS.PLATINUM.minPoints) return 'platinum'
    if (totalPoints >= this.TIERS.GOLD.minPoints) return 'gold'
    if (totalPoints >= this.TIERS.SILVER.minPoints) return 'silver'
    return 'bronze'
  }

  /**
   * Get customer loyalty details
   * @param {string} customerId - Customer UUID
   * @param {string} restaurantId - Restaurant UUID
   * @returns {Promise<Object>} - Loyalty details
   */
  static async getCustomerLoyalty(customerId, restaurantId) {
    try {
      // Get loyalty account
      const { data: account } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('customer_id', customerId)
        .eq('restaurant_id', restaurantId)
        .single()

      if (!account) {
        return {
          hasAccount: false,
          currentBalance: 0,
          tier: 'bronze',
          nextTier: 'silver',
          pointsToNextTier: this.TIERS.SILVER.minPoints
        }
      }

      // Calculate next tier info
      const currentTierConfig = Object.values(this.TIERS).find(
        t => t.name.toLowerCase() === account.tier
      )
      const nextTierConfig = Object.values(this.TIERS).find(
        t => t.minPoints > account.points_earned
      )

      // Get recent transactions
      const { data: transactions } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(10)

      return {
        hasAccount: true,
        currentBalance: account.current_balance,
        totalEarned: account.points_earned,
        totalRedeemed: account.points_redeemed,
        tier: account.tier,
        tierConfig: currentTierConfig,
        nextTier: nextTierConfig?.name.toLowerCase(),
        pointsToNextTier: nextTierConfig 
          ? nextTierConfig.minPoints - account.points_earned
          : 0,
        discountAvailable: account.current_balance * this.POINTS_TO_RUPEE_RATIO,
        recentTransactions: transactions || []
      }
    } catch (error) {
      console.error('Error getting customer loyalty:', error)
      throw error
    }
  }

  /**
   * Get loyalty leaderboard for restaurant
   * @param {string} restaurantId - Restaurant UUID
   * @param {number} limit - Number of customers to return
   * @returns {Promise<Array>} - Top customers
   */
  static async getLeaderboard(restaurantId, limit = 10) {
    try {
      const { data: topCustomers, error } = await supabase
        .from('loyalty_points')
        .select(`
          *,
          customer:auth.users(email, user_metadata)
        `)
        .eq('restaurant_id', restaurantId)
        .order('points_earned', { ascending: false })
        .limit(limit)

      if (error) throw error

      return topCustomers.map((customer, index) => ({
        rank: index + 1,
        customerId: customer.customer_id,
        customerName: customer.customer?.user_metadata?.full_name || 'Anonymous',
        customerEmail: customer.customer?.email,
        pointsEarned: customer.points_earned,
        currentBalance: customer.current_balance,
        tier: customer.tier
      }))
    } catch (error) {
      console.error('Error getting leaderboard:', error)
      throw error
    }
  }

  /**
   * Process expired points
   * @param {string} restaurantId - Restaurant UUID
   */
  static async processExpiredPoints(restaurantId) {
    try {
      // Get expired transactions
      const { data: expiredTransactions, error } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('transaction_type', 'earned')
        .lt('expires_at', new Date().toISOString())
        .is('processed', false)

      if (error) throw error

      // Process each expired transaction
      for (const transaction of expiredTransactions || []) {
        // Deduct expired points from customer balance
        const { data: account } = await supabase
          .from('loyalty_points')
          .select('*')
          .eq('customer_id', transaction.customer_id)
          .eq('restaurant_id', transaction.restaurant_id)
          .single()

        if (account) {
          const newBalance = Math.max(0, account.current_balance - transaction.points)
          
          await supabase
            .from('loyalty_points')
            .update({ current_balance: newBalance })
            .eq('customer_id', transaction.customer_id)
            .eq('restaurant_id', transaction.restaurant_id)

          // Mark transaction as processed
          await supabase
            .from('loyalty_transactions')
            .update({ processed: true })
            .eq('id', transaction.id)

          // Record expiry transaction
          await this.recordTransaction(
            transaction.customer_id,
            transaction.restaurant_id,
            null,
            'expired',
            -transaction.points,
            `Points expired from ${new Date(transaction.created_at).toLocaleDateString()}`
          )
        }
      }

      return { processed: expiredTransactions?.length || 0 }
    } catch (error) {
      console.error('Error processing expired points:', error)
      throw error
    }
  }

  /**
   * Get loyalty analytics for restaurant
   * @param {string} restaurantId - Restaurant UUID
   * @returns {Promise<Object>} - Analytics data
   */
  static async getLoyaltyAnalytics(restaurantId) {
    try {
      // Get total customers enrolled
      const { count: totalCustomers } = await supabase
        .from('loyalty_points')
        .select('*', { count: 'exact', head: true })
        .eq('restaurant_id', restaurantId)

      // Get tier distribution
      const { data: tierData } = await supabase
        .from('loyalty_points')
        .select('tier')
        .eq('restaurant_id', restaurantId)

      const tierDistribution = tierData?.reduce((acc, { tier }) => {
        acc[tier] = (acc[tier] || 0) + 1
        return acc
      }, {})

      // Get points statistics
      const { data: stats } = await supabase
        .from('loyalty_points')
        .select('points_earned, points_redeemed, current_balance')
        .eq('restaurant_id', restaurantId)

      const totalPointsEarned = stats?.reduce((sum, s) => sum + s.points_earned, 0) || 0
      const totalPointsRedeemed = stats?.reduce((sum, s) => sum + s.points_redeemed, 0) || 0
      const totalPointsBalance = stats?.reduce((sum, s) => sum + s.current_balance, 0) || 0

      // Get recent activity
      const { data: recentActivity } = await supabase
        .from('loyalty_transactions')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(20)

      return {
        totalCustomers,
        tierDistribution,
        totalPointsEarned,
        totalPointsRedeemed,
        totalPointsBalance,
        redemptionRate: totalPointsEarned > 0 
          ? (totalPointsRedeemed / totalPointsEarned * 100).toFixed(2)
          : 0,
        averageBalance: totalCustomers > 0
          ? Math.floor(totalPointsBalance / totalCustomers)
          : 0,
        recentActivity
      }
    } catch (error) {
      console.error('Error getting loyalty analytics:', error)
      throw error
    }
  }
}

export default LoyaltyService
