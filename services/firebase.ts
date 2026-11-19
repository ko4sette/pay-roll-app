import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import {
  getAuth,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyCFiMRwoi9jCcrSfiWOT_u7b0zojjZ5wQ0',
  authDomain: 'cafe-payroll.firebaseapp.com',
  projectId: 'cafe-payroll',
  storageBucket: 'cafe-payroll.firebasestorage.app',
  messagingSenderId: '425254806585',
  appId: '1:425254806585:web:2b94d2eb3762dc66de19e8',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Firebase exposes this helper through its React Native package condition.
// TypeScript's generic package condition omits it, so add its documented type here.
const getReactNativePersistence = (FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence: (
    storage: typeof AsyncStorage,
  ) => NonNullable<Parameters<typeof initializeAuth>[1]>['persistence'];
}).getReactNativePersistence;

let auth: Auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
