import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  QrCodeIcon, 
  UserCircleIcon, 
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline'
import useAuthStore from '../stores/useAuthStore'

const Navbar = ({ variant = 'default' }) => {
  const { user, profile, signOut } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (variant === 'minimal') {
    return (
      <nav className="bg-white/95 backdrop-blur-md border-b border-neutral-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <QrCodeIcon className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-xl font-bold text-neutral-900">QR Restaurant</span>
            </Link>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="bg-white shadow-sm border-b border-neutral-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <QrCodeIcon className="h-8 w-8 text-primary-500" />
            <span className="ml-2 text-xl font-bold text-neutral-900">QR Restaurant</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-3">
                  <UserCircleIcon className="h-8 w-8 text-neutral-600" />
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-neutral-900">
                      {profile?.full_name || user.email}
                    </p>
                    <p className="text-xs text-neutral-500 capitalize">
                      {profile?.role || 'User'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link
                    to="/dashboard"
                    className="p-2 text-neutral-600 hover:text-primary-500 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="p-2 text-neutral-600 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/auth/signin"
                  className="text-neutral-600 hover:text-primary-500 font-medium transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/auth/signup"
                  className="btn-primary"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
