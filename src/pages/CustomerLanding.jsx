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
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Html5QrcodeScanner } from 'html5-qrcode'
import toast from 'react-hot-toast'
import FloatingActionButton from '../components/common/FloatingActionButton'
import AppInstallPrompt from '../components/common/AppInstallPrompt'
import NetworkStatus from '../components/common/NetworkStatus'

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-black/10 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center shadow-lg">
                <QrCodeIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-black tracking-tight">QR Restaurant</h1>
                <p className="text-sm text-gray-600 font-medium">Scan. Order. Enjoy.</p>
              </div>
            </div>
            
            <Link
              to="/customer-auth"
              className="px-8 py-3 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        {/* Enhanced Background Pattern */}
        <div className="absolute inset-0">
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000'%3E%3Cpath d='M0 0h1v60H0V0zm60 0v1H0V0h60zM0 60h60v1H0v-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          
          {/* Dot Pattern */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000'%3E%3Ccircle cx='10' cy='10' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          
          {/* Geometric Accent */}
          <div className="absolute top-20 right-20 w-32 h-32 border-4 border-black/5 rounded-full"></div>
          <div className="absolute bottom-32 left-16 w-24 h-24 border-4 border-black/5 rotate-45"></div>
        </div>

        <div className="relative z-10 px-4 py-16 sm:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Hero Text */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="mb-8"
            >
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-black mb-4 leading-[0.9] tracking-tighter">
                SCAN
              </h1>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-gray-400 mb-4 leading-[0.9] tracking-tighter">
                ORDER
              </h1>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-black leading-[0.9] tracking-tighter">
                ENJOY
              </h1>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg sm:text-xl text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              The future of dining is here. No apps, no waiting, no complications.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
            >
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={startQRScanner}
                className="flex-1 px-8 py-4 bg-black text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-black/20 transition-all flex items-center justify-center gap-3 group"
              >
                <CameraIcon className="w-6 h-6 group-hover:rotate-6 transition-transform" />
                <span>SCAN QR</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowLocationSearch(true)}
                className="flex-1 px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg shadow-xl hover:shadow-black/10 transition-all border-2 border-black hover:bg-black hover:text-white flex items-center justify-center gap-3 group"
              >
                <MapPinIcon className="w-6 h-6 group-hover:rotate-6 transition-transform" />
                <span>FIND FOOD</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black relative">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.05]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M0 0h1v40H0V0zm40 0v1H0V0h40zM0 40h40v1H0v-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tighter">
              WHY QR?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto font-light">
              Experience the revolution in dining
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.01, y: -2 }}
                className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-white/10 transition-all group"
              >
                <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-3 transition-transform">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-black mb-4 tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-gray-700 leading-relaxed text-lg font-medium">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white relative">
        {/* Enhanced Background */}
        <div className="absolute inset-0">
          {/* Diagonal Lines Pattern */}
          <div className="absolute inset-0 opacity-[0.015]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%23000000' stroke-width='1'%3E%3Cpath d='M0 40L40 0M-10 10L10-10M30 50L50 30'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          
          {/* Subtle Grid */}
          <div className="absolute inset-0 opacity-[0.01]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000'%3E%3Cpath d='M0 0h1v80H0V0zm80 0v1H0V0h80zM0 80h80v1H0v-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          
          {/* Floating Elements */}
          <div className="absolute top-16 left-10 w-16 h-16 border-2 border-black/5 rounded-full"></div>
          <div className="absolute bottom-20 right-12 w-12 h-12 border-2 border-black/5 rotate-12"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl sm:text-6xl font-black text-black mb-6 tracking-tighter">
              HOW IT WORKS
            </h2>
            <p className="text-xl text-gray-600 font-light">
              Four steps to food heaven
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="text-center group"
              >
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto shadow-xl group-hover:shadow-black/20 transition-all group-hover:rotate-3">
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center text-sm font-black border-2 border-black shadow-md">
                    {step.step}
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-black mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-gray-700 leading-relaxed text-base font-medium">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center mt-16"
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={startQRScanner}
              className="px-12 py-4 bg-black text-white rounded-full font-black text-xl shadow-xl hover:shadow-black/20 transition-all"
            >
              START NOW
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
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border-4 border-black"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black text-black tracking-tight">SCAN QR</h3>
                <button
                  onClick={stopQRScanner}
                  className="p-3 hover:bg-black hover:text-white rounded-2xl transition-all border-2 border-black"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div id="qr-reader" className="mb-8 rounded-3xl overflow-hidden border-4 border-black shadow-xl"></div>
              
              <p className="text-black text-center font-medium text-lg">
                Point your camera at the table QR code
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
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl border-4 border-black"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black text-black tracking-tight">FIND FOOD</h3>
                <button
                  onClick={() => setShowLocationSearch(false)}
                  className="p-3 hover:bg-black hover:text-white rounded-2xl transition-all border-2 border-black"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-8">
                <label className="block text-lg font-bold text-black mb-4">
                  Enter Location
                </label>
                <div className="relative">
                  <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-500" />
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full pl-14 pr-4 py-4 border-4 border-black rounded-2xl focus:ring-4 focus:ring-black/20 focus:border-black text-lg font-medium"
                    placeholder="City, area, or restaurant name"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => setShowLocationSearch(false)}
                  className="flex-1 px-6 py-4 border-4 border-black text-black rounded-2xl hover:bg-black hover:text-white transition-all font-bold text-lg"
                >
                  CANCEL
                </button>
                <button
                  onClick={searchByLocation}
                  className="flex-1 px-6 py-4 bg-black text-white rounded-2xl hover:bg-gray-800 transition-all font-bold text-lg shadow-xl"
                >
                  SEARCH
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer CTA */}
      <section className="py-16 bg-black relative">
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-[0.05]">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M0 0h1v40H0V0zm40 0v1H0V0h40zM0 40h40v1H0v-1z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-6xl font-black text-white mb-6 tracking-tighter">
              READY TO EAT?
            </h2>
            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto font-light">
              Join the food revolution. No downloads, no waiting, just pure convenience.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={startQRScanner}
                className="flex-1 px-8 py-4 bg-white text-black rounded-2xl font-black text-lg shadow-xl hover:shadow-white/10 transition-all flex items-center justify-center gap-3 group"
              >
                <QrCodeIcon className="w-6 h-6 group-hover:rotate-6 transition-transform" />
                <span>SCAN NOW</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/customer-auth')}
                className="flex-1 px-8 py-4 bg-transparent text-white rounded-2xl font-black text-lg border-2 border-white hover:bg-white hover:text-black transition-all flex items-center justify-center gap-3 group"
              >
                <UserIcon className="w-6 h-6 group-hover:rotate-6 transition-transform" />
                <span>SIGN UP</span>
              </motion.button>
            </div>
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
