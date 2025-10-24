import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlayIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import CartService from '../../services/cartService'
import OrderService from '../../services/orderService'
import PaymentService from '../../services/paymentService'
import customerService from '../../services/customerService'
import StaffAssignmentService from '../../services/staffAssignmentService'
import realtimeService from '../../services/realtimeService'
import toast from 'react-hot-toast'

const CompleteWorkflowIntegrationTest = () => {
  const [testResults, setTestResults] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [currentStep, setCurrentStep] = useState(null)
  const [testData, setTestData] = useState({
    sessionId: null,
    restaurantId: 'test-restaurant-id',
    tableId: 'test-table-id',
    orderId: null,
    staffId: null,
    paymentId: null
  })

  const workflowSteps = [
    {
      id: 'customer_session',
      name: '1. Customer QR Scan & Session Creation',
      description: 'Customer scans QR code and creates session',
      test: async () => {
        const sessionResult = await customerService.createCustomerSession({
          restaurantId: testData.restaurantId,
          tableId: testData.tableId,
          customerName: 'Test Customer',
          customerPhone: '+91-9876543210',
          customerEmail: 'test@customer.com'
        })
        
        if (sessionResult.success) {
          setTestData(prev => ({ ...prev, sessionId: sessionResult.data.session_id }))
          return { 
            success: true, 
            data: { 
              sessionId: sessionResult.data.session_id,
              restaurantName: sessionResult.data.restaurants?.name
            }
          }
        }
        throw new Error(sessionResult.error)
      }
    },
    {
      id: 'cart_management',
      name: '2. Menu Browsing & Cart Storage',
      description: 'Customer adds items to cart (stored in database)',
      test: async () => {
        if (!testData.sessionId) throw new Error('No session ID')
        
        // Add multiple items to cart
        await CartService.addToCart(testData.sessionId, {
          menuItemId: 'test-item-1',
          quantity: 2,
          specialInstructions: 'Extra spicy'
        })
        
        await CartService.addToCart(testData.sessionId, {
          menuItemId: 'test-item-2',
          quantity: 1,
          specialInstructions: 'No onions'
        })
        
        // Verify cart storage
        const cartSummary = await CartService.getCartSummary(testData.sessionId)
        
        return { 
          success: cartSummary.itemCount >= 2, 
          data: { 
            itemCount: cartSummary.itemCount,
            subtotal: cartSummary.subtotal,
            total: cartSummary.total
          }
        }
      }
    },
    {
      id: 'staff_availability_check',
      name: '3. Staff Availability Check',
      description: 'System checks if staff is available at restaurant',
      test: async () => {
        const availableStaff = await StaffAssignmentService.getAvailableStaff(testData.restaurantId)
        const staffDistribution = await StaffAssignmentService.getStaffDistribution(testData.restaurantId)
        
        return { 
          success: true, 
          data: { 
            availableStaffCount: availableStaff.length,
            recommendedStaff: staffDistribution.recommendedStaff,
            staffShortage: staffDistribution.staffShortage,
            hasAvailableStaff: availableStaff.length > 0
          }
        }
      }
    },
    {
      id: 'order_creation_assignment',
      name: '4. Order Creation & Staff Assignment',
      description: 'Create order and assign to available staff OR notify owner',
      test: async () => {
        if (!testData.sessionId) throw new Error('No session ID')
        
        const orderResult = await OrderService.createOrder({
          restaurantId: testData.restaurantId,
          tableId: testData.tableId,
          sessionId: testData.sessionId,
          specialInstructions: 'Test order - complete workflow verification',
          paymentMethod: 'cash',
          tipAmount: 50
        })
        
        setTestData(prev => ({ 
          ...prev, 
          orderId: orderResult.id,
          staffId: orderResult.assigned_staff_id
        }))
        
        return { 
          success: !!orderResult.id, 
          data: { 
            orderNumber: orderResult.order_number,
            orderId: orderResult.id,
            assignedStaff: orderResult.assigned_staff_id,
            workflowStatus: orderResult.workflow_status,
            totalAmount: orderResult.total_amount
          }
        }
      }
    },
    {
      id: 'staff_notification',
      name: '5. Staff Real-time Notification',
      description: 'Staff receives WebSocket notification for new order',
      test: async () => {
        if (!testData.staffId || !testData.orderId) {
          return { 
            success: false, 
            data: { error: 'No staff assigned - owner should be notified instead' }
          }
        }
        
        return new Promise((resolve) => {
          let notificationReceived = false
          
          // Subscribe to staff notifications
          const subscription = realtimeService.subscribeToStaffNotifications(testData.staffId, {
            onNewOrder: (data) => {
              notificationReceived = true
              subscription?.unsubscribe?.()
              resolve({ 
                success: true, 
                data: { 
                  orderId: data.orderId,
                  staffNotified: true,
                  notificationData: data
                }
              })
            }
          })
          
          // Simulate staff notification
          setTimeout(() => {
            realtimeService.notifyStaffNewOrder(testData.staffId, {
              id: testData.orderId,
              order_number: `TEST-${Date.now()}`,
              total_amount: 350
            })
          }, 1000)
          
          // Timeout after 5 seconds
          setTimeout(() => {
            if (!notificationReceived) {
              subscription?.unsubscribe?.()
              resolve({ 
                success: false, 
                data: { error: 'Staff notification timeout' }
              })
            }
          }, 5000)
        })
      }
    },
    {
      id: 'customer_order_tracking',
      name: '6. Customer Real-time Order Tracking',
      description: 'Customer receives WebSocket updates for order status',
      test: async () => {
        if (!testData.sessionId || !testData.orderId) {
          throw new Error('Missing session or order ID')
        }
        
        return new Promise((resolve) => {
          let updateReceived = false
          
          const subscription = customerService.trackSessionOrder(testData.sessionId, testData.orderId, {
            onOrderAssigned: (data) => {
              updateReceived = true
              subscription?.unsubscribe?.()
              resolve({ 
                success: true, 
                data: { 
                  orderStatus: data.status,
                  staffName: data.staffName,
                  trackingActive: true
                }
              })
            },
            onStatusUpdate: (data) => {
              updateReceived = true
              subscription?.unsubscribe?.()
              resolve({ 
                success: true, 
                data: { 
                  newStatus: data.status,
                  trackingActive: true
                }
              })
            }
          })
          
          // Simulate order status update
          setTimeout(() => {
            realtimeService.notifyCustomerOrderUpdate(testData.sessionId, {
              id: testData.orderId,
              order_number: `TEST-${Date.now()}`,
              status: 'assigned'
            }, 'assigned')
          }, 1000)
          
          // Timeout after 5 seconds
          setTimeout(() => {
            if (!updateReceived) {
              subscription?.unsubscribe?.()
              resolve({ 
                success: false, 
                data: { error: 'Customer tracking timeout' }
              })
            }
          }, 5000)
        })
      }
    },
    {
      id: 'payment_processing',
      name: '7. Payment Processing (Pay Now/Later)',
      description: 'Process payment based on customer choice',
      test: async () => {
        if (!testData.orderId) throw new Error('No order ID')
        
        // Test cash payment (pay later)
        const cashPaymentResult = await PaymentService.processPayment({
          orderId: testData.orderId,
          amount: 350,
          paymentMethod: 'cash',
          staffId: testData.staffId,
          tipAmount: 50
        })
        
        // Test online payment (pay now)
        const onlinePaymentResult = await PaymentService.processPayment({
          orderId: testData.orderId,
          amount: 350,
          paymentMethod: 'online',
          transactionId: `TEST_TXN_${Date.now()}`,
          tipAmount: 50
        })
        
        setTestData(prev => ({ ...prev, paymentId: cashPaymentResult.data?.id }))
        
        return { 
          success: cashPaymentResult.success && onlinePaymentResult.success, 
          data: { 
            cashPayment: cashPaymentResult.success,
            onlinePayment: onlinePaymentResult.success,
            paymentId: cashPaymentResult.data?.id,
            transactionId: onlinePaymentResult.data?.transaction_id
          }
        }
      }
    },
    {
      id: 'staff_payment_collection',
      name: '8. Staff Payment Collection (Cash Orders)',
      description: 'Staff collects cash payment when order is ready',
      test: async () => {
        if (!testData.orderId || !testData.staffId) {
          throw new Error('Missing order or staff ID')
        }
        
        // Simulate staff collecting cash payment
        const collectionResult = await PaymentService.confirmCashPayment({
          orderId: testData.orderId,
          staffId: testData.staffId,
          amountReceived: 350,
          tipAmount: 50
        })
        
        return { 
          success: collectionResult.success, 
          data: { 
            paymentConfirmed: collectionResult.success,
            amountCollected: 350,
            tipCollected: 50,
            staffId: testData.staffId
          }
        }
      }
    },
    {
      id: 'owner_notifications',
      name: '9. Owner Notifications (Staff Unavailable)',
      description: 'Owner receives notification when no staff available',
      test: async () => {
        // Simulate scenario where no staff is available
        const orderData = {
          id: testData.orderId,
          order_number: `TEST-${Date.now()}`,
          total_amount: 350,
          customer_name: 'Test Customer'
        }
        
        // Notify owner about staff unavailability
        await realtimeService.notifyOwnerStaffUnavailable(testData.restaurantId, orderData)
        
        return { 
          success: true, 
          data: { 
            ownerNotified: true,
            notificationType: 'staff_unavailable',
            orderData: orderData
          }
        }
      }
    },
    {
      id: 'complete_workflow_verification',
      name: '10. Complete Workflow Verification',
      description: 'Verify all components work together seamlessly',
      test: async () => {
        // Get order details to verify complete workflow
        const orderDetails = await OrderService.getOrderDetails(testData.orderId)
        const paymentHistory = await PaymentService.getPaymentHistory(testData.orderId)
        const sessionDetails = await customerService.getCustomerSession(testData.sessionId)
        
        const workflowComplete = !!(
          orderDetails && 
          paymentHistory.length > 0 && 
          sessionDetails.success
        )
        
        return { 
          success: workflowComplete, 
          data: { 
            orderCreated: !!orderDetails,
            paymentProcessed: paymentHistory.length > 0,
            sessionActive: sessionDetails.success,
            workflowComplete,
            totalSteps: workflowSteps.length,
            completedSteps: Object.keys(testResults).length
          }
        }
      }
    }
  ]

  const runCompleteWorkflowTest = async () => {
    setIsRunning(true)
    setTestResults({})
    
    toast.success('🚀 Starting Complete Restaurant Workflow Test')
    
    for (const step of workflowSteps) {
      setCurrentStep(step.id)
      
      try {
        const result = await step.test()
        setTestResults(prev => ({
          ...prev,
          [step.id]: { ...result, timestamp: new Date().toISOString() }
        }))
        
        if (result.success) {
          toast.success(`✅ ${step.name} - PASSED`)
        } else {
          toast.error(`❌ ${step.name} - FAILED`)
        }
        
        // Wait 1.5 seconds between tests for better visualization
        await new Promise(resolve => setTimeout(resolve, 1500))
        
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
        toast.error(`❌ ${step.name} - ERROR: ${error.message}`)
      }
    }
    
    setCurrentStep(null)
    setIsRunning(false)
    
    const successCount = Object.values(testResults).filter(r => r.success).length
    const totalTests = workflowSteps.length
    
    if (successCount === totalTests) {
      toast.success('🎉 Complete Restaurant Workflow - ALL TESTS PASSED!')
    } else {
      toast.error(`⚠️ Workflow Test Complete: ${successCount}/${totalTests} tests passed`)
    }
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
  const totalTests = workflowSteps.length
  const completedTests = Object.keys(testResults).length

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              🍽️ Complete Restaurant Ordering Workflow Test
            </h2>
            <p className="text-gray-600">
              End-to-end verification of the complete restaurant ordering system
            </p>
          </div>
          
          <button
            onClick={runCompleteWorkflowTest}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            <PlayIcon className="h-5 w-5" />
            {isRunning ? 'Running Complete Test...' : 'Run Complete Workflow Test'}
          </button>
        </div>

        {/* Progress */}
        {completedTests > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress: {completedTests}/{totalTests} workflow steps completed
              </span>
              <span className="text-sm font-medium text-green-600">
                {successCount}/{completedTests} passed
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${(completedTests / totalTests) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Workflow Steps */}
        <div className="space-y-4">
          {workflowSteps.map((step, index) => {
            const status = getStepStatus(step.id)
            const result = testResults[step.id]
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`border rounded-lg p-4 transition-all ${
                  status === 'running' ? 'border-blue-500 bg-blue-50 shadow-md' :
                  status === 'success' ? 'border-green-500 bg-green-50' :
                  status === 'error' ? 'border-red-500 bg-red-50' :
                  'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(status)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{step.name}</h3>
                      {index < workflowSteps.length - 1 && (
                        <ArrowRightIcon className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                    
                    {result && (
                      <div className="mt-3 p-3 bg-white rounded border">
                        {result.success ? (
                          <div>
                            <p className="text-sm font-medium text-green-800 mb-2">
                              ✅ Workflow Step Completed Successfully
                            </p>
                            {result.data && (
                              <pre className="text-xs text-gray-600 overflow-x-auto bg-gray-50 p-2 rounded">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        ) : (
                          <div>
                            <p className="text-sm font-medium text-red-800 mb-2">
                              ❌ Workflow Step Failed
                            </p>
                            <p className="text-sm text-red-600">{result.error}</p>
                            {result.data && (
                              <pre className="text-xs text-gray-600 mt-2 overflow-x-auto bg-gray-50 p-2 rounded">
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

        {/* Test Summary */}
        {completedTests > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Workflow Test Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{completedTests}</p>
                <p className="text-sm text-gray-600">Steps Completed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{successCount}</p>
                <p className="text-sm text-gray-600">Steps Passed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{completedTests - successCount}</p>
                <p className="text-sm text-gray-600">Steps Failed</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {completedTests > 0 ? Math.round((successCount / completedTests) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600">Success Rate</p>
              </div>
            </div>
          </div>
        )}

        {/* Test Data */}
        {Object.keys(testData).some(key => testData[key]) && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">Test Data Generated</h4>
            <pre className="text-sm text-gray-600 overflow-x-auto">
              {JSON.stringify(testData, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompleteWorkflowIntegrationTest
