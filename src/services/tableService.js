import { supabase } from '../config/supabase'

class TableService {
  constructor() {
    this.supabase = supabase
  }

  // Get all tables for a restaurant with their current status
  async getRestaurantTables(restaurantId) {
    try {
      const { data: tables, error } = await this.supabase
        .from('tables')
        .select(`
          *,
          customer_sessions!customer_sessions_table_id_fkey (
            id,
            session_id,
            customer_name,
            customer_phone,
            status,
            started_at,
            ended_at
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('table_number')

      if (error) throw error

      // Enrich tables with reservation status
      const enrichedTables = tables.map(table => {
        const activeSession = table.customer_sessions?.find(session => 
          session.status === 'active' && !session.ended_at
        )

        return {
          ...table,
          reservation_status: activeSession ? 'reserved' : 'available',
          current_session: activeSession || null,
          reserved_by: activeSession ? 'customer' : null,
          reserved_at: activeSession?.started_at || null
        }
      })

      return enrichedTables
    } catch (error) {
      console.error('Error fetching restaurant tables:', error)
      throw error
    }
  }

  // Reserve table when customer scans QR code
  async reserveTableByCustomer(tableId, restaurantId, sessionId, customerInfo = {}) {
    try {
      // Check if table is already reserved using maybeSingle() to avoid RLS issues
      const { data: existingSession, error: checkError } = await this.supabase
        .from('customer_sessions')
        .select('*')
        .eq('table_id', tableId)
        .eq('status', 'active')
        .is('ended_at', null)
        .maybeSingle()

      if (checkError) {
        console.warn('Error checking existing session:', checkError)
        // Continue with reservation attempt even if check fails
      }

      if (existingSession) {
        throw new Error('Table is already reserved')
      }

      // Create or update customer session
      const sessionData = {
        session_id: sessionId,
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: customerInfo.name || null,
        customer_phone: customerInfo.phone || null,
        customer_email: customerInfo.email || null,
        status: 'active',
        started_at: new Date().toISOString(),
        created_by_staff: false // Flag to indicate customer-created session
      }

      const { data: session, error } = await this.supabase
        .from('customer_sessions')
        .upsert(sessionData, { 
          onConflict: 'session_id',
          ignoreDuplicates: false 
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating customer session:', error)
        throw new Error(`Failed to reserve table: ${error.message}`)
      }

      // Update table status in real-time
      await this.notifyTableStatusChange(tableId, 'reserved', 'customer')

      return {
        success: true,
        session,
        message: 'Table reserved successfully'
      }
    } catch (error) {
      console.error('Error reserving table by customer:', error)
      throw error
    }
  }

  // Reserve table by staff for customer without mobile
  async reserveTableByStaff(tableId, restaurantId, staffId, customerInfo) {
    try {
      console.log('🔍 Starting staff table reservation:', {
        tableId,
        restaurantId,
        staffId,
        customerInfo
      })

      // Check current auth status
      const { data: { user }, error: authError } = await this.supabase.auth.getUser()
      console.log('👤 Current auth user:', user?.id, 'Error:', authError)

      // Check if table is available using maybeSingle() to avoid RLS issues
      const { data: existingSession, error: checkError } = await this.supabase
        .from('customer_sessions')
        .select('*')
        .eq('table_id', tableId)
        .eq('status', 'active')
        .is('ended_at', null)
        .maybeSingle()

      console.log('🔍 Existing session check:', { existingSession, checkError })

      if (checkError) {
        console.warn('Error checking existing session:', checkError)
        // Continue with reservation attempt even if check fails
      }

      if (existingSession) {
        throw new Error('Table is already reserved')
      }

      // Generate a session ID for staff-assisted reservation
      const sessionId = `staff_${staffId}_${Date.now()}`

      // Create customer session with all required fields
      const sessionData = {
        session_id: sessionId,
        restaurant_id: restaurantId,
        table_id: tableId,
        customer_name: customerInfo.name,
        customer_phone: customerInfo.phone || null,
        customer_email: customerInfo.email || null,
        status: 'active',
        started_at: new Date().toISOString(),
        created_by_staff: true, // Flag to indicate staff-created session
        staff_id: staffId // Track which staff member created this
      }

      console.log('📝 Session data to insert:', sessionData)

      // Try direct insert first
      const { data: session, error } = await this.supabase
        .from('customer_sessions')
        .insert(sessionData)
        .select()
        .single()

      console.log('💾 Insert result:', { session, error })

      if (error) {
        console.error('❌ Insert failed, trying upsert:', error)
        
        // Try upsert as fallback
        const { data: upsertSession, error: upsertError } = await this.supabase
          .from('customer_sessions')
          .upsert(sessionData, { 
            onConflict: 'session_id',
            ignoreDuplicates: false 
          })
          .select()
          .single()

        console.log('🔄 Upsert result:', { upsertSession, upsertError })

        if (upsertError) {
          console.error('❌ Both insert and upsert failed')
          throw new Error(`Failed to create table reservation: ${upsertError.message}`)
        }

        // Use upsert result
        const finalSession = upsertSession
        
        // Update table status in real-time
        await this.notifyTableStatusChange(tableId, 'reserved', 'staff', staffId)

        return {
          success: true,
          session: finalSession,
          sessionId,
          message: 'Table reserved by staff successfully'
        }
      }

      // Update table status in real-time
      await this.notifyTableStatusChange(tableId, 'reserved', 'staff', staffId)

      console.log('✅ Staff table reservation successful')

      return {
        success: true,
        session,
        sessionId,
        message: 'Table reserved by staff successfully'
      }
    } catch (error) {
      console.error('❌ Error reserving table by staff:', error)
      throw error
    }
  }

  // Release table reservation
  async releaseTable(tableId, sessionId) {
    try {
      // End the customer session
      const { error } = await this.supabase
        .from('customer_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('table_id', tableId)
        .eq('session_id', sessionId)
        .eq('status', 'active')

      if (error) throw error

      // Update table status in real-time
      await this.notifyTableStatusChange(tableId, 'available')

      return {
        success: true,
        message: 'Table released successfully'
      }
    } catch (error) {
      console.error('Error releasing table:', error)
      throw error
    }
  }

  // Get table status with current reservation info
  async getTableStatus(tableId) {
    try {
      const { data: table, error } = await this.supabase
        .from('tables')
        .select(`
          *,
          customer_sessions!customer_sessions_table_id_fkey (
            id,
            session_id,
            customer_name,
            customer_phone,
            status,
            started_at,
            ended_at
          )
        `)
        .eq('id', tableId)
        .single()

      if (error) throw error

      const activeSession = table.customer_sessions?.find(session => 
        session.status === 'active' && !session.ended_at
      )

      return {
        ...table,
        reservation_status: activeSession ? 'reserved' : 'available',
        current_session: activeSession || null,
        reserved_at: activeSession?.started_at || null
      }
    } catch (error) {
      console.error('Error getting table status:', error)
      throw error
    }
  }

  // Get available tables for staff ordering
  async getAvailableTables(restaurantId) {
    try {
      const { data: tables, error } = await this.supabase
        .from('tables')
        .select(`
          *,
          customer_sessions!customer_sessions_table_id_fkey (
            id,
            session_id,
            status,
            ended_at
          )
        `)
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('table_number')

      if (error) throw error

      // Filter only available tables
      const availableTables = tables.filter(table => {
        const hasActiveSession = table.customer_sessions?.some(session => 
          session.status === 'active' && !session.ended_at
        )
        return !hasActiveSession
      })

      return availableTables
    } catch (error) {
      console.error('Error getting available tables:', error)
      throw error
    }
  }

  // Notify table status change via real-time
  async notifyTableStatusChange(tableId, status, reservedBy = null, staffId = null) {
    try {
      // Send real-time notification to restaurant dashboard
      const notification = {
        type: 'table_status_change',
        tableId,
        status,
        reservedBy,
        staffId,
        timestamp: new Date().toISOString()
      }

      // You can implement WebSocket or Supabase real-time here
      console.log('Table status notification:', notification)
      
      return notification
    } catch (error) {
      console.error('Error sending table status notification:', error)
    }
  }

  // Get table reservation history
  async getTableHistory(tableId, limit = 10) {
    try {
      const { data: sessions, error } = await this.supabase
        .from('customer_sessions')
        .select('*')
        .eq('table_id', tableId)
        .order('started_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return sessions
    } catch (error) {
      console.error('Error getting table history:', error)
      throw error
    }
  }

  // Get restaurant table analytics
  async getTableAnalytics(restaurantId, dateRange = 7) {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - dateRange)

      const { data: sessions, error } = await this.supabase
        .from('customer_sessions')
        .select(`
          *,
          tables (table_number, capacity)
        `)
        .eq('restaurant_id', restaurantId)
        .gte('started_at', startDate.toISOString())

      if (error) throw error

      // Calculate analytics
      const analytics = {
        totalReservations: sessions.length,
        customerReservations: sessions.filter(s => !s.session_id.startsWith('staff_')).length,
        staffAssistedReservations: sessions.filter(s => s.session_id.startsWith('staff_')).length,
        averageSessionDuration: this.calculateAverageSessionDuration(sessions),
        mostPopularTables: this.getMostPopularTables(sessions),
        peakHours: this.getPeakHours(sessions)
      }

      return analytics
    } catch (error) {
      console.error('Error getting table analytics:', error)
      throw error
    }
  }

  // Helper methods for analytics
  calculateAverageSessionDuration(sessions) {
    const completedSessions = sessions.filter(s => s.ended_at)
    if (completedSessions.length === 0) return 0

    const totalDuration = completedSessions.reduce((sum, session) => {
      const start = new Date(session.started_at)
      const end = new Date(session.ended_at)
      return sum + (end - start)
    }, 0)

    return Math.round(totalDuration / completedSessions.length / (1000 * 60)) // minutes
  }

  getMostPopularTables(sessions) {
    const tableCounts = {}
    sessions.forEach(session => {
      const tableNumber = session.tables?.table_number
      if (tableNumber) {
        tableCounts[tableNumber] = (tableCounts[tableNumber] || 0) + 1
      }
    })

    return Object.entries(tableCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([table, count]) => ({ table, count }))
  }

  getPeakHours(sessions) {
    const hourCounts = {}
    sessions.forEach(session => {
      const hour = new Date(session.started_at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
  }
}

export default new TableService()
