import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './stores/useAuthStore'
import { CustomerNavigationProvider } from './contexts/CustomerNavigationContext'
import { ConfirmationProvider } from './contexts/ConfirmationContext'

// Import pages
import LandingPage from './pages/LandingPage'
import CustomerLanding from './pages/CustomerLanding'
import CustomerAuth from './pages/CustomerAuth'
import RestaurantDiscovery from './pages/RestaurantDiscovery'
import Auth from './pages/Auth'
import CustomerMenu from './pages/CustomerMenu'
import ItemDetail from './pages/ItemDetail'
import StaffDashboard from './pages/StaffDashboard'
import OwnerDashboard from './pages/OwnerDashboard'
import SuperAdminPanel from './pages/SuperAdminPanel'
import EmailVerification from './components/EmailVerification'
import RestaurantOnboarding from './pages/RestaurantOnboarding'
import OrderTracking from './pages/OrderTracking'
import CustomerProfile from './pages/CustomerProfile'
import CustomerOrders from './pages/CustomerOrders'
import CustomerFavorites from './pages/CustomerFavorites'
import CustomerSettings from './pages/CustomerSettings'
import RestaurantDetailsPage from './pages/RestaurantDetailsPage'

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, profile, userRole, userId } = useAuthStore()

  if (!user) {
    return <Navigate to="/auth" replace />
  }

  // Check if email is verified (skip for unified users system)
  // if (user && !user.email_confirmed_at) {
  //   return <Navigate to="/verify-email" replace />
  // }

  console.log('🔐 ProtectedRoute check:', {
    userId,
    userRole,
    profileRole: profile?.role,
    allowedRoles
  })

  if (!userRole) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        <p className="text-sm text-gray-500 mt-2">Setting up your profile</p>
      </div>
    </div>
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

// Public Route (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { user, profile, initialized, userRole, userId, loading } = useAuthStore()

  console.log('🔄 PublicRoute check:', {
    user: !!user,
    userId,
    userRole,
    profileRole: profile?.role,
    initialized,
    loading,
    currentPath: window.location.pathname,
    fullUser: user,
    fullProfile: profile
  })

  // Show loading screen while authentication is being initialized
  if (!initialized || loading) {
    console.log('⏳ PublicRoute: Still initializing, showing loading screen')
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we set up your session</p>
        </div>
      </div>
    )
  }

  // Only redirect if user is authenticated AND initialized
  if (user && initialized) {
    console.log('🔄 PublicRoute: User authenticated, redirecting...', {
      userRole,
      currentPath: window.location.pathname
    })

    // Redirect based on role
    if (userRole === 'super_admin') {
      console.log('➡️ Redirecting to /admin')
      return <Navigate to="/admin" replace />
    } else if (userRole === 'staff') {
      console.log('➡️ Redirecting to /staff')
      return <Navigate to="/staff" replace />
    } else if (userRole === 'restaurant_owner') {
      console.log('➡️ Redirecting to /dashboard')
      return <Navigate to="/dashboard" replace />
    } else {
      console.log('➡️ Unknown role, redirecting to /')
      return <Navigate to="/" replace />
    }
  }

  console.log('📋 PublicRoute: Not redirecting - showing auth page')
  return children
}

function App() {
  const { initialize, loading, user, profile, initialized, userRole, userId } = useAuthStore()

  // Debug: Monitor auth state changes
  useEffect(() => {
    console.log('🏠 App state changed:', {
      loading,
      initialized,
      user: !!user,
      userId,
      userRole,
      profileRole: profile?.role,
      currentPath: window.location.pathname
    })

    // If user is authenticated and initialized, they should be redirected
    if (user && initialized) {
      console.log('✅ App: User authenticated, should be redirected by PublicRoute')
      
      // Force redirect if we're still on auth page
      if (window.location.pathname === '/auth') {
        const userRole = user.user_metadata?.role || profile?.role
        console.log('🔄 Force redirecting from auth page:', userRole)
        
        if (userRole === 'restaurant_owner') {
          window.location.href = '/dashboard'
        } else if (userRole === 'staff') {
          window.location.href = '/staff'
        } else if (userRole === 'super_admin') {
          window.location.href = '/admin'
        }
      }
    }
  }, [loading, initialized, user, profile])

  useEffect(() => {
    initialize()
  }, []) // Empty dependency array - only run once on mount

  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route path="/auth" element={
            <PublicRoute>
              <ConfirmationProvider>
                <Auth />
              </ConfirmationProvider>
            </PublicRoute>
          } />
          
          {/* Email Verification */}
          <Route path="/verify-email" element={
            <ConfirmationProvider>
              <EmailVerification />
            </ConfirmationProvider>
          } />
          
          {/* Restaurant Onboarding */}
          <Route path="/restaurant-setup" element={
            <ProtectedRoute allowedRoles={['restaurant_owner']}>
              <ConfirmationProvider>
                <RestaurantOnboarding />
              </ConfirmationProvider>
            </ProtectedRoute>
          } />
          
          {/* Customer Menu - Public but table-specific */}
          <Route path="/menu/:restaurantId/:tableId" element={
            <CustomerNavigationProvider>
              <CustomerMenu />
            </CustomerNavigationProvider>
          } />
          <Route path="/menu/:restaurantId" element={
            <CustomerNavigationProvider>
              <CustomerMenu />
            </CustomerNavigationProvider>
          } />
          
          {/* Item Detail Page */}
          <Route path="/menu/:restaurantId/item/:itemId" element={
            <CustomerNavigationProvider>
              <ItemDetail />
            </CustomerNavigationProvider>
          } />
          
          {/* Protected Routes */}
          <Route path="/staff" element={
            <ProtectedRoute allowedRoles={['staff']}>
              <ConfirmationProvider>
                <StaffDashboard />
              </ConfirmationProvider>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            user?.user_metadata?.role === 'super_admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <ProtectedRoute allowedRoles={['restaurant_owner']}>
                <ConfirmationProvider>
                  <OwnerDashboard />
                </ConfirmationProvider>
              </ProtectedRoute>
            )
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <ConfirmationProvider>
                <SuperAdminPanel />
              </ConfirmationProvider>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/restaurant/:restaurantId" element={
            <ProtectedRoute allowedRoles={['super_admin']}>
              <ConfirmationProvider>
                <RestaurantDetailsPage />
              </ConfirmationProvider>
            </ProtectedRoute>
          } />
          
          <Route path="/order/:orderId" element={<OrderTracking />} />
          
          {/* Customer Routes - Wrapped with Navigation Provider */}
          <Route path="/customer" element={
            <CustomerNavigationProvider>
              <CustomerLanding />
            </CustomerNavigationProvider>
          } />
          <Route path="/customer-auth" element={
            <CustomerNavigationProvider>
              <CustomerAuth />
            </CustomerNavigationProvider>
          } />
          <Route path="/customer-profile" element={
            <CustomerNavigationProvider>
              <CustomerProfile />
            </CustomerNavigationProvider>
          } />
          <Route path="/restaurants" element={
            <CustomerNavigationProvider>
              <RestaurantDiscovery />
            </CustomerNavigationProvider>
          } />
          <Route path="/customer-orders" element={
            <CustomerNavigationProvider>
              <CustomerOrders />
            </CustomerNavigationProvider>
          } />
          <Route path="/customer-favorites" element={
            <CustomerNavigationProvider>
              <CustomerFavorites />
            </CustomerNavigationProvider>
          } />
          <Route path="/customer-settings" element={
            <CustomerNavigationProvider>
              <CustomerSettings />
            </CustomerNavigationProvider>
          } />
          
          {/* Landing Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/business" element={
            <ConfirmationProvider>
              <LandingPage />
            </ConfirmationProvider>
          } />
          
          {/* Default redirect for authenticated users */}
          <Route path="/home" element={
            user ? (
              (() => {
                console.log('🏡 Home route redirect:', {
                  userRole,
                  userId,
                  profileRole: profile?.role
                })

                return (
                  userRole === 'staff' ? <Navigate to="/staff" replace /> :
                  userRole === 'restaurant_owner' ? <Navigate to="/dashboard" replace /> :
                  userRole === 'super_admin' ? <Navigate to="/admin" replace /> :
                  <Navigate to="/auth" replace />
                )
              })()
            ) : (
              <Navigate to="/auth" replace />
            )
          } />

          {/* Catch-all redirect for authenticated users */}
          <Route path="*" element={
            user ? (
              (() => {
                console.log('🎯 Catch-all route redirect:', {
                  userRole,
                  userId,
                  profileRole: profile?.role
                })

                return (
                  userRole === 'staff' ? <Navigate to="/staff" replace /> :
                  userRole === 'restaurant_owner' ? <Navigate to="/dashboard" replace /> :
                  userRole === 'super_admin' ? <Navigate to="/admin" replace /> :
                  <Navigate to="/" replace />
                )
              })()
            ) : (
              <Navigate to="/" replace />
            )
          } />
        </Routes>
        
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
        
      </div>
    </Router>
  )
}

export default App
