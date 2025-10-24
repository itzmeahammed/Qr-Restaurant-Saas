// Comprehensive Restaurant Ownership Fix
// This script will diagnose and fix all restaurant ownership issues

import { supabase } from '../config/supabase.js'

const comprehensiveRestaurantFix = async () => {
  console.log('🔧 COMPREHENSIVE RESTAURANT OWNERSHIP FIX')
  console.log('=' .repeat(60))
  
  const targetUserId = '4340aba7-e3f0-464a-b761-b45abc7761cf'
  const restaurantName = 'barbeque Nation'
  
  try {
    console.log('\n1️⃣ DIAGNOSING CURRENT STATE...')
    
    // Check if user exists in users table
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle()
    
    if (userError) {
      console.log('❌ Error checking user:', userError.message)
    } else if (user) {
      console.log('✅ User found in users table:')
      console.log(`  - ID: ${user.id}`)
      console.log(`  - Name: ${user.full_name}`)
      console.log(`  - Email: ${user.email}`)
      console.log(`  - Role: ${user.role}`)
    } else {
      console.log('❌ User NOT found in users table!')
    }
    
    // Check all restaurants (regardless of owner)
    const { data: allRestaurants, error: allRestError } = await supabase
      .from('restaurants')
      .select('*')
    
    if (allRestError) {
      console.log('❌ Error fetching all restaurants:', allRestError.message)
    } else {
      console.log(`\n📊 Found ${allRestaurants.length} total restaurants:`)
      allRestaurants.forEach((restaurant, index) => {
        console.log(`  ${index + 1}. "${restaurant.name}" (ID: ${restaurant.id}, Owner: ${restaurant.owner_id})`)
      })
    }
    
    // Find restaurant by name
    const { data: restaurantByName, error: nameError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('name', restaurantName)
      .maybeSingle()
    
    if (nameError) {
      console.log('❌ Error finding restaurant by name:', nameError.message)
    } else if (restaurantByName) {
      console.log(`\n🏪 Found restaurant "${restaurantName}":`)
      console.log(`  - ID: ${restaurantByName.id}`)
      console.log(`  - Current owner_id: ${restaurantByName.owner_id}`)
      console.log(`  - Target owner_id: ${targetUserId}`)
      console.log(`  - Match: ${restaurantByName.owner_id === targetUserId ? '✅' : '❌'}`)
    } else {
      console.log(`❌ Restaurant "${restaurantName}" not found!`)
    }
    
    console.log('\n2️⃣ APPLYING COMPREHENSIVE FIX...')
    
    if (restaurantByName && restaurantByName.owner_id !== targetUserId) {
      console.log('🔄 Updating restaurant ownership...')
      
      const { error: updateError } = await supabase
        .from('restaurants')
        .update({ owner_id: targetUserId })
        .eq('id', restaurantByName.id)
      
      if (updateError) {
        console.log('❌ Error updating restaurant:', updateError.message)
      } else {
        console.log('✅ Restaurant ownership updated!')
      }
    }
    
    // Also check if we need to update the users table restaurant_id field
    if (user && user.restaurant_id !== restaurantByName?.id) {
      console.log('🔄 Updating user restaurant_id...')
      
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ restaurant_id: restaurantByName?.id })
        .eq('id', targetUserId)
      
      if (userUpdateError) {
        console.log('❌ Error updating user restaurant_id:', userUpdateError.message)
      } else {
        console.log('✅ User restaurant_id updated!')
      }
    }
    
    console.log('\n3️⃣ FINAL VERIFICATION...')
    
    // Test the exact query that's failing
    const { data: verifyRestaurant, error: verifyError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', targetUserId)
      .maybeSingle()
    
    if (verifyError) {
      console.log('❌ Verification query failed:', verifyError.message)
    } else if (verifyRestaurant) {
      console.log('✅ SUCCESS! Restaurant now found with correct ownership:')
      console.log(`  - Name: ${verifyRestaurant.name}`)
      console.log(`  - ID: ${verifyRestaurant.id}`)
      console.log(`  - Owner ID: ${verifyRestaurant.owner_id}`)
      
      // Test the exact curl equivalent
      console.log('\n🧪 Testing equivalent API call...')
      const { data: apiTest, error: apiError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', targetUserId)
      
      if (apiError) {
        console.log('❌ API test failed:', apiError.message)
      } else {
        console.log(`✅ API test successful! Found ${apiTest.length} restaurant(s)`)
      }
      
    } else {
      console.log('❌ Restaurant still not found after fix!')
      
      // Additional debugging
      console.log('\n🔍 Additional debugging...')
      const { data: debugRestaurants } = await supabase
        .from('restaurants')
        .select('id, name, owner_id')
      
      console.log('All restaurants with owner IDs:')
      debugRestaurants?.forEach(r => {
        console.log(`  - ${r.name}: owner_id = "${r.owner_id}" (target: "${targetUserId}")`)
      })
    }
    
    console.log('\n🎯 FIX COMPLETE!')
    console.log('=' .repeat(60))
    
  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

// Export for use
export { comprehensiveRestaurantFix }

// For direct execution
if (typeof window !== 'undefined') {
  window.comprehensiveRestaurantFix = comprehensiveRestaurantFix
}
