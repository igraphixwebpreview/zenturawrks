import { NextApiRequest, NextApiResponse } from 'next';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin if it hasn't been initialized
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const auth = getAuth();
const db = getFirestore();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, firstName, lastName, role, department, label, phone } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !role || !department) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate a random password
    const tempPassword = Math.random().toString(36).slice(-8);

    // Create the user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password: tempPassword,
      displayName: `${firstName} ${lastName}`,
    });

    // Create the user document in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      email,
      firstName,
      lastName,
      role: role || 'staff',
      label: label || '',
      department,
      phone: phone || '',
      isActive: true,
      isAdmin: false,
      createdAt: new Date(),
      lastLogin: null,
      displayName: `${firstName} ${lastName}`,
    });

    // Return success with the temporary password
    return res.status(200).json({
      message: 'User created successfully',
      tempPassword,
      uid: userRecord.uid,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    
    // Type guard for Firebase Auth errors
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as { code: string; message: string };
      
      // Handle specific Firebase Auth errors
      switch (firebaseError.code) {
        case 'auth/email-already-exists':
          return res.status(400).json({ message: 'Email already exists' });
        case 'auth/invalid-email':
          return res.status(400).json({ message: 'Invalid email address' });
        case 'auth/operation-not-allowed':
          return res.status(400).json({ message: 'Operation not allowed' });
        default:
          return res.status(500).json({ message: `Firebase error: ${firebaseError.message}` });
      }
    }

    return res.status(500).json({ message: 'Error creating user' });
  }
} 