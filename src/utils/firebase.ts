import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { maskEmail } from './security';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore using the configured database ID (required to prevent connection failures)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    maskedEmail?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      maskedEmail?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const rawErrorMessage = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: rawErrorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      maskedEmail: maskEmail(auth.currentUser?.email),
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        maskedEmail: maskEmail(provider.email),
      })) || []
    },
    operationType,
    path
  };
  
  // Safe sanitized logging (prevents CWE-532 PII leakage)
  console.error(`[Firestore ${operationType.toUpperCase()}] ${path || 'unknown'}: ${rawErrorMessage}`);
  return errInfo;
}
