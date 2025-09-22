# QR Restaurant SaaS Platform

A comprehensive QR-based ordering system for restaurants, hotels, tea stalls, and juice shops. This platform enables contactless ordering through QR code scanning with automated staff assignment, order tracking, payment processing, and comprehensive management dashboards.

## 🚀 Features

### Customer Experience
- **QR Code Ordering**: Scan QR codes to access menus instantly without app downloads
- **Mobile-First Design**: Fully responsive PWA optimized for mobile devices
- **Real-Time Order Tracking**: Live updates on order status with staff assignment
- **Multiple Payment Options**: UPI, cards, wallets, and cash payments
- **Loyalty Points System**: Earn and redeem points for orders
- **Rating & Reviews**: Rate food, service, and overall experience

### Staff Management
- **Smart Order Assignment**: Automatic FIFO-based order distribution
- **Real-Time Notifications**: Instant alerts for new orders
- **Performance Tracking**: Monitor completion rates, tips, and ratings
- **Mobile Dashboard**: Optimized interface for tablets and phones
- **Offline Capability**: Basic functions work without internet

### Restaurant Owner Dashboard
- **Comprehensive Analytics**: Revenue trends, popular items, peak hours
- **Menu Management**: Add, edit, and manage menu items and categories
- **Staff Performance**: Track login hours, orders completed, customer ratings
- **Financial Reports**: Daily/weekly/monthly earnings and profit analysis
- **Inventory Management**: Stock tracking with low stock alerts
- **QR Code Generation**: Generate and manage table QR codes

### Super Admin Panel
- **Multi-Tenant Management**: Manage multiple restaurants
- **Platform Analytics**: Global revenue, restaurant performance comparison
- **User Management**: Customer base analytics and management
- **System Monitoring**: Uptime, performance metrics, error tracking

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS with custom design system
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Animations**: Framer Motion
- **Icons**: Heroicons
- **Notifications**: React Hot Toast

## 🎨 Design System

### Color Palette
- **Primary**: Orange (#f97316) - Warm and inviting
- **Secondary**: Magenta (#e879f9) - Modern and vibrant
- **Accent**: Orange variants (#fb923c) - Complementary tones
- **Neutral**: Gray scale for text and backgrounds
- **Success**: Green (#10b981)
- **Warning**: Amber (#f59e0b)
- **Error**: Red (#ef4444)

### Typography
- **Display Font**: Poppins (headings, hero text)
- **Body Font**: Inter (body text, UI elements)

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurent-sass-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema from `src/database/schema.sql`
   - Update Supabase configuration in `src/config/supabase.js`

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🗄️ Database Setup

1. **Create Supabase Project**
   - Go to [Supabase](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Run Database Schema**
   - Open Supabase SQL editor
   - Copy and paste the contents of `src/database/schema.sql`
   - Execute the script to create all tables and relationships

3. **Configure Row Level Security (RLS)**
   - The schema includes RLS policies for data security
   - Ensure proper authentication is set up

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables for Supabase

### Vercel
1. Import project from GitHub
2. Framework preset: Vite
3. Build command: `npm run build`
4. Output directory: `dist`

## 📱 PWA Features

- **Offline Capability**: Service worker for basic offline functionality
- **Install Prompt**: Add to home screen on mobile devices
- **Push Notifications**: Real-time order updates
- **Background Sync**: Sync data when connection is restored

## 🔧 Configuration

### Supabase Configuration
Update `src/config/supabase.js` with your Supabase credentials:
```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'
```

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Usage

### For Customers
1. Scan QR code at restaurant table
2. Browse menu and add items to cart
3. Enter contact details and place order
4. Track order status in real-time
5. Rate experience after delivery

### For Staff
1. Log in to staff dashboard
2. Toggle online/offline status
3. Accept and manage assigned orders
4. Update order status (preparing, ready, delivered)
5. View earnings and performance metrics

### For Restaurant Owners
1. Access owner dashboard
2. Manage menu items and categories
3. Monitor staff performance
4. View analytics and reports
5. Generate QR codes for tables

### For Super Admins
1. Access super admin panel
2. Manage multiple restaurants
3. View platform-wide analytics
4. Monitor system health
5. Manage user accounts

## 🔐 Security Features

- **Row Level Security**: Database-level access control
- **JWT Authentication**: Secure user sessions
- **API Rate Limiting**: Prevent abuse
- **Data Encryption**: Sensitive data protection
- **CORS Configuration**: Secure cross-origin requests

## 📊 Analytics & Reporting

- **Real-time Dashboards**: Live metrics and KPIs
- **Revenue Tracking**: Daily, weekly, monthly reports
- **Customer Analytics**: Behavior patterns and preferences
- **Staff Performance**: Productivity and customer satisfaction
- **Inventory Reports**: Stock levels and usage patterns

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Email: support@qrrestaurant.com
- Documentation: [docs.qrrestaurant.com](https://docs.qrrestaurant.com)
- Issues: GitHub Issues tab

## 🗺️ Roadmap

- [ ] AI-powered menu recommendations
- [ ] Voice ordering integration
- [ ] Kitchen display system
- [ ] Delivery partner integration
- [ ] Multi-language support
- [ ] Advanced analytics with ML
- [ ] Franchise management system
- [ ] Integration with POS systems

---

Built with ❤️ for the restaurant industry
