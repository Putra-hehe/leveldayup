import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { AppState, Badge, DailyChallenge, DailyDungeon, FocusSession, Habit, Quest, WeeklyBoss } from "../types";
import { ensureCommunityProfile } from "../utils/communityTrust";
import { createId } from "../utils/id";
import { mockBadges } from "../utils/mockData";
import { getWeeklyBossTemplate } from "../utils/bosses";
import {
  loadFromFirebase,
  loadFromStorage,
  saveToFirebase,
  saveToStorage,
} from "../utils/storage";
import {
  getLocalWeekKey,
  isoToLocalDateKey,
  makeDueDateISO,
  toLocalDateKey,
} from "../utils/date";
import {
  applyMomentumDayRollover,
  normalizeMomentumState,
  registerQuestCompletion,
} from "../utils/momentum";
import { calculateLevel, calculateXPForLevel } from "../utils/xp";

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

function mergeBadges(savedBadges?: Badge[]): Badge[] {
  if (!savedBadges?.length) return mockBadges;

  const merged = mockBadges.map((template) => {
    const saved = savedBadges.find(
      (badge) => badge.id === template.id || badge.name === template.name,
    );
    return saved ? { ...template, ...saved } : template;
  });

  const legacyOnly = savedBadges.filter(
    (badge) => !merged.some((existing) => existing.id === badge.id || existing.name === badge.name),
  );

  return [...merged, ...legacyOnly];
}

function normalizeAppDefaults(state: AppState): AppState {
  return {
    ...state,
    currentPage: state.currentPage === "calendar" ? "planner" : state.currentPage,
    badges: mergeBadges(state.badges),
    reminders: Array.isArray(state.reminders) ? state.reminders : [],
    scheduleItems: Array.isArray(state.scheduleItems) ? state.scheduleItems : [],
    communityMessages: Array.isArray(state.communityMessages) ? state.communityMessages : [],
    communityProfile: ensureCommunityProfile(state.communityProfile),
    rewardClaims: Array.isArray(state.rewardClaims) ? state.rewardClaims : [],
    assistantMessages: Array.isArray(state.assistantMessages) ? state.assistantMessages : [],
    settings: {
      dailyDungeonFocusMinMinutes: 25,
      ...(state.settings ?? {}),
    },
    momentum: normalizeMomentumState(state.momentum),
  };
}

function uniqueLocalDateKeys(dates: string[]) {
  return Array.from(
    new Set(
      dates
        .map((value) => isoToLocalDateKey(value))
        .filter((value): value is string => typeof value === "string"),
    ),
  ).sort();
}

function dateKeyToIndex(key: string): number {
  return new Date(`${key}T12:00:00`).getTime() / (24 * 60 * 60 * 1000);
}

function calculateDailyStreakMetrics(dateKeys: string[]) {
  if (!dateKeys.length) return { currentStreak: 0, longestStreak: 0 };

  const sorted = [...dateKeys].sort((a, b) => a.localeCompare(b));
  const todayIndex = dateKeyToIndex(toLocalDateKey(new Date()));
  let longest = 1;
  let run = 1;

  for (let index = 1; index < sorted.length; index += 1) {
    const prev = dateKeyToIndex(sorted[index - 1]);
    const current = dateKeyToIndex(sorted[index]);
    if (current - prev === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else if (current !== prev) {
      run = 1;
    }
  }

  const lastIndex = dateKeyToIndex(sorted[sorted.length - 1]);
  const daysSinceLastCompletion = todayIndex - lastIndex;

  let currentStreak = 0;
  if (daysSinceLastCompletion <= 1) {
    currentStreak = 1;
    for (let index = sorted.length - 1; index > 0; index -= 1) {
      const current = dateKeyToIndex(sorted[index]);
      const prev = dateKeyToIndex(sorted[index - 1]);
      if (current - prev === 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak: longest };
}

const QUEST_BOSS_DAMAGE: Record<Quest["difficulty"], number> = {
  easy: 45,
  normal: 75,
  hard: 115,
};

function calculateBossDamageFromQuest(quest: Pick<Quest, "difficulty" | "isWeekly">): number {
  const baseDamage = QUEST_BOSS_DAMAGE[quest.difficulty] ?? QUEST_BOSS_DAMAGE.normal;
  return quest.isWeekly ? Math.round(baseDamage * 1.3) : baseDamage;
}

function calculateHabitMetrics(habit: Habit, completedDates: string[]) {
  if (habit.frequency !== "daily") {
    const unique = uniqueLocalDateKeys(completedDates);
    return {
      currentStreak: unique.length,
      longestStreak: Math.max(habit.longestStreak, unique.length),
    };
  }

  return calculateDailyStreakMetrics(uniqueLocalDateKeys(completedDates));
}

export function useLeveldayState(initialState: AppState) {
  const [appState, setAppState] = useState<AppState>(normalizeAppDefaults(initialState));
  const [remoteReadyUserId, setRemoteReadyUserId] = useState<string | null>(null);
  const lastSavedSnapshotRef = useRef<string | null>(null);
  const appStateRef = useRef(appState);
  appStateRef.current = appState;

  const userId = appState.user?.id;

  const normalizeWeeklyBoss = (boss?: WeeklyBoss): WeeklyBoss | undefined => {
    if (!boss) return undefined;

    const currentWeekKey = getLocalWeekKey(new Date());
    const maxHP = Number((boss as any).maxHP);
    const damage = Number((boss as any).damage);

    const safeMaxHP = Number.isFinite(maxHP) && maxHP > 0 ? maxHP : 0;
    const safeDamageRaw = Number.isFinite(damage) && damage > 0 ? damage : 0;
    const safeDamage = safeMaxHP > 0 ? Math.min(safeDamageRaw, safeMaxHP) : 0;

    const normalized: WeeklyBoss = {
      ...boss,
      maxHP: safeMaxHP,
      damage: safeDamage,
    };

    if (normalized.weekKey === currentWeekKey) return normalized;

    return {
      ...normalized,
      weekKey: currentWeekKey,
      damage: 0,
      defeatedAt: undefined,
    };
  };

  const maybeWeeklyRollover = () => {
    setAppState((prev) => {
      if (!prev.user || !prev.weeklyBoss) return prev;

      const normalized = normalizeWeeklyBoss(prev.weeklyBoss);
      if (!normalized) return prev;
      if (normalized.weekKey === prev.weeklyBoss.weekKey) return prev;

      return { ...prev, weeklyBoss: normalized };
    });
  };

  const generateDailyDungeon = (state: AppState): DailyDungeon => {
    const todayKey = toLocalDateKey(new Date());

    const actionableQuests = shuffle(
      state.quests.filter((quest) => {
        if (quest.status === "completed") return false;
        const dueKey = isoToLocalDateKey(quest.dueDate);
        const actionableDueDate = !!dueKey && dueKey <= todayKey;
        return !!quest.isDaily || !!quest.isWeekly || actionableDueDate;
      }),
    ).slice(0, 2);

    const actionableHabits = shuffle(
      state.habits.filter((habit) => {
        const today = new Date();
        const localDay = today.getDay();
        const dueToday =
          habit.frequency === "daily" ||
          (habit.frequency === "custom" && Array.isArray(habit.customDays)
            ? habit.customDays.includes(localDay)
            : habit.frequency === "weekly");

        if (!dueToday) return false;

        return !habit.completedDates.some((date) => isoToLocalDateKey(date) === todayKey);
      }),
    ).slice(0, 2);

    const challenges: DailyChallenge[] = [
      ...actionableQuests.map((quest) => ({
        id: createId("ddq"),
        type: "quest" as const,
        refId: quest.id,
        status: "pending" as const,
        titleSnapshot: quest.title,
      })),
      ...actionableHabits.map((habit) => ({
        id: createId("ddh"),
        type: "habit" as const,
        refId: habit.id,
        status: "pending" as const,
        titleSnapshot: habit.title,
      })),
    ];

    const bossLinkedFocusTitle = state.weeklyBoss?.goalTitle
      ? `Focus sprint on: ${state.weeklyBoss.goalTitle}`
      : "Complete one focus sprint";

    challenges.push({
      id: createId("ddf"),
      type: "focus",
      refId: null,
      status: "pending",
      titleSnapshot: bossLinkedFocusTitle,
    });

    while (challenges.length < 3) {
      challenges.push({
        id: createId("ddf"),
        type: "focus",
        refId: null,
        status: "pending",
        titleSnapshot: challenges.length === 1 ? "Protect one deep-work block" : "Return for one more short focus block",
      });
    }

    const trimmedChallenges = challenges.slice(0, 5);
    const clearXp = 30 + trimmedChallenges.length * 10;
    const partialXp = Math.max(20, Math.round(clearXp * 0.45));

    return {
      dateKey: todayKey,
      challenges: trimmedChallenges,
      rewardClaimed: false,
      createdAt: Date.now(),
      reward: {
        clearXp,
        partialXp,
      },
    };
  };

  const applyDailyResetIfNeeded = (state: AppState, todayKey: string, now: Date): AppState => {
    if (state.lastDailyReset === todayKey) return state;

    return {
      ...state,
      quests: state.quests.map((quest) => {
        if (!quest.isDaily) return quest;
        return {
          ...quest,
          status: "pending" as const,
          completedAt: undefined,
          dueDate: makeDueDateISO(now),
          subtasks: quest.subtasks.map((subtask) => ({ ...subtask, completed: false })),
        };
      }),
      lastDailyReset: todayKey,
    };
  };

  const buildDailyMaintenanceState = (state: AppState, now: Date) => {
    if (!state.user) return null;

    const todayKey = toLocalDateKey(now);
    let nextState = applyDailyResetIfNeeded(state, todayKey, now);
    let changed = nextState !== state;

    const currentMomentum = normalizeMomentumState(nextState.momentum);
    const momentumMaintenance = applyMomentumDayRollover(currentMomentum, todayKey);
    if (JSON.stringify(currentMomentum) !== JSON.stringify(momentumMaintenance.momentum)) {
      nextState = {
        ...nextState,
        momentum: momentumMaintenance.momentum,
      };
      changed = true;
    }

    if (nextState.dailyDungeon?.dateKey !== todayKey) {
      nextState = {
        ...nextState,
        dailyDungeon: generateDailyDungeon(nextState),
      };
      changed = true;
    }

    return {
      nextState,
      changed,
      usedFreezeDates: momentumMaintenance.usedFreezeDates,
      streakBroken: momentumMaintenance.streakBroken,
    };
  };

  const runDailyMaintenance = () => {
    const now = new Date();
    const preview = buildDailyMaintenanceState(appStateRef.current, now);
    if (!preview || !preview.changed) return;

    setAppState((prev) => {
      const next = buildDailyMaintenanceState(prev, now);
      return next?.changed ? next.nextState : prev;
    });

    if (preview.usedFreezeDates.length && !preview.streakBroken) {
      toast.info("Streak freeze aktif", {
        description:
          preview.usedFreezeDates.length === 1
            ? `Streak diselamatkan untuk ${preview.usedFreezeDates[0]}.`
            : `Streak diselamatkan untuk ${preview.usedFreezeDates.length} hari yang terlewat.`,
      });
      return;
    }

    if (preview.streakBroken) {
      toast.error("Streak terputus", {
        description: preview.usedFreezeDates.length
          ? "Sebagian freeze terpakai, tapi jumlah hari yang terlewat masih terlalu banyak."
          : "Selesaikan satu quest hari ini untuk memulai streak baru.",
      });
    }
  };

  const buildQuestCompletionState = (state: AppState, questId: string, now: Date) => {
    if (!state.user) return null;

    const todayKey = toLocalDateKey(now);
    const baseState = applyDailyResetIfNeeded(state, todayKey, now);
    const targetQuest = baseState.quests.find((item) => item.id === questId);
    if (!targetQuest || targetQuest.status === "completed") return null;

    const updatedQuests = baseState.quests.map((item) =>
      item.id === questId
        ? { ...item, status: "completed" as const, completedAt: now.toISOString() }
        : item,
    );

    let updatedDungeon = baseState.dailyDungeon;
    if (updatedDungeon && updatedDungeon.dateKey === todayKey) {
      updatedDungeon = {
        ...updatedDungeon,
        challenges: updatedDungeon.challenges.map((challenge) =>
          challenge.type === "quest" && challenge.refId === questId && challenge.status !== "completed"
            ? { ...challenge, status: "completed", completedAt: Date.now() }
            : challenge,
        ),
      };
    }

    const completedTodayCount = updatedQuests.filter(
      (item) => item.status === "completed" && isoToLocalDateKey(item.completedAt) === todayKey,
    ).length;
    const momentumAfterMaintenance = applyMomentumDayRollover(baseState.momentum, todayKey).momentum;
    const momentumResult = registerQuestCompletion({
      momentum: momentumAfterMaintenance,
      todayKey,
      difficulty: targetQuest.difficulty,
      xpReward: targetQuest.xpReward,
      completedTodayCountAfter: completedTodayCount,
    });

    let updatedWeeklyBoss = normalizeWeeklyBoss(baseState.weeklyBoss);
    let bossDamage = 0;
    let bossDefeatedNow = false;

    if (updatedWeeklyBoss && !updatedWeeklyBoss.defeatedAt && updatedWeeklyBoss.maxHP > 0) {
      bossDamage = calculateBossDamageFromQuest(targetQuest);
      const nextDamage = Math.min(updatedWeeklyBoss.maxHP, updatedWeeklyBoss.damage + bossDamage);
      bossDefeatedNow = nextDamage >= updatedWeeklyBoss.maxHP;
      updatedWeeklyBoss = {
        ...updatedWeeklyBoss,
        damage: nextDamage,
        defeatedAt: bossDefeatedNow ? now.toISOString() : updatedWeeklyBoss.defeatedAt,
      };
    }

    return {
      nextState: {
        ...baseState,
        quests: updatedQuests,
        dailyDungeon: updatedDungeon,
        momentum: momentumResult.momentum,
        weeklyBoss: updatedWeeklyBoss,
      } satisfies AppState,
      xpReward: Number((targetQuest as any).xpReward ?? 0),
      pointsEarned: momentumResult.pointsEarned,
      dailyBonusAwarded: momentumResult.dailyBonusAwarded,
      bossDamage,
      bossDefeatedNow,
      bossName: updatedWeeklyBoss?.bossName,
      questTitle: targetQuest.title,
    };
  };

  useEffect(() => {
    const savedState = loadFromStorage();
    if (!savedState) return;

    const normalized = normalizeAppDefaults(savedState);
    setAppState((prev) => ({
      ...normalized,
      weeklyBoss: normalizeWeeklyBoss(normalized.weeklyBoss),
      currentPage: prev.currentPage !== "landing" ? prev.currentPage : normalized.currentPage,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchRemoteState() {
      if (!userId) {
        setRemoteReadyUserId(null);
        return;
      }

      setRemoteReadyUserId(null);
      const remoteState = await loadFromFirebase(userId);
      if (cancelled) return;

      if (remoteState) {
        const normalized = normalizeAppDefaults(remoteState);

        setAppState((prev) => {
          if (!prev.user || prev.user.id !== userId) return prev;

          return {
            ...normalized,
            weeklyBoss: normalizeWeeklyBoss(normalized.weeklyBoss),
            currentPage: prev.currentPage,
            isOnboarded: normalized.isOnboarded,
          };
        });
      }

      setRemoteReadyUserId(userId);
    }

    fetchRemoteState();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!appState.user) return;

    saveToStorage(appState);

    if (remoteReadyUserId !== appState.user.id) return;

    const snapshot = JSON.stringify(appState);
    if (lastSavedSnapshotRef.current === snapshot) return;
    lastSavedSnapshotRef.current = snapshot;

    saveToFirebase(appState.user.id, appState).catch((error) => {
      console.error("Failed to sync app state:", error);
    });
  }, [appState, remoteReadyUserId]);

  useEffect(() => {
    if (!userId) return;

    runDailyMaintenance();
    maybeWeeklyRollover();

    const onFocus = () => {
      runDailyMaintenance();
      maybeWeeklyRollover();
    };
    const onVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        runDailyMaintenance();
        maybeWeeklyRollover();
      }
    };

    const intervalId = typeof window !== "undefined"
      ? window.setInterval(() => {
          runDailyMaintenance();
          maybeWeeklyRollover();
        }, 60_000)
      : undefined;

    if (typeof window !== "undefined") window.addEventListener("focus", onFocus);
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibility);
    }

    return () => {
      if (typeof intervalId === "number") window.clearInterval(intervalId);
      if (typeof window !== "undefined") window.removeEventListener("focus", onFocus);
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibility);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const checkAndUnlockBadges = (state: AppState): Badge[] => {
    return state.badges.map((badge) => {
      if (!badge.isLocked || !state.user) return badge;

      const completedQuestsCount = state.quests.filter((quest) => quest.status === "completed").length;
      const completedFocusSessions = state.focusSessions.filter((session) => session.completed).length;
      const dungeonCleared =
        !!state.dailyDungeon?.rewardClaimed &&
        state.dailyDungeon.challenges.every((challenge) => challenge.status === "completed");
      const defeatedWeeklyBoss = !!state.weeklyBoss?.defeatedAt;
      const bestHabitStreak = state.habits.reduce(
        (best, habit) => Math.max(best, habit.longestStreak),
        0,
      );
      const bestMomentumStreak = Math.max(
        state.momentum?.streak ?? 0,
        state.momentum?.bestStreak ?? 0,
      );
      const bestStreak = Math.max(bestHabitStreak, bestMomentumStreak);

      let unlock = false;
      const requirement = badge.requirement?.toLowerCase() || "";

      if (requirement.includes("complete 1 quest") && completedQuestsCount >= 1) unlock = true;
      else if (requirement.includes("3-day streak") && bestStreak >= 3) unlock = true;
      else if (requirement.includes("clear 1 daily dungeon") && dungeonCleared) unlock = true;
      else if (requirement.includes("defeat 1 weekly boss") && defeatedWeeklyBoss) unlock = true;
      else if (requirement.includes("25 quests") && completedQuestsCount >= 25) unlock = true;
      else if (requirement.includes("40 focus sessions") && completedFocusSessions >= 40) unlock = true;
      else if (requirement.includes("level 10") && state.user.level >= 10) unlock = true;

      if (!unlock) return badge;

      toast.success(`🏆 Badge Unlocked: ${badge.name}!`);
      return { ...badge, isLocked: false, unlockedAt: new Date().toISOString() };
    });
  };

  const addXP = (xpToAdd: number, reason: string) => {
    const safeXP = Number(xpToAdd);
    if (!Number.isFinite(safeXP)) {
      console.error("addXP called with invalid xpToAdd:", xpToAdd, { reason });
      toast.error("System Error", {
        description: "XP value is invalid. Please try again.",
      });
      return;
    }
    if (safeXP <= 0) return;

    setAppState((prev) => {
      if (!prev.user) return prev;

      const prevTotalXP = Number((prev.user as any).totalXP ?? 0);
      const safePrevTotalXP = Number.isFinite(prevTotalXP) && prevTotalXP >= 0 ? prevTotalXP : 0;

      const prevLevelRaw = Number((prev.user as any).level ?? 1);
      const safePrevLevel =
        Number.isFinite(prevLevelRaw) && prevLevelRaw > 0
          ? prevLevelRaw
          : calculateLevel(safePrevTotalXP);

      const newTotalXP = safePrevTotalXP + safeXP;
      const newLevel = calculateLevel(newTotalXP);
      const leveledUp = newLevel > safePrevLevel;

      let xpForCurrentLevel = 0;
      for (let level = 1; level < newLevel; level += 1) {
        xpForCurrentLevel += calculateXPForLevel(level);
      }
      const currentXP = newTotalXP - xpForCurrentLevel;
      const xpToNextLevel = calculateXPForLevel(newLevel);

      if (leveledUp) {
        toast.success(`🎉 Level Up! You're now Level ${newLevel}!`, {
          description: `You earned ${safeXP} XP`,
        });
      } else {
        toast.success(`${reason}! +${safeXP} XP`, {
          description: `${xpToNextLevel - currentXP} XP until Level ${newLevel + 1}`,
        });
      }

      const updatedUser = {
        ...prev.user,
        xp: currentXP,
        xpToNextLevel,
        level: newLevel,
        totalXP: newTotalXP,
      };

      const nextState: AppState = { ...prev, user: updatedUser };
      return { ...nextState, badges: checkAndUnlockBadges(nextState) };
    });
  };

  const selectWeeklyBoss = (
    selection:
      | string
      | {
          bossId: string;
          goalTitle?: string;
          goalSummary?: string;
          rewardLabel?: string;
        },
  ) => {
    const bossId = typeof selection === "string" ? selection : selection.bossId;
    const template = getWeeklyBossTemplate(bossId);
    if (!template) return;

    const weekKey = getLocalWeekKey(new Date());
    const nextBoss: WeeklyBoss = {
      weekKey,
      bossId: template.id,
      bossName: template.name,
      maxHP: template.maxHP,
      damage: 0,
      selectedAt: new Date().toISOString(),
      defeatedAt: undefined,
      goalTitle: typeof selection === "string" ? undefined : selection.goalTitle?.trim() || undefined,
      goalSummary:
        typeof selection === "string" ? undefined : selection.goalSummary?.trim() || undefined,
      rewardLabel:
        typeof selection === "string" ? undefined : selection.rewardLabel?.trim() || undefined,
    };

    setAppState((prev) => {
      if (!prev.user) return prev;
      return { ...prev, weeklyBoss: nextBoss, dailyDungeon: generateDailyDungeon({ ...prev, weeklyBoss: nextBoss }) };
    });

    toast.success(
      nextBoss.goalTitle
        ? `Weekly Boss ready: ${nextBoss.goalTitle}`
        : `Weekly Boss selected: ${template.name}`,
    );
  };

  const completeQuest = (questId: string) => {
    const now = new Date();
    const preview = buildQuestCompletionState(appState, questId, now);
    if (!preview) return;

    setAppState((prev) => {
      const next = buildQuestCompletionState(prev, questId, now);
      return next ? next.nextState : prev;
    });

    addXP(preview.xpReward, "Quest complete");

    if (preview.bossDamage > 0 && preview.bossName) {
      toast.success(`⚔️ ${preview.questTitle} menyerang ${preview.bossName}`, {
        description: `Boss mingguan menerima ${preview.bossDamage} damage dari quest yang selesai.`,
      });
    }

    if (preview.bossDefeatedNow && preview.bossName) {
      toast.success(`🏆 ${preview.bossName} dikalahkan`, {
        description: "Minggu ini ditutup dengan clear target utama.",
      });
    }

    if (preview.pointsEarned > 0) {
      toast.success(`+${preview.pointsEarned} reward points`, {
        description: preview.dailyBonusAwarded
          ? "Daily combo tercapai. Bonus poin masuk ke wallet momentum."
          : "Poin ini bisa dipakai untuk beli streak freeze.",
      });
    }
  };

  const toggleHabit = (habitId: string) => {
    const todayKey = toLocalDateKey(new Date());
    const habit = appState.habits.find((item) => item.id === habitId);
    if (!habit) return;

    const isCompletedToday = habit.completedDates.some((date) => isoToLocalDateKey(date) === todayKey);
    const alreadyAwardedToday = (habit.xpAwardedDates ?? []).includes(todayKey);

    setAppState((prev) => {
      const targetHabit = prev.habits.find((item) => item.id === habitId);
      if (!targetHabit) return prev;

      const updatedCompletionDates = isCompletedToday
        ? targetHabit.completedDates.filter((date) => isoToLocalDateKey(date) !== todayKey)
        : [...targetHabit.completedDates, new Date().toISOString()];

      const metrics = calculateHabitMetrics(targetHabit, updatedCompletionDates);
      const nextAwardedDates = isCompletedToday
        ? targetHabit.xpAwardedDates ?? []
        : alreadyAwardedToday
          ? targetHabit.xpAwardedDates ?? []
          : Array.from(new Set([...(targetHabit.xpAwardedDates ?? []), todayKey]));

      const updatedHabits = prev.habits.map((item) =>
        item.id === habitId
          ? {
              ...item,
              completedDates: updatedCompletionDates,
              xpAwardedDates: nextAwardedDates,
              currentStreak: metrics.currentStreak,
              longestStreak: Math.max(item.longestStreak, metrics.longestStreak),
            }
          : item,
      );

      let updatedDungeon = prev.dailyDungeon;
      if (updatedDungeon && updatedDungeon.dateKey === todayKey) {
        updatedDungeon = {
          ...updatedDungeon,
          challenges: updatedDungeon.challenges.map((challenge) =>
            challenge.type === "habit" && challenge.refId === habitId
              ? isCompletedToday
                ? { ...challenge, status: "pending", completedAt: undefined }
                : challenge.status !== "completed"
                  ? { ...challenge, status: "completed", completedAt: Date.now() }
                  : challenge
              : challenge,
          ),
        };
      }

      return { ...prev, habits: updatedHabits, dailyDungeon: updatedDungeon };
    });

    if (isCompletedToday) {
      toast.info("Habit unmarked", {
        description: "XP hari ini tidak dihapus, tapi juga tidak bisa difarm ulang.",
      });
      return;
    }

    if (alreadyAwardedToday) {
      toast.success("Habit checked", {
        description: "Progress tercatat. XP untuk habit ini hari ini sudah pernah diberikan.",
      });
      return;
    }

    addXP(Number((habit as any).xpPerCompletion ?? 0), "Habit complete");
  };

  const completeFocusSession = (session: FocusSession) => {
    if (!session.completed) return;

    const focusMin = appState.settings?.dailyDungeonFocusMinMinutes ?? 25;
    setAppState((prev) => {
      let updatedDungeon = prev.dailyDungeon;
      const todayKey = toLocalDateKey(new Date());

      if (
        updatedDungeon &&
        updatedDungeon.dateKey === todayKey &&
        Number(session.duration) >= focusMin
      ) {
        const index = updatedDungeon.challenges.findIndex(
          (challenge) => challenge.type === "focus" && challenge.status === "pending",
        );

        if (index >= 0) {
          updatedDungeon = {
            ...updatedDungeon,
            challenges: updatedDungeon.challenges.map((challenge, challengeIndex) =>
              challengeIndex === index
                ? { ...challenge, status: "completed", completedAt: Date.now() }
                : challenge,
            ),
          };
        }
      }

      return {
        ...prev,
        focusSessions: [...prev.focusSessions, session],
        dailyDungeon: updatedDungeon,
      };
    });

    addXP(Number((session as any).xpEarned ?? 0), "Focus session complete");
  };

  const claimDailyDungeonReward = () => {
    const todayKey = toLocalDateKey(new Date());
    const dungeon = appState.dailyDungeon;
    if (!dungeon || dungeon.rewardClaimed || dungeon.dateKey !== todayKey) return;

    const completedCount = dungeon.challenges.filter((challenge) => challenge.status === "completed").length;
    const totalChallenges = dungeon.challenges.length;
    const requiredPartial = Math.ceil(totalChallenges * 0.4);

    let reward = 0;
    let status: "clear" | "partial" | "none" = "none";
    if (completedCount === totalChallenges) {
      reward = dungeon.reward.clearXp;
      status = "clear";
    } else if (completedCount >= requiredPartial) {
      reward = dungeon.reward.partialXp;
      status = "partial";
    }

    if (reward <= 0) {
      toast.info("Reward unavailable", {
        description: "Complete enough challenges to qualify for a reward.",
      });
      return;
    }

    setAppState((prev) => {
      if (!prev.dailyDungeon) return prev;
      return {
        ...prev,
        dailyDungeon: {
          ...prev.dailyDungeon,
          rewardClaimed: true,
          rewardClaimedAt: Date.now(),
        },
      };
    });

    addXP(reward, "Daily Dungeon reward");
    toast.success(
      status === "clear"
        ? `Daily Dungeon cleared! +${reward} XP`
        : `Daily Dungeon reward claimed: +${reward} XP`,
      {
        description:
          status === "clear"
            ? "Full clear. The System counts that as a real win."
            : "Partial progress still counts. Keep the loop alive.",
      },
    );
  };

  const setDailyDungeonFocusMinMinutes = (minutes: 15 | 25) => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...(prev.settings ?? {}),
        dailyDungeonFocusMinMinutes: minutes,
      },
    }));
  };

  return {
    appState,
    setAppState,
    completeQuest,
    toggleHabit,
    completeFocusSession,
    checkAndUnlockBadges,
    selectWeeklyBoss,
    claimDailyDungeonReward,
    setDailyDungeonFocusMinMinutes,
  };
}
