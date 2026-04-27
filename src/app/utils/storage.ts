import { AppState } from "../types";
import { ensureCommunityProfile } from "./communityTrust";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { normalizeMomentumState } from "./momentum";

const STORAGE_KEY_PREFIX = "levelday_app_state::";
const LEGACY_STORAGE_KEY_PREFIX = "solo_app_state::";
const LAST_USER_KEY = "levelday_last_user_id";
const LEGACY_LAST_USER_KEY = "solo_last_user_id";
const LEGACY_STORAGE_KEYS = ["levelday_app_state", "solo_app_state"] as const;

function userStorageKey(userId: string): string {
  return `${STORAGE_KEY_PREFIX}${userId}`;
}

function legacyUserStorageKey(userId: string): string {
  return `${LEGACY_STORAGE_KEY_PREFIX}${userId}`;
}

const COLLECTION_NAME = "appState";

export const saveToStorage = (state: AppState): void => {
  try {
    const uid = state.user?.id;

    if (!uid) {
      localStorage.setItem(LEGACY_STORAGE_KEYS[0], JSON.stringify(state));
      return;
    }

    localStorage.setItem(userStorageKey(uid), JSON.stringify(state));
    localStorage.setItem(LAST_USER_KEY, uid);
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
};

export const loadFromStorage = (userId?: string): AppState | null => {
  try {
    const resolvedUserId =
      userId ||
      localStorage.getItem(LAST_USER_KEY) ||
      localStorage.getItem(LEGACY_LAST_USER_KEY) ||
      undefined;

    if (resolvedUserId) {
      const preferred = localStorage.getItem(userStorageKey(resolvedUserId));
      if (preferred) return JSON.parse(preferred) as AppState;

      const legacyPerUser = localStorage.getItem(legacyUserStorageKey(resolvedUserId));
      if (legacyPerUser) return JSON.parse(legacyPerUser) as AppState;
    }

    for (const legacyKey of LEGACY_STORAGE_KEYS) {
      const legacy = localStorage.getItem(legacyKey);
      if (legacy) return JSON.parse(legacy) as AppState;
    }

    return null;
  } catch (error) {
    console.error("Failed to load from localStorage:", error);
    return null;
  }
};

export const clearStorage = (userId?: string): void => {
  try {
    if (userId) {
      localStorage.removeItem(userStorageKey(userId));
      localStorage.removeItem(legacyUserStorageKey(userId));
      const last = localStorage.getItem(LAST_USER_KEY);
      if (last === userId) localStorage.removeItem(LAST_USER_KEY);
      const legacyLast = localStorage.getItem(LEGACY_LAST_USER_KEY);
      if (legacyLast === userId) localStorage.removeItem(LEGACY_LAST_USER_KEY);
      return;
    }

    for (const legacyKey of LEGACY_STORAGE_KEYS) localStorage.removeItem(legacyKey);
    localStorage.removeItem(LAST_USER_KEY);
    localStorage.removeItem(LEGACY_LAST_USER_KEY);
  } catch {
    // ignore
  }
};

function normalizeAppState(raw: any): AppState | null {
  if (!raw || typeof raw !== "object") return null;

  const user = raw.user ?? null;
  const normalizedUser =
    user && typeof user === "object"
      ? {
          ...user,
          level: Number.isFinite(Number(user.level)) ? Number(user.level) : 1,
          xp: Number.isFinite(Number(user.xp)) ? Number(user.xp) : 0,
          xpToNextLevel: Number.isFinite(Number(user.xpToNextLevel))
            ? Number(user.xpToNextLevel)
            : 100,
          totalXP: Number.isFinite(Number(user.totalXP)) ? Number(user.totalXP) : 0,
        }
      : null;

  const currentPage =
    typeof raw.currentPage === "string"
      ? raw.currentPage === "calendar"
        ? "planner"
        : raw.currentPage
      : "dashboard";

  return {
    user: normalizedUser,
    quests: Array.isArray(raw.quests) ? raw.quests : [],
    habits: Array.isArray(raw.habits)
      ? raw.habits.map((habit: any) => ({
          ...habit,
          completedDates: Array.isArray(habit?.completedDates) ? habit.completedDates : [],
          xpAwardedDates: Array.isArray(habit?.xpAwardedDates) ? habit.xpAwardedDates : [],
        }))
      : [],
    focusSessions: Array.isArray(raw.focusSessions) ? raw.focusSessions : [],
    badges: Array.isArray(raw.badges) ? raw.badges : [],
    currentPage,
    isOnboarded: typeof raw.isOnboarded === "boolean" ? raw.isOnboarded : !!normalizedUser,
    reminders: Array.isArray(raw.reminders) ? raw.reminders : [],
    scheduleItems: Array.isArray(raw.scheduleItems) ? raw.scheduleItems : [],
    communityMessages: Array.isArray(raw.communityMessages) ? raw.communityMessages : [],
    communityProfile: ensureCommunityProfile(raw.communityProfile),
    rewardClaims: Array.isArray(raw.rewardClaims) ? raw.rewardClaims : [],
    assistantMessages: Array.isArray(raw.assistantMessages) ? raw.assistantMessages : [],
    weeklyBoss: raw.weeklyBoss && typeof raw.weeklyBoss === "object" ? raw.weeklyBoss : undefined,
    moodByDate: raw.moodByDate && typeof raw.moodByDate === "object" ? raw.moodByDate : undefined,
    lastDailyReset: typeof raw.lastDailyReset === "string" ? raw.lastDailyReset : undefined,
    dailyDungeon:
      raw.dailyDungeon && typeof raw.dailyDungeon === "object"
        ? (raw.dailyDungeon as any)
        : undefined,
    settings:
      raw.settings && typeof raw.settings === "object"
        ? (raw.settings as any)
        : undefined,
    momentum: normalizeMomentumState(raw.momentum),
  };
}

export const loadFromFirebase = async (userId: string): Promise<AppState | null> => {
  try {
    const ref = doc(db, COLLECTION_NAME, userId);
    const snapshot = await getDoc(ref);
    if (!snapshot.exists()) return null;
    return normalizeAppState(snapshot.data());
  } catch (error) {
    console.error("Failed to load from Firebase:", error);
    return null;
  }
};

const SAVE_DEBOUNCE_MS = 600;

type Resolver = { resolve: () => void; reject: (err: unknown) => void };

type PendingSave = {
  timer?: ReturnType<typeof setTimeout>;
  lastState?: AppState;
  waiting: Resolver[];
  inFlight?: Promise<void>;
};

const pendingByUser = new Map<string, PendingSave>();

async function performSave(userId: string, state: AppState): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return;

  const ref = doc(db, COLLECTION_NAME, userId);
  await setDoc(ref, state);
}

export const saveToFirebase = (userId: string, state: AppState): Promise<void> => {
  return new Promise((resolve, reject) => {
    const entry: PendingSave = pendingByUser.get(userId) ?? { waiting: [] };
    entry.lastState = state;
    entry.waiting.push({ resolve, reject });

    if (entry.timer) clearTimeout(entry.timer);

    entry.timer = setTimeout(async () => {
      entry.timer = undefined;
      const latest = entry.lastState;
      if (!latest) {
        const waiters = entry.waiting.splice(0, entry.waiting.length);
        waiters.forEach((waiter) => waiter.resolve());
        return;
      }

      try {
        if (entry.inFlight) {
          try {
            await entry.inFlight;
          } catch {
            // ignore previous failed save
          }
        }

        entry.inFlight = performSave(userId, latest)
          .catch((err) => {
            console.error("Failed to save to Firebase:", err);
            throw err;
          })
          .finally(() => {
            entry.inFlight = undefined;
          });

        await entry.inFlight;
        const waiters = entry.waiting.splice(0, entry.waiting.length);
        waiters.forEach((waiter) => waiter.resolve());
      } catch (err) {
        const waiters = entry.waiting.splice(0, entry.waiting.length);
        waiters.forEach((waiter) => waiter.reject(err));
      }
    }, SAVE_DEBOUNCE_MS);

    pendingByUser.set(userId, entry);
  });
};
