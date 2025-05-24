import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${process.env.VITE_FIREBASE_PROJECT_ID}.firebasestorage.app`,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

async function setupFirestore() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    console.log('Setting up Firestore collections...');
    
    // Create users collection with a placeholder document
    await setDoc(doc(db, 'users', 'placeholder'), {
      email: 'placeholder@example.com',
      createdAt: new Date(),
      isAdmin: false
    });
    
    // Create invoices collection
    await setDoc(doc(db, 'invoices', 'placeholder'), {
      invoiceNumber: 'PLACEHOLDER-001',
      status: 'draft',
      createdAt: new Date()
    });
    
    // Create clients collection
    await setDoc(doc(db, 'clients', 'placeholder'), {
      name: 'Placeholder Client',
      email: 'placeholder@client.com',
      createdAt: new Date()
    });
    
    // Create email_templates collection
    await setDoc(doc(db, 'email_templates', 'placeholder'), {
      name: 'Default Template',
      subject: 'Your Invoice',
      body: 'Please find your invoice attached.',
      invoiceType: 'invoice',
      isDefault: true,
      createdAt: new Date()
    });
    
    // Create settings collection
    await setDoc(doc(db, 'settings', 'default'), {
      companyName: 'Your Company',
      companyEmail: 'admin@yourcompany.com',
      companyAddress: '123 Business St',
      invoicePrefix: 'INV',
      nextInvoiceNumber: 1000,
      defaultVat: '10',
      paymentTerms: 30,
      updatedAt: new Date()
    });
    
    console.log('✅ Firestore collections created successfully!');
    console.log('Your database is now ready for profile picture uploads.');
    
  } catch (error) {
    console.error('❌ Error setting up Firestore:', error);
  }
}

setupFirestore();