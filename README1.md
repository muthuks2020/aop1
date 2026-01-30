# Product Commitment PWA - Appasamy Associates

A Progressive Web Application (PWA) for managing product commitments across different sales personas at Appasamy Associates.

## 📁 Project Structure

```
product-commitment-pwa/
├── public/
│   ├── index.html          # Main HTML file
│   ├── manifest.json       # PWA manifest
│   ├── robots.txt          # SEO robots file
│   ├── favicon.ico         # App icon
│   ├── logo192.png         # PWA icon (192x192)
│   └── logo512.png         # PWA icon (512x512)
│
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.js    # Route protection
│   │   └── common/
│   │       ├── Header.js            # App header with navigation
│   │       ├── Footer.js            # App footer with actions
│   │       ├── StatsRow.js          # Statistics cards
│   │       ├── Toolbar.js           # Search and filter toolbar
│   │       ├── CategoryList.js      # Category accordion list
│   │       ├── ProductCard.js       # Individual product card
│   │       ├── ProductPanel.js      # Product detail slide panel
│   │       ├── Toast.js             # Toast notifications
│   │       └── Modal.js             # Confirmation modal
│   │
│   ├── context/
│   │   └── AuthContext.js   # Authentication state management
│   │
│   ├── pages/
│   │   ├── Login.js         # Common login page
│   │   ├── SalesRep/
│   │   │   └── Dashboard.js # Sales Representative dashboard
│   │   ├── TBM/
│   │   │   └── Dashboard.js # Territory Business Manager dashboard
│   │   ├── ABM/
│   │   │   └── Dashboard.js # Area Business Manager dashboard
│   │   ├── ZBM/
│   │   │   └── Dashboard.js # Zonal Business Manager dashboard
│   │   └── SalesHead/
│   │       └── Dashboard.js # Sales Head dashboard
│   │
│   ├── services/
│   │   └── api.js           # API service with mock data
│   │
│   ├── styles/
│   │   ├── index.css        # Global styles
│   │   └── login.css        # Login page styles
│   │
│   ├── utils/
│   │   └── helpers.js       # Utility functions
│   │
│   ├── App.js               # Main App component with routing
│   ├── index.js             # React entry point
│   ├── service-worker.js    # PWA service worker
│   └── serviceWorkerRegistration.js # SW registration
│
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. **Clone or download the project:**
   ```bash
   cd product-commitment-pwa
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open in browser:**
   The app will automatically open at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

### Serving the Production Build

```bash
# Install serve globally
npm install -g serve

# Serve the production build
serve -s build
```

## 🔐 Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Sales Representative | `salesrep` | `demo123` |
| Territory Business Manager | `tbm` | `demo123` |
| Area Business Manager | `abm` | `demo123` |
| Zonal Business Manager | `zbm` | `demo123` |
| Sales Head | `saleshead` | `demo123` |

## 📱 Installing the PWA

### On Desktop (Chrome/Edge/Brave)

1. Open the app in your browser
2. Look for the **Install** icon in the address bar (or click the three dots menu)
3. Click **"Install Product Commitment"**
4. The app will be added to your desktop/start menu

### On Android

1. Open the app in Chrome
2. Tap the **three dots menu** in the top right
3. Select **"Add to Home screen"** or **"Install app"**
4. Tap **"Install"** in the prompt
5. The app icon will appear on your home screen

### On iOS (iPhone/iPad)

1. Open the app in Safari
2. Tap the **Share** button (square with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"** in the top right
5. The app icon will appear on your home screen

## 🌐 PWA Features

- **Offline Support:** Works without internet connection
- **Installable:** Can be installed on any device
- **Push Notifications:** Receive updates (when backend is configured)
- **Background Sync:** Data syncs when connection is restored
- **Responsive:** Works on desktop, tablet, and mobile
- **Fast Loading:** Assets are cached for instant loading

## 🎨 Features by Role

### Sales Representative
- View and manage product commitments
- Submit commitments for approval
- Track approval status
- Search and filter products

### Territory Business Manager (TBM)
- All Sales Rep features
- View territory-wide commitments (coming soon)
- Approve/reject submissions (coming soon)

### Area Business Manager (ABM)
- All TBM features
- Area-wide analytics (coming soon)
- Multi-territory overview (coming soon)

### Zonal Business Manager (ZBM)
- All ABM features
- Zone-wide reporting (coming soon)
- Strategic planning tools (coming soon)

### Sales Head
- All ZBM features
- Company-wide dashboard (coming soon)
- Final approval authority (coming soon)
- Export and reporting (coming soon)

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from create-react-app (one-way operation)
npm run eject
```

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=https://api.appasamy.com
REACT_APP_USE_MOCK=true
```

## 📄 API Integration

The app currently uses mock data. To connect to a real API:

1. Open `src/services/api.js`
2. Set `USE_MOCK = false`
3. Update `BASE_URL` to your API endpoint
4. Ensure your API endpoints match the expected format

### Expected API Endpoints

```
GET    /api/v1/categories
GET    /api/v1/products
GET    /api/v1/products?category={id}
POST   /api/v1/products/{id}/draft
POST   /api/v1/products/{id}/submit
POST   /api/v1/products/submit-batch
POST   /api/v1/products/save-all
```

## 🛠️ Troubleshooting

### PWA Not Installing
- Ensure you're using HTTPS (or localhost)
- Check that `manifest.json` is properly configured
- Verify service worker registration in browser DevTools

### Offline Mode Not Working
- Build the production version (`npm run build`)
- Service worker only works in production mode
- Clear browser cache and reload

### Styles Not Loading
- Check if Google Fonts CDN is accessible
- Verify Font Awesome CDN is accessible
- Check browser console for errors

## 📞 Support

For technical support, contact the development team or raise an issue in the repository.

## 📜 License

© 2025 Appasamy Associates. All rights reserved.
