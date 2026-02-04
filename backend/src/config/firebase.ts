import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');

let isFirebaseInitialized = false;

if (fs.existsSync(serviceAccountPath)) {
    try {
        const serviceAccount = require(serviceAccountPath);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        isFirebaseInitialized = true;
        console.log('[Firebase] Admin SDK Initialized.');
    } catch (error) {
        console.error('[Firebase] Failed to initialize:', error);
    }
} else {
    console.warn('[Firebase] serviceAccountKey.json not found. FCM will not work.');
}

export { admin, isFirebaseInitialized };
