import { MomentumState, QuestDifficulty } from "../types";
import { toLocalDateKey } from "./date";

export const STREAK_FREEZE_COST = 120;
export const MAX_STREAK_FREEZES = 3;
export const DAILY_QUEST_POINT_BONUS_THRESHOLD = 3;
export const DAILY_QUEST_POINT_BONUS = 24;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isDateKeyString(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function createDefaultMomentumState(): MomentumState {
  return {
    streak: 0,
    bestStreak: 0,
    rewardPoints: 0,
    lifetimeRewardPoints: 0,
    freezeCount: 0,
    freezeUses: [],
    lastActiveDateKey: undefined,
  };
}

export function normalizeMomentumState(raw?: Partial<MomentumState> | null): MomentumState {
  const defaults = createDefaultMomentumState();
  if (!raw || typeof raw !== "object") return defaults;

  const streak = isFiniteNumber(Number(raw.streak)) ? Math.max(0, Math.floor(Number(raw.streak))) : defaults.streak;
  const bestStreakRaw = isFiniteNumber(Number(raw.bestStreak))
    ? Math.max(0, Math.floor(Number(raw.bestStreak)))
    : defaults.bestStreak;
  const rewardPoints = isFiniteNumber(Number(raw.rewardPoints))
    ? Math.max(0, Math.floor(Number(raw.rewardPoints)))
    : defaults.rewardPoints;
  const lifetimeRewardPointsRaw = isFiniteNumber(Number(raw.lifetimeRewardPoints))
    ? Math.max(0, Math.floor(Number(raw.lifetimeRewardPoints)))
    : defaults.lifetimeRewardPoints;

  return {
    streak,
    bestStreak: Math.max(bestStreakRaw, streak),
    rewardPoints,
    lifetimeRewardPoints: Math.max(lifetimeRewardPointsRaw, rewardPoints),
    freezeCount: isFiniteNumber(Number(raw.freezeCount))
      ? Math.min(MAX_STREAK_FREEZES, Math.max(0, Math.floor(Number(raw.freezeCount))))
      : defaults.freezeCount,
    freezeUses: Array.isArray(raw.freezeUses)
      ? raw.freezeUses
          .filter(
            (entry): entry is { dateKey: string; usedAt: string } =>
              !!entry && isDateKeyString(entry.dateKey) && typeof entry.usedAt === "string",
          )
          .slice(-20)
      : defaults.freezeUses,
    lastActiveDateKey: isDateKeyString(raw.lastActiveDateKey)
      ? raw.lastActiveDateKey
      : defaults.lastActiveDateKey,
  };
}

function dateKeyToIndex(key: string): number {
  return new Date(`${key}T12:00:00`).getTime() / (24 * 60 * 60 * 1000);
}

function getDayGap(fromKey: string, toKey: string): number {
  return Math.round(dateKeyToIndex(toKey) - dateKeyToIndex(fromKey));
}

function addDaysToDateKey(key: string, amount: number): string {
  const value = new Date(`${key}T12:00:00`);
  value.setDate(value.getDate() + amount);
  return toLocalDateKey(value);
}

export interface MomentumMaintenanceResult {
  momentum: MomentumState;
  usedFreezeDates: string[];
  streakBroken: boolean;
}

export function applyMomentumDayRollover(
  rawMomentum: MomentumState | undefined,
  todayKey: string,
): MomentumMaintenanceResult {
  const momentum = normalizeMomentumState(rawMomentum);
  const lastActiveDateKey = momentum.lastActiveDateKey;

  if (!lastActiveDateKey) {
    return {
      momentum,
      usedFreezeDates: [],
      streakBroken: false,
    };
  }

  const dayGap = getDayGap(lastActiveDateKey, todayKey);
  if (dayGap <= 1) {
    return {
      momentum,
      usedFreezeDates: [],
      streakBroken: false,
    };
  }

  const missedDays = Math.max(0, dayGap - 1);
  if (missedDays === 0) {
    return {
      momentum,
      usedFreezeDates: [],
      streakBroken: false,
    };
  }

  const usableFreezeCount = Math.min(momentum.freezeCount, missedDays);
  const usedFreezeDates = Array.from({ length: usableFreezeCount }, (_, index) => addDaysToDateKey(lastActiveDateKey, index + 1));

  if (usableFreezeCount === missedDays) {
    const updatedMomentum: MomentumState = {
      ...momentum,
      freezeCount: momentum.freezeCount - usableFreezeCount,
      freezeUses: [
        ...usedFreezeDates.map((dateKey) => ({
          dateKey,
          usedAt: new Date().toISOString(),
        })),
        ...momentum.freezeUses,
      ].slice(0, 20),
      lastActiveDateKey: addDaysToDateKey(todayKey, -1),
    };

    return {
      momentum: updatedMomentum,
      usedFreezeDates,
      streakBroken: false,
    };
  }

  const updatedMomentum: MomentumState = {
    ...momentum,
    streak: 0,
    freezeCount: momentum.freezeCount - usableFreezeCount,
    freezeUses: [
      ...usedFreezeDates.map((dateKey) => ({
        dateKey,
        usedAt: new Date().toISOString(),
      })),
      ...momentum.freezeUses,
    ].slice(0, 20),
    lastActiveDateKey: undefined,
  };

  return {
    momentum: updatedMomentum,
    usedFreezeDates,
    streakBroken: true,
  };
}

export function getQuestRewardPoints(difficulty: QuestDifficulty | string, xpReward?: number): number {
  switch (difficulty) {
    case "easy":
      return 12;
    case "normal":
      return 20;
    case "hard":
      return 32;
    default:
      return Math.max(10, Math.round(Number(xpReward ?? 0) * 0.6) || 10);
  }
}

export interface QuestMomentumResult {
  momentum: MomentumState;
  streakAdvanced: boolean;
  pointsEarned: number;
  dailyBonusAwarded: boolean;
}

export function registerQuestCompletion(args: {
  momentum: MomentumState | undefined;
  todayKey: string;
  difficulty: QuestDifficulty | string;
  xpReward?: number;
  completedTodayCountAfter: number;
}): QuestMomentumResult {
  const baseMomentum = normalizeMomentumState(args.momentum);
  const pointReward = getQuestRewardPoints(args.difficulty, args.xpReward);
  const dailyBonusAwarded = args.completedTodayCountAfter === DAILY_QUEST_POINT_BONUS_THRESHOLD;
  const pointsEarned = pointReward + (dailyBonusAwarded ? DAILY_QUEST_POINT_BONUS : 0);

  let nextMomentum = baseMomentum;
  let streakAdvanced = false;

  if (nextMomentum.lastActiveDateKey !== args.todayKey) {
    if (!nextMomentum.lastActiveDateKey) {
      nextMomentum = {
        ...nextMomentum,
        streak: 1,
        bestStreak: Math.max(nextMomentum.bestStreak, 1),
        lastActiveDateKey: args.todayKey,
      };
    } else {
      const dayGap = getDayGap(nextMomentum.lastActiveDateKey, args.todayKey);
      const nextStreak = dayGap === 1 ? nextMomentum.streak + 1 : 1;
      nextMomentum = {
        ...nextMomentum,
        streak: nextStreak,
        bestStreak: Math.max(nextMomentum.bestStreak, nextStreak),
        lastActiveDateKey: args.todayKey,
      };
    }
    streakAdvanced = true;
  }

  nextMomentum = {
    ...nextMomentum,
    rewardPoints: nextMomentum.rewardPoints + pointsEarned,
    lifetimeRewardPoints: nextMomentum.lifetimeRewardPoints + pointsEarned,
  };

  return {
    momentum: nextMomentum,
    streakAdvanced,
    pointsEarned,
    dailyBonusAwarded,
  };
}

export interface PurchaseFreezeResult {
  ok: boolean;
  momentum: MomentumState;
  reason?: "insufficient-points" | "inventory-full";
}

export function purchaseStreakFreeze(rawMomentum: MomentumState | undefined): PurchaseFreezeResult {
  const momentum = normalizeMomentumState(rawMomentum);

  if (momentum.freezeCount >= MAX_STREAK_FREEZES) {
    return {
      ok: false,
      momentum,
      reason: "inventory-full",
    };
  }

  if (momentum.rewardPoints < STREAK_FREEZE_COST) {
    return {
      ok: false,
      momentum,
      reason: "insufficient-points",
    };
  }

  return {
    ok: true,
    momentum: {
      ...momentum,
      rewardPoints: momentum.rewardPoints - STREAK_FREEZE_COST,
      freezeCount: momentum.freezeCount + 1,
    },
  };
}
