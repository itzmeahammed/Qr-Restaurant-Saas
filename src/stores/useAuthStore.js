import { create } from 'zustand'
import { supabase } from '../config/supabase'
import toast from 'react-hot-toast'
import bcrypt from 'bcryptjs'

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  initialized: false,
  initializing: false, // Add flag to prevent concurrent initialization
  userRole: undefined,
  userId: undefined,
  isAuthenticated: false,
  
  // Initialize auth state - checks localStorage for unified users session
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
      // Check for stored user session in localStorage
      console.log('🔄 Checking localStorage for user session...')
      const storedSession = localStorage.getItem('user_session')
      
      if (storedSession) {
        try {
          const userSession = JSON.parse(storedSession)
          console.log('✅ Found stored session:', userSession)
          
          // Verify the user still exists and is active
          const { data: userData, error: verifyError } = await supabase
            .from('users')
            .select('*')
            .eq('id', userSession.id)
            .eq('is_active', true)
            .single()

          if (verifyError || !userData) {
            console.log('❌ Stored session invalid, clearing...', verifyError)
            localStorage.removeItem('user_session')
            throw new Error('Session expired')
          }

          console.log('🔍 User data from database:', userData)
          console.log('🔍 User role from database:', userData.role)

          // Update session with latest data
          const updatedSession = {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            phone: userData.phone,
            role: userData.role,
            restaurant_id: userData.restaurant_id,
            position: userData.position,
            hourly_rate: userData.hourly_rate,
            is_available: userData.is_available
          }

          localStorage.setItem('user_session', JSON.stringify(updatedSession))

          console.log('✅ Session restored and updated', {
            userRole: userData.role,
            userId: userData.id,
            userData: userData
          })
          set({ 
            user: updatedSession, 
            profile: updatedSession,
            loading: false, 
            initialized: true, 
            initializing: false,
            isAuthenticated: true,
            userRole: userData.role,
            userId: userData.id
          })
        } catch (parseError) {
          console.error('❌ Error parsing stored session:', parseError)
          localStorage.removeItem('user_session')
          set({ 
            user: null, 
            profile: null, 
            loading: false, 
            initialized: true, 
            initializing: false,
            isAuthenticated: false,
            userRole: undefined,
            userId: undefined
          })
        }
      } else {
        console.log('📋 No stored session found')
        set({ 
          user: null, 
          profile: null, 
          loading: false, 
          initialized: true, 
          initializing: false,
          isAuthenticated: false,
          userRole: undefined,
          userId: undefined
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
        initializing: false,
        isAuthenticated: false,
        userRole: undefined,
        userId: undefined
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
            .from('users')
            .select('id')
            .eq('id', user.id)
            .eq('role', 'restaurant_owner')
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

  // Sign up using unified users table
  signUp: async (email, password, userData = {}) => {
    set({ loading: true })
    try {
      console.log('🔄 Attempting signup for:', email, 'with role:', userData.role)
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .maybeSingle()

      if (existingUser) {
        throw new Error('An account with this email already exists')
      }

      // Hash the password
      const saltRounds = 10
      const passwordHash = await bcrypt.hash(password, saltRounds)
      console.log('🔒 Password hashed successfully')

      // Create new user in unified users table
      const newUser = {
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        full_name: userData.full_name || '',
        phone: userData.phone || '',
        role: userData.role || 'staff',
        is_active: true,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('📝 Creating user with data:', { ...newUser, password_hash: '[HIDDEN]' })

      const { data: createdUser, error: insertError } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single()

      if (insertError) {
        console.error('❌ Error creating user:', insertError)
        throw new Error(insertError.message || 'Failed to create account')
      }

      console.log('✅ User created successfully:', createdUser)

      // For signup, don't automatically log in the user
      // They should login separately after signup
      set({ 
        user: null,
        profile: null,
        loading: false,
        isAuthenticated: false,
        userRole: undefined,
        userId: undefined
      })

      return { user: createdUser, success: true }
    } catch (error) {
      console.error('❌ Signup error:', error)
      set({ loading: false })
      throw error
    }
  },

  // Sign in using unified users table
  signIn: async (email, password) => {
    set({ loading: true })
    try {
      console.log('🔄 Attempting sign in for:', email)
      
      // Query the unified users table
      const { data: userData, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (queryError || !userData) {
        console.error('❌ User not found:', queryError)
        throw new Error('Invalid email or password. Please check your credentials.')
      }

      console.log('🔍 Found user:', userData)

      // Password verification logic
      let passwordValid = false
      
      // Check for temporary password format (Staff + last 8 chars of ID + !)
      const tempPassword = 'Staff' + userData.id.slice(-8) + '!'
      if (password === tempPassword) {
        passwordValid = true
        console.log('✅ Temporary password matched')
      }
      
      // Check for temporary hash that needs reset
      else if (userData.password_hash === '$2b$10$temp.password.hash.needs.to.be.reset') {
        passwordValid = true
        console.log('✅ Temporary hash matched')
      }
      
      // For bcrypt hashes, use proper bcrypt verification
      else if (userData.password_hash && userData.password_hash.startsWith('$2b$')) {
        console.log('🔍 Checking bcrypt hash...')
        try {
          passwordValid = await bcrypt.compare(password, userData.password_hash)
          if (passwordValid) {
            console.log('✅ Bcrypt password verified successfully')
          } else {
            console.log('❌ Bcrypt password verification failed')
          }
        } catch (bcryptError) {
          console.error('❌ Bcrypt verification error:', bcryptError)
          passwordValid = false
        }
      }
      
      if (passwordValid) {
        
        // Create a user session object
        const userSession = {
          id: userData.id,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role,
          restaurant_id: userData.restaurant_id,
          position: userData.position,
          hourly_rate: userData.hourly_rate,
          is_available: userData.is_available
        }

        // Store in localStorage for session persistence
        localStorage.setItem('user_session', JSON.stringify(userSession))
        
        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userData.id)

        console.log('✅ Sign in successful for:', userData.role)
        set({ 
          user: userSession, 
          profile: userSession,
          loading: false,
          isAuthenticated: true,
          userRole: userData.role,
          userId: userData.id
        })
        
        return { 
          data: { user: userSession }, 
          error: null 
        }
      } else {
        throw new Error('Invalid email or password. Please check your credentials.')
      }

    } catch (error) {
      console.error('❌ Sign in error:', error)
      set({ loading: false })
      return { data: null, error }
    }
  },

  // Sign out from unified users system
  signOut: async () => {
    try {
      console.log('🚪 Signing out...')
      
      // Clear all auth state
      set({ 
        user: null, 
        profile: null, 
        loading: false,
        initialized: true,
        isAuthenticated: false,
        userRole: undefined,
        userId: undefined
      })
      
      // Clear localStorage
      try {
        localStorage.removeItem('user_session')
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
