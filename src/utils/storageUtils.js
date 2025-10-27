import { supabase } from '../config/supabase'

/**
 * Upload image to Supabase storage bucket with restaurant-specific organization
 * @param {File} file - The image file to upload
 * @param {string} restaurantId - The restaurant ID for organization
 * @param {string} imageType - Type of image ('logo', 'banner', 'menu-item', 'category')
 * @param {string} bucket - The storage bucket name
 * @param {string} fileName - The file name (optional, will generate if not provided)
 * @returns {Promise<{url: string, path: string, bucket: string}>} - The public URL, storage path, and bucket
 */
export const uploadRestaurantImage = async (file, restaurantId, imageType, bucket = 'restaurant-images', fileName = null) => {
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

    // Validate restaurant ID and image type
    if (!restaurantId) {
      throw new Error('Restaurant ID is required')
    }
    
    if (!['logo', 'banner', 'menu-item', 'category'].includes(imageType)) {
      throw new Error('Invalid image type. Must be: logo, banner, menu-item, or category')
    }

    // Generate unique filename if not provided
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const finalFileName = fileName || `${timestamp}_${randomString}.${fileExtension}`
    
    // Construct restaurant-specific folder structure
    const folder = `restaurants/${restaurantId}/${imageType}s`
    const filePath = `${folder}/${finalFileName}`

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
      bucket: bucket,
      folder: folder,
      fileName: finalFileName,
      imageType: imageType,
      restaurantId: restaurantId
    }
  } catch (error) {
    console.error('Error uploading image:', error)
    throw error
  }
}

/**
 * Legacy upload function for backward compatibility
 * @deprecated Use uploadRestaurantImage instead
 */
export const uploadImageToStorage = async (file, bucket = 'restaurant-images', folder = '', fileName = null) => {
  console.warn('uploadImageToStorage is deprecated. Use uploadRestaurantImage instead.')
  
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
 * Legacy compress function for backward compatibility
 * @deprecated Use compressRestaurantImage instead
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 800, quality = 0.8) => {
  console.warn('compressImage is deprecated. Use compressRestaurantImage instead.')
  
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
 * Delete restaurant image with proper path handling
 * @param {string} restaurantId - The restaurant ID
 * @param {string} imageType - Type of image ('logo', 'banner', 'menu-item', 'category')
 * @param {string} fileName - The file name to delete
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<boolean>} - Success status
 */
export const deleteRestaurantImage = async (restaurantId, imageType, fileName, bucket = 'restaurant-images') => {
  try {
    if (!restaurantId || !imageType || !fileName) {
      throw new Error('Restaurant ID, image type, and file name are required')
    }

    const filePath = `restaurants/${restaurantId}/${imageType}s/${fileName}`
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Storage delete error:', error)
      throw new Error(`Delete failed: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error('Error deleting restaurant image:', error)
    throw error
  }
}

/**
 * List all images for a restaurant
 * @param {string} restaurantId - The restaurant ID
 * @param {string} imageType - Type of image ('logo', 'banner', 'menu-item', 'category') or 'all'
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<Array>} - Array of file objects
 */
export const listRestaurantImages = async (restaurantId, imageType = 'all', bucket = 'restaurant-images') => {
  try {
    if (!restaurantId) {
      throw new Error('Restaurant ID is required')
    }

    let folderPath
    if (imageType === 'all') {
      folderPath = `restaurants/${restaurantId}`
    } else {
      folderPath = `restaurants/${restaurantId}/${imageType}s`
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folderPath, {
        limit: 100,
        offset: 0
      })

    if (error) {
      console.error('Storage list error:', error)
      throw new Error(`List failed: ${error.message}`)
    }

    // Add public URLs to each file
    const filesWithUrls = data.map(file => {
      const filePath = `${folderPath}/${file.name}`
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath)
      
      return {
        ...file,
        path: filePath,
        url: publicUrl,
        restaurantId,
        imageType: imageType === 'all' ? 'mixed' : imageType
      }
    })

    return filesWithUrls
  } catch (error) {
    console.error('Error listing restaurant images:', error)
    throw error
  }
}

/**
 * Get restaurant image URL by type and filename
 * @param {string} restaurantId - The restaurant ID
 * @param {string} imageType - Type of image ('logo', 'banner', 'menu-item', 'category')
 * @param {string} fileName - The file name
 * @param {string} bucket - The storage bucket name
 * @returns {string} - The public URL
 */
export const getRestaurantImageUrl = (restaurantId, imageType, fileName, bucket = 'restaurant-images') => {
  if (!restaurantId || !imageType || !fileName) {
    throw new Error('Restaurant ID, image type, and file name are required')
  }

  const filePath = `restaurants/${restaurantId}/${imageType}s/${fileName}`
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath)

  return publicUrl
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
 * Compress image with specific dimensions for different image types
 * @param {File} file - The image file to compress
 * @param {string} imageType - Type of image ('logo', 'banner', 'menu-item', 'category')
 * @param {number} quality - Compression quality (0-1, default: 0.8)
 * @returns {Promise<File>} - The compressed image file
 */
export const compressRestaurantImage = (file, imageType, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    // Define dimensions for different image types
    const dimensions = {
      'logo': { width: 400, height: 400 },
      'banner': { width: 1200, height: 400 },
      'menu-item': { width: 800, height: 600 },
      'category': { width: 600, height: 400 }
    }

    const targetDimensions = dimensions[imageType] || { width: 800, height: 600 }

    img.onload = () => {
      const { width: targetWidth, height: targetHeight } = targetDimensions
      
      // For logos, maintain aspect ratio within square
      if (imageType === 'logo') {
        const size = Math.min(img.width, img.height)
        canvas.width = targetWidth
        canvas.height = targetHeight
        
        // Center the image
        const x = (targetWidth - size) / 2
        const y = (targetHeight - size) / 2
        
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, targetWidth, targetHeight)
        ctx.drawImage(img, x, y, size, size)
      } else {
        // For other types, fit to dimensions maintaining aspect ratio
        const aspectRatio = img.width / img.height
        const targetAspectRatio = targetWidth / targetHeight
        
        let drawWidth, drawHeight, x = 0, y = 0
        
        if (aspectRatio > targetAspectRatio) {
          drawWidth = targetWidth
          drawHeight = targetWidth / aspectRatio
          y = (targetHeight - drawHeight) / 2
        } else {
          drawHeight = targetHeight
          drawWidth = targetHeight * aspectRatio
          x = (targetWidth - drawWidth) / 2
        }
        
        canvas.width = targetWidth
        canvas.height = targetHeight
        
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, targetWidth, targetHeight)
        ctx.drawImage(img, x, y, drawWidth, drawHeight)
      }
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
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
