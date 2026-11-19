import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { Attendance, User } from '../types';
import { db } from './firebase';

function toAttendance(id: string, data: Record<string, unknown>): Attendance {
  return { ...data, id } as Attendance;
}

function updatedAtValue(record: Attendance): number {
  return record.updatedAt ? Date.parse(record.updatedAt) || 0 : 0;
}

export async function loadAttendanceForUser(user: User, localAttendance: Attendance[]): Promise<Attendance[]> {
  if (user.role === 'finance') return localAttendance;

  const attendanceQuery = user.role === 'staff'
    ? query(collection(db, 'attendance'), where('employeeId', '==', user.employeeId ?? ''))
    : collection(db, 'attendance');
  const snapshot = await getDocs(attendanceQuery);
  const cloudRecords = snapshot.docs.map(item => toAttendance(item.id, item.data()));
  const cloudById = new Map(cloudRecords.map(record => [record.id, record]));
  const localRecords = user.role === 'staff'
    ? localAttendance.filter(record => record.employeeId === user.employeeId)
    : localAttendance;
  const localOnly = localRecords.filter(record => !cloudById.has(record.id));

  // Add only missing local records. Never replace an existing cloud record on login.
  await Promise.all(localOnly.map(record =>
    setDoc(doc(db, 'attendance', record.id), {
      ...record,
      updatedAt: record.updatedAt ?? new Date().toISOString(),
    }),
  ));

  const merged = new Map(cloudById);
  for (const record of localRecords) {
    const cloudRecord = merged.get(record.id);
    if (!cloudRecord || updatedAtValue(record) > updatedAtValue(cloudRecord)) {
      merged.set(record.id, record);
    }
  }
  return [...merged.values()];
}

export async function saveAttendanceToFirestore(record: Attendance): Promise<void> {
  await setDoc(doc(db, 'attendance', record.id), {
    ...record,
    updatedAt: record.updatedAt ?? new Date().toISOString(),
  }, { merge: true });
}
