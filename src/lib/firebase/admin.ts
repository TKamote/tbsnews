import * as admin from 'firebase-admin';

const isFirebaseAdminConfigured = 
  !!process.env.FIREBASE_ADMIN_PROJECT_ID && 
  !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL && 
  !!process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!admin.apps.length && isFirebaseAdminConfigured) {
  try {
    const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
    
    if (!privateKey || !privateKey.includes('BEGIN PRIVATE KEY')) {
      console.error('FIREBASE_ADMIN_PRIVATE_KEY is invalid or missing');
    } else {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log('Firebase Admin initialized successfully');
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
} else if (!isFirebaseAdminConfigured) {
  console.warn('Firebase Admin not configured - missing environment variables');
}

export const adminDb = admin.apps.length ? admin.firestore() : null;
export const adminAuth = admin.apps.length ? admin.auth() : null;

export default admin;

