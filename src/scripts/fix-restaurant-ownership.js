// Fix restaurant ownership mismatch
// This script fixes the issue where restaurant owner_id doesn't match the current user

import { supabase } from '../config/supabase.js'

const fixRestaurantOwnership = async () => {
  console.log('🔧 Fixing Restaurant Ownership Mismatch...\n')
  
  const currentUserId = '4340aba7-e3f0-464a-b761-b45abc7761cf'
  const restaurantId = '4340aba7-e3f0-464a-b761-b45abc7761cf' // Same as user ID in this case
  const oldOwnerId = '75a5a84a-2589-43d9-b480-9b9f76e6c828'
  
  try {
    console.log('1️⃣ Checking current restaurant ownership...')
    
    // Check current restaurant data
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single()
    
    if (restaurantError) {
      console.log('❌ Error fetching restaurant:', restaurantError.message)
      return
    }
    
    console.log('📊 Current restaurant data:')
    console.log(`  - ID: ${restaurant.id}`)
    console.log(`  - Name: ${restaurant.name}`)
    console.log(`  - Current owner_id: ${restaurant.owner_id}`)
    console.log(`  - Should be owner_id: ${currentUserId}`)
    
    if (restaurant.owner_id === currentUserId) {
      console.log('✅ Restaurant ownership is already correct!')
      return
    }
    
    console.log('\n2️⃣ Updating restaurant ownership...')
    
    // Update restaurant owner_id
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ owner_id: currentUserId })
      .eq('id', restaurantId)
    
    if (updateError) {
      console.log('❌ Error updating restaurant:', updateError.message)
      return
    }
    
    console.log('✅ Restaurant ownership updated successfully!')
    
    console.log('\n3️⃣ Checking and updating related records...')
    
    // Update categories (restaurant_id should reference user_id per schema)
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name, restaurant_id')
      .eq('restaurant_id', oldOwnerId)
    
    if (categories && categories.length > 0) {
      console.log(`📂 Found ${categories.length} categories to update`)
      
      const { error: updateCategoriesError } = await supabase
        .from('categories')
        .update({ restaurant_id: currentUserId })
        .eq('restaurant_id', oldOwnerId)
      
      if (updateCategoriesError) {
        console.log('❌ Error updating categories:', updateCategoriesError.message)
      } else {
        console.log('✅ Categories updated successfully!')
      }
    } else {
      console.log('📂 No categories found to update')
    }
    
    // Update menu_items (restaurant_id should reference user_id per schema)
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('id, name, restaurant_id')
      .eq('restaurant_id', oldOwnerId)
    
    if (menuItems && menuItems.length > 0) {
      console.log(`🍽️ Found ${menuItems.length} menu items to update`)
      
      const { error: updateMenuItemsError } = await supabase
        .from('menu_items')
        .update({ restaurant_id: currentUserId })
        .eq('restaurant_id', oldOwnerId)
      
      if (updateMenuItemsError) {
        console.log('❌ Error updating menu items:', updateMenuItemsError.message)
      } else {
        console.log('✅ Menu items updated successfully!')
      }
    } else {
      console.log('🍽️ No menu items found to update')
    }
    
    // Update tables (restaurant_id should reference user_id per schema)
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('id, table_number, restaurant_id')
      .eq('restaurant_id', oldOwnerId)
    
    if (tables && tables.length > 0) {
      console.log(`🪑 Found ${tables.length} tables to update`)
      
      const { error: updateTablesError } = await supabase
        .from('tables')
        .update({ restaurant_id: currentUserId })
        .eq('restaurant_id', oldOwnerId)
      
      if (updateTablesError) {
        console.log('❌ Error updating tables:', updateTablesError.message)
      } else {
        console.log('✅ Tables updated successfully!')
      }
    } else {
      console.log('🪑 No tables found to update')
    }
    
    console.log('\n4️⃣ Final verification...')
    
    // Verify the fix
    const { data: updatedRestaurant, error: verifyError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('owner_id', currentUserId)
      .maybeSingle()
    
    if (verifyError) {
      console.log('❌ Error verifying fix:', verifyError.message)
    } else if (updatedRestaurant) {
      console.log('✅ VERIFICATION SUCCESSFUL!')
      console.log(`  - Restaurant "${updatedRestaurant.name}" now belongs to user ${currentUserId}`)
      console.log('  - The "Restaurant not found" error should be resolved!')
    } else {
      console.log('❌ Verification failed - restaurant still not found')
    }
    
    console.log('\n🎯 FIX COMPLETE!')
    console.log('=' .repeat(50))
    console.log('💡 Try refreshing your application now.')
    
  } catch (error) {
    console.error('❌ Fix script error:', error)
  }
}

// Export for use in other files
export { fixRestaurantOwnership }

// If running directly in browser console:
// fixRestaurantOwnership()
