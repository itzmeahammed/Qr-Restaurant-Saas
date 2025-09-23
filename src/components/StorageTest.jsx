import React, { useState } from 'react'
import { uploadImageToStorage } from '../utils/storageUtils'
import useAuthStore from '../stores/useAuthStore'
import toast from 'react-hot-toast'

const StorageTest = () => {
  const { user } = useAuthStore()
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState('')

  const handleTestUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      // Bucket should already exist (created manually in Supabase dashboard)
      
      // Upload test image
      const result = await uploadImageToStorage(
        file,
        'restaurant-images',
        `test/${user?.id || 'anonymous'}`,
        `test_${Date.now()}.${file.name.split('.').pop()}`
      )

      setUploadedUrl(result.url)
      toast.success('Test upload successful!')
      console.log('Upload result:', result)
    } catch (error) {
      console.error('Test upload failed:', error)
      toast.error(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Supabase Storage Test</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Image Upload
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleTestUpload}
            disabled={uploading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
          />
        </div>

        {uploading && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
            <span className="text-sm text-gray-600">Uploading...</span>
          </div>
        )}

        {uploadedUrl && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-green-600">Upload successful!</p>
            <img 
              src={uploadedUrl} 
              alt="Uploaded test" 
              className="w-full h-32 object-cover rounded-lg border"
            />
            <p className="text-xs text-gray-500 break-all">{uploadedUrl}</p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p><strong>User ID:</strong> {user?.id || 'Not authenticated'}</p>
          <p><strong>Bucket:</strong> restaurant-images</p>
          <p><strong>Folder:</strong> test/{user?.id || 'anonymous'}</p>
        </div>
      </div>
    </div>
  )
}

export default StorageTest
