// Debug script to test restaurant key lookup
// Run this in your browser console on the auth page

async function debugRestaurantKey(key) {
  console.log('🔍 Testing restaurant key:', key);
  
  // Test 1: Direct lookup
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('id, name, owner_id, staff_signup_key')
      .eq('staff_signup_key', key)
      .maybeSingle();
    
    console.log('📊 Direct lookup result:', {
      key: key,
      found: !!data,
      error: error,
      data: data
    });
  } catch (err) {
    console.error('❌ Direct lookup failed:', err);
  }

  // Test 2: Get all keys to compare
  try {
    const { data: allRestaurants, error } = await supabase
      .from('restaurants')
      .select('id, name, staff_signup_key')
      .not('staff_signup_key', 'is', null);
    
    console.log('📋 All restaurant keys:', allRestaurants);
    
    // Find exact matches
    const exactMatch = allRestaurants?.find(r => r.staff_signup_key === key);
    console.log('🎯 Exact match found:', exactMatch);
    
    // Find case-insensitive matches
    const caseInsensitiveMatch = allRestaurants?.find(r => 
      r.staff_signup_key?.toUpperCase() === key.toUpperCase()
    );
    console.log('🔤 Case-insensitive match:', caseInsensitiveMatch);
    
  } catch (err) {
    console.error('❌ All keys lookup failed:', err);
  }
}

// Test with the problematic key
debugRestaurantKey('DXP5-MFC-AHT');

// Also test by getting the restaurant by name first
async function getRestaurantByName(name) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .ilike('name', `%${name}%`);
  
  console.log('🏪 Restaurant by name:', { name, data, error });
}

getRestaurantByName('barbeque Nation');
