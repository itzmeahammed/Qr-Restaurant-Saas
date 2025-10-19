import { createStorageBucket, getStoragePolicySQL } from './src/utils/storageUtils.js'

/**
 * Setup storage bucket for the application
 * Run this script once after setting up your new Supabase instance
 */
async function setupStorage() {
  console.log('🚀 Setting up storage bucket...')
  
  try {
    // Create the restaurant-images bucket
    await createStorageBucket('restaurant-images', true)
    console.log('✅ Storage bucket created successfully!')
    
    // Display the SQL policies that need to be run manually
    console.log('\n📋 Next step: Run these SQL commands in your Supabase SQL Editor:')
    console.log('=' .repeat(60))
    console.log(getStoragePolicySQL('restaurant-images'))
    console.log('=' .repeat(60))
    
    console.log('\n🎯 Storage setup complete!')
    console.log('📝 Remember to run the SQL policies above in your Supabase dashboard')
    
  } catch (error) {
    console.error('❌ Error setting up storage:', error.message)
    
    if (error.message.includes('permission')) {
      console.log('\n💡 If you get permission errors, create the bucket manually:')
      console.log('1. Go to Supabase Dashboard → Storage')
      console.log('2. Click "New Bucket"')
      console.log('3. Name: restaurant-images')
      console.log('4. Make it Public: Yes')
      console.log('5. Then run the SQL policies shown above')
    }
  }
}

// Run the setup
setupStorage()
