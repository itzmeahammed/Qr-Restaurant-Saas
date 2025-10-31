import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  ArrowLeftIcon,
  UserIcon,
  ClockIcon,
  GiftIcon,
  MapPinIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline'
import ordyrrCoin from '../../assets/ordyrr coin.png'
import { supabase } from '../../config/supabase'

// Ordyrr Brand Colors
const ACTION_GREEN = '#00C853'
const DARK_TEXT = '#212121'
const MEDIUM_GRAY = '#666666'

const ProfileModal = ({ isOpen, onClose, currentCustomer, loyaltyPoints, onViewOrders, onViewLiveOrders, onLogout }) => {
  const [showCoinsHistory, setShowCoinsHistory] = React.useState(false)
  const [coinsTransactions, setCoinsTransactions] = React.useState([])
  const [loadingHistory, setLoadingHistory] = React.useState(false)

  // Fetch coins transaction history
  const fetchCoinsHistory = async () => {
    if (!currentCustomer?.id) return
    
    setLoadingHistory(true)
    try {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('customer_id', currentCustomer.id)
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setCoinsTransactions(data || [])
    } catch (error) {
      console.error('Error fetching coins history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Fetch history when modal opens
  React.useEffect(() => {
    if (showCoinsHistory) {
      fetchCoinsHistory()
    }
  }, [showCoinsHistory])

  if (!currentCustomer) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header with Green Background */}
            <div className="p-4" style={{ background: 'linear-gradient(135deg, #00E676 0%, #00C853 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <button onClick={onClose} className="p-2">
                  <ArrowLeftIcon className="w-5 h-5 text-white" />
                </button>
                <h3 className="text-lg font-bold text-white uppercase">Profile</h3>
                <button onClick={onClose} className="p-2">
                  <XMarkIcon className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Profile Avatar & Name */}
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mb-3">
                  <UserIcon className="w-10 h-10" style={{ color: ACTION_GREEN }} />
                </div>
                <h4 className="text-xl font-bold text-white">{currentCustomer.full_name || currentCustomer.name}</h4>
                <p className="text-sm text-white/90">{currentCustomer.email}</p>
              </div>
            </div>

            {/* Ordyrr Coin Card */}
            <div className="px-4 py-3">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold" style={{ color: MEDIUM_GRAY }}>Ordyrr Coins</p>
                    <p className="text-3xl font-black" style={{ color: '#F59E0B' }}>{loyaltyPoints || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                    <img src={ordyrrCoin} alt="Ordyrr Coin" className="w-8 h-8 object-contain" />
                  </div>
                </div>
                <button
                  onClick={() => setShowCoinsHistory(true)}
                  className="w-full py-2 text-xs font-bold rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: '#FEF3C7',
                    color: '#92400E',
                    border: '1px solid #FCD34D'
                  }}
                >
                  View History →
                </button>
              </div>
            </div>

            {/* Account Information */}
            <div className="px-4 py-3">
              <h5 className="text-sm font-bold mb-3" style={{ color: DARK_TEXT }}>Account Information</h5>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span style={{ color: MEDIUM_GRAY }}>Name:</span>
                  <span className="font-semibold" style={{ color: DARK_TEXT }}>{currentCustomer.full_name || currentCustomer.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: MEDIUM_GRAY }}>Email:</span>
                  <span className="font-semibold" style={{ color: DARK_TEXT }}>{currentCustomer.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: MEDIUM_GRAY }}>Phone:</span>
                  <span className="font-semibold" style={{ color: DARK_TEXT }}>{currentCustomer.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: MEDIUM_GRAY }}>Member Since:</span>
                  <span className="font-semibold" style={{ color: DARK_TEXT }}>
                    {new Date(currentCustomer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 pb-4 space-y-3">
              {/* Live Order Tracking Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onViewLiveOrders}
                className="w-full py-3 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: ACTION_GREEN,
                  boxShadow: '0 4px 0 0 #000000'
                }}
              >
                <MapPinIcon className="w-5 h-5" />
                <span>Track Live Orders</span>
              </motion.button>

              {/* Order History Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onViewOrders}
                className="w-full py-3 text-black font-bold text-sm rounded-xl flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: '#F59E0B',
                  boxShadow: '0 4px 0 0 #000000'
                }}
              >
                <ClockIcon className="w-5 h-5" />
                <span>View Order History</span>
              </motion.button>

              {/* Logout Button */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onLogout}
                className="w-full py-3 text-white font-bold text-sm rounded-xl"
                style={{ 
                  backgroundColor: '#EF4444',
                  boxShadow: '0 4px 0 0 #000000'
                }}
              >
                Logout
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Coins History Modal */}
      {showCoinsHistory && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowCoinsHistory(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src={ordyrrCoin} alt="Ordyrr Coin" className="w-6 h-6" />
                <h3 className="text-lg font-bold" style={{ color: DARK_TEXT }}>Coins History</h3>
              </div>
              <button onClick={() => setShowCoinsHistory(false)} className="p-2">
                <XMarkIcon className="w-5 h-5" style={{ color: DARK_TEXT }} />
              </button>
            </div>

            {/* Current Balance */}
            <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold" style={{ color: MEDIUM_GRAY }}>Current Balance</span>
                <span className="text-2xl font-black" style={{ color: '#F59E0B' }}>{loyaltyPoints || 0} coins</span>
              </div>
            </div>

            {/* Transaction List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
                </div>
              ) : coinsTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm" style={{ color: MEDIUM_GRAY }}>No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {coinsTransactions.map((transaction) => {
                    const isEarned = transaction.points_earned > 0
                    const isRedeemed = transaction.points_redeemed > 0
                    const amount = isEarned ? transaction.points_earned : transaction.points_redeemed
                    
                    return (
                      <motion.div
                        key={transaction.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isEarned ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                              {isEarned ? (
                                <ArrowDownIcon className="w-4 h-4 text-green-600" />
                              ) : (
                                <ArrowUpIcon className="w-4 h-4 text-red-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold" style={{ color: DARK_TEXT }}>
                                {isEarned ? 'Earned' : 'Redeemed'}
                              </p>
                              <p className="text-xs" style={{ color: MEDIUM_GRAY }}>
                                {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <span className={`text-lg font-black ${
                            isEarned ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {isEarned ? '+' : '-'}{amount}
                          </span>
                        </div>
                        {transaction.description && (
                          <p className="text-xs mt-2 pl-10" style={{ color: MEDIUM_GRAY }}>
                            {transaction.description}
                          </p>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ProfileModal
