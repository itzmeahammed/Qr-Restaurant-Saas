import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  UserIcon,
  BellIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  QuestionMarkCircleIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  ArrowLeftIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
import CustomerNavHeader from '../components/customer/CustomerNavHeader'
import MobileMenu from '../components/customer/MobileMenu'
import { useCustomerNavigation } from '../contexts/CustomerNavigationContext'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'

// Brand colors
const BRAND_LIME = '#C6FF3D'
const BRAND_BLACK = '#2D2D2D'

const CustomerSettings = () => {
  const navigate = useNavigate()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [language, setLanguage] = useState('English')

  // Safe navigation hook usage
  let navigationContext = null
  try {
    navigationContext = useCustomerNavigation()
  } catch (error) {
    console.warn('CustomerSettings: Navigation context not available')
  }
  
  const { currentUser, isAuthenticated } = navigationContext || {}

  const settingsGroups = [
    {
      title: 'Account',
      items: [
        {
          icon: UserIcon,
          label: 'Profile Information',
          description: 'Update your personal details',
          action: () => toast.success('🔧 Profile settings coming soon!')
        },
        {
          icon: CreditCardIcon,
          label: 'Payment Methods',
          description: 'Manage your payment options',
          action: () => toast.success('💳 Payment settings coming soon!')
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: BellIcon,
          label: 'Notifications',
          description: 'Order updates and promotions',
          toggle: true,
          value: notifications,
          action: () => {
            setNotifications(!notifications)
            toast.success(`🔔 Notifications ${!notifications ? 'enabled' : 'disabled'}`)
          }
        },
        {
          icon: darkMode ? MoonIcon : SunIcon,
          label: 'Dark Mode',
          description: 'Switch between light and dark theme',
          toggle: true,
          value: darkMode,
          action: () => {
            setDarkMode(!darkMode)
            toast.success(`🌙 Dark mode ${!darkMode ? 'enabled' : 'disabled'}`)
          }
        },
        {
          icon: GlobeAltIcon,
          label: 'Language',
          description: language,
          action: () => toast.success('🌍 Language settings coming soon!')
        }
      ]
    },
    {
      title: 'Security & Privacy',
      items: [
        {
          icon: ShieldCheckIcon,
          label: 'Privacy Settings',
          description: 'Control your data and privacy',
          action: () => toast.success('🔒 Privacy settings coming soon!')
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          icon: QuestionMarkCircleIcon,
          label: 'Help & Support',
          description: 'Get help and contact support',
          action: () => toast.success('❓ Support center coming soon!')
        }
      ]
    }
  ]

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CustomerNavHeader 
          title="Settings" 
          showBackButton={true}
          showMenu={true}
          onMenuClick={() => setShowMobileMenu(true)}
        />
        <div className="p-6 text-center py-20">
          <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access your settings</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.href = '/customer-auth'}
            className="px-6 py-3 bg-black text-white rounded-2xl font-semibold hover:bg-gray-800 transition-all"
          >
            Sign In
          </motion.button>
        </div>
        <MobileMenu 
          isOpen={showMobileMenu}
          onClose={() => setShowMobileMenu(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND_LIME }}>
      {/* Playful Background */}
      <div className="fixed inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-20 right-10 w-32 h-32 rounded-full border-4 border-black/5"
          animate={{ y: [0, -20, 0], rotate: [0, 180, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-32 left-10 w-24 h-24 rounded-full bg-black/5"
          animate={{ y: [0, 20, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Dot Pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 30 30' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='15' cy='15' r='2' fill='%232D2D2D'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Header */}
      <motion.div 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-50 bg-black border-b-4 border-black"
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.1, rotate: -10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/customer')}
              className="w-12 h-12 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(198,255,61,1)] hover:shadow-[4px_4px_0_0_rgba(198,255,61,1)] transition-all"
            >
              <ArrowLeftIcon className="w-5 h-5 text-black" />
            </motion.button>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", bounce: 0.5 }}
            >
              <img src={logo} alt="Ordyrr" className="h-10 w-auto" />
            </motion.div>
            
            <motion.button
              whileHover={{ scale: 1.1, rotate: 10 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(true)}
              className="w-12 h-12 rounded-full bg-white border-4 border-black flex items-center justify-center shadow-[3px_3px_0_0_rgba(198,255,61,1)] hover:shadow-[4px_4px_0_0_rgba(198,255,61,1)] transition-all"
            >
              <Bars3Icon className="w-5 h-5 text-black" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Page Title & User Info */}
      <div className="relative z-10 p-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] mb-4"
        >
          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-20 h-20 rounded-full flex items-center justify-center border-4 border-black font-black text-2xl"
              style={{ backgroundColor: BRAND_LIME, color: BRAND_BLACK }}
            >
              {currentUser?.name?.charAt(0) || 'U'}
            </motion.div>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-black tracking-tight mb-1">SETTINGS</h2>
              <p className="text-black/70 font-bold text-sm">{currentUser?.email || 'Not signed in'}</p>
              <p className="text-xs font-bold text-black/50 mt-1">Customer since Jan 2024</p>
            </div>
          </div>
        </motion.div>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="bg-white rounded-2xl border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] overflow-hidden mb-4"
          >
            <div className="px-6 py-4 border-b-4 border-black">
              <h3 className="text-xl font-black text-black">{group.title.toUpperCase()}</h3>
            </div>
            
            <div className="p-4 space-y-2">
              {group.items.map((item, itemIndex) => (
                <motion.button
                  key={item.label}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.action}
                  className="w-full px-4 py-4 flex items-center gap-3 text-left rounded-xl border-3 border-black shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)] transition-all"
                  style={{ backgroundColor: BRAND_LIME }}
                >
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 border-3 border-black">
                    <item.icon className="w-6 h-6 text-black" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-black">{item.label.toUpperCase()}</p>
                    <p className="text-xs font-bold text-black/70 truncate">{item.description}</p>
                  </div>
                  
                  {item.toggle ? (
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full border-3 border-black transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)] ${
                        item.value ? 'bg-black' : 'bg-gray-300'
                      }`}
                    >
                      <span className={`inline-block h-5 w-5 transform rounded-full border-2 border-black transition-transform ${
                        item.value ? 'translate-x-8' : 'translate-x-1'
                      }`} style={{ backgroundColor: BRAND_LIME }} />
                    </motion.div>
                  ) : (
                    <ChevronRightIcon className="w-6 h-6 text-black flex-shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* App Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 border-4 border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] mb-4"
        >
          <div className="text-center">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 border-4 border-black"
              style={{ backgroundColor: BRAND_LIME }}
            >
              <img src={logo} alt="Ordyrr" className="h-12 w-auto" />
            </motion.div>
            <h3 className="font-black text-black text-xl mb-1">ORDYRR</h3>
            <p className="text-sm font-bold text-black/70 mb-2">Version 1.0.0</p>
            <p className="text-xs font-bold text-black/50">
              Made with ❤️ for better dining experiences
            </p>
          </div>
        </motion.div>
      </div>

      <MobileMenu 
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </div>
  )
}

export default CustomerSettings
