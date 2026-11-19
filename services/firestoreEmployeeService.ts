import { collection, doc, getDoc, getDocs, query, setDoc, where, writeBatch } from 'firebase/firestore';
import { Employee, User } from '../types';
import { db } from './firebase';

function toEmployee(id: string, data: Record<string, unknown>): Employee {
  return { ...data, id } as Employee;
}

/**
 * Loads the signed-in user's employee records. Admin migration only adds missing
 * documents; existing Firestore documents are never overwritten automatically.
 */
export async function loadEmployeesForUser(user: User, localEmployees: Employee[]): Promise<Employee[]> {
  if (user.role === 'staff') {
    if (!user.employeeId) return [];
    const employeeSnapshot = await getDoc(doc(db, 'employees', user.employeeId));
    if (employeeSnapshot.exists()) return [toEmployee(employeeSnapshot.id, employeeSnapshot.data())];
    return localEmployees.filter(employee => employee.id === user.employeeId);
  }

  const employeesSnapshot = await getDocs(collection(db, 'employees'));
  const cloudEmployees = employeesSnapshot.docs.map(snapshot => toEmployee(snapshot.id, snapshot.data()));
  const cloudById = new Map(cloudEmployees.map(employee => [employee.id, employee]));
  const localOnlyEmployees = localEmployees.filter(employee => !cloudById.has(employee.id));

  if (user.role === 'admin') {
    // Preserve locally saved employee records while seeding any IDs not in Firestore.
    await Promise.all(localOnlyEmployees.map(employee =>
      setDoc(doc(db, 'employees', employee.id), {
        ...employee,
        emailLowercase: employee.email.trim().toLowerCase(),
        updatedAt: employee.updatedAt ?? new Date().toISOString(),
      }),
    ));
  }

  // Prefer the version with the newest edit timestamp. Older local records without
  // a timestamp remain preferred when the cloud copy also has no timestamp.
  const merged = new Map(cloudById);
  for (const employee of localEmployees) {
    const cloudEmployee = merged.get(employee.id);
    if (!cloudEmployee) {
      merged.set(employee.id, employee);
      continue;
    }
    const localTime = employee.updatedAt ? Date.parse(employee.updatedAt) : 0;
    const cloudTime = cloudEmployee.updatedAt ? Date.parse(cloudEmployee.updatedAt) : 0;
    if (localTime >= cloudTime) merged.set(employee.id, employee);
  }
  return [...merged.values()];
}

export async function saveEmployeeToFirestore(employee: Employee): Promise<Employee> {
  const updatedEmployee = {
    ...employee,
    emailLowercase: employee.email.trim().toLowerCase(),
    updatedAt: new Date().toISOString(),
  };
  const linkedProfiles = await getDocs(query(
    collection(db, 'users'),
    where('employeeId', '==', employee.id),
  ));
  const batch = writeBatch(db);
  batch.set(doc(db, 'employees', employee.id), updatedEmployee, { merge: true });
  for (const profile of linkedProfiles.docs) {
    batch.update(profile.ref, {
      isActive: employee.employmentStatus === 'Active',
      updatedAt: new Date().toISOString(),
    });
  }
  await batch.commit();
  return updatedEmployee;
}

/**
 * Removes an employee and their Firestore attendance/payroll history. Access is
 * disabled first; dependent records are deleted in bounded batches, then the
 * employee and login lookup documents are removed. The Firebase Auth identity
 * itself requires a trusted server/Admin SDK to delete.
 */
export async function deleteEmployeeFromFirestore(employee: Employee): Promise<void> {
  const [attendance, payroll, profiles] = await Promise.all([
    getDocs(query(collection(db, 'attendance'), where('employeeId', '==', employee.id))),
    getDocs(query(collection(db, 'payrollRecords'), where('employeeId', '==', employee.id))),
    getDocs(query(collection(db, 'users'), where('employeeId', '==', employee.id))),
  ]);

  const updatedAt = new Date().toISOString();
  const dependentRefs = [
    ...attendance.docs.map(snapshot => snapshot.ref),
    ...payroll.docs.map(snapshot => snapshot.ref),
  ];
  const employeeRef = doc(db, 'employees', employee.id);
  const employeeLookupRef = doc(db, 'loginLookup', `id_${employee.employeeNumber.trim().toLowerCase()}`);
  const email = (employee.emailLowercase ?? employee.email).trim().toLowerCase();
  const emailLookupRef = doc(db, 'loginLookup', `email_${email}`);

  // Keep the common case atomic, including permission failures. Only unusually
  // long histories need multiple Firestore batches.
  if (dependentRefs.length + profiles.size + 3 <= 500) {
    const batch = writeBatch(db);
    for (const profile of profiles.docs) batch.update(profile.ref, { isActive: false, updatedAt });
    dependentRefs.forEach(ref => batch.delete(ref));
    batch.delete(employeeRef);
    batch.delete(employeeLookupRef);
    batch.delete(emailLookupRef);
    await batch.commit();
    return;
  }

  if (profiles.size) {
    const disableProfiles = writeBatch(db);
    for (const profile of profiles.docs) {
      disableProfiles.update(profile.ref, { isActive: false, updatedAt });
    }
    await disableProfiles.commit();
  }

  // Firestore batches are limited, so remove records in chunks. The employee
  // document is retained until every dependent record has been deleted; if a
  // chunk fails, the admin can retry and the disabled account cannot add more.
  for (let offset = 0; offset < dependentRefs.length; offset += 450) {
    const batch = writeBatch(db);
    dependentRefs.slice(offset, offset + 450).forEach(ref => batch.delete(ref));
    await batch.commit();
  }

  const batch = writeBatch(db);
  batch.delete(employeeRef);
  batch.delete(employeeLookupRef);
  batch.delete(emailLookupRef);
  await batch.commit();
}
