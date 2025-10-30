import { supabase } from '../config/supabase'

/**
 * 📊 PERFORMANCE MONITORING SERVICE
 * Tracks system performance, order metrics, and provides analytics
 */
class PerformanceMonitorService {
  static metrics = new Map()
  static performanceLog = []

  /**
   * ⏱️ Start performance tracking for an operation
   */
  static startTracking(operationId, operationType, metadata = {}) {
    const startTime = performance.now()
    this.metrics.set(operationId, {
      type: operationType,
      startTime,
      metadata,
      timestamp: new Date().toISOString()
    })
    
    console.log(`📊 Started tracking: ${operationType} (${operationId})`)
    return operationId
  }

  /**
   * ⏹️ End performance tracking and log results
   */
  static endTracking(operationId, success = true, error = null) {
    const metric = this.metrics.get(operationId)
    if (!metric) {
      console.warn(`⚠️ No tracking found for operation: ${operationId}`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - metric.startTime
    
    const result = {
      ...metric,
      endTime,
      duration,
      success,
      error: error?.message || null,
      completedAt: new Date().toISOString()
    }

    // Log performance data
    this.performanceLog.push(result)
    this.metrics.delete(operationId)

    // Log to console with appropriate level
    if (success) {
      console.log(`✅ ${metric.type} completed in ${duration.toFixed(2)}ms`)
    } else {
      console.error(`❌ ${metric.type} failed after ${duration.toFixed(2)}ms:`, error?.message)
    }

    // Store critical metrics in database for analytics
    if (duration > 5000 || !success) { // Log slow operations or failures
      this.logToDatabase(result)
    }

    return result
  }

  /**
   * 💾 Log performance data to database
   */
  static async logToDatabase(performanceData) {
    try {
      const { error } = await supabase
        .from('performance_logs')
        .insert({
          operation_id: `${performanceData.type}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          operation_type: performanceData.type,
          duration_ms: performanceData.duration,
          success: performanceData.success,
          error_message: performanceData.error,
          metadata: performanceData.metadata,
          created_at: performanceData.completedAt
        })
      
      if (error) {
        // Check if it's a table not found error
        if (error.code === 'PGRST205' || error.message?.includes('performance_logs')) {
          console.warn('⚠️ Performance logs table not found - run database_fixes.sql to create it')
          return // Gracefully continue without logging
        }
        throw error
      }
      
      console.log('📊 Performance data logged to database')
    } catch (error) {
      console.warn('⚠️ Failed to log performance data to database:', error.message)
      // Continue execution - performance logging is not critical for app functionality
    }
  }

  /**
   * 📈 Get performance analytics
   */
  static getAnalytics(timeframe = '24h') {
    const now = Date.now()
    const timeframeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    }[timeframe] || 24 * 60 * 60 * 1000

    const recentLogs = this.performanceLog.filter(log => 
      new Date(log.completedAt).getTime() > (now - timeframeMs)
    )

    const analytics = {
      totalOperations: recentLogs.length,
      successRate: recentLogs.length > 0 ? 
        (recentLogs.filter(log => log.success).length / recentLogs.length * 100).toFixed(2) : 0,
      averageDuration: recentLogs.length > 0 ?
        (recentLogs.reduce((sum, log) => sum + log.duration, 0) / recentLogs.length).toFixed(2) : 0,
      slowOperations: recentLogs.filter(log => log.duration > 3000).length,
      failedOperations: recentLogs.filter(log => !log.success).length,
      operationTypes: {}
    }

    // Group by operation type
    recentLogs.forEach(log => {
      if (!analytics.operationTypes[log.type]) {
        analytics.operationTypes[log.type] = {
          count: 0,
          avgDuration: 0,
          successRate: 0,
          failures: 0
        }
      }
      analytics.operationTypes[log.type].count++
      if (!log.success) analytics.operationTypes[log.type].failures++
    })

    // Calculate averages for each type
    Object.keys(analytics.operationTypes).forEach(type => {
      const typeLogs = recentLogs.filter(log => log.type === type)
      const typeData = analytics.operationTypes[type]
      
      typeData.avgDuration = (typeLogs.reduce((sum, log) => sum + log.duration, 0) / typeLogs.length).toFixed(2)
      typeData.successRate = ((typeData.count - typeData.failures) / typeData.count * 100).toFixed(2)
    })

    return analytics
  }

  /**
   * 🧹 Clean old performance logs
   */
  static cleanOldLogs(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
    const cutoff = Date.now() - maxAge
    const initialCount = this.performanceLog.length
    
    this.performanceLog = this.performanceLog.filter(log => 
      new Date(log.completedAt).getTime() > cutoff
    )
    
    const cleaned = initialCount - this.performanceLog.length
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} old performance logs`)
    }
  }

  /**
   * 🚨 Check for performance issues
   */
  static checkPerformanceHealth() {
    const analytics = this.getAnalytics('1h')
    const issues = []

    if (parseFloat(analytics.successRate) < 95) {
      issues.push(`Low success rate: ${analytics.successRate}%`)
    }

    if (parseFloat(analytics.averageDuration) > 3000) {
      issues.push(`High average duration: ${analytics.averageDuration}ms`)
    }

    if (analytics.slowOperations > analytics.totalOperations * 0.1) {
      issues.push(`Too many slow operations: ${analytics.slowOperations}/${analytics.totalOperations}`)
    }

    if (issues.length > 0) {
      console.warn('🚨 Performance issues detected:', issues)
      return { healthy: false, issues }
    }

    console.log('✅ System performance is healthy')
    return { healthy: true, issues: [] }
  }

  /**
   * 📊 Real-time performance dashboard data
   */
  static getDashboardData() {
    const analytics = this.getAnalytics('24h')
    const health = this.checkPerformanceHealth()
    
    return {
      ...analytics,
      health,
      activeOperations: this.metrics.size,
      lastUpdated: new Date().toISOString()
    }
  }
}

// Auto-cleanup every hour
setInterval(() => {
  PerformanceMonitorService.cleanOldLogs()
}, 60 * 60 * 1000)

export default PerformanceMonitorService
