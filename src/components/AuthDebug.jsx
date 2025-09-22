import React from 'react'
import useAuthStore from '../stores/useAuthStore'
import { supabase } from '../config/supabase'

const AuthDebug = () => {
  const { user, profile, loading } = useAuthStore()

  const checkAuthStatus = async () => {
    console.log('=== Manual Auth Check ===')
    
    // Check Supabase session
    const { data: { session }, error } = await supabase.auth.getSession()
    console.log('Supabase session:', session)
    console.log('Session error:', error)
    
    // Check current user
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser()
    console.log('Current user:', currentUser)
    console.log('User error:', userError)
    
    // Check auth store state
    console.log('Auth store user:', user)
    console.log('Auth store profile:', profile)
    console.log('Auth store loading:', loading)
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div className="text-xs space-y-1">
        <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
        <p><strong>User:</strong> {user ? user.email : 'None'}</p>
        <p><strong>Profile:</strong> {profile ? profile.role : 'None'}</p>
        <p><strong>User ID:</strong> {user?.id || 'None'}</p>
      </div>
      <button 
        onClick={checkAuthStatus}
        className="mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded"
      >
        Check Auth
      </button>
    </div>
  )
}

export default AuthDebug
