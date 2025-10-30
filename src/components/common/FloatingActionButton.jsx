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
  const [chatMessage, setChatMessage] = useState('')
  const [chatMessages, setChatMessages] = useState([
    { id: 1, text: '👋 Hi! How can we help you today?', sender: 'bot', time: new Date() },
    { id: 2, text: "I'm here to assist with any questions about Ordyrr! 🍽️", sender: 'bot', time: new Date() }
  ])
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

  const BRAND_LIME = '#C6FF3D'
  const BRAND_BLACK = '#2D2D2D'

  const actions = [
    {
      icon: QrCodeIcon,
      label: 'Scan QR',
      color: 'text-white border-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)]',
      bgColor: BRAND_BLACK,
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
      color: 'text-black border-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)]',
      bgColor: '#FFFFFF',
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
      color: 'text-white border-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)]',
      bgColor: '#3B82F6',
      onClick: () => {
        setShowChat(true)
        toast.success('💬 Chat opened', { duration: 1500 })
        setIsOpen(false)
      }
    },
    {
      icon: PhoneIcon,
      label: 'Call Us',
      color: 'text-white border-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)]',
      bgColor: '#10B981',
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
                  
                  {/* Compact Action Menu - Ordyrr Style */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="absolute bottom-20 right-0 space-y-3"
                  >
                    {actions.map((action, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.05, x: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={action.onClick}
                        className={`flex items-center gap-3 px-5 py-3 rounded-full transition-all font-black text-sm min-w-[170px] ${action.color}`}
                        style={{ backgroundColor: action.bgColor }}
                      >
                        <action.icon className="w-5 h-5" />
                        <span>{action.label}</span>
                      </motion.button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Main FAB Button - Ordyrr Style */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: isOpen ? 0 : 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsOpen(!isOpen)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border-4 border-black ${
                isOpen 
                  ? 'shadow-[0_4px_0_0_rgba(0,0,0,1)]' 
                  : 'shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:shadow-[0_8px_0_0_rgba(0,0,0,1)]'
              }`}
              style={{ backgroundColor: isOpen ? '#EF4444' : BRAND_LIME }}
            >
              <motion.div
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {isOpen ? (
                  <XMarkIcon className="w-6 h-6 text-white font-bold" />
                ) : (
                  <PlusIcon className="w-6 h-6 text-black font-bold" />
                )}
              </motion.div>
              
              {/* Small notification dot - Ordyrr Style */}
              {!isOpen && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse border-2 border-white" style={{ backgroundColor: '#EF4444' }}></div>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal - Ordyrr Brand Style */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-end p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="rounded-[2rem] shadow-[8px_8px_0_0_rgba(0,0,0,1)] border-4 border-black w-full max-w-sm h-[500px] flex flex-col overflow-hidden"
              style={{ backgroundColor: BRAND_LIME }}
            >
              {/* Chat Header - Ordyrr Style */}
              <div className="p-6 flex items-center justify-between border-b-4 border-black" style={{ backgroundColor: BRAND_BLACK }}>
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-black shadow-[4px_4px_0_0_rgba(198,255,61,0.3)]"
                    style={{ backgroundColor: BRAND_LIME }}
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChatBubbleLeftRightIcon className="w-6 h-6 text-black" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-black tracking-tight" style={{ color: BRAND_LIME }}>LIVE SUPPORT 💬</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#10B981' }}></div>
                      <p className="text-sm font-bold" style={{ color: BRAND_LIME, opacity: 0.8 }}>Online now</p>
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowChat(false)}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center border-4 border-black shadow-[4px_4px_0_0_rgba(198,255,61,0.3)] transition-all"
                  style={{ backgroundColor: BRAND_LIME }}
                >
                  <XMarkIcon className="w-5 h-5 text-black" />
                </motion.button>
              </div>

              {/* Chat Messages - Ordyrr Style */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto" style={{ backgroundColor: '#FFFFFF' }}>
                {chatMessages.map((msg, index) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.sender === 'bot' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`rounded-2xl p-4 max-w-xs border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] ${
                      msg.sender === 'user' ? 'ml-auto' : ''
                    }`}
                    style={{ 
                      backgroundColor: msg.sender === 'bot' ? '#FFFFFF' : BRAND_LIME 
                    }}
                  >
                    <p className="text-sm font-bold text-black">{msg.text}</p>
                  </motion.div>
                ))}
                
                {/* Quick Actions */}
                {chatMessages.length <= 2 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="space-y-2 pt-2"
                  >
                    <p className="text-xs font-black text-black/60 uppercase tracking-wide">Quick Actions:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { emoji: '📱', text: 'Scan QR' },
                        { emoji: '🏪', text: 'Find Food' },
                        { emoji: '📞', text: 'Call Us' },
                        { emoji: '❓', text: 'Help' }
                      ].map((action, i) => (
                        <motion.button
                          key={i}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const actionMsg = {
                              id: chatMessages.length + 1,
                              text: `I need help with: ${action.text}`,
                              sender: 'user',
                              time: new Date()
                            }
                            setChatMessages([...chatMessages, actionMsg])
                            
                            setTimeout(() => {
                              const botMsg = {
                                id: chatMessages.length + 2,
                                text: `Great! I can help you with ${action.text}. A support agent will assist you shortly! 💚`,
                                sender: 'bot',
                                time: new Date()
                              }
                              setChatMessages(prev => [...prev, botMsg])
                            }, 1000)
                          }}
                          className="px-3 py-2 rounded-xl font-black text-xs border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)] transition-all"
                          style={{ backgroundColor: BRAND_LIME, color: BRAND_BLACK }}
                        >
                          {action.emoji} {action.text}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Chat Input - Ordyrr Style */}
              <div className="p-4 border-t-4 border-black" style={{ backgroundColor: BRAND_LIME }}>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  if (chatMessage.trim()) {
                    // Add user message
                    const userMsg = {
                      id: chatMessages.length + 1,
                      text: chatMessage,
                      sender: 'user',
                      time: new Date()
                    }
                    setChatMessages([...chatMessages, userMsg])
                    setChatMessage('')
                    
                    // Simulate bot response after 1 second
                    setTimeout(() => {
                      const botMsg = {
                        id: chatMessages.length + 2,
                        text: "Thanks for your message! A support agent will assist you shortly. For immediate help, check our Quick Actions above! 💚",
                        sender: 'bot',
                        time: new Date()
                      }
                      setChatMessages(prev => [...prev, botMsg])
                    }, 1000)
                  }
                }} className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-3 border-4 border-black rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-black/20 shadow-[4px_4px_0_0_rgba(0,0,0,1)] bg-white text-black placeholder-black/50"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={!chatMessage.trim()}
                    className="px-6 py-3 rounded-2xl text-sm font-black border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: BRAND_BLACK, color: BRAND_LIME }}
                  >
                    SEND ➤
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default FloatingActionButton
