// scripts/add-inspector.js
// Usage: node scripts/add-inspector.js "Inspector Name" [--admin]

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, getDocs, query, where, Timestamp } = require('firebase/firestore');
require('dotenv').config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function addInspector(name, isAdmin = false) {
  console.log('🚛 YardCheck - Add Inspector');
  console.log('===========================\n');

  // Validate environment variables
  if (!process.env.VITE_FIREBASE_PROJECT_ID) {
    console.error('❌ Error: .env.local file not found or missing Firebase config.');
    console.error('   Please create .env.local with your Firebase configuration.');
    process.exit(1);
  }

  // Validate name
  if (!name || name.trim() === '') {
    console.error('❌ Error: Inspector name is required.');
    console.error('   Usage: node scripts/add-inspector.js "Inspector Name" [--admin]');
    process.exit(1);
  }

  const trimmedName = name.trim();

  console.log(`📦 Connecting to Firebase project: ${process.env.VITE_FIREBASE_PROJECT_ID}`);
  
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  
  console.log('✅ Connected to Firebase\n');

  const inspectorsRef = collection(db, 'inspectors');

  // Check if inspector already exists
  const q = query(inspectorsRef, where('name', '==', trimmedName));
  const existing = await getDocs(q);
  
  if (!existing.empty) {
    console.log(`❌ Inspector "${trimmedName}" already exists.`);
    process.exit(1);
  }

  // Add the inspector
  const now = Timestamp.now();
  await addDoc(inspectorsRef, {
    name: trimmedName,
    isAdmin: isAdmin,
    active: true,
    createdAt: now,
    updatedAt: now,
  });
  
  const role = isAdmin ? '(Admin)' : '';
  console.log(`✅ Added inspector: ${trimmedName} ${role}`);
  console.log('\n🚀 The new inspector can now be selected in the app.\n');
  
  process.exit(0);
}

// Parse command line arguments
const args = process.argv.slice(2);
const name = args.find(arg => !arg.startsWith('--'));
const isAdmin = args.includes('--admin');

if (!name) {
  console.log('🚛 YardCheck - Add Inspector');
  console.log('===========================\n');
  console.error('❌ Error: Inspector name is required.');
  console.error('   Usage: node scripts/add-inspector.js "Inspector Name" [--admin]');
  console.error('\n   Examples:');
  console.error('     node scripts/add-inspector.js "John Smith"');
  console.error('     node scripts/add-inspector.js "Jane Doe" --admin\n');
  process.exit(1);
}

addInspector(name, isAdmin).catch((error) => {
  console.error('❌ Failed to add inspector:', error.message);
  process.exit(1);
});
