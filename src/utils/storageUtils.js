import { supabase } from '../config/supabase'

/**
 * Upload image to Supabase storage bucket
 * @param {File} file - The image file to upload
 * @param {string} bucket - The storage bucket name
 * @param {string} folder - The folder path within the bucket
 * @param {string} fileName - The file name (optional, will generate if not provided)
 * @returns {Promise<{url: string, path: string}>} - The public URL and storage path
 */
export const uploadImageToStorage = async (file, bucket = 'restaurant-images', folder = '', fileName = null) => {
  try {
    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB')
    }

    // Generate unique filename if not provided
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const finalFileName = fileName || `${timestamp}_${randomString}.${fileExtension}`
    
    // Construct the full path
    const filePath = folder ? `${folder}/${finalFileName}` : finalFileName

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath,
      bucket: bucket
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

/**
 * Delete image from Supabase storage
 * @param {string} bucket - The storage bucket name
 * @param {string} filePath - The file path to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteImageFromStorage = async (bucket = 'restaurant-images', filePath) => {
  try {
    if (!filePath) {
      throw new Error('No file path provided')
    }

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Storage delete error:', error)
      throw new Error(`Delete failed: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

/**
 * Get signed URL for private images (if needed)
 * @param {string} bucket - The storage bucket name
 * @param {string} filePath - The file path
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} - The signed URL
 */
export const getSignedUrl = async (bucket = 'restaurant-images', filePath, expiresIn = 3600) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('Signed URL error:', error)
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }

    return data.signedUrl
  } catch (error) {
    console.error('Error creating signed URL:', error)
    throw error
  }
}

/**
 * Compress image before upload
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width (default: 1200)
 * @param {number} maxHeight - Maximum height (default: 800)
 * @param {number} quality - Compression quality (0-1, default: 0.8)
 * @returns {Promise<File>} - The compressed image file
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Create new File object with compressed data
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            })
            resolve(compressedFile)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        file.type,
        quality
      )
    }

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Create storage bucket if it doesn't exist
 * @param {string} bucketName - The bucket name to create
 * @param {boolean} isPublic - Whether the bucket should be public (default: true)
 * @returns {Promise<boolean>} - Success status
 */
export const createStorageBucket = async (bucketName = 'restaurant-images', isPublic = true) => {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      throw listError
    }

    const bucketExists = buckets.some(bucket => bucket.name === bucketName)
    
    if (bucketExists) {
      console.log(`Bucket '${bucketName}' already exists`)
      return true
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: isPublic,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      fileSizeLimit: 5242880 // 5MB
    })

    if (error) {
      console.error('Error creating bucket:', error)
      throw error
    }

    console.log(`Bucket '${bucketName}' created successfully`)
    return true
  } catch (error) {
    console.error('Error in createStorageBucket:', error)
    throw error
  }
}

/**
 * Setup storage policies for the bucket (requires admin privileges)
 * This function provides the SQL commands that need to be run in Supabase dashboard
 * @param {string} bucketName - The bucket name
 * @returns {string} - SQL commands to run
 */
export const getStoragePolicySQL = (bucketName = 'restaurant-images') => {
  return `
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to upload images
CREATE POLICY "Authenticated users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = '${bucketName}' 
  AND auth.role() = 'authenticated'
);

-- Policy for public read access
CREATE POLICY "Public can view images" ON storage.objects
FOR SELECT USING (bucket_id = '${bucketName}');

-- Policy for users to update their own images
CREATE POLICY "Users can update own images" ON storage.objects
FOR UPDATE USING (
  bucket_id = '${bucketName}' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy for users to delete their own images
CREATE POLICY "Users can delete own images" ON storage.objects
FOR DELETE USING (
  bucket_id = '${bucketName}' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
  `.trim()
}
