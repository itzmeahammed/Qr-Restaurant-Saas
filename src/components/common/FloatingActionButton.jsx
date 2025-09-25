import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  QrCodeIcon,
  MapPinIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  XMarkIcon,
  HeartIcon,
  ClockIcon,
  PlusIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const FloatingActionButton = ({ onQRScan, onLocationSearch }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const navigate = useNavigate()

  // Hide/show FAB on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const actions = [
    {
      icon: QrCodeIcon,
      label: 'Scan QR',
      color: 'bg-black hover:bg-gray-800 text-white',
      onClick: () => {
        if (onQRScan) {
          onQRScan()
          toast.success('📱 QR Scanner opened', { duration: 1500 })
        } else {
          toast.error('QR Scanner not available')
        }
        setIsOpen(false)
      }
    },
    {
      icon: MapPinIcon,
      label: 'Restaurants',
      color: 'bg-white hover:bg-gray-50 text-black border border-gray-300',
      onClick: () => {
        if (onLocationSearch) {
          onLocationSearch()
          toast.success('🗺️ Restaurant search opened', { duration: 1500 })
        } else {
          navigate('/restaurants')
          toast.success('🏪 Browsing restaurants', { duration: 1500 })
        }
        setIsOpen(false)
      }
    },
    {
      icon: ChatBubbleLeftRightIcon,
      label: 'Live Chat',
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
      onClick: () => {
        setShowChat(true)
        toast.success('💬 Chat opened', { duration: 1500 })
        setIsOpen(false)
      }
    },
    {
      icon: PhoneIcon,
      label: 'Call Us',
      color: 'bg-green-500 hover:bg-green-600 text-white',
      onClick: () => {
        const phoneNumber = '+1-800-QR-FOOD'
        if (navigator.userAgent.match(/iPhone|iPad|iPod|Android/i)) {
          window.location.href = `tel:${phoneNumber}`
          toast.success('📞 Calling support', { duration: 1500 })
        } else {
          navigator.clipboard.writeText(phoneNumber)
          toast.success('📞 Phone copied to clipboard', { duration: 2000 })
        }
        setIsOpen(false)
      }
    }
  ]

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 right-4 z-50"
          >
            <AnimatePresence>
              {isOpen && (
                <>
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm"
                    style={{ zIndex: -1 }}
                    onClick={() => setIsOpen(false)}
                  />
                  
                  {/* Compact Action Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="absolute bottom-16 right-0 space-y-2"
                  >
                    {actions.map((action, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={action.onClick}
                        className={`flex items-center gap-3 px-4 py-3 ${action.color} rounded-xl shadow-lg hover:shadow-xl transition-all font-medium text-sm`}
                      >
                        <action.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{action.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Compact Main FAB */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className={`relative w-12 h-12 rounded-xl shadow-lg flex items-center justify-center transition-all duration-200 ${
                isOpen 
                  ? 'bg-white border-2 border-gray-300 text-gray-700' 
                  : 'bg-black text-white'
              }`}
            >
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? (
                  <XMarkIcon className="w-5 h-5" />
                ) : (
                  <PlusIcon className="w-5 h-5" />
                )}
              </motion.div>
              
              {/* Small notification dot */}
              {!isOpen && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-end p-4"
          >
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm h-96 flex flex-col"
            >
              {/* Chat Header */}
              <div className="bg-blue-500 text-white p-4 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Live Support</h3>
                    <p className="text-xs text-blue-100">Online now</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowChat(false)}
                  className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
                >
                  <XMarkIcon className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-100 rounded-2xl p-3 max-w-xs"
                >
                  <p className="text-sm text-gray-800">👋 Hi! How can we help you today?</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gray-100 rounded-2xl p-3 max-w-xs"
                >
                  <p className="text-sm text-gray-800">I'm here to assist with any questions about QR Restaurant!</p>
                </motion.div>
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-all"
                  >
                    Send
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingActionButton
