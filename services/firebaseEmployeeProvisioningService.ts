import { deleteApp, initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser, inMemoryPersistence, initializeAuth, signOut, updatePassword } from 'firebase/auth';
import { collection, doc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import * as Crypto from 'expo-crypto';
import { Employee } from '../types';
import { auth, db, firebaseConfig } from './firebase';

export interface EmployeeCredentials {
  employeeId: string;
  temporaryPassword: string;
  authEmail: string;
}

async function getInternalAuthEmail(employeeEmail: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, employeeEmail.trim().toLowerCase());
  return `staff-${hash}@cafe-payroll.firebaseapp.com`;
}

async function generateTemporaryPassword(): Promise<string> {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const randomBytes = await Crypto.getRandomBytesAsync(18);
  const randomPart = Array.from(randomBytes, byte => alphabet[byte % alphabet.length]).join('');
  return `${randomPart}aA7!`;
}

export async function createEmployeeAccountOnFreePlan(employee: Employee): Promise<EmployeeCredentials> {
  if (!auth.currentUser) throw new Error('Sign in as Admin before adding employees.');
  const email = employee.email.trim().toLowerCase();
  const authEmail = await getInternalAuthEmail(email);

  const duplicateEmployee = await getDocs(query(
    collection(db, 'employees'),
    where('emailLowercase', '==', email),
  ));
  const legacyDuplicate = duplicateEmployee.empty ? await getDocs(query(
    collection(db, 'employees'),
    where('email', '==', email),
  )) : duplicateEmployee;
  if (!legacyDuplicate.empty) throw new Error('An employee already uses this email address.');

  const temporaryPassword = await generateTemporaryPassword();
  const secondaryApp = initializeApp(firebaseConfig, `employee-provision-${Date.now()}`);
  let secondaryAuth: ReturnType<typeof initializeAuth> | undefined;
  let newAuthUser: Awaited<ReturnType<typeof createUserWithEmailAndPassword>>['user'] | undefined;

  try {
    secondaryAuth = initializeAuth(secondaryApp, { persistence: inMemoryPersistence });
    const credential = await createUserWithEmailAndPassword(secondaryAuth, authEmail, temporaryPassword);
    newAuthUser = credential.user;

    const newEmployee: Employee = {
      ...employee,
      email,
      emailLowercase: email,
      authEmail,
      updatedAt: new Date().toISOString(),
    };
    const batch = writeBatch(db);
    batch.set(doc(db, 'employees', employee.id), newEmployee);
    batch.set(doc(db, 'users', credential.user.uid), {
      email,
      emailLowercase: email,
      authEmail,
      fullName: employee.fullName,
      role: 'staff',
      employeeId: employee.id,
      isActive: true,
      mustChangePassword: true,
      updatedAt: new Date().toISOString(),
    });
    batch.set(doc(db, 'loginLookup', `id_${employee.id.trim().toLowerCase()}`), { authEmail });
    batch.set(doc(db, 'loginLookup', `email_${email}`), { authEmail });
    await batch.commit();

    return { employeeId: employee.employeeNumber, temporaryPassword, authEmail };
  } catch (error) {
    if (newAuthUser) await deleteUser(newAuthUser).catch(() => undefined);
    throw error;
  } finally {
    if (secondaryAuth) await signOut(secondaryAuth).catch(() => undefined);
    await deleteApp(secondaryApp).catch(() => undefined);
  }
}

export async function completeEmployeePasswordChange(newPassword: string): Promise<void> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Please sign in again before changing your password.');
  await updatePassword(currentUser, newPassword);
  await updateDoc(doc(db, 'users', currentUser.uid), {
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  });
}
