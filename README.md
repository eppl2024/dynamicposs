# Energy Palace POS System

A comprehensive Point of Sale (POS) system built with React Native and Expo for Energy Palace Pvt. Ltd.

## Features

- **Multi-Sheet Support**: Connect multiple Google Sheets for different stores/branches
- **Order Management**: Create and manage multiple orders simultaneously
- **Product Catalog**: Browse products by categories with search functionality
- **Payment Processing**: Support for Cash, Esewa, and Fonepay payment methods
- **Expense Tracking**: Record business expenses with categorization
- **Charging Station**: Calculate billing for EV charging services
- **Deposits Management**: Track money deposits with different modes
- **Business Insights**: View analytics and reports from your data
- **Offline Capable**: Works offline with data sync when connected

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd energy-palace-pos
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

## Building APK

To generate an APK file for Android:

### Method 1: Using EAS Build (Recommended)

1. Install EAS CLI if you haven't already:
```bash
npm install -g eas-cli
```

2. Login to your Expo account:
```bash
eas login
```

3. Configure the project:
```bash
eas build:configure
```

4. Build the APK:
```bash
# For preview/testing
eas build --platform android --profile preview

# For production
eas build --platform android --profile production
```

5. Download the APK from the Expo dashboard or the provided link.

### Method 2: Local Build (Alternative)

1. Install Android Studio and set up Android SDK
2. Create a local build:
```bash
npx expo run:android --variant release
```

## Google Sheets Integration

The app comes pre-configured with Energy Palace's Google Sheets URL. You can:

1. **Use the default configuration**: The app automatically connects to the main Energy Palace sheet
2. **Add additional sheets**: Go to Settings > Google Sheets Management to add more sheets
3. **Switch between sheets**: Each sheet appears as a separate tab in the app

### Setting up Google Apps Script

Your Google Apps Script should handle these actions:
- `login`: User authentication
- `getProducts`: Fetch product catalog
- `submitOrder`: Submit new orders
- `submitCharging`: Submit charging records
- `submitExpense`: Submit expense records
- `submitDeposit`: Submit deposit records
- `getBepInsight`: Fetch business insights

## App Structure

```
app/
├── (tabs)/                 # Tab-based navigation
│   ├── index.tsx          # Main orders screen
│   ├── charging.tsx       # Charging station
│   ├── expenses.tsx       # Expense tracking
│   ├── deposits.tsx       # Deposit management
│   ├── insights.tsx       # Business analytics
│   └── settings.tsx       # App settings
├── login.tsx              # Login screen
└── _layout.tsx            # Root layout

contexts/
├── AuthContext.tsx        # Authentication state
└── AppContext.tsx         # App state management

components/
└── SheetOrdersScreen.tsx  # Dynamic sheet components
```

## Configuration

### Default Settings

- **Company**: Energy Palace Pvt. Ltd.
- **Google Sheets URL**: Pre-configured and permanent
- **Payment Methods**: Cash, Esewa, Fonepay
- **Currency**: NPR (Nepalese Rupees)

### Customization

You can customize the app by:
1. Adding new expense categories in `expenses.tsx`
2. Modifying payment methods across the app
3. Adding new product categories
4. Customizing the UI theme and colors

## Deployment

### Android APK Distribution

1. Build the APK using EAS Build
2. Download the APK file
3. Distribute via:
   - Direct download link
   - File sharing services
   - Internal app distribution platforms

### Web Deployment

The app also supports web deployment:
```bash
npm run build:web
```

## Support

For technical support or questions about the Energy Palace POS system, please contact the development team.

## License

This software is proprietary to Energy Palace Pvt. Ltd. All rights reserved.