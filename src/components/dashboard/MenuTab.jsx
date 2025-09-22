import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PhotoIcon,
  EyeSlashIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const MenuTab = ({ menuItems, categories, onAddItem, onUpdateItem, onDeleteItem, onAddCategory }) => {
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
  const [newCategory, setNewCategory] = useState({ name: '', description: '' })

  const handleAddItem = () => {
    if (newItem.name && newItem.price && newItem.category_id) {
      const item = {
        id: Date.now(),
        ...newItem,
        price: parseFloat(newItem.price)
      }
      onAddItem?.(item)
      setNewItem({ name: '', description: '', price: '', category_id: '', is_available: true, image_url: '' })
      setShowAddItemModal(false)
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

  const handleUpdateItem = (itemId, updates) => {
    onUpdateItem?.(itemId, updates)
  }

  const handleDeleteItem = (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      onDeleteItem?.(itemId)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900">Menu Management</h2>
            <p className="text-neutral-600 text-sm mt-1">Manage your restaurant menu items and categories</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowAddCategoryModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              Add Category
            </button>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              <PlusIcon className="h-4 w-4" />
              Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="space-y-6">
        {categories.length > 0 ? categories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900">{category.name}</h3>
              <span className="text-sm text-neutral-500">
                {menuItems.filter(item => item.category_id === category.id).length} items
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems
                .filter(item => item.category_id === category.id)
                .map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 hover:shadow-md transition-shadow"
                  >
                    {/* Item Image */}
                    <div className="aspect-video bg-neutral-200 rounded-lg mb-3 overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PhotoIcon className="h-8 w-8 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Item Info */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-neutral-900 line-clamp-1">{item.name}</h4>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1 text-neutral-400 hover:text-orange-500 transition-colors"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-neutral-600 line-clamp-2">{item.description}</p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <span className="font-bold text-orange-600">₹{item.price}</span>
                        <button
                          onClick={() => handleUpdateItem(item.id, { is_available: !item.is_available })}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            item.is_available 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {item.is_available ? (
                            <>
                              <EyeIcon className="h-3 w-3" />
                              Available
                            </>
                          ) : (
                            <>
                              <EyeSlashIcon className="h-3 w-3" />
                              Unavailable
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              
              {/* Add Item Card */}
              <div
                onClick={() => setShowAddItemModal(true)}
                className="bg-neutral-50 rounded-xl p-4 border-2 border-dashed border-neutral-300 hover:border-orange-300 hover:bg-orange-50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
              >
                <PlusIcon className="h-8 w-8 text-neutral-400 mb-2" />
                <span className="text-sm font-medium text-neutral-600">Add New Item</span>
              </div>
            </div>
          </div>
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
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900">Add Menu Item</h3>
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
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
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Image URL (Optional)</label>
                <input
                  type="url"
                  value={newItem.image_url}
                  onChange={(e) => setNewItem({ ...newItem, image_url: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
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
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900">Add Category</h3>
                <button
                  onClick={() => setShowAddCategoryModal(false)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
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
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowAddCategoryModal(false)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCategory}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-neutral-900">Edit Menu Item</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
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
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Image URL (Optional)</label>
                <input
                  type="url"
                  value={editingItem.image_url || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
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
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 text-neutral-600 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUpdateItem(editingItem.id, editingItem)
                    setEditingItem(null)
                  }}
                  className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Save Changes
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
