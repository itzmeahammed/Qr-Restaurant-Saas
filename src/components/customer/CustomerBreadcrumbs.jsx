import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'
import { useCustomerNavigation } from '../../contexts/CustomerNavigationContext'

const CustomerBreadcrumbs = ({ className = '' }) => {
  // Safe navigation hook usage with fallback
  let navigationContext = null
  try {
    navigationContext = useCustomerNavigation()
  } catch (error) {
    console.warn('CustomerBreadcrumbs: Navigation context not available')
    return null // Don't render breadcrumbs if context is not available
  }
  
  const { getBreadcrumbs, goToHome } = navigationContext
  const breadcrumbs = getBreadcrumbs()

  if (breadcrumbs.length <= 1) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-gray-50 border-b border-gray-200 ${className}`}
    >
      <div className="px-4 py-2">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
          {/* Home Icon */}
          <button
            onClick={goToHome}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            <HomeIcon className="w-4 h-4" />
          </button>

          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              
              <span
                className={`text-sm font-medium whitespace-nowrap ${
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                {crumb.title}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default CustomerBreadcrumbs
