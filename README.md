# YardCheck - Trucking Yard Inspection PWA

A mobile-first Progressive Web App (PWA) for trucking yard inspections. Two inspectors can collaborate in real-time to complete DOT compliance checklists on trucks.

## Features

- **Mobile-First Design**: Optimized for phones with large touch targets for outdoor use
- **Real-Time Collaboration**: Two inspectors can work on the same inspection simultaneously
- **Offline Support**: Works offline with Firebase offline persistence
- **PWA**: Installable on mobile devices with home screen icon
- **DOT Compliance**: Complete 14-point interior and exterior checklist

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Custom shadcn/ui-style components
- **PWA**: Vite PWA Plugin (service worker, offline support, installable)
- **Backend/Database**: Firebase (Firestore for real-time sync)
- **Hosting**: Firebase Hosting

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Firebase account

### Firebase Setup

1. **Create a Firebase Project**

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Click "Add project"
   - Enter a project name (e.g., "yardcheck")
   - Disable Google Analytics (optional, not needed for MVP)
   - Click "Create project"

2. **Enable Firestore Database**

   - In your Firebase project, go to "Build" > "Firestore Database"
   - Click "Create database"
   - Select "Start in test mode" (we'll update rules later)
   - Choose a location closest to your users
   - Click "Done"

3. **Get Firebase Configuration**

   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon (</>)
   - Register your app with a nickname (e.g., "YardCheck Web")
   - Copy the configuration values

4. **Configure Environment Variables**

   Create a `.env.local` file in the project root:

   ```bash
   cp .env.example .env.local
   ```

   Fill in your Firebase configuration:

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

5. **Deploy Firestore Rules and Indexes**

   Install Firebase CLI if you haven't:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

   Initialize Firebase in your project:

   ```bash
   firebase init
   ```

   Select:
   - Firestore
   - Hosting

   When prompted, use existing files for rules and indexes.

   Deploy rules and indexes:

   ```bash
   firebase deploy --only firestore
   ```

6. **Add Initial Inspector Data**

   In the Firebase Console, go to Firestore Database and create the `inspectors` collection with sample documents:

   ```javascript
   // Document 1
   {
     name: "John Smith",
     isAdmin: false,
     active: true,
     createdAt: Timestamp,
     updatedAt: Timestamp
   }

   // Document 2
   {
     name: "Jane Doe",
     isAdmin: false,
     active: true,
     createdAt: Timestamp,
     updatedAt: Timestamp
   }

   // Document 3 (Admin)
   {
     name: "Admin User",
     isAdmin: true,
     active: true,
     createdAt: Timestamp,
     updatedAt: Timestamp
   }
   ```

### Local Development

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

3. **Build for Production**

   ```bash
   npm run build
   ```

4. **Preview Production Build**

   ```bash
   npm run preview
   ```

### Deployment

Deploy to Firebase Hosting:

```bash
npm run build
firebase deploy --only hosting
```

Or deploy everything (Firestore + Hosting):

```bash
npm run build
firebase deploy
```

## Project Structure

```
yardcheck/
├── public/
│   └── icons/              # PWA app icons
├── src/
│   ├── main.tsx            # App entry point
│   ├── App.tsx             # Main app with routing
│   ├── config/
│   │   ├── firebase.ts     # Firebase initialization
│   │   └── checklist.ts    # Checklist configuration
│   ├── contexts/
│   │   ├── AuthContext.tsx # Inspector authentication state
│   │   └── ConnectionContext.tsx # Online/offline status
│   ├── hooks/
│   │   ├── useInspection.ts    # Inspection data management
│   │   └── useInspectors.ts    # Inspector data fetching
│   ├── pages/
│   │   ├── LoginPage.tsx       # Inspector selection
│   │   ├── TruckEntryPage.tsx  # Truck number entry
│   │   └── InspectionPage.tsx  # Checklist interface
│   ├── components/
│   │   ├── ui/             # Base UI components
│   │   ├── ChecklistItem.tsx
│   │   ├── ChecklistSection.tsx
│   │   ├── ConnectionStatus.tsx
│   │   └── ProgressBar.tsx
│   ├── services/
│   │   ├── inspectionService.ts  # Firestore inspection operations
│   │   └── inspectorService.ts   # Firestore inspector operations
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   └── utils/
│       ├── cn.ts           # Class name utility
│       └── validation.ts   # Input validation
├── firebase.json           # Firebase hosting config
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore composite indexes
└── vite.config.ts          # Vite configuration with PWA
```

## Checklist Items

### Interior (6 items)
- Registration: Yes / No / Added
- IFTA Card: Yes / No / Added
- ELD Instruction Sheet: Yes / No / Added
- Accident Hotline Card: Yes / No / Added
- Insurance Card: Yes / No / Added
- Blank Log Books: Yes / No / Added

### Exterior (8 items)
- DOT Annual: In-Date / Out-of-Date
- IFTA Sticker: Yes / No / Added
- Tag: In-Date / Out-of-Date
- HUT Sticker: Yes / No / Added
- Fire Extinguisher: Yes / No
- Triangles: Yes / No
- Tires: Yes / No
- Mudflaps: Yes / No

## Data Models

### Inspector
```typescript
interface Inspector {
  id: string;
  name: string;
  isAdmin: boolean;
  active: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Inspection
```typescript
interface Inspection {
  id: string;
  truckNumber: string;
  status: 'in-progress' | 'complete' | 'gone';
  inspector1: string;
  inspector2: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt: Timestamp | null;
  interior: { /* checklist items */ };
  exterior: { /* checklist items */ };
  additionalDefects: string;
}
```

## PWA Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home screen" or "Install app"
4. Tap "Add"

## Future Enhancements (Phase 2)

- [ ] Admin dashboard for viewing inspection history
- [ ] Export inspections to PDF/Excel
- [ ] Photo attachments for defects
- [ ] User authentication with Firebase Auth
- [ ] Tighter security rules
- [ ] Push notifications for inspection completion
- [ ] Inspection templates for different truck types

## License

MIT
