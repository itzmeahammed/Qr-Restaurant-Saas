// JavaScript function to delete specific users
// This requires admin privileges and should be used carefully

import { supabase } from '../config/supabase'

export const deleteSpecificUsers = async () => {
  const usersToDelete = [
    {
      id: "9a02203f-66f0-405d-a987-ad7a6105fbba",
      email: "sumaiya27khan@gmail.com",
      full_name: "givegainz"
    },
    {
      id: "9b2cde97-6305-4419-9b51-2a9eaf81a8e1", 
      email: "givegainz3@gmail.com",
      full_name: "Ahammed S"
    }
  ]

  try {
    console.log('Starting user deletion process...')
    
    for (const user of usersToDelete) {
      console.log(`Deleting user: ${user.full_name} (${user.email})`)
      
      // Step 1: Clean up staff records
      const { error: staffError } = await supabase
        .from('staff')
        .delete()
        .eq('user_id', user.id)
      
      if (staffError) {
        console.error(`Error deleting staff records for ${user.email}:`, staffError)
      }
      
      // Step 2: Update restaurant ownership
      const { error: restaurantError } = await supabase
        .from('restaurants')
        .update({ owner_id: null })
        .eq('owner_id', user.id)
      
      if (restaurantError) {
        console.error(`Error updating restaurant ownership for ${user.email}:`, restaurantError)
      }
      
      // Step 3: Delete from user_profiles if exists
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id)
      
      if (profileError) {
        console.error(`Error deleting user profile for ${user.email}:`, profileError)
      }
      
      // Step 4: Delete from auth.users (requires admin privileges)
      // Note: This might not work from client-side, use SQL script instead
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id)
      
      if (authError) {
        console.error(`Error deleting auth user for ${user.email}:`, authError)
        console.log('You may need to run the SQL script manually in Supabase dashboard')
      } else {
        console.log(`Successfully deleted user: ${user.full_name}`)
      }
    }
    
    console.log('User deletion process completed')
    return { success: true, message: 'Users deleted successfully' }
    
  } catch (error) {
    console.error('Error in user deletion process:', error)
    return { success: false, error: error.message }
  }
}

// Usage example:
// import { deleteSpecificUsers } from './scripts/deleteUsers'
// 
// const handleDeleteUsers = async () => {
//   const result = await deleteSpecificUsers()
//   if (result.success) {
//     toast.success('Users deleted successfully')
//     fetchUsers() // Refresh the user list
//   } else {
//     toast.error(result.error)
//   }
// }
