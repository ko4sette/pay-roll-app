import { doc, getDoc } from 'firebase/firestore';
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { Employee, Role, User } from '../types';
import { auth, db } from './firebase';
import { resolveFirebaseLoginEmail } from './firebaseLoginLookupService';

const VALID_ROLES: Role[] = ['admin', 'finance', 'staff'];

function appUserFromProfile(uid: string, profile: Record<string, unknown>): User | null {
  const role = profile.role;
  if (profile.isActive !== true || typeof role !== 'string' || !VALID_ROLES.includes(role as Role)) return null;

  const email = typeof profile.email === 'string' ? profile.email : auth.currentUser?.email ?? '';
  const nameValue = profile.fullName ?? profile.name;
  const name = typeof nameValue === 'string' && nameValue.trim() ? nameValue.trim() : email;
  const employeeId = typeof profile.employeeId === 'string' ? profile.employeeId : undefined;

  if (role === 'staff' && !employeeId) return null;

  return {
    id: uid,
    email,
    name,
    role: role as Role,
    ...(employeeId ? { employeeId } : {}),
    mustChangePassword: profile.mustChangePassword === true,
  };
}

export async function loadFirebaseAppUser(uid: string): Promise<User | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return null;
  return appUserFromProfile(uid, snapshot.data());
}

export async function authenticateFirebaseUser(
  identifier: string,
  password: string,
  employees: Employee[],
): Promise<User | null> {
  const input = identifier.trim();
  const employee = employees.find(item =>
    item.employmentStatus === 'Active'
      && (item.employeeNumber.trim().toLowerCase() === input.toLowerCase()
        || item.email.trim().toLowerCase() === input.toLowerCase()),
  );
  let email = employee?.authEmail ?? (input.includes('@') ? input : employee?.email);
  if (!email) {
    try {
      email = await resolveFirebaseLoginEmail(input) ?? undefined;
    } catch {
      // Admin/Finance and existing email-based users can still sign in while the
      // optional Employee ID/email resolver function has not been deployed yet.
    }
    if (!email && input.includes('@')) email = input;
  }
  if (!email) return null;

  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const appUser = await loadFirebaseAppUser(credential.user.uid);
  if (!appUser) {
    await signOut(auth);
    throw new Error('This account has no active app profile. Ask the administrator to check its Firebase user profile.');
  }
  return appUser;
}

export async function sendFirebasePasswordResetEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export function getFriendlyFirebaseLoginError(error: unknown): string {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: unknown }).code)
    : '';
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password') {
    return 'The email or password is incorrect.';
  }
  if (code === 'auth/invalid-email') return 'Enter a valid email address or an Employee ID linked to an email.';
  if (code === 'auth/network-request-failed') return 'Could not reach Firebase. Check your internet connection and try again.';
  if (code === 'permission-denied' || code === 'firestore/permission-denied') {
    return 'Firebase blocked access to the account profile. Check that the profile exists and its read rule is published.';
  }
  if (error instanceof Error && error.message.startsWith('This account has no active app profile.')) return error.message;
  return 'Sign-in could not be completed. Check the account details and Firebase setup, then try again.';
}
