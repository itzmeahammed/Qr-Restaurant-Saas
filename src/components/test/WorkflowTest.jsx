import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlayIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'
import CartService from '../../services/cartService'
import OrderService from '../../services/orderService'
import PaymentService from '../../services/paymentService'
import customerService from '../../services/customerService'
import StaffAssignmentService from '../../services/staffAssignmentService'
import toast from 'react-hot-toast'

const WorkflowTest = () => {
  const [testResults, setTestResults] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(null)
  const [testData, setTestData] = useState({
    sessionId: null,
    restaurantId: 'test-restaurant-id',
    tableId: 'test-table-id',
    orderId: null,
    paymentId: null
  })

  const testSteps = [
    {
      id: 'session',
      name: 'Create Customer Session',
      description: 'Initialize customer session for QR ordering',
      test: async () => {
        const session = await customerService.createCustomerSession({
          restaurantId: testData.restaurantId,
          tableId: testData.tableId,
          customerName: 'Test Customer',
          customerPhone: '+91-9876543210'
        })
        setTestData(prev => ({ ...prev, sessionId: session.session_id }))
        return { success: true, data: session }
      }
    },
    {
      id: 'cart',
      name: 'Cart Management',
      description: 'Add items to cart and validate storage',
      test: async () => {
        if (!testData.sessionId) throw new Error('No session ID')
        
        // Add test items to cart
        await CartService.addToCart(testData.sessionId, {
          menuItemId: 'test-item-1',
          quantity: 2,
          specialInstructions: 'Extra spicy'
        })
        
        await CartService.addToCart(testData.sessionId, {
          menuItemId: 'test-item-2',
          quantity: 1
        })
        
        // Get cart summary
        const summary = await CartService.getCartSummary(testData.sessionId)
        
        return { 
          success: summary.itemCount === 3, 
          data: { itemCount: summary.itemCount, total: summary.total }
        }
      }
    },
    {
      id: 'staff_check',
      name: 'Staff Availability Check',
      description: 'Verify staff assignment system',
      test: async () => {
        const availableStaff = await StaffAssignmentService.getAvailableStaff(testData.restaurantId)
        return { 
          success: true, 
          data: { staffCount: availableStaff.length, staff: availableStaff }
        }
      }
    },
    {
      id: 'order_creation',
      name: 'Order Creation & Staff Assignment',
      description: 'Create order with complete workflow',
      test: async () => {
        if (!testData.sessionId) throw new Error('No session ID')
        
        const order = await OrderService.createOrder({
          restaurantId: testData.restaurantId,
          tableId: testData.tableId,
          sessionId: testData.sessionId,
          specialInstructions: 'Test order - please ignore',
          paymentMethod: 'cash',
          tipAmount: 50
        })
        
        setTestData(prev => ({ ...prev, orderId: order.id }))
        
        return { 
          success: !!order.id, 
          data: { 
            orderNumber: order.order_number,
            status: order.status,
            assignedStaff: order.assigned_staff_id,
            total: order.total_amount
          }
        }
      }
    },
    {
      id: 'payment_cash',
      name: 'Cash Payment Processing',
      description: 'Process cash payment workflow',
      test: async () => {
        if (!testData.orderId) throw new Error('No order ID')
        
        const paymentResult = await PaymentService.processPayment({
          orderId: testData.orderId,
          amount: 350,
          paymentMethod: 'cash',
          tipAmount: 50
        })
        
        setTestData(prev => ({ ...prev, paymentId: paymentResult.data?.id }))
        
        return { 
          success: paymentResult.success, 
          data: { 
            paymentId: paymentResult.data?.id,
            status: paymentResult.data?.status,
            method: paymentResult.data?.payment_method
          }
        }
      }
    },
    {
      id: 'payment_online',
      name: 'Online Payment Processing',
      description: 'Process online payment workflow',
      test: async () => {
        if (!testData.orderId) throw new Error('No order ID')
        
        const paymentResult = await PaymentService.processPayment({
          orderId: testData.orderId,
          amount: 350,
          paymentMethod: 'online',
          transactionId: `TEST_TXN_${Date.now()}`,
          tipAmount: 50
        })
        
        return { 
          success: paymentResult.success, 
          data: { 
            paymentId: paymentResult.data?.id,
            status: paymentResult.data?.status,
            transactionId: paymentResult.data?.transaction_id
          }
        }
      }
    },
    {
      id: 'order_tracking',
      name: 'Real-time Order Tracking',
      description: 'Verify customer order tracking subscription',
      test: async () => {
        if (!testData.sessionId || !testData.orderId) throw new Error('Missing session or order ID')
        
        return new Promise((resolve) => {
          let updateReceived = false
          
          const subscription = customerService.trackSessionOrder(testData.sessionId, testData.orderId, {
            onOrderUpdate: (data) => {
              updateReceived = true
              subscription?.unsubscribe?.()
              resolve({ 
                success: true, 
                data: { orderStatus: data.status, updateReceived: true }
              })
            },
            onStatusUpdate: (data) => {
              updateReceived = true
              subscription?.unsubscribe?.()
              resolve({ 
                success: true, 
                data: { status: data.status, updateReceived: true }
              })
            }
          })
          
          // Timeout after 5 seconds
          setTimeout(() => {
            if (!updateReceived) {
              subscription?.unsubscribe?.()
              resolve({ 
                success: false, 
                data: { error: 'No real-time updates received' }
              })
            }
          }, 5000)
        })
      }
    },
    {
      id: 'payment_history',
      name: 'Payment History Retrieval',
      description: 'Verify payment history and analytics',
      test: async () => {
        if (!testData.orderId) throw new Error('No order ID')
        
        const paymentHistory = await PaymentService.getPaymentHistory(testData.orderId)
        const analytics = await PaymentService.getPaymentAnalytics(testData.restaurantId)
        
        return { 
          success: paymentHistory.length > 0, 
          data: { 
            paymentCount: paymentHistory.length,
            totalRevenue: analytics.totalRevenue,
            avgOrderValue: analytics.avgOrderValue
          }
        }
      }
    }
  ]

  const runAllTests = async () => {
    setIsRunning(true)
    setTestResults({})
    
    for (const step of testSteps) {
      setCurrentStep(step.id)
      
      try {
        const result = await step.test()
        setTestResults(prev => ({
          ...prev,
          [step.id]: { ...result, timestamp: new Date().toISOString() }
        }))
        
        if (result.success) {
          toast.success(`✅ ${step.name} - Passed`)
        } else {
          toast.error(`❌ ${step.name} - Failed`)
        }
        
        // Wait 1 second between tests
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } catch (error) {
        console.error(`Test ${step.id} failed:`, error)
        setTestResults(prev => ({
          ...prev,
          [step.id]: { 
            success: false, 
            error: error.message,
            timestamp: new Date().toISOString()
          }
        }))
        toast.error(`❌ ${step.name} - Error: ${error.message}`)
      }
    }
    
    setCurrentStep(null)
    setIsRunning(false)
    toast.success('🎉 Workflow test completed!')
  }

  const getStepStatus = (stepId) => {
    if (currentStep === stepId) return 'running'
    if (testResults[stepId]) {
      return testResults[stepId].success ? 'success' : 'error'
    }
    return 'pending'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircleIcon className="h-5 w-5 text-red-500" />
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
    }
  }

  const successCount = Object.values(testResults).filter(r => r.success).length
  const totalTests = testSteps.length
  const completedTests = Object.keys(testResults).length

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Restaurant Order Workflow Test
            </h2>
            <p className="text-gray-600 mt-1">
              Complete end-to-end testing of the ordering system
            </p>
          </div>
          
          <button
            onClick={runAllTests}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <PlayIcon className="h-5 w-5" />
            {isRunning ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>

        {/* Progress */}
        {completedTests > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress: {completedTests}/{totalTests} tests completed
              </span>
              <span className="text-sm font-medium text-green-600">
                {successCount}/{completedTests} passed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(completedTests / totalTests) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Test Steps */}
        <div className="space-y-4">
          {testSteps.map((step, index) => {
            const status = getStepStatus(step.id)
            const result = testResults[step.id]
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border rounded-lg p-4 transition-all ${
                  status === 'running' ? 'border-blue-500 bg-blue-50' :
                  status === 'success' ? 'border-green-500 bg-green-50' :
                  status === 'error' ? 'border-red-500 bg-red-50' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(status)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{step.name}</h3>
                      {index < testSteps.length - 1 && (
                        <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                    
                    {result && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        {result.success ? (
                          <div>
                            <p className="text-sm font-medium text-green-800 mb-2">✅ Test Passed</p>
                            {result.data && (
                              <pre className="text-xs text-gray-600 overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-red-800 mb-2">❌ Test Failed</p>
                            <p className="text-sm text-red-600">{result.error}</p>
                            {result.data && (
                              <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Completed at: {new Date(result.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Test Data */}
        {Object.keys(testData).some(key => testData[key]) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Test Data</h4>
            <pre className="text-sm text-gray-600 overflow-x-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkflowTest
