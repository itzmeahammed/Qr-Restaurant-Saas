# Quick Setup Guide

## Fix Dependencies & Run the App

1. **Install missing dependency:**
   ```bash
   npm install @heroicons/react
   ```

2. **Remove conflicting CSS file:**
   ```bash
   # Delete src/style.css (it conflicts with index.css)
   rm src/style.css
   # OR on Windows:
   del src\style.css
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Database Setup

1. Go to [Supabase](https://supabase.com) and open your project
2. Navigate to SQL Editor
3. Copy and paste the entire contents of `src/database/schema.sql`
4. Run the SQL to create all tables and sample data

## Access the Application

- **Landing Page:** http://localhost:3000/
- **Customer Menu:** http://localhost:3000/menu/awesome-cafe
- **Staff Dashboard:** http://localhost:3000/staff
- **Owner Dashboard:** http://localhost:3000/dashboard
- **Super Admin:** http://localhost:3000/admin

## Troubleshooting

If you see errors about missing dependencies, install them:
```bash
npm install @heroicons/react @headlessui/react framer-motion zustand react-hot-toast recharts
```

The app is fully configured with your Supabase credentials and ready to use!
