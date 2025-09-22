import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://hinxagdwoyscbghpvyxj.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpbnhhZ2R3b3lzY2JnaHB2eXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTE2NzUsImV4cCI6MjA3Mzc4NzY3NX0.xyF9J7cZFVppU3u_Rc0X0A0MrXGzca0Y7XiO1cT9i40'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  db: {
    schema: 'public' 
  },
  global: {
    headers: {
      'x-my-custom-header': 'restaurant-saas'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: 1000
  }
})

export { supabaseUrl, supabaseAnonKey }
