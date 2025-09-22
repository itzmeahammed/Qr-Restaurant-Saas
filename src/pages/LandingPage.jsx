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
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const LandingPage = () => {
  const navigate = useNavigate()
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        onClick={() => navigate(-1)}
        className="fixed top-6 left-6 z-50 bg-white/90 backdrop-blur-sm hover:bg-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      >
        <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
      </motion.button>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <QrCodeIcon className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-xl font-bold text-neutral-900">QR Restaurant</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-neutral-600 hover:text-primary-500 transition-colors">Features</a>
              <a href="#pricing" className="text-neutral-600 hover:text-primary-500 transition-colors">Pricing</a>
              <a href="#contact" className="text-neutral-600 hover:text-primary-500 transition-colors">Contact</a>
              <Link to="/dashboard" className="btn-primary">Get Started</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-neutral-900 leading-tight">
                Transform Your Restaurant with
                <span className="gradient-bg bg-clip-text text-transparent"> QR Ordering</span>
              </h1>
              <p className="text-xl text-neutral-600 mt-6 leading-relaxed">
                Complete contactless dining solution with QR menus, real-time order tracking, 
                staff management, and powerful analytics. Boost efficiency and customer satisfaction.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-8">
                <Link to="/menu/demo" className="btn-primary text-center">
                  Try Demo Menu
                </Link>
                <Link to="/dashboard" className="btn-outline text-center">
                  Start Free Trial
                </Link>
              </div>
              <div className="flex items-center gap-8 mt-8">
                <div className="flex items-center gap-2">
                  <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-sm text-neutral-600">4.9/5 rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-primary-500" />
                  <span className="text-sm text-neutral-600">Setup in 5 minutes</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl p-6 text-white">
                  <QrCodeIcon className="h-16 w-16 mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Scan & Order</h3>
                  <p className="opacity-90">Instant access to menu without app downloads</p>
                </div>
                <div className="mt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-success rounded-full"></div>
                    <span className="text-neutral-700">Order placed successfully</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-warning rounded-full animate-pulse"></div>
                    <span className="text-neutral-700">Preparing your order...</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-neutral-300 rounded-full"></div>
                    <span className="text-neutral-400">Ready for pickup</span>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-accent-400 rounded-3xl blur-xl opacity-30 -z-10"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold text-primary-500 mb-2">
                  {stat.number}
                </div>
                <div className="text-neutral-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-neutral-900 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-neutral-600 max-w-3xl mx-auto">
              Comprehensive restaurant management platform designed for modern dining experiences
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="card hover:shadow-2xl transition-all duration-300 group"
              >
                <div className="flex items-center mb-4">
                  <div className="p-3 bg-primary-100 rounded-xl group-hover:bg-primary-500 transition-colors duration-300">
                    <feature.icon className="h-6 w-6 text-primary-500 group-hover:text-white transition-colors duration-300" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Restaurant?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of restaurants already using our platform to increase efficiency and customer satisfaction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard" className="bg-white text-primary-500 hover:bg-neutral-100 font-medium py-3 px-8 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl">
                Start Free Trial
              </Link>
              <Link to="/menu/demo" className="border-2 border-white text-white hover:bg-white hover:text-primary-500 font-medium py-3 px-8 rounded-xl transition-all duration-200">
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <QrCodeIcon className="h-8 w-8 text-primary-500" />
                <span className="ml-2 text-xl font-bold">QR Restaurant</span>
              </div>
              <p className="text-neutral-400 leading-relaxed">
                The complete QR ordering solution for modern restaurants.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-neutral-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-neutral-400">
            <p>&copy; 2024 QR Restaurant SaaS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
