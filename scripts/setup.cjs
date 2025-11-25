// scripts/setup.js
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
  if (!process.env.VITE_FIREBASE_PROJECT_ID) {
    console.error('❌ Error: .env.local file not found or missing Firebase config.');
    console.error('   Please create .env.local with your Firebase configuration.');
    process.exit(1);
  }

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
