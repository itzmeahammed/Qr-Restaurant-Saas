import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://qwjvnxkqmkwxqjsqkqnq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3anZueGtxbWt3eHFqc3FrcW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk4MzY4NzEsImV4cCI6MjA0NTQxMjg3MX0.BQtFJzqfJjqL2Z8GJ_lN7wQZvYFZJZ0qGqGqGqGqGqG'

const supabase = createClient(supabaseUrl, supabaseKey)

async function removeUnverifiedStaff() {
  try {
    console.log('🔍 Looking for unverified staff records...')
    
    // First, let's see what records exist
    const { data: existingRecords, error: fetchError } = await supabase
      .from('staff')
      .select('*')
      .eq('email', 'engagesmart2@gmail.com')
      .is('restaurant_id', null)
    
    if (fetchError) {
      console.error('❌ Error fetching records:', fetchError)
      return
    }
    
    console.log('📋 Found records:', existingRecords)
    
    if (existingRecords && existingRecords.length > 0) {
      // Delete the unverified staff record
      const { data, error } = await supabase
        .from('staff')
        .delete()
        .eq('email', 'engagesmart2@gmail.com')
        .is('restaurant_id', null)
        .select()
      
      if (error) {
        console.error('❌ Error deleting record:', error)
        return
      }
      
      console.log('✅ Successfully removed unverified staff record:', data)
      console.log(`🗑️ Deleted ${data.length} record(s)`)
    } else {
      console.log('ℹ️ No unverified staff records found for engagesmart2@gmail.com')
    }
    
    // Verify deletion
    const { data: verifyData, error: verifyError } = await supabase
      .from('staff')
      .select('*')
      .eq('email', 'engagesmart2@gmail.com')
    
    if (verifyError) {
      console.error('❌ Error verifying deletion:', verifyError)
      return
    }
    
    console.log('🔍 Remaining records for this email:', verifyData)
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the cleanup
removeUnverifiedStaff()
