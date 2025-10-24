// Fix OwnerDashboard restaurant query to work with existing data
// This script updates the checkRestaurantSetup function to find restaurants by name instead of owner_id

const fixOwnerDashboardQuery = `
// Replace the restaurant query in OwnerDashboard.jsx checkRestaurantSetup function
// Around line 216, change this:

// OLD CODE:
const { data: restaurantData, error: restaurantError } = await supabase
  .from('restaurants')
  .select('*')
  .eq('owner_id', user.id)
  .maybeSingle()

// NEW CODE:
// First try by owner_id, then fallback to finding by user's restaurant name
let restaurantData, restaurantError

// Try finding by owner_id first
const { data: restaurantByOwner, error: ownerError } = await supabase
  .from('restaurants')
  .select('*')
  .eq('owner_id', user.id)
  .maybeSingle()

if (restaurantByOwner) {
  restaurantData = restaurantByOwner
  restaurantError = ownerError
} else {
  // Fallback: Find restaurant by matching name with user's restaurant_name
  console.log('No restaurant found by owner_id, trying by name:', userData.restaurant_name)
  
  const { data: restaurantByName, error: nameError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('name', userData.restaurant_name)
    .maybeSingle()
    
  restaurantData = restaurantByName
  restaurantError = nameError
  
  // If found by name, update the owner_id to match current user (optional)
  if (restaurantByName) {
    console.log('Found restaurant by name, consider updating owner_id in database')
  }
}
`

console.log('=== OWNER DASHBOARD FIX ===')
console.log(fixOwnerDashboardQuery)
console.log('\n=== INSTRUCTIONS ===')
console.log('1. Open OwnerDashboard.jsx')
console.log('2. Find the checkRestaurantSetup function around line 216')
console.log('3. Replace the restaurant query with the NEW CODE above')
console.log('4. This will make the dashboard work with your existing data')

export { fixOwnerDashboardQuery }
