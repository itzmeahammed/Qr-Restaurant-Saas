import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const CustomerNavigationContext = createContext()

export const useCustomerNavigation = () => {
  const context = useContext(CustomerNavigationContext)
  if (!context) {
    throw new Error('useCustomerNavigation must be used within CustomerNavigationProvider')
  }
  return context
}

export const CustomerNavigationProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [navigationHistory, setNavigationHistory] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Track navigation history
  useEffect(() => {
    const currentPath = {
      path: location.pathname,
      search: location.search,
      timestamp: Date.now(),
      title: getPageTitle(location.pathname)
    }

    setNavigationHistory(prev => {
      // Avoid duplicates of the same path
      if (prev.length > 0 && prev[prev.length - 1].path === currentPath.path) {
        return prev
      }
      // Keep only last 10 entries
      return [...prev.slice(-9), currentPath]
    })
  }, [location])

  const getPageTitle = (pathname) => {
    const routes = {
      '/customer': 'Home',
      '/customer-auth': 'Sign In',
      '/restaurants': 'Restaurants',
      '/menu': 'Menu',
      '/profile': 'Profile',
      '/orders': 'My Orders',
      '/favorites': 'Favorites'
    }

    // Handle dynamic routes
    if (pathname.startsWith('/menu/')) return 'Restaurant Menu'
    if (pathname.startsWith('/restaurant/')) return 'Restaurant Details'
    
    return routes[pathname] || 'QR Restaurant'
  }

  const goBack = () => {
    if (navigationHistory.length > 1) {
      // Go to previous page in history
      const previousPage = navigationHistory[navigationHistory.length - 2]
      navigate(previousPage.path + previousPage.search)
    } else {
      // Default fallback
      navigate('/customer')
    }
  }

  const goToHome = () => {
    navigate('/customer')
    setNavigationHistory([{
      path: '/customer',
      search: '',
      timestamp: Date.now(),
      title: 'Home'
    }])
  }

  const goToRestaurants = () => {
    navigate('/restaurants')
  }

  const goToProfile = () => {
    if (isAuthenticated) {
      navigate('/customer-profile')
    } else {
      navigate('/customer-auth')
    }
  }

  const goToOrders = () => {
    if (isAuthenticated) {
      navigate('/customer-orders')
    } else {
      navigate('/customer-auth')
    }
  }

  const signIn = (userData) => {
    setCurrentUser(userData)
    setIsAuthenticated(true)
    localStorage.setItem('customer_user', JSON.stringify(userData))
  }

  const signOut = () => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem('customer_user')
    navigate('/customer')
    setNavigationHistory([{
      path: '/customer',
      search: '',
      timestamp: Date.now(),
      title: 'Home'
    }])
  }

  // Initialize user state from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('customer_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setCurrentUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        localStorage.removeItem('customer_user')
      }
    }
  }, [])

  const canGoBack = navigationHistory.length > 1

  const getCurrentPageTitle = () => {
    return navigationHistory.length > 0 
      ? navigationHistory[navigationHistory.length - 1].title 
      : 'QR Restaurant'
  }

  const getBreadcrumbs = () => {
    return navigationHistory.slice(-3).map(item => ({
      title: item.title,
      path: item.path + item.search
    }))
  }

  const value = {
    // Navigation
    goBack,
    goToHome,
    goToRestaurants,
    goToProfile,
    goToOrders,
    canGoBack,
    getCurrentPageTitle,
    getBreadcrumbs,
    navigationHistory,
    
    // Authentication
    currentUser,
    isAuthenticated,
    signIn,
    signOut
  }

  return (
    <CustomerNavigationContext.Provider value={value}>
      {children}
    </CustomerNavigationContext.Provider>
  )
}

export default CustomerNavigationContext
