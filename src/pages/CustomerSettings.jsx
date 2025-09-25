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
  SunIcon
} from '@heroicons/react/24/outline'
import CustomerNavHeader from '../components/customer/CustomerNavHeader'
import MobileMenu from '../components/customer/MobileMenu'
import { useCustomerNavigation } from '../contexts/CustomerNavigationContext'
import toast from 'react-hot-toast'

const CustomerSettings = () => {
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
    <div className="min-h-screen bg-gray-50">
      <CustomerNavHeader 
        title="Settings" 
        showBackButton={true}
        showMenu={true}
        onMenuClick={() => setShowMobileMenu(true)}
      />

      {/* User Info */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xl">
              {currentUser?.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-xl text-gray-900">{currentUser?.name || 'Ahammed S'}</h2>
            <p className="text-gray-600">{currentUser?.email || 'sumaiya27khan@gmail.com'}</p>
            <p className="text-sm text-gray-500 mt-1">Customer since Jan 2024</p>
          </div>
        </div>
      </div>

      {/* Settings Groups */}
      <div className="p-4 space-y-6">
        {settingsGroups.map((group, groupIndex) => (
          <motion.div
            key={group.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: groupIndex * 0.1 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100"
          >
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{group.title}</h3>
            </div>
            
            <div className="divide-y divide-gray-100">
              {group.items.map((item, itemIndex) => (
                <motion.button
                  key={item.label}
                  whileHover={{ backgroundColor: '#f9fafb' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={item.action}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left transition-all"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500 truncate">{item.description}</p>
                  </div>
                  
                  {item.toggle ? (
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      item.value ? 'bg-black' : 'bg-gray-300'
                    }`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        item.value ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </div>
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* App Info */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="text-center">
            <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-3">
              <span className="text-white font-bold text-xl">QR</span>
            </div>
            <h3 className="font-bold text-gray-900 mb-1">QR Restaurant</h3>
            <p className="text-sm text-gray-500 mb-2">Version 1.0.0</p>
            <p className="text-xs text-gray-400">
              Made with ❤️ for better dining experiences
            </p>
          </div>
        </div>
      </div>

      <MobileMenu 
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      />
    </div>
  )
}

export default CustomerSettings
