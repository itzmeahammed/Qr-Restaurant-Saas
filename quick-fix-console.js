// Quick fix for restaurant ownership - Run this in browser console
// Copy and paste this entire code block into your browser console

const quickFixRestaurantOwnership = async () => {
  // Initialize Supabase (adjust URL and key as needed)
  const supabaseUrl = 'https://vehymqkyosjzdofpfimf.supabase.co'
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlaHltcWt5b3NqemRvZnBmaW1mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTE0MjQsImV4cCI6MjA3NDk4NzQyNH0.-KeJ1FpYzndX9iB1iDtBqxnXxF2JstDWJZRMH2RahTc'
  const supabase = window.supabase?.createClient(supabaseUrl, supabaseKey)
  
  if (!supabase) {
    console.log('❌ Supabase not available. Make sure you are on your app page.')
    return
  }
  
  const currentUserId = '4340aba7-e3f0-464a-b761-b45abc7761cf'
  const restaurantId = '4340aba7-e3f0-464a-b761-b45abc7761cf'
  
  console.log('🔧 Quick fixing restaurant ownership...')
  
  try {
    // Update restaurant owner_id
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ owner_id: currentUserId })
      .eq('id', restaurantId)
    
    if (updateError) {
      console.log('❌ Error:', updateError.message)
      return
    }
    
    console.log('✅ Restaurant ownership fixed!')
    console.log('💡 Refresh your page now - the error should be gone!')
    
    // Verify the fix
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('name, owner_id')
      .eq('owner_id', currentUserId)
      .maybeSingle()
    
    if (restaurant) {
      console.log(`✅ Verified: "${restaurant.name}" now belongs to user ${currentUserId}`)
    }
    
  } catch (error) {
    console.log('❌ Fix failed:', error.message)
  }
}

// Run the fix
quickFixRestaurantOwnership()
