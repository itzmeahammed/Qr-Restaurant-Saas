// Diagnostic script to check restaurant and user data
// Run this in your browser console or as a Node.js script

import { supabase } from '../config/supabase.js'

const diagnoseRestaurantIssue = async () => {
  console.log('🔍 Diagnosing Restaurant Database Issue...\n')
  
  const currentUserId = '4340aba7-e3f0-464a-b761-b45abc7761cf'
  const restaurantOwnerId = '75a5a84a-2589-43d9-b480-9b9f76e6c828'
  
  try {
    // 1. Check if user exists in auth.users
    console.log('1️⃣ Checking auth.users table...')
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(targetUserId)
    
    if (authError) {
      console.log('❌ Auth user not found:', authError.message)
    } else {
      console.log('✅ Auth user found:', {
        id: authUser.user.id,
        email: authUser.user.email,
        role: authUser.user.user_metadata?.role
      })
    }
    
    // 2. Check if user exists in public.users table
    console.log('\n2️⃣ Checking public.users table...')
    const { data: publicUser, error: publicError } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .maybeSingle()
    
    if (publicError) {
      console.log('❌ Error querying public.users:', publicError.message)
    } else if (publicUser) {
      console.log('✅ Public user found:', {
        id: publicUser.id,
        email: publicUser.email,
        role: publicUser.role,
        full_name: publicUser.full_name
      })
    } else {
      console.log('❌ No user found in public.users table')
    }
    
    // 3. Check restaurants table for this owner_id
    console.log('\n3️⃣ Checking restaurants table...')
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', targetUserId)
    
    if (restaurantError) {
      console.log('❌ Error querying restaurants:', restaurantError.message)
    } else if (restaurants && restaurants.length > 0) {
      console.log('✅ Restaurants found:', restaurants.map(r => ({
        id: r.id,
        name: r.name,
        owner_id: r.owner_id,
        is_active: r.is_active
      })))
    } else {
      console.log('❌ No restaurants found for this owner_id')
    }
    
    // 4. Check all restaurants to see what owner_ids exist
    console.log('\n4️⃣ Checking all restaurants in database...')
    const { data: allRestaurants, error: allRestaurantsError } = await supabase
      .from('restaurants')
      .select('id, name, owner_id, is_active')
      .limit(10)
    
    if (allRestaurantsError) {
      console.log('❌ Error querying all restaurants:', allRestaurantsError.message)
    } else {
      console.log('📊 Sample restaurants in database:')
      allRestaurants.forEach(r => {
        console.log(`  - ${r.name} (owner_id: ${r.owner_id}, active: ${r.is_active})`)
      })
    }
    
    // 5. Check categories for this user_id (since categories.restaurant_id references users.id)
    console.log('\n5️⃣ Checking categories table...')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', targetUserId)
    
    if (categoriesError) {
      console.log('❌ Error querying categories:', categoriesError.message)
    } else if (categories && categories.length > 0) {
      console.log('✅ Categories found:', categories.map(c => ({
        id: c.id,
        name: c.name,
        restaurant_id: c.restaurant_id
      })))
    } else {
      console.log('❌ No categories found for this restaurant_id (user_id)')
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE')
    console.log('=' .repeat(50))
    
    // Provide recommendations
    if (!publicUser && !authUser.user) {
      console.log('💡 RECOMMENDATION: User does not exist. Create user account first.')
    } else if (!restaurants || restaurants.length === 0) {
      console.log('💡 RECOMMENDATION: User exists but has no restaurant. Complete restaurant onboarding.')
    } else {
      console.log('💡 RECOMMENDATION: User and restaurant exist. Check for other issues.')
    }
    
  } catch (error) {
    console.error('❌ Diagnostic script error:', error)
  }
}

// Export for use in other files
export { diagnoseRestaurantIssue }

// If running directly in browser console:
// diagnoseRestaurantIssue()
