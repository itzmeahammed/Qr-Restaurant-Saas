# QR Scanner Installation Guide

## Install Required Package

Run this command in your project root:

```bash
npm install html5-qrcode
```

## Package Details

- **Package**: `html5-qrcode`
- **Purpose**: Enables QR code scanning functionality in the CustomerLanding page
- **Features**: 
  - Camera access for QR scanning
  - Cross-platform compatibility
  - Mobile-optimized scanning
  - Real-time QR code detection

## Usage

The QR scanner is integrated into the CustomerLanding page and allows customers to:
1. Click "Scan QR Code" button
2. Grant camera permissions
3. Point camera at restaurant table QR code
4. Automatically navigate to the restaurant menu

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari (iOS 11+)
- Edge

## Security Note

The QR scanner requires HTTPS in production for camera access. Make sure your deployment uses SSL certificates.
