import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { 
  QrCodeIcon,
  CameraIcon,
  MapPinIcon,
  StarIcon,
  ClockIcon,
  ShoppingCartIcon,
  UserIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import FloatingActionButton from '../components/common/FloatingActionButton'
import AppInstallPrompt from '../components/common/AppInstallPrompt'
import NetworkStatus from '../components/common/NetworkStatus'
import ordyrrLogo from '../assets/logo green.png'

// Brand palette - Matching Menu Page
const BRAND_GREEN = '#00E676' // Header background
const ACTION_GREEN = '#00C853' // Buttons, active states
const BRAND_LIME = '#C6FF3D' // Legacy (replaced with green)
const BRAND_BLACK = '#2D2D2D'
const BRAND_WHITE = '#ffffff'

const CustomerLanding = () => {
  const navigate = useNavigate()
  const [showQRScanner, setShowQRScanner] = useState(false)
  const [showLocationSearch, setShowLocationSearch] = useState(false)
  const [location, setLocation] = useState('')
  const scannerRef = useRef(null)

  // Cleanup scanner on component unmount
  React.useEffect(() => {
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear()
        } catch (error) {
          console.warn('Error cleaning up scanner:', error)
        }
      }
    }
  }, [])

  const features = [
    {
      icon: QrCodeIcon,
      title: 'Scan QR Code',
      description: 'Simply point your camera at the table QR code and start ordering instantly'
    },
    {
      icon: ClockIcon,
      title: 'Order Instantly',
      description: 'Browse menu, customize your order, and send it directly to the kitchen'
    },
    {
      icon: ShoppingCartIcon,
      title: 'Track Orders',
      description: 'Get real-time updates on your order status from kitchen to table'
    },
    {
      icon: StarIcon,
      title: 'Rate & Review',
      description: 'Share your dining experience and help others discover great food'
    }
  ]

  const steps = [
    {
      step: '01',
      title: 'Scan QR Code',
      description: 'Use your phone camera to scan the QR code on your table',
      icon: QrCodeIcon
    },
    {
      step: '02',
      title: 'Browse Menu',
      description: 'Explore the digital menu with photos and detailed descriptions',
      icon: MagnifyingGlassIcon
    },
    {
      step: '03',
      title: 'Place Order',
      description: 'Add items to cart and customize your order preferences',
      icon: ShoppingCartIcon
    },
    {
      step: '04',
      title: 'Enjoy Food',
      description: 'Relax while your order is prepared and served to your table',
      icon: StarIcon
    }
  ]

  const startQRScanner = () => {
    setShowQRScanner(true)
    
    setTimeout(() => {
      try {
        const scanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        )

        scanner.render(
          (decodedText) => {
            console.log('QR Code scanned:', decodedText)
            stopQRScanner()
            
            // Parse QR code URL and navigate
            try {
              const url = new URL(decodedText)
              if (url.pathname.includes('/menu/')) {
                window.location.href = decodedText
              } else {
                toast.error('Invalid QR code. Please scan a restaurant table QR code.')
              }
            } catch (error) {
              toast.error('Invalid QR code format.')
            }
          },
          (error) => {
            console.warn('QR scan error:', error)
          }
        )

        scannerRef.current = scanner
      } catch (error) {
        console.error('Failed to start QR scanner:', error)
        toast.error('Failed to start camera. Please check permissions.')
        setShowQRScanner(false)
      }
    }, 100)
  }

  const stopQRScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear()
        scannerRef.current = null
      } catch (error) {
        console.warn('Error stopping scanner:', error)
      }
    }
    setShowQRScanner(false)
  }

  const searchByLocation = () => {
    if (!location.trim()) {
      toast.error('Please enter your location')
      return
    }
    
    // Navigate to restaurant discovery page with location
    navigate(`/restaurants?location=${encodeURIComponent(location)}`)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND_GREEN }}>
      {/* Header - Unique Floating Design */}
      <header className="relative z-40" style={{ backgroundColor: BRAND_GREEN }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo with unique card design */}
            <motion.div 
              className="relative"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="bg-white rounded-2xl px-4 py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all">
                <img 
                  src={ordyrrLogo} 
                  alt="Ordyrr - Dine In" 
                  className="h-10 sm:h-12 w-auto"
                />
              </div>
            </motion.div>
            
            {/* Navigation with unique pill design */}
            <div className="flex items-center gap-3 sm:gap-4">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/customer-auth"
                  className="px-6 py-2.5 sm:px-8 sm:py-3 bg-black rounded-full font-black text-sm sm:text-base transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.4)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.6)] active:shadow-[2px_2px_0_0_rgba(0,0,0,0.4)] border-2 border-black"
                  style={{ color: BRAND_GREEN }}
                >
                  Sign In
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
        {/* Bottom border accent */}
        <div className="h-1 bg-black"></div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ backgroundColor: BRAND_GREEN }}>
        {/* Playful Background Elements */}
        <div className="absolute inset-0">
          {/* Floating circles */}
          <motion.div 
            className="absolute top-20 right-10 w-24 h-24 rounded-full border-4 border-black/10"
            animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-32 left-16 w-16 h-16 rounded-full bg-black/5"
            animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute top-1/2 left-10 w-12 h-12 rotate-45 border-4 border-black/10"
            animate={{ rotate: [45, 225, 45] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Dot Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%23000000'/%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 px-4 py-12 sm:py-16 lg:py-24 pb-32">
          <div className="max-w-6xl mx-auto">
            {/* Hero Content - Asymmetric Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center relative">
              
              {/* Left Side - Text Content */}
              <div className="text-center lg:text-left space-y-6 sm:space-y-8">
                {/* Main Headline - Stacked Words */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.8 }}
                  className="space-y-1 sm:space-y-2"
                >
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-black leading-[0.85] tracking-tighter">
                    SCAN.
                  </h1>
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-black leading-[0.85] tracking-tighter">
                    ORDER.
                  </h1>
                  <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-black leading-[0.85] tracking-tighter">
                    ENJOY.
                  </h1>
                </motion.div>

                {/* Speed Highlight */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="space-y-1"
                >
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-black">
                    30 seconds to order.
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-black text-black">
                    10 minutes to eat.
                  </p>
                </motion.div>

                {/* Tagline - Hidden on mobile, shown on desktop */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="hidden lg:block text-lg sm:text-xl lg:text-2xl font-black text-black max-w-lg"
                >
                  Welcome to India's fastest dine-in app.
                </motion.p>

                {/* Mobile Compact Design - Visible only on mobile */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="lg:hidden mt-6 space-y-6"
                >
                  {/* Compact Feature Pills */}
                  <div className="flex flex-wrap justify-center gap-3">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-white rounded-full px-5 py-2.5 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-2"
                    >
                      <span className="text-2xl">⚡</span>
                      <span className="font-black text-sm text-black">FAST</span>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-white rounded-full px-5 py-2.5 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-2"
                    >
                      <span className="text-2xl">🔒</span>
                      <span className="font-black text-sm text-black">SECURE</span>
                    </motion.div>
                    
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="bg-white rounded-full px-5 py-2.5 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-2"
                    >
                      <span className="text-2xl">😋</span>
                      <span className="font-black text-sm text-black">EASY</span>
                    </motion.div>
                  </div>

                  {/* Animated Food Icons */}
                  <div className="flex justify-center gap-4">
                    <motion.div
                      animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="text-4xl"
                    >
                      🍕
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -10, 0], rotate: [0, -5, 0] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                      className="text-4xl"
                    >
                      🍔
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -12, 0], rotate: [0, 8, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                      className="text-4xl"
                    >
                      🍜
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, -9, 0], rotate: [0, -8, 0] }}
                      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
                      className="text-4xl"
                    >
                      🍰
                    </motion.div>
                  </div>

                  {/* Mobile Tagline */}
                  <p className="text-base font-black text-black/90 max-w-sm mx-auto">
                    India's fastest dine-in app
                  </p>
                </motion.div>
              </div>

              {/* Right Side - Phone Mockup with Food Animation - Desktop Only */}
              <div className="hidden lg:flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8, type: "spring", bounce: 0.3 }}
                  className="relative"
                >
                  {/* Phone Mockup */}
                  <div className="relative">
                    {/* Phone Frame */}
                    <div className="relative bg-black rounded-[3rem] p-3 border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)]">
                      {/* Phone Screen */}
                      <div className="bg-white rounded-[2.5rem] overflow-hidden w-[280px] h-[560px] relative">
                        {/* Status Bar */}
                        <div className="absolute top-0 left-0 right-0 h-10 bg-white z-10 flex items-center justify-between px-6">
                          <span className="text-xs font-bold text-black">9:41</span>
                          <div className="flex gap-1">
                            <div className="w-4 h-3 border border-black rounded-sm"></div>
                            <div className="w-4 h-3 border border-black rounded-sm"></div>
                            <div className="w-4 h-3 border border-black rounded-sm"></div>
                          </div>
                        </div>

                        {/* Screen Content */}
                        <div className="pt-12 px-6 pb-6 h-full flex flex-col items-center justify-center" style={{ backgroundColor: BRAND_GREEN }}>
                          {/* App Header */}
                          <div className="mb-6">
                            <img 
                              src={ordyrrLogo} 
                              alt="Ordyrr" 
                              className="h-12 w-auto mx-auto"
                            />
                          </div>

                          {/* Main Content */}
                          <div className="text-center mb-6">
                            <h3 className="text-2xl font-black text-black mb-2">SCAN & ORDER</h3>
                            <p className="text-sm font-bold text-black/80">Skip the wait, skip the menu</p>
                          </div>

                          {/* QR Code Placeholder */}
                          <motion.div 
                            className="bg-white rounded-2xl p-6 mb-6 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                            animate={{ scale: [1, 1.02, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <div className="w-32 h-32 bg-black/10 rounded-xl flex items-center justify-center">
                              <QrCodeIcon className="w-20 h-20 text-black/30" />
                            </div>
                          </motion.div>

                          {/* CTA Button */}
                          <div className="bg-black rounded-full px-8 py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
                            <span className="font-black text-sm" style={{ color: BRAND_LIME }}>SCAN QR CODE</span>
                          </div>

                          <p className="text-xs font-bold text-black/60 mt-4">Fast • Secure • Easy</p>
                        </div>
                      </div>

                      {/* Phone Notch */}
                      <div className="absolute top-3 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-b-2xl"></div>
                    </div>
                  </div>

                  {/* Floating Food Emojis */}
                  <motion.div
                    className="absolute -top-8 -left-8 text-5xl"
                    animate={{ 
                      y: [0, -15, 0],
                      rotate: [0, 10, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    🍕
                  </motion.div>

                  <motion.div
                    className="absolute -top-4 -right-12 text-4xl"
                    animate={{ 
                      y: [0, -20, 0],
                      rotate: [0, -15, 0]
                    }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    🍔
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-8 -left-12 text-4xl"
                    animate={{ 
                      y: [0, 15, 0],
                      rotate: [0, 15, 0]
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    🍜
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-4 -right-8 text-5xl"
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, -10, 0]
                    }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                  >
                    🍰
                  </motion.div>

                  <motion.div
                    className="absolute top-1/2 -left-16 text-3xl"
                    animate={{ 
                      y: [0, 20, 0],
                      x: [0, -5, 0]
                    }}
                    transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  >
                    🥗
                  </motion.div>

                  <motion.div
                    className="absolute top-1/3 -right-12 text-4xl"
                    animate={{ 
                      y: [0, -18, 0],
                      rotate: [0, 20, 0]
                    }}
                    transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  >
                    🍱
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fixed Floating CTA Buttons - Bottom Center (Mobile & Desktop) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6, type: "spring", bounce: 0.4 }}
        className="fixed bottom-6 sm:bottom-8 left-0 right-0 z-50 flex flex-row gap-3 sm:gap-4 justify-center items-center px-4"
        style={{ transform: 'none' }}
      >
        <motion.button
          whileHover={{ scale: 1.1, rotate: 3 }}
          whileTap={{ scale: 0.95 }}
          onClick={startQRScanner}
          className="px-5 py-3 sm:px-6 sm:py-4 bg-black rounded-full font-black text-sm sm:text-base shadow-[0_6px_0_0_rgba(0,0,0,0.4)] hover:shadow-[0_8px_0_0_rgba(0,0,0,0.6)] active:shadow-[0_3px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 transition-all flex items-center justify-center gap-2 group border-4 border-black"
          style={{ color: BRAND_GREEN }}
        >
          <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
          <span>SCAN QR</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, rotate: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowLocationSearch(true)}
          className="px-5 py-3 sm:px-6 sm:py-4 bg-white text-black rounded-full font-black text-sm sm:text-base shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:shadow-[0_8px_0_0_rgba(0,0,0,1)] active:shadow-[0_3px_0_0_rgba(0,0,0,1)] active:translate-y-1 transition-all border-4 border-black flex items-center justify-center gap-2 group"
        >
          <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
          <span>FIND FOOD</span>
        </motion.button>
      </motion.div>

      {/* Features Section - WHY ORDYRR? */}
      <section className="py-16 sm:py-20 bg-black relative overflow-hidden">
        {/* Playful Background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-10 left-20 w-20 h-20 rounded-full"
            style={{ backgroundColor: BRAND_GREEN, opacity: 0.1 }}
            animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 right-16 w-16 h-16 rotate-45"
            style={{ backgroundColor: BRAND_GREEN, opacity: 0.1 }}
            animate={{ rotate: [45, 135, 45] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%23C6FF3D'/%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 tracking-tighter" style={{ color: BRAND_GREEN }}>
              WHY ORDYRR?
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl max-w-2xl mx-auto font-bold" style={{ color: BRAND_GREEN, opacity: 0.8 }}>
              Experience the revolution in dining ⚡
            </p>
          </motion.div>

          {/* Features Grid - Mobile: Stack, Desktop: 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_6px_0_0_rgba(0,230,118,0.3)] hover:shadow-[0_8px_0_0_rgba(0,230,118,0.5)] transition-all group border-4 border-black"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                <div className="flex items-start gap-4 sm:gap-0 sm:block">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black rounded-2xl sm:rounded-3xl flex items-center justify-center mb-0 sm:mb-6 group-hover:rotate-6 transition-transform shadow-[0_4px_0_0_rgba(0,0,0,0.3)] flex-shrink-0">
                    <feature.icon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: BRAND_GREEN }} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-black mb-2 sm:mb-4 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-black/90 leading-relaxed text-base sm:text-lg font-bold">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 sm:py-20 relative overflow-hidden" style={{ backgroundColor: BRAND_GREEN }}>
        {/* Playful Background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-20 right-20 w-24 h-24 rounded-full border-4 border-black/10"
            animate={{ y: [0, -15, 0], rotate: [0, 180, 360] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-16 left-16 w-16 h-16 rotate-45 border-4 border-black/10"
            animate={{ rotate: [45, 225, 45], scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%23000000'/%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-black mb-4 sm:mb-6 tracking-tighter">
              HOW IT WORKS
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl text-black/90 font-bold">
              Four steps to food heaven 🍔
            </p>
          </motion.div>

          {/* Steps Grid - Mobile: 2x2, Desktop: 4 columns */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="text-center group"
              >
                <div className="relative mb-4 sm:mb-6">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-black rounded-full flex items-center justify-center mx-auto shadow-[0_4px_0_0_rgba(0,0,0,0.3)] sm:shadow-[0_6px_0_0_rgba(0,0,0,0.3)] group-hover:shadow-[0_6px_0_0_rgba(0,0,0,0.3)] sm:group-hover:shadow-[0_8px_0_0_rgba(0,0,0,0.3)] transition-all group-hover:rotate-6 border-4 border-black">
                    <step.icon className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: BRAND_GREEN }} />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-black border-3 sm:border-4 border-black shadow-[0_3px_0_0_rgba(0,0,0,1)] sm:shadow-[0_4px_0_0_rgba(0,0,0,1)]" style={{ backgroundColor: BRAND_GREEN, color: BRAND_BLACK }}>
                    {step.step}
                  </div>
                </div>
                
                <h3 className="text-base sm:text-xl lg:text-2xl font-black text-black mb-2 sm:mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-black/90 leading-relaxed text-sm sm:text-base font-bold">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Call to Action - Hidden on mobile (buttons are fixed at bottom) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="hidden sm:flex justify-center mt-12 sm:mt-16"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={startQRScanner}
              className="px-10 py-4 sm:px-12 sm:py-5 bg-black rounded-full font-black text-xl sm:text-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] hover:shadow-[0_8px_0_0_rgba(0,0,0,0.3)] active:shadow-[0_3px_0_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all border-4 border-black"
              style={{ color: BRAND_GREEN }}
            >
              START NOW ⚡
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showQRScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="rounded-[2rem] p-8 max-w-md w-full shadow-[0_8px_0_0_rgba(0,0,0,1)] border-4 border-black"
              style={{ backgroundColor: BRAND_GREEN }}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black text-black tracking-tight">SCAN QR 📸</h3>
                <button
                  onClick={stopQRScanner}
                  className="p-3 bg-black rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-[0_4px_0_0_rgba(0,0,0,0.3)]"
                  style={{ color: BRAND_GREEN }}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div id="qr-reader" className="mb-8 rounded-3xl overflow-hidden border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,1)]"></div>
              
              <p className="text-black text-center font-black text-lg">
                Point your camera at the table QR code 🎯
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Location Search Modal */}
      <AnimatePresence>
        {showLocationSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-md z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="rounded-[2rem] p-8 max-w-md w-full shadow-[0_8px_0_0_rgba(0,0,0,1)] border-4 border-black"
              style={{ backgroundColor: BRAND_GREEN }}
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black text-black tracking-tight">FIND FOOD 🍕</h3>
                <button
                  onClick={() => setShowLocationSearch(false)}
                  className="p-3 bg-black rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-[0_4px_0_0_rgba(0,0,0,0.3)]"
                  style={{ color: BRAND_GREEN }}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-8">
                <label className="block text-xl font-black text-black mb-4">
                  Enter Location 📍
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-black/60" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 border-4 border-black rounded-2xl focus:ring-4 focus:ring-black/30 focus:border-black text-lg font-bold bg-white shadow-[0_4px_0_0_rgba(0,0,0,1)]"
                    placeholder="City, area, or restaurant name"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLocationSearch(false)}
                  className="flex-1 px-6 py-4 border-4 border-black text-black rounded-3xl bg-white hover:scale-105 active:scale-95 transition-all font-black text-lg shadow-[0_4px_0_0_rgba(0,0,0,1)]"
                >
                  CANCEL
                </button>
                <button
                  onClick={searchByLocation}
                  className="flex-1 px-6 py-4 bg-black rounded-3xl hover:scale-105 active:scale-95 transition-all font-black text-lg shadow-[0_4px_0_0_rgba(0,0,0,0.3)] border-4 border-black"
                  style={{ color: BRAND_GREEN }}
                >
                  SEARCH
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer CTA */}
      <section className="py-16 sm:py-20 pb-24 sm:pb-28 bg-black relative overflow-hidden">
        {/* Playful Background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-10 left-10 w-20 h-20 rounded-full"
            style={{ backgroundColor: BRAND_GREEN, opacity: 0.1 }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-10 right-20 w-16 h-16 rotate-45"
            style={{ backgroundColor: BRAND_GREEN, opacity: 0.1 }}
            animate={{ rotate: [45, 225, 45] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%23C6FF3D'/%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 tracking-tighter" style={{ color: BRAND_GREEN }}>
              READY TO EAT?
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl mb-10 sm:mb-12 max-w-2xl mx-auto font-bold" style={{ color: BRAND_GREEN, opacity: 0.9 }}>
              Join the food revolution. No downloads, no waiting, just pure convenience. 🚀
            </p>
            
            {/* Desktop Only Buttons */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center max-w-xl mx-auto">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={startQRScanner}
                className="flex-1 px-8 py-4 sm:py-5 rounded-3xl font-black text-lg sm:text-xl shadow-[0_6px_0_0_rgba(0,230,118,0.3)] hover:shadow-[0_8px_0_0_rgba(0,230,118,0.5)] active:shadow-[0_3px_0_0_rgba(0,230,118,0.3)] active:translate-y-1 transition-all flex items-center justify-center gap-3 group border-4 border-black"
                style={{ backgroundColor: BRAND_GREEN, color: BRAND_BLACK }}
              >
                <QrCodeIcon className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
                <span>SCAN NOW</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/customer-auth')}
                className="flex-1 px-8 py-4 sm:py-5 bg-transparent rounded-3xl font-black text-lg sm:text-xl border-4 hover:shadow-[0_6px_0_0_rgba(0,230,118,0.3)] active:translate-y-1 transition-all flex items-center justify-center gap-3 group"
                style={{ borderColor: BRAND_GREEN, color: BRAND_GREEN }}
              >
                <UserIcon className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
                <span>SIGN UP</span>
              </motion.button>
            </div>

            {/* Mobile Message - Pointing to fixed buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="sm:hidden mt-8"
            >
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-lime-400/30">
                <span className="text-lime-400 font-bold text-sm">👇 Use buttons below to get started</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Floating Action Button */}
      <FloatingActionButton 
        onQRScan={startQRScanner}
        onLocationSearch={() => setShowLocationSearch(true)}
      />

      {/* App Install Prompt */}
      <AppInstallPrompt />

      {/* Network Status */}
      <NetworkStatus />
    </div>
  )
}

export default CustomerLanding
