import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';
import { PayrollRecord, User } from '../types';
import { db } from './firebase';

const PAYROLL_COLLECTION = 'payrollRecords';

function toPayrollRecord(id: string, data: Record<string, unknown>): PayrollRecord {
  return { ...data, id } as PayrollRecord;
}

/**
 * Loads payroll visible to this role. Admin login also copies legacy local
 * payroll into Firestore only when that record ID is not already present.
 */
export async function loadPayrollForUser(user: User, localRecords: PayrollRecord[]): Promise<PayrollRecord[]> {
  const payrollQuery = user.role === 'staff'
    ? query(collection(db, PAYROLL_COLLECTION), where('employeeId', '==', user.employeeId ?? ''))
    : collection(db, PAYROLL_COLLECTION);
  const snapshot = await getDocs(payrollQuery);
  const cloudRecords = snapshot.docs.map(item => toPayrollRecord(item.id, item.data()));
  const cloudIds = new Set(cloudRecords.map(record => record.id));

  if (user.role === 'admin') {
    const localOnly = localRecords.filter(record => !cloudIds.has(record.id));
    if (localOnly.length) {
      const refs = localOnly.map(record => doc(db, PAYROLL_COLLECTION, record.id));
      const latestRecords = await runTransaction(db, async transaction => {
        const existing = await Promise.all(refs.map(ref => transaction.get(ref)));
        return existing.map((snapshot, index) => {
          if (snapshot.exists()) return toPayrollRecord(snapshot.id, snapshot.data());
          const record = localOnly[index];
          transaction.set(refs[index], {
            ...record,
            updatedAt: record.updatedAt ?? new Date().toISOString(),
          });
          return record;
        });
      });
      return [...cloudRecords, ...latestRecords];
    }
  }

  const localOnly = localRecords.filter(record =>
    !cloudIds.has(record.id) && (user.role !== 'staff' || record.employeeId === user.employeeId),
  );
  return [...cloudRecords, ...localOnly];
}

/** Keeps Admin, Finance, and Employee payroll views current across devices. */
export function subscribeToPayrollForUser(
  user: User,
  onRecords: (records: PayrollRecord[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const payrollQuery = user.role === 'staff'
    ? query(collection(db, PAYROLL_COLLECTION), where('employeeId', '==', user.employeeId ?? ''))
    : collection(db, PAYROLL_COLLECTION);
  return onSnapshot(payrollQuery, snapshot => {
    onRecords(snapshot.docs.map(item => toPayrollRecord(item.id, item.data())));
  }, error => onError?.(error));
}

/** Admin creates payroll records. Transactions stop two devices preparing the same IDs. */
export async function createPayrollRecords(records: PayrollRecord[]): Promise<void> {
  if (!records.length) return;
  await runTransaction(db, async transaction => {
    const refs = records.map(record => doc(db, PAYROLL_COLLECTION, record.id));
    const existing = await Promise.all(refs.map(ref => transaction.get(ref)));
    if (existing.some(snapshot => snapshot.exists())) {
      throw new Error('Some payroll records already exist. Refresh payroll and review the date again.');
    }
    refs.forEach((ref, index) => transaction.set(ref, records[index]));
  });
}

/** Finance records a payment once; the transaction prevents duplicate confirmations. */
export async function recordPayrollPayment(record: PayrollRecord): Promise<PayrollRecord> {
  const ref = doc(db, PAYROLL_COLLECTION, record.id);
  return runTransaction(db, async transaction => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) throw new Error('This payroll record is no longer available. Refresh and try again.');
    const current = toPayrollRecord(snapshot.id, snapshot.data());
    if (current.status !== 'Pending') throw new Error('This payment has already been recorded. Refresh the payments list.');
    const paidRecord: PayrollRecord = {
      ...current,
      status: 'Paid',
      paidAt: record.paidAt,
      updatedAt: record.updatedAt,
      paymentMethod: record.paymentMethod,
    };
    transaction.update(ref, {
      status: paidRecord.status,
      paidAt: paidRecord.paidAt,
      updatedAt: paidRecord.updatedAt,
      paymentMethod: paidRecord.paymentMethod,
    });
    return paidRecord;
  });
}
