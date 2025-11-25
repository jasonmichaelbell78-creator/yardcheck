// scripts/setup.cjs
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if it exists (for local development)
// In CI, environment variables are passed directly via the workflow
const envLocalPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
}

// Required Firebase config keys
const requiredConfigKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
];

// Validate all required config values are present
function validateConfig() {
  const missingKeys = requiredConfigKeys.filter(key => !process.env[key] || process.env[key].trim() === '');
  
  if (missingKeys.length > 0) {
    console.error('❌ Error: Missing Firebase configuration values:');
    missingKeys.forEach(key => console.error(`   - ${key}`));
    console.error('\n   For local development: Create .env.local with your Firebase configuration.');
    console.error('   For CI: Ensure GitHub Secrets are configured for all required values.');
    process.exit(1);
  }
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const initialInspectors = [
  { name: 'Matt Hale', isAdmin: true },
  { name: 'Jason Bell', isAdmin: false },
  { name: 'Alexis McElhaney', isAdmin: false },
  { name: 'Derek Owen', isAdmin: false },
];

async function setup() {
  console.log('🚛 YardCheck Setup Script');
  console.log('========================\n');

  // Validate environment variables
  validateConfig();

  console.log(`📦 Connecting to Firebase project: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('✅ Connected to Firebase\n');
  console.log('👥 Adding inspectors...\n');

  const inspectorsRef = collection(db, 'inspectors');
  let added = 0;
  let skipped = 0;

  for (const inspector of initialInspectors) {
    // Check if inspector already exists
    const q = query(inspectorsRef, where('name', '==', inspector.name));
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      console.log(`   ⏭️  ${inspector.name} already exists, skipping`);
      skipped++;
      continue;
    }

    // Add the inspector
    const now = Timestamp.now();
    await addDoc(inspectorsRef, {
      name: inspector.name,
      isAdmin: inspector.isAdmin,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    
    const role = inspector.isAdmin ? '(Admin)' : '';
    console.log(`   ✅ Added ${inspector.name} ${role}`);
    added++;
  }

  console.log('\n========================');
  console.log(`✅ Setup complete! Added ${added} inspector(s), skipped ${skipped} existing.`);
  console.log('\n🚀 Next steps:');
  console.log('   1. Run "npm run dev" to start the app');
  console.log('   2. Open http://localhost:5173');
  console.log('   3. Select an inspector and start inspecting!\n');
  
  process.exit(0);
}

setup().catch((error) => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});
