import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
  EyeSlashIcon,
  EyeIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  ClipboardDocumentListIcon
} from '@heroicons/react/24/outline'
import { uploadImageToStorage, deleteImageFromStorage } from '../../utils/storageUtils'
import toast from 'react-hot-toast'
import { useConfirmation } from '../../contexts/ConfirmationContext'

const MenuTab = ({ menuItems, categories, onAddItem, onUpdateItem, onDeleteItem, onAddCategory }) => {
  const { showConfirmation } = useConfirmation()
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category_id: '',
    is_available: true,
    image_url: ''
  })
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const [editImagePreview, setEditImagePreview] = useState('')
  const [editSelectedImage, setEditSelectedImage] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isEditDragging, setIsEditDragging] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })

  const handleAddItem = async () => {
    if (newItem.name && newItem.price && newItem.category_id) {
      setUploadingImage(true)
      let imageUrl = newItem.image_url
      
      
      try {
        // Upload image if file is selected
        if (selectedImage) {
          try {
            const uploadResult = await uploadImageToStorage(
              selectedImage,
              'restaurant-images',
              'menu-items'
            )
            
            if (!uploadResult || !uploadResult.url) {
              throw new Error('Upload succeeded but no URL returned')
            }
            
            imageUrl = uploadResult.url
            toast.success('Image uploaded successfully!')
          } catch (uploadError) {
            console.error('Image upload error:', uploadError)
            toast.error('Failed to upload image: ' + uploadError.message)
            throw uploadError
          }
        }
        
        // Create the complete item data
        const itemData = {
          name: newItem.name,
          description: newItem.description,
          price: parseFloat(newItem.price),
          category_id: newItem.category_id,
          is_available: newItem.is_available,
          image_url: imageUrl || null // Ensure empty strings become null
        }
        
        // Validate that if an image was selected, we got a URL
        if (selectedImage && !imageUrl) {
          throw new Error('Image upload failed - no URL received')
        }
        
        
        if (!onAddItem) {
          throw new Error('onAddItem function not provided')
        }
        
        await onAddItem(itemData)
        
        // Reset form
        setNewItem({ name: '', description: '', price: '', category_id: '', is_available: true, image_url: '' })
        setSelectedImage(null)
        setImagePreview('')
        setShowAddItemModal(false)
        
      } catch (error) {
        console.error('Error adding menu item:', error)
        toast.error('Failed to add menu item')
      } finally {
        setUploadingImage(false)
      }
    }
  }

  const handleAddCategory = () => {
    if (newCategory.name) {
      const category = {
        id: Date.now(),
        ...newCategory,
        sort_order: categories.length + 1
      }
      onAddCategory?.(category)
      setNewCategory({ name: '', description: '' })
      setShowAddCategoryModal(false)
    }
  }

  const handleUpdateItem = async (itemId, updates) => {
    let finalUpdates = { ...updates }
    
    // Remove nested objects and non-updatable fields
    const {
      id,
      categories,
      created_at,
      updated_at,
      restaurant_id,
      ...cleanUpdates
    } = finalUpdates
    
    finalUpdates = cleanUpdates
    
    
    // Upload image if file is selected for editing
    if (editSelectedImage) {
      setUploadingImage(true)
      try {
        const uploadResult = await uploadImageToStorage(
          editSelectedImage,
          'restaurant-images',
          'menu-items'
        )
        finalUpdates.image_url = uploadResult.url
        toast.success('Image uploaded successfully!')
      } catch (error) {
        console.error('Error uploading image:', error)
        toast.error('Failed to upload image')
        setUploadingImage(false)
        return
      }
      setUploadingImage(false)
    }
    
    onUpdateItem?.(itemId, finalUpdates)
  }

  const handleDeleteItem = async (itemId) => {
    const confirmed = await showConfirmation({
      title: 'Delete Menu Item',
      message: 'Are you sure you want to delete this menu item?\n\nThis action cannot be undone.',
      type: 'warning',
      confirmText: 'Delete Item',
      cancelText: 'Cancel',
      confirmButtonColor: 'red'
    })
    
    if (confirmed) {
      onDeleteItem?.(itemId)
    }
  }

  // Image handling functions
  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedImage(file)
      setNewItem({ ...newItem, image_url: '' }) // Clear URL when file is selected
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const clearImageSelection = () => {
    setSelectedImage(null)
    setImagePreview('')
    // Reset file input
    const fileInput = document.getElementById('image-upload')
    if (fileInput) fileInput.value = ''
  }

  const handleEditImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setEditSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setEditImagePreview(e.target.result)
        setEditingItem({ ...editingItem, image_url: '' }) // Clear URL when file is selected
      }
      reader.readAsDataURL(file)
    }
  }

  const clearEditImageSelection = () => {
    setEditSelectedImage(null)
    setEditImagePreview('')
    // Reset file input
    const fileInput = document.getElementById('edit-image-upload')
    if (fileInput) fileInput.value = ''
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        setSelectedImage(file)
        setNewItem({ ...newItem, image_url: '' })
        
        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreview(e.target.result)
        }
        reader.readAsDataURL(file)
      } else {
        toast.error('Please drop an image file')
      }
    }
  }

  // Edit drag and drop handlers
  const handleEditDragOver = (e) => {
    e.preventDefault()
    setIsEditDragging(true)
  }

  const handleEditDragLeave = (e) => {
    e.preventDefault()
    setIsEditDragging(false)
  }

  const handleEditDrop = (e) => {
    e.preventDefault()
    setIsEditDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('image/')) {
        setEditSelectedImage(file)
        
        // Create preview
        const reader = new FileReader()
        reader.onload = (e) => {
          setEditImagePreview(e.target.result)
          setEditingItem({ ...editingItem, image_url: '' })
        }
        reader.readAsDataURL(file)
      } else {
        toast.error('Please drop an image file')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-white to-orange-50 rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">Menu Management</h2>
              <p className="text-neutral-600 text-sm mt-1">Create and organize your restaurant menu</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add Category</span>
              <span className="sm:hidden">Category</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddItemModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 font-medium shadow-sm"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Add Menu Item</span>
              <span className="sm:hidden">Add Item</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="space-y-6">
        {categories.length > 0 ? categories.map((category) => (
          <motion.div 
            key={category.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-orange-600 rounded-full"></div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-neutral-500">{category.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full text-xs font-medium">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  {menuItems.filter(item => item.category_id === category.id).length} items
                </span>
              </div>
            </div>
            
            {/* Mobile-Optimized Responsive Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              {menuItems
                .filter(item => item.category_id === category.id)
                .map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group bg-white rounded-xl border border-neutral-200 hover:border-orange-200 hover:shadow-lg transition-all duration-200 overflow-hidden"
                  >
                    {/* Compact Image Section */}
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PhotoIcon className="h-6 w-6 text-neutral-400" />
                        </div>
                      )}
                      
                      {/* Floating Action Buttons */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-neutral-600 hover:text-orange-500 hover:bg-white shadow-sm transition-all duration-200"
                        >
                          <PencilIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-full text-neutral-600 hover:text-red-500 hover:bg-white shadow-sm transition-all duration-200"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Availability Badge */}
                      <div className="absolute bottom-2 left-2">
                        <button
                          onClick={() => handleUpdateItem(item.id, { is_available: !item.is_available })}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm transition-all duration-200 ${
                            item.is_available 
                              ? 'bg-green-500/90 text-white hover:bg-green-600' 
                              : 'bg-red-500/90 text-white hover:bg-red-600'
                          }`}
                        >
                          {item.is_available ? (
                            <>
                              <EyeIcon className="h-3 w-3" />
                              <span className="hidden sm:inline">Available</span>
                            </>
                          ) : (
                            <>
                              <EyeSlashIcon className="h-3 w-3" />
                              <span className="hidden sm:inline">Hidden</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Mobile-Optimized Content Section */}
                    <div className="p-2 sm:p-3">
                      <div className="space-y-1 sm:space-y-2">
                        {/* Title and Price Row */}
                        <div className="flex items-start justify-between gap-1 sm:gap-2">
                          <h4 className="font-semibold text-neutral-900 text-xs sm:text-sm leading-tight line-clamp-1 flex-1">
                            {item.name}
                          </h4>
                          <span className="font-bold text-orange-600 text-xs sm:text-sm whitespace-nowrap">
                            ₹{item.price}
                          </span>
                        </div>
                        
                        {/* Description - Hidden on very small screens */}
                        <p className="hidden sm:block text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                          {item.description || 'No description available'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              
              {/* Mobile-Optimized Add Item Card */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowAddItemModal(true)}
                className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border-2 border-dashed border-orange-300 hover:border-orange-400 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 cursor-pointer flex flex-col items-center justify-center min-h-[120px] sm:min-h-[160px] group"
              >
                <div className="flex flex-col items-center gap-1 sm:gap-2">
                  <div className="p-2 sm:p-3 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow duration-200">
                    <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-orange-700">Add New Item</span>
                  <span className="hidden sm:block text-xs text-orange-600 opacity-75">Click to create</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )) : (
          <div className="bg-white rounded-xl p-8 md:p-12 shadow-sm border border-neutral-200 text-center">
            <PhotoIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-neutral-900 mb-2">No Categories Found</h3>
            <p className="text-neutral-500 mb-4">Create your first menu category to get started.</p>
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Category
            </button>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Add Menu Item</h3>
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="e.g., Butter Chicken"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Describe your dish..."
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Price (₹)</label>
                <input
                  type="number"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Category</label>
                <select
                  value={newItem.category_id}
                  onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Item Image</label>
                
                {/* Image Preview */}
                {(imagePreview || newItem.image_url) && (
                  <div className="mb-3">
                    <img
                      src={imagePreview || newItem.image_url}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-neutral-300"
                    />
                  </div>
                )}
                
                {/* Upload Options */}
                <div className="space-y-3">
                  {/* File Upload with Drag & Drop */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Upload Image File</label>
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
                        isDragging 
                          ? 'border-orange-400 bg-orange-50' 
                          : 'border-neutral-300 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center gap-2 px-4 py-6 cursor-pointer"
                      >
                        <CloudArrowUpIcon className={`h-8 w-8 transition-colors ${
                          isDragging ? 'text-orange-500' : 'text-neutral-400'
                        }`} />
                        <div className="text-center">
                          <span className="text-sm font-medium text-neutral-700">
                            {selectedImage ? selectedImage.name : 'Drop image here or click to browse'}
                          </span>
                          <p className="text-xs text-neutral-500 mt-1">
                            Supports: JPG, PNG, GIF up to 5MB
                          </p>
                        </div>
                      </label>
                      {selectedImage && (
                        <button
                          type="button"
                          onClick={clearImageSelection}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* URL Input */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Or paste image URL</label>
                    <input
                      type="url"
                      value={newItem.image_url}
                      onChange={(e) => {
                        setNewItem({ ...newItem, image_url: e.target.value })
                        if (e.target.value && !selectedImage) {
                          setImagePreview('')
                        }
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      disabled={selectedImage}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="available"
                  checked={newItem.is_available}
                  onChange={(e) => setNewItem({ ...newItem, is_available: e.target.checked })}
                  className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="available" className="text-sm font-medium text-neutral-700">
                  Available for order
                </label>
              </div>
              
            </div>
            
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={uploadingImage}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    'Add Item'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Add Category</h3>
                <button
                  onClick={() => setShowAddCategoryModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Category Name</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Main Course"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Description (Optional)</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="Describe this category..."
                  rows={2}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddCategoryModal(false)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Add Category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-4 sm:p-6 border-b border-neutral-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900">Edit Menu Item</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Item Name</label>
                <input
                  type="text"
                  value={editingItem.name}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                <textarea
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Price (₹)</label>
                <input
                  type="number"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              {/* Edit Image Upload Section */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Item Image</label>
                
                {/* Image Preview */}
                {(editImagePreview || editingItem.image_url) && (
                  <div className="mb-3">
                    <img
                      src={editImagePreview || editingItem.image_url}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg border border-neutral-300"
                    />
                  </div>
                )}
                
                {/* Upload Options */}
                <div className="space-y-3">
                  {/* File Upload with Drag & Drop */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Upload New Image</label>
                    <div
                      onDragOver={handleEditDragOver}
                      onDragLeave={handleEditDragLeave}
                      onDrop={handleEditDrop}
                      className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ${
                        isEditDragging 
                          ? 'border-orange-400 bg-orange-50' 
                          : 'border-neutral-300 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageSelect}
                        className="hidden"
                        id="edit-image-upload"
                      />
                      <label
                        htmlFor="edit-image-upload"
                        className="flex flex-col items-center justify-center gap-2 px-4 py-6 cursor-pointer"
                      >
                        <CloudArrowUpIcon className={`h-8 w-8 transition-colors ${
                          isEditDragging ? 'text-orange-500' : 'text-neutral-400'
                        }`} />
                        <div className="text-center">
                          <span className="text-sm font-medium text-neutral-700">
                            {editSelectedImage ? editSelectedImage.name : 'Drop image here or click to browse'}
                          </span>
                          <p className="text-xs text-neutral-500 mt-1">
                            Supports: JPG, PNG, GIF up to 5MB
                          </p>
                        </div>
                      </label>
                      {editSelectedImage && (
                        <button
                          type="button"
                          onClick={clearEditImageSelection}
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md text-neutral-400 hover:text-red-500 transition-colors"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* URL Input */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">Or paste image URL</label>
                    <input
                      type="url"
                      value={editingItem.image_url || ''}
                      onChange={(e) => {
                        setEditingItem({ ...editingItem, image_url: e.target.value })
                        if (e.target.value && !editSelectedImage) {
                          setEditImagePreview('')
                        }
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                      disabled={editSelectedImage}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-available"
                  checked={editingItem.is_available}
                  onChange={(e) => setEditingItem({ ...editingItem, is_available: e.target.checked })}
                  className="rounded border-neutral-300 text-orange-500 focus:ring-orange-500"
                />
                <label htmlFor="edit-available" className="text-sm font-medium text-neutral-700">
                  Available for order
                </label>
              </div>
              
            </div>
            
            <div className="p-4 sm:p-6 border-t border-neutral-200 bg-neutral-50 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateItem(editingItem.id, editingItem)
                    setEditingItem(null)
                    setEditSelectedImage(null)
                    setEditImagePreview('')
                  }}
                  disabled={uploadingImage}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {uploadingImage ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuTab
