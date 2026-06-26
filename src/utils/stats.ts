import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserStats {
  userId: string;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  updatedAt: any;
}

/**
 * Initializes a user's stats document if it doesn't already exist.
 */
export async function initializeUserStats(userId: string): Promise<UserStats> {
  const statsRef = doc(db, 'user_stats', userId);
  const snap = await getDoc(statsRef);
  
  if (!snap.exists()) {
    const initialStats: UserStats = {
      userId,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
      updatedAt: new Date()
    };
    await setDoc(statsRef, initialStats);
    return initialStats;
  }
  
  return snap.data() as UserStats;
}

/**
 * Retrieves a user's stats document.
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const statsRef = doc(db, 'user_stats', userId);
  const snap = await getDoc(statsRef);
  if (snap.exists()) {
    return snap.data() as UserStats;
  }
  return null;
}

/**
 * Updates user statistics after a match has completed.
 */
export async function updateUserStatsAfterMatch(
  userId: string,
  goalsScored: number,
  goalsConceded: number,
  outcome: 'win' | 'draw' | 'loss'
): Promise<UserStats> {
  const statsRef = doc(db, 'user_stats', userId);
  const snap = await getDoc(statsRef);
  
  let current: UserStats;
  if (!snap.exists()) {
    current = {
      userId,
      matchesPlayed: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsScored: 0,
      goalsConceded: 0,
      updatedAt: new Date()
    };
  } else {
    current = snap.data() as UserStats;
  }
  
  const updated: UserStats = {
    userId,
    matchesPlayed: (current.matchesPlayed || 0) + 1,
    wins: (current.wins || 0) + (outcome === 'win' ? 1 : 0),
    draws: (current.draws || 0) + (outcome === 'draw' ? 1 : 0),
    losses: (current.losses || 0) + (outcome === 'loss' ? 1 : 0),
    goalsScored: (current.goalsScored || 0) + goalsScored,
    goalsConceded: (current.goalsConceded || 0) + goalsConceded,
    updatedAt: new Date()
  };
  
  await setDoc(statsRef, updated);
  return updated;
}
