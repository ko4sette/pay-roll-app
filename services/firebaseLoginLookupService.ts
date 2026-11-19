import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function resolveFirebaseLoginEmail(identifier: string): Promise<string | null> {
  const value = identifier.trim();
  if (!value) return null;
  const key = value.includes('@')
    ? `email_${value.toLowerCase()}`
    : `id_${value.toLowerCase()}`;
  const snapshot = await getDoc(doc(db, 'loginLookup', key));
  const authEmail = snapshot.exists() ? snapshot.data().authEmail : null;
  return typeof authEmail === 'string' && authEmail ? authEmail : null;
}
