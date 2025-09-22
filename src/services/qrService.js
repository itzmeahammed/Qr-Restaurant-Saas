import QRCode from 'qrcode'
import { supabase } from '../config/supabase'

/**
 * QR Code Service for generating and managing table QR codes
 */
class QRService {
  /**
   * Generate QR code for a restaurant table
   * @param {string} restaurantId - Restaurant UUID
   * @param {string} tableId - Table UUID
   * @param {string} tableNumber - Table number/name
   * @returns {Promise<{qrCodeUrl: string, qrCodeData: string}>}
   */
  static async generateTableQR(restaurantId, tableId, tableNumber) {
    try {
      // Create the URL that will be encoded in the QR code
      const baseUrl = window.location.origin
      const qrUrl = `${baseUrl}/menu/${restaurantId}/${tableId}`

      // Generate QR code options
      const qrOptions = {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 512
      }

      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrUrl, qrOptions)

      // Generate QR code with custom branding
      const qrWithBranding = await this.addBrandingToQR(qrCodeDataUrl, tableNumber)

      return {
        qrCodeUrl: qrUrl,
        qrCodeData: qrWithBranding || qrCodeDataUrl
      }
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw error
    }
  }

  /**
   * Add branding elements to QR code (table number, restaurant logo)
   * @param {string} qrCodeDataUrl - Base QR code data URL
   * @param {string} tableNumber - Table number to display
   * @returns {Promise<string>} - Branded QR code data URL
   */
  static async addBrandingToQR(qrCodeDataUrl, tableNumber) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Set canvas size with padding for text
        canvas.width = 600
        canvas.height = 700

        // White background
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Draw QR code
        ctx.drawImage(img, 50, 50, 500, 500)

        // Add table number text
        ctx.fillStyle = '#000000'
        ctx.font = 'bold 48px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`Table ${tableNumber}`, canvas.width / 2, 620)

        // Add instruction text
        ctx.font = '24px Arial'
        ctx.fillStyle = '#666666'
        ctx.fillText('Scan to view menu & order', canvas.width / 2, 660)

        // Convert canvas to data URL
        resolve(canvas.toDataURL('image/png'))
      }

      img.src = qrCodeDataUrl
    })
  }

  /**
   * Generate multiple QR codes for all tables in a restaurant
   * @param {string} restaurantId - Restaurant UUID
   * @returns {Promise<Array>} - Array of QR codes for all tables
   */
  static async generateAllTableQRs(restaurantId) {
    try {
      // Fetch all tables for the restaurant
      const { data: tables, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true)
        .order('table_number')

      if (error) throw error

      // Generate QR codes for all tables
      const qrCodes = await Promise.all(
        tables.map(async (table) => {
          const qrData = await this.generateTableQR(
            restaurantId,
            table.id,
            table.table_number
          )

          // Update table with QR code data
          await supabase
            .from('restaurant_tables')
            .update({ qr_code: qrData.qrCodeUrl })
            .eq('id', table.id)

          return {
            tableId: table.id,
            tableNumber: table.table_number,
            tableName: table.table_name,
            ...qrData
          }
        })
      )

      return qrCodes
    } catch (error) {
      console.error('Error generating all table QR codes:', error)
      throw error
    }
  }

  /**
   * Download QR code as image file
   * @param {string} qrCodeData - QR code data URL
   * @param {string} fileName - File name for download
   */
  static downloadQRCode(qrCodeData, fileName = 'qr-code') {
    const link = document.createElement('a')
    link.download = `${fileName}.png`
    link.href = qrCodeData
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /**
   * Generate and download all QR codes as a ZIP file
   * @param {Array} qrCodes - Array of QR code objects
   * @param {string} restaurantName - Restaurant name for ZIP file
   */
  static async downloadAllQRCodes(qrCodes, restaurantName) {
    try {
      // Dynamic import of JSZip
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // Add each QR code to the ZIP
      qrCodes.forEach((qr) => {
        // Convert data URL to blob
        const base64 = qr.qrCodeData.split(',')[1]
        const fileName = `table-${qr.tableNumber}.png`
        zip.file(fileName, base64, { base64: true })
      })

      // Generate ZIP file
      const content = await zip.generateAsync({ type: 'blob' })

      // Download ZIP file
      const link = document.createElement('a')
      link.download = `${restaurantName}-qr-codes.zip`
      link.href = URL.createObjectURL(content)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading QR codes:', error)
      throw error
    }
  }

  /**
   * Validate QR code URL and extract restaurant/table info
   * @param {string} qrUrl - QR code URL
   * @returns {Object} - Extracted restaurant and table IDs
   */
  static parseQRUrl(qrUrl) {
    try {
      const url = new URL(qrUrl)
      const pathParts = url.pathname.split('/')
      
      if (pathParts[1] === 'menu' && pathParts[2] && pathParts[3]) {
        return {
          restaurantId: pathParts[2],
          tableId: pathParts[3],
          isValid: true
        }
      }

      return { isValid: false }
    } catch (error) {
      console.error('Invalid QR URL:', error)
      return { isValid: false }
    }
  }
}

export default QRService
