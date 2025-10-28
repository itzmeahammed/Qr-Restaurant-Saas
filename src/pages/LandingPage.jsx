import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  QrCodeIcon, 
  DevicePhoneMobileIcon, 
  ChartBarIcon,
  ClockIcon,
  StarIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  UsersIcon,
  ShieldCheckIcon,
  BuildingStorefrontIcon,
  CogIcon,
  BellIcon,
  PlayIcon,
  SparklesIcon,
  RocketLaunchIcon
} from '@heroicons/react/24/outline'
import restaurantLogo from '../assets/restaurant-logo.png'

const LandingPage = () => {
  const navigate = useNavigate()
  
  // Brand Colors from Restaurant Logo
  const BRAND_ORANGE = '#F59E0B' // Amber-500
  const BRAND_BLACK = '#1F2937' // Gray-800
  const features = [
    {
      icon: QrCodeIcon,
      title: 'QR Code Ordering',
      description: 'Customers scan QR codes to access menus instantly without downloading apps'
    },
    {
      icon: DevicePhoneMobileIcon,
      title: 'Mobile Optimized',
      description: 'Perfect mobile experience with PWA capabilities for seamless ordering'
    },
    {
      icon: ChartBarIcon,
      title: 'Real-time Analytics',
      description: 'Track orders, revenue, and customer behavior with comprehensive dashboards'
    },
    {
      icon: CreditCardIcon,
      title: 'Multiple Payment Options',
      description: 'Accept payments via UPI, cards, wallets, and cash with integrated gateways'
    },
    {
      icon: UsersIcon,
      title: 'Staff Management',
      description: 'Automatic order assignment, performance tracking, and tip distribution'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with 99.9% uptime guarantee'
    }
  ]

  const stats = [
    { number: '500+', label: 'Restaurants' },
    { number: '50K+', label: 'Orders Daily' },
    { number: '99.9%', label: 'Uptime' },
    { number: '4.9★', label: 'Rating' }
  ]

  const howItWorks = [
    {
      step: '01',
      title: 'Setup Your Restaurant',
      description: 'Create your account, add restaurant details, and upload your menu with photos',
      icon: BuildingStorefrontIcon,
      color: 'from-blue-500 to-blue-600'
    },
    {
      step: '02',
      title: 'Generate QR Codes',
      description: 'Create unique QR codes for each table that link directly to your digital menu',
      icon: QrCodeIcon,
      color: 'from-purple-500 to-purple-600'
    },
    {
      step: '03',
      title: 'Manage Orders',
      description: 'Receive orders in real-time, assign to staff, and track preparation status',
      icon: CogIcon,
      color: 'from-green-500 to-green-600'
    },
    {
      step: '04',
      title: 'Grow Your Business',
      description: 'Use analytics to optimize menu, pricing, and operations for maximum profit',
      icon: ChartBarIcon,
      color: 'from-orange-500 to-orange-600'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="relative z-40 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              className="relative"
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              <div className="bg-white rounded-2xl px-4 py-3 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] transition-all">
                <img src={restaurantLogo} alt="Ordyrr Restaurant" className="h-10 sm:h-12 w-auto" />
              </div>
            </motion.div>

            {/* Navigation */}
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="font-black text-sm hover:text-amber-500 transition-colors">FEATURES</a>
                <a href="#how-it-works" className="font-black text-sm hover:text-amber-500 transition-colors">HOW IT WORKS</a>
                <a href="#pricing" className="font-black text-sm hover:text-amber-500 transition-colors">PRICING</a>
              </div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link 
                  to="/auth" 
                  className="px-6 py-2.5 sm:px-8 sm:py-3 rounded-full font-black text-sm sm:text-base transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_0_rgba(0,0,0,1)] active:shadow-[2px_2px_0_0_rgba(0,0,0,1)] border-4 border-black text-white"
                  style={{ backgroundColor: BRAND_ORANGE }}
                >
                  GET STARTED
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
        <div className="h-1 bg-black"></div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ backgroundColor: BRAND_ORANGE }}>
        {/* Playful Background Elements */}
        <div className="absolute inset-0">
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
          
          {/* Dot Pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%23000000'/%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="relative z-10 px-4 py-12 sm:py-16 lg:py-24">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              
              {/* Left Side - Text Content */}
              <div className="text-center lg:text-left space-y-6 sm:space-y-8">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="inline-flex items-center gap-2 bg-black px-4 py-2 rounded-full border-2 border-black shadow-[3px_3px_0_0_rgba(0,0,0,0.3)]"
                >
                  <SparklesIcon className="w-5 h-5 text-amber-400" />
                  <span className="font-black text-sm tracking-wide text-amber-400">TRUSTED BY 500+ RESTAURANTS</span>
                </motion.div>

                {/* Main Headline */}
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="space-y-1 sm:space-y-2"
                >
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black leading-[0.9] tracking-tighter">
                    TRANSFORM
                  </h1>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black leading-[0.9] tracking-tighter">
                    YOUR
                  </h1>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-black leading-[0.9] tracking-tighter">
                    RESTAURANT
                  </h1>
                </motion.div>

                {/* Subtitle - Shorter for mobile */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="text-base sm:text-lg lg:text-2xl font-black text-black/90 max-w-lg mx-auto lg:mx-0"
                >
                  <span className="lg:hidden">Boost revenue by 40%. Reduce wait times by 60%. Powered by QR technology.</span>
                  <span className="hidden lg:block">Boost revenue by 40%. Reduce wait times by 60%. Powered by QR technology.</span>
                </motion.p>

                {/* Mobile Feature Pills - Mobile Only */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="lg:hidden flex flex-wrap justify-center gap-3"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white rounded-full px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-2"
                  >
                    <span className="text-xl">⚡</span>
                    <span className="font-black text-xs text-black">FAST</span>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white rounded-full px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-2"
                  >
                    <span className="text-xl">📊</span>
                    <span className="font-black text-xs text-black">ANALYTICS</span>
                  </motion.div>
                  
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="bg-white rounded-full px-4 py-2 border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-2"
                  >
                    <span className="text-xl">💰</span>
                    <span className="font-black text-xs text-black">REVENUE</span>
                  </motion.div>
                </motion.div>

                {/* Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto lg:mx-0"
                >
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-lg sm:text-2xl lg:text-3xl font-black text-black">{stat.number}</div>
                      <div className="text-xs sm:text-sm font-bold text-black/70">{stat.label}</div>
                    </div>
                  ))}
                </motion.div>
              </div>

              {/* Right Side - Dashboard Mockup */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.8, type: "spring", bounce: 0.3 }}
                className="hidden lg:block relative"
              >
                {/* Desktop Frame */}
                <div className="relative bg-black rounded-3xl p-3 border-4 border-black shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                  {/* Screen */}
                  <div className="bg-white rounded-2xl overflow-hidden">
                    {/* Browser Bar */}
                    <div className="bg-gray-100 px-4 py-3 flex items-center gap-2 border-b-2 border-black">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500 border border-black"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500 border border-black"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500 border border-black"></div>
                      </div>
                      <div className="flex-1 bg-white rounded-lg px-3 py-1 border-2 border-black">
                        <span className="text-xs font-bold text-black/60">ordyrr.com/dashboard</span>
                      </div>
                    </div>

                    {/* Dashboard Content */}
                    <div className="p-6 bg-white">
                      {/* Header */}
                      <div className="mb-6">
                        <h3 className="text-xl font-black text-black mb-1">Dashboard</h3>
                        <p className="text-xs font-bold text-black/60">Today's Performance</p>
                      </div>

                      {/* Stats Cards */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {/* Revenue Card */}
                        <motion.div
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="p-4 rounded-xl border-4 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                          style={{ backgroundColor: BRAND_ORANGE }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                              <span className="text-lg">💰</span>
                            </div>
                            <span className="text-xs font-black text-black">REVENUE</span>
                          </div>
                          <div className="text-2xl font-black text-black mb-1">₹45,280</div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-black text-green-600">↑ 40%</span>
                            <span className="text-xs font-bold text-black/60">vs last week</span>
                          </div>
                        </motion.div>

                        {/* Orders Card */}
                        <motion.div
                          animate={{ scale: [1, 1.02, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                          className="p-4 rounded-xl border-4 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                          style={{ backgroundColor: BRAND_ORANGE }}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                              <span className="text-lg">📦</span>
                            </div>
                            <span className="text-xs font-black text-black">ORDERS</span>
                          </div>
                          <div className="text-2xl font-black text-black mb-1">342</div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-black text-green-600">↑ 35%</span>
                            <span className="text-xs font-bold text-black/60">vs last week</span>
                          </div>
                        </motion.div>
                      </div>

                      {/* Chart Placeholder */}
                      <div className="p-4 rounded-xl border-4 border-black bg-gray-50">
                        <div className="flex items-end justify-between h-20 gap-2">
                          {[40, 65, 45, 80, 60, 90, 75].map((height, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: 0 }}
                              animate={{ height: `${height}%` }}
                              transition={{ delay: i * 0.1, duration: 0.5 }}
                              className="flex-1 rounded-t-lg border-2 border-black"
                              style={{ backgroundColor: BRAND_ORANGE }}
                            />
                          ))}
                        </div>
                        <div className="mt-2 text-center">
                          <span className="text-xs font-black text-black/60">WEEKLY GROWTH</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Success Badge */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -top-4 -right-4 bg-white p-3 rounded-2xl border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-black">Live Dashboard</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - WHY CHOOSE US? */}
      <section id="features" className="py-16 sm:py-20 bg-black relative overflow-hidden">
        {/* Playful Background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-10 left-20 w-20 h-20 rounded-full"
            style={{ backgroundColor: BRAND_ORANGE, opacity: 0.1 }}
            animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-20 right-16 w-16 h-16 rotate-45"
            style={{ backgroundColor: BRAND_ORANGE, opacity: 0.1 }}
            animate={{ rotate: [45, 135, 45] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%23F59E0B'/%3E%3C/svg%3E")`,
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
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 tracking-tighter" style={{ color: BRAND_ORANGE }}>
              WHY CHOOSE US?
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl max-w-2xl mx-auto font-bold" style={{ color: BRAND_ORANGE, opacity: 0.8 }}>
              Everything you need to run a modern restaurant ⚡
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
                className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_6px_0_0_rgba(245,158,11,0.3)] hover:shadow-[0_8px_0_0_rgba(245,158,11,0.5)] transition-all group border-4 border-black"
                style={{ backgroundColor: BRAND_ORANGE }}
              >
                <div className="flex items-start gap-4 sm:gap-0 sm:block">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-black rounded-2xl sm:rounded-3xl flex items-center justify-center mb-0 sm:mb-6 group-hover:rotate-6 transition-transform shadow-[0_4px_0_0_rgba(0,0,0,0.3)] flex-shrink-0">
                    <feature.icon className="w-8 h-8 sm:w-10 sm:h-10" style={{ color: BRAND_ORANGE }} />
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
      <section id="how-it-works" className="py-16 sm:py-20 relative overflow-hidden" style={{ backgroundColor: BRAND_ORANGE }}>
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
              Get your restaurant online in 4 simple steps 🚀
            </p>
          </motion.div>

          {/* Steps Grid - Mobile: 2x2, Desktop: 4 columns */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {howItWorks.map((step, index) => (
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
                    <step.icon className="w-10 h-10 sm:w-12 sm:h-12" style={{ color: BRAND_ORANGE }} />
                  </div>
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-black border-3 sm:border-4 border-black shadow-[0_3px_0_0_rgba(0,0,0,1)] sm:shadow-[0_4px_0_0_rgba(0,0,0,1)]" style={{ backgroundColor: BRAND_ORANGE, color: '#000' }}>
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

          {/* CTA Button - Hidden on mobile (buttons are fixed at bottom) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="hidden sm:flex justify-center mt-12 sm:mt-16"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/auth')}
              className="px-10 py-4 sm:px-12 sm:py-5 bg-black rounded-full font-black text-xl sm:text-2xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] hover:shadow-[0_8px_0_0_rgba(0,0,0,0.3)] active:shadow-[0_3px_0_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all border-4 border-black"
              style={{ color: BRAND_ORANGE }}
            >
              GET STARTED NOW ⚡
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 sm:py-20 bg-black relative overflow-hidden">
        {/* Playful Background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-10 left-10 w-20 h-20 rounded-full"
            style={{ backgroundColor: BRAND_ORANGE, opacity: 0.1 }}
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-10 right-20 w-16 h-16 rotate-45"
            style={{ backgroundColor: BRAND_ORANGE, opacity: 0.1 }}
            animate={{ rotate: [45, 225, 45] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%23F59E0B'/%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black mb-4 sm:mb-6 tracking-tighter" style={{ color: BRAND_ORANGE }}>
              SIMPLE PRICING
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl max-w-2xl mx-auto font-bold" style={{ color: BRAND_ORANGE, opacity: 0.8 }}>
              Start free and scale as you grow 💰
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Starter Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_6px_0_0_rgba(245,158,11,0.3)] hover:shadow-[0_8px_0_0_rgba(245,158,11,0.5)] transition-all border-4 border-black bg-white"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-black mb-2">STARTER</h3>
                <div className="text-5xl font-black text-black mb-1">FREE</div>
                <p className="text-black/70 font-bold">Perfect for small restaurants</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-black font-bold">Up to 50 orders/month</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-black font-bold">QR code menus</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-black font-bold">Basic analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-black font-bold">Email support</span>
                </li>
              </ul>
              
              <Link to="/auth" className="w-full text-center block px-6 py-3 bg-white text-black rounded-full font-black border-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] transition-all">
                GET STARTED FREE
              </Link>
            </motion.div>

            {/* Professional Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_8px_0_0_rgba(245,158,11,0.5)] hover:shadow-[0_10px_0_0_rgba(245,158,11,0.7)] transition-all border-4 border-black relative transform scale-105"
              style={{ backgroundColor: BRAND_ORANGE }}
            >
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-black text-amber-400 px-4 py-1 rounded-full text-sm font-black border-2 border-black">
                  MOST POPULAR
                </span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-black mb-2">PROFESSIONAL</h3>
                <div className="text-5xl font-black text-black mb-1">₹999</div>
                <p className="text-black/70 font-bold">per month</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-black font-bold">Unlimited orders</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-black font-bold">Advanced analytics</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-black font-bold">Staff management</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-black font-bold">Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="text-black font-bold">Custom branding</span>
                </li>
              </ul>
              
              <Link to="/auth" className="w-full text-center block px-6 py-3 bg-black text-amber-400 rounded-full font-black border-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] transition-all">
                START FREE TRIAL
              </Link>
            </motion.div>

            {/* Enterprise Plan */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_6px_0_0_rgba(245,158,11,0.3)] hover:shadow-[0_8px_0_0_rgba(245,158,11,0.5)] transition-all border-4 border-black bg-white"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-black text-black mb-2">ENTERPRISE</h3>
                <div className="text-5xl font-black text-black mb-1">CUSTOM</div>
                <p className="text-black/70 font-bold">For restaurant chains</p>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-black font-bold">Everything in Pro</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-black font-bold">Multi-location support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-black font-bold">Dedicated account manager</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-black font-bold">24/7 phone support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-black font-bold">Custom integrations</span>
                </li>
              </ul>
              
              <Link to="/auth" className="w-full text-center block px-6 py-3 bg-white text-black rounded-full font-black border-4 border-black shadow-[0_4px_0_0_rgba(0,0,0,1)] hover:shadow-[0_6px_0_0_rgba(0,0,0,1)] transition-all">
                CONTACT SALES
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 pb-24 sm:pb-28 relative overflow-hidden" style={{ backgroundColor: BRAND_ORANGE }}>
        {/* Playful Background */}
        <div className="absolute inset-0">
          <motion.div 
            className="absolute top-10 left-10 w-20 h-20 rounded-full border-4 border-black/10"
            animate={{ scale: [1, 1.4, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-10 right-20 w-16 h-16 rotate-45 border-4 border-black/10"
            animate={{ rotate: [45, 225, 45] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%23000000'/%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-7xl font-black text-black mb-4 sm:mb-6 tracking-tighter">
              READY TO GROW?
            </h2>
            <p className="text-lg sm:text-xl lg:text-2xl mb-10 sm:mb-12 max-w-2xl mx-auto font-bold text-black/90">
              Join 500+ restaurants using Ordyrr to boost revenue and delight customers 🚀
            </p>
            
            {/* Desktop Only Buttons */}
            <div className="hidden sm:flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center max-w-xl mx-auto">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/auth')}
                className="flex-1 px-8 py-4 sm:py-5 rounded-full font-black text-lg sm:text-xl shadow-[0_6px_0_0_rgba(0,0,0,0.3)] hover:shadow-[0_8px_0_0_rgba(0,0,0,0.3)] active:shadow-[0_3px_0_0_rgba(0,0,0,0.3)] active:translate-y-1 transition-all flex items-center justify-center gap-3 group border-4 border-black bg-black text-amber-400"
              >
                <RocketLaunchIcon className="w-6 h-6 sm:w-7 sm:h-7 group-hover:rotate-12 transition-transform" />
                <span>START FREE TRIAL</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/menu/demo')}
                className="flex-1 px-8 py-4 sm:py-5 bg-white text-black rounded-full font-black text-lg sm:text-xl border-4 border-black shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:shadow-[0_8px_0_0_rgba(0,0,0,1)] active:translate-y-1 transition-all flex items-center justify-center gap-3 group"
              >
                <PlayIcon className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform" />
                <span>VIEW DEMO</span>
              </motion.button>
            </div>

            {/* Mobile Message - Pointing to fixed buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="sm:hidden mt-8"
            >
              <div className="inline-flex items-center gap-2 bg-black/10 backdrop-blur-sm px-6 py-3 rounded-full border-2 border-black/30">
                <span className="text-black font-bold text-sm">👇 Use buttons below to get started</span>
              </div>
            </motion.div>
          </motion.div>
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
          onClick={() => navigate('/auth')}
          className="px-5 py-3 sm:px-6 sm:py-4 bg-black rounded-full font-black text-sm sm:text-base shadow-[0_6px_0_0_rgba(0,0,0,0.4)] hover:shadow-[0_8px_0_0_rgba(0,0,0,0.6)] active:shadow-[0_3px_0_0_rgba(0,0,0,0.4)] active:translate-y-1 transition-all flex items-center justify-center gap-2 group border-4 border-black text-amber-400"
        >
          <RocketLaunchIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
          <span>START FREE</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1, rotate: -3 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/menu/demo')}
          className="px-5 py-3 sm:px-6 sm:py-4 bg-white text-black rounded-full font-black text-sm sm:text-base shadow-[0_6px_0_0_rgba(0,0,0,1)] hover:shadow-[0_8px_0_0_rgba(0,0,0,1)] active:shadow-[0_3px_0_0_rgba(0,0,0,1)] active:translate-y-1 transition-all border-4 border-black flex items-center justify-center gap-2 group"
        >
          <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
          <span>VIEW DEMO</span>
        </motion.button>
      </motion.div>

      {/* Footer */}
      <footer className="bg-black text-white py-12 sm:py-16 border-t-4 border-amber-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-4">
                <img src={restaurantLogo} alt="Ordyrr Restaurant" className="h-12 w-auto" />
              </div>
              <p className="text-white/70 leading-relaxed font-bold text-sm">
                The complete QR ordering solution for modern restaurants.
              </p>
            </div>
            <div>
              <h3 className="font-black mb-4 text-amber-400">PRODUCT</h3>
              <ul className="space-y-2 text-white/70 font-bold text-sm">
                <li><a href="#features" className="hover:text-amber-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-amber-400 transition-colors">Pricing</a></li>
                <li><a href="/menu/demo" className="hover:text-amber-400 transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black mb-4 text-amber-400">SUPPORT</h3>
              <ul className="space-y-2 text-white/70 font-bold text-sm">
                <li><a href="#" className="hover:text-amber-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-black mb-4 text-amber-400">COMPANY</h3>
              <ul className="space-y-2 text-white/70 font-bold text-sm">
                <li><a href="#" className="hover:text-amber-400 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-amber-400 transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t-2 border-white/10 pt-8 text-center">
            <p className="text-white/60 font-bold text-sm">&copy; 2024 Ordyrr Restaurant SaaS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
