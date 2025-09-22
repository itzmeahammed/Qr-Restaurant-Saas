import { create } from 'zustand'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  initializing: false, // Add flag to prevent concurrent initialization
  
  // Initialize auth state - handles both immediate session and delayed restoration
  initialize: async () => {
    const state = get()
    console.log('🔄 Initialize called. Current state:', { 
      initialized: state.initialized, 
      initializing: state.initializing,
      loading: state.loading 
    })
    
    if (state.initialized || state.initializing) {
      console.log('Auth already initialized or initializing, skipping...')
      return
    }

    console.log('🔄 Starting auth initialization...')
    set({ loading: true, initializing: true })

    try {
      // Get the current session without timeout - let Supabase handle it
      console.log('🔄 Getting session from Supabase...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Error getting session:', error)
        set({ 
          user: null, 
          profile: null, 
          loading: false, 
          initialized: true, 
          initializing: false 
        })
        return
      }
      
      if (session?.user) {
        console.log('✅ Session found during initialization')
        console.log('📋 Session user:', session.user.email)
        console.log('📋 User metadata:', session.user.user_metadata)
        
        // Create profile immediately from user metadata - don't fetch from database
        const profile = {
          id: session.user.id,
          email: session.user.email,
          role: session.user.user_metadata?.role || 'restaurant_owner', // Default for this user
          full_name: session.user.user_metadata?.full_name || '',
          phone: session.user.user_metadata?.phone || ''
        }

        console.log('✅ Profile created from metadata:', profile)
        set({ 
          user: session.user, 
          profile: profile,
          loading: false, 
          initialized: true, 
          initializing: false 
        })
      } else {
        console.log('📋 No session found during initialization')
        set({ 
          user: null, 
          profile: null, 
          loading: false, 
          initialized: true, 
          initializing: false 
        })
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error)
      // Always set loading to false to prevent infinite loading
      set({ 
        user: null, 
        profile: null, 
        loading: false, 
        initialized: true,
        initializing: false
      })
    }
  },
  

  // Fetch user profile
  fetchProfile: async (userId) => {
    try {
      console.log('🔄 Fetching profile for user:', userId)

      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('❌ Error getting user:', userError)
        return null
      }

      if (!user) {
        console.log('❌ No user found')
        return null
      }

      console.log('📋 User data:', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      })

      // Check if role exists in user metadata
      let userRole = user.user_metadata?.role

      if (!userRole) {
        console.log('⚠️ No role found in user metadata, determining role...')
        
        // Set a timeout for database queries to prevent hanging
        const queryTimeout = 3000 // 3 seconds
        
        try {
          // Check if this user owns a restaurant with timeout
          const restaurantPromise = supabase
            .from('restaurants')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle()

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Database query timeout')), queryTimeout)
          )

          const { data: restaurant, error: restaurantError } = await Promise.race([
            restaurantPromise,
            timeoutPromise
          ])

          if (restaurantError && !restaurantError.message.includes('timeout')) {
            console.log('❌ Error checking restaurant ownership:', restaurantError)
          } else if (restaurant) {
            userRole = 'restaurant_owner'
            console.log('✅ User is a restaurant owner')
          }
        } catch (err) {
          console.error('❌ Exception checking restaurant:', err)
        }

        // If still no role, check if user is staff (with timeout)
        if (!userRole) {
          try {
            const staffPromise = supabase
              .from('staff')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle()

            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database query timeout')), queryTimeout)
            )

            const { data: staff, error: staffError } = await Promise.race([
              staffPromise,
              timeoutPromise
            ])

            if (staffError && !staffError.message.includes('timeout')) {
              console.log('❌ Error checking staff status:', staffError)
            } else if (staff) {
              userRole = 'staff'
              console.log('✅ User is a staff member')
            }
          } catch (err) {
            console.error('❌ Exception checking staff:', err)
          }
        }

        // If still no role, default to customer
        if (!userRole) {
          userRole = 'customer'
          console.log('✅ User is a customer (default)')
        }

        // Update user metadata with the determined role (don't wait for this)
        supabase.auth.updateUser({
          data: { ...user.user_metadata, role: userRole }
        }).then(({ error: updateError }) => {
          if (updateError) {
            console.error('❌ Error updating user metadata:', updateError)
          } else {
            console.log('✅ Updated user metadata with role:', userRole)
          }
        }).catch(updateErr => {
          console.error('❌ Exception updating user role:', updateErr)
        })
      } else {
        console.log('✅ Role found in metadata:', userRole)
      }

      console.log('📋 Final role determined:', userRole)

      // Create profile object
      const profile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        phone: user.user_metadata?.phone || '',
        email: user.email,
        ...user.user_metadata,
        role: userRole // Ensure role is set (overrides any role in user_metadata)
      }

      console.log('✅ Profile created:', profile)
      set({ profile })
      return profile
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error)
      // Return a basic profile with customer role as fallback
      const fallbackProfile = {
        id: userId,
        role: 'customer',
        email: '',
        full_name: '',
        phone: ''
      }
      set({ profile: fallbackProfile })
      return fallbackProfile
    }
  },

  // Sign up
  signUp: async (email, password, userData = {}) => {
    set({ loading: true })
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            phone: userData.phone,
            role: userData.role || 'customer'
          }
        }
      })
      
      if (error) throw error
      
      set({ user: data.user, loading: false })
      return data
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  // Sign in
  signIn: async (email, password) => {
    set({ loading: true })
    try {
      console.log('🔄 Attempting sign in for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('❌ Sign in error:', error)
        
        // Handle specific error types
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials.')
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link.')
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Network connection error. Please check your internet connection and try again.')
        } else {
          throw new Error(error.message || 'Sign in failed. Please try again.')
        }
      }

      console.log('✅ Sign in successful')
      set({ loading: false })
      return { data, error: null }
    } catch (error) {
      console.error('❌ Sign in error:', error)
      set({ loading: false })
      return { data: null, error }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      console.log('🚪 Signing out...')
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Clear all auth state
      set({ 
        user: null, 
        profile: null, 
        loading: false,
        initialized: true 
      })
      
      // Clear localStorage
      try {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('sb-hinxagdwoyscbghpvyxj-auth-token')
      } catch (e) {
        console.error('Error clearing localStorage:', e)
      }
      
      console.log('✅ Signed out successfully')
      toast.success('Signed out successfully')
    } catch (error) {
      console.error('❌ Sign out error:', error)
      toast.error(error.message)
    }
  },

  // Update user metadata with role
  updateUserRole: async (role) => {
    try {
      console.log('🔄 Updating user role to:', role)

      const { data, error } = await supabase.auth.updateUser({
        data: { role: role }
      })

      if (error) throw error

      console.log('✅ User role updated successfully:', data.user?.user_metadata)

      // Refresh profile after role update
      const state = get()
      if (state.user) {
        await state.fetchProfile(state.user.id)
      }

      return { data, error: null }
    } catch (error) {
      console.error('❌ Error updating user role:', error)
      return { data: null, error }
    }
  },
}))

// Listen to auth changes - handles delayed session restoration after refresh
let authChangeProcessing = false
supabase.auth.onAuthStateChange(async (event, session) => {
  // Prevent duplicate processing
  if (authChangeProcessing) return
  authChangeProcessing = true

  const state = useAuthStore.getState()
  console.log('🔔 Auth change:', event, !!session?.user)

  try {
    if (session?.user) {
      console.log('✅ Session restored/signed in via auth change')
      console.log('🔍 User metadata:', session.user.user_metadata)
      console.log('🔍 User email:', session.user.email)

      // Create profile immediately from user metadata - don't fetch from database
      const profile = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.user_metadata?.role || 'restaurant_owner', // Default for this user
        full_name: session.user.user_metadata?.full_name || '',
        phone: session.user.user_metadata?.phone || ''
      }
      
      console.log('✅ Profile created from metadata:', profile)
      
      useAuthStore.setState({
        user: session.user,
        profile: profile,
        loading: false,
        initialized: true,
        initializing: false
      })
    } else {
      console.log('❌ No session via auth change')
      useAuthStore.setState({
        user: null,
        profile: null,
        loading: false,
        initialized: true,
        initializing: false
      })
    }
  } catch (error) {
    console.error('❌ Error in auth change handler:', error)
    useAuthStore.setState({
      loading: false,
      initialized: true,
      initializing: false
    })
  } finally {
    authChangeProcessing = false
  }
})

export default useAuthStore
