# Product Commitment PWA - Appasamy Associates

A Progressive Web Application (PWA) for managing product commitments across different sales personas at Appasamy Associates.

## 📁 Project Structure

```
product-commitment-pwa/
├── public/
│   ├── index.html          # Main HTML file
│   ├── manifest.json       # PWA manifest
│   └── appasamy-logo.png   # Company logo (add your own)
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
│   │       ├── OverviewStats.js     # Overview statistics dashboard
│   │       ├── TargetEntryGrid.js   # Excel-like target entry grid
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
│   │   └── TBM/
│   │       └── Dashboard.js # Territory Business Manager dashboard
│   │
│   ├── services/
│   │   └── api.js           # API service with mock data
│   │
│   ├── styles/
│   │   ├── index.css           # Global styles
│   │   ├── login.css           # Login page styles
│   │   └── targetEntryGrid.css # Target entry grid styles
│   │
│   ├── utils/
│   │   └── helpers.js       # Utility functions
│   │
│   ├── App.js               # Main App component with routing
│   ├── index.js             # React entry point
│   └── serviceWorkerRegistration.js # PWA service worker registration
│
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. **Extract the project:**
   ```bash
   unzip product-commitment-pwa.zip
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

## 👤 Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Sales Representative | salesrep | demo123 |
| Territory Business Manager | tbm | demo123 |
| Area Business Manager | abm | demo123 |
| Zonal Business Manager | zbm | demo123 |
| Sales Head | saleshead | demo123 |

## ✨ Features

### Sales Representative Module
- **Overview Dashboard**: Summary statistics with category breakdown
- **Target Entry Grid**: Excel-like interface for entering monthly targets
- **Quarterly Totals**: Inline quarterly totals in header row
- **Status Tracking**: Visual status indicators (Draft, Submitted, Approved, Rejected)
- **Bulk Actions**: Save all drafts, submit all for approval

### TBM Module
- **Approval Workflow**: Review and approve/reject submitted targets
- **Team Overview**: View all sales rep submissions
- **Statistics Dashboard**: Comprehensive team performance metrics

### Common Features
- **Role-Based Access**: Different views based on user role
- **PWA Support**: Install as app, offline capability
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Updates**: Instant feedback on all actions

## 🎨 Design Features

- **Appasamy Brand Colors**: Primary blue (#1B4D7A) and accent teal (#00A19B)
- **Excel-like Grid**: Familiar spreadsheet interface
- **Quarter Color Coding**: Q1=Blue, Q2=Green, Q3=Yellow, Q4=Red
- **Status-based Styling**: Visual cues for different statuses
- **Glass Morphism**: Modern UI effects
- **Animated Statistics**: Engaging user experience

## 📝 Adding Your Logo

Replace the placeholder logo:
1. Add your `appasamy-logo.png` to the `public/` folder
2. The app will automatically use it in the header and login page

## 🔧 Configuration

### API Configuration
Edit `src/services/api.js`:
```javascript
const USE_MOCK = true;  // Set to false for real API
const BASE_URL = 'https://your-api-server.com/api/v1';
```

### Adding New Categories
Edit the `MockCategories` array in `src/services/api.js`:
```javascript
{ id: 'new_cat', name: 'New Category', icon: 'fa-icon', color: 'new_cat', isRevenueOnly: false }
```

## 📱 PWA Installation

1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Or use the browser menu: "Install Product Commitment"

## 🔄 Version History

- **v2.1.0**: Simplified quarterly totals display in header row
- **v2.0.0**: Added Excel-like Target Entry Grid
- **v1.0.0**: Initial release with card-based interface

## 📄 License

Proprietary - Appasamy Associates

## 🤝 Support

For support, contact the IT team at Appasamy Associates.
