import React from 'react'
import useAuthStore from '../stores/useAuthStore'
import toast from 'react-hot-toast'

const AuthDebugPanel = () => {
  const { user, profile, loading, initialized, reset, initialize } = useAuthStore()

  const handleReset = () => {
    reset()
    toast.success('Auth state reset! Refresh the page.')
  }

  const handleForceInit = async () => {
    await initialize()
    toast.success('Auth re-initialized!')
  }

  const handleClearStorage = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
      toast.success('All storage cleared! Refresh the page.')
    } catch (error) {
      toast.error('Error clearing storage: ' + error.message)
    }
  }

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">🔧 Auth Debug Panel</h3>
      
      <div className="text-xs space-y-1 mb-3">
        <div>Loading: <span className={loading ? 'text-red-600' : 'text-green-600'}>{loading ? 'Yes' : 'No'}</span></div>
        <div>Initialized: <span className={initialized ? 'text-green-600' : 'text-red-600'}>{initialized ? 'Yes' : 'No'}</span></div>
        <div>User: <span className={user ? 'text-green-600' : 'text-red-600'}>{user ? user.email : 'None'}</span></div>
        <div>Profile: <span className={profile ? 'text-green-600' : 'text-red-600'}>{profile ? profile.role : 'None'}</span></div>
      </div>
      
      <div className="space-y-2">
        <button
          onClick={handleReset}
          className="w-full px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600"
        >
          Reset Auth State
        </button>
        
        <button
          onClick={handleForceInit}
          className="w-full px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
        >
          Force Re-initialize
        </button>
        
        <button
          onClick={handleClearStorage}
          className="w-full px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600"
        >
          Clear All Storage
        </button>
      </div>
    </div>
  )
}

export default AuthDebugPanel
