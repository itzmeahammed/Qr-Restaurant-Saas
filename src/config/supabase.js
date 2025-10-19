import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://vehymqkyosjzdofpfimf.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaHltcWt5b3NqemRvZnBmaW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTE0MjQsImV4cCI6MjA3NDk4NzQyNH0.-KeJ1FpYzndX9iB1iDtBqxnXxF2JstDWJZRMH2RahTc'

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
