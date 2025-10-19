import React, { createContext, useContext, useState } from 'react'
import ConfirmationModal from '../components/common/ConfirmationModal'

const ConfirmationContext = createContext()

export const useConfirmation = () => {
  const context = useContext(ConfirmationContext)
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider')
  }
  return context
}

export const ConfirmationProvider = ({ children }) => {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmButtonColor: 'orange',
    showCancel: true,
    onConfirm: null,
    isLoading: false
  })

  const showConfirmation = ({
    title,
    message,
    type = 'warning',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmButtonColor = 'orange',
    showCancel = true
  }) => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        confirmButtonColor,
        showCancel,
        onConfirm: () => {
          resolve(true)
          closeModal()
        },
        isLoading: false
      })
    })
  }

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }))
  }

  const setLoading = (loading) => {
    setModalState(prev => ({ ...prev, isLoading: loading }))
  }

  return (
    <ConfirmationContext.Provider value={{ showConfirmation, setLoading }}>
      {children}
      <ConfirmationModal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        confirmButtonColor={modalState.confirmButtonColor}
        showCancel={modalState.showCancel}
        isLoading={modalState.isLoading}
      />
    </ConfirmationContext.Provider>
  )
}
