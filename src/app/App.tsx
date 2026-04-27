import { SpeedInsights } from "@vercel/speed-insights/react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Toaster, toast } from "sonner";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import {
  AssistantMessage,
  Badge,
  CommunityChannel,
  CommunityReportReason,
  FocusSession,
  Habit,
  Quest,
  Reminder,
  RewardProgress,
  ScheduleItem,
  User,
  UserClass,
  LeaderboardEntry,
} from "./types";
import { useLeveldayState } from "./hooks/useLeveldayState";
import { auth } from "./firebase";
import { createId } from "./utils/id";
import { generateSmartQuest } from "./utils/ai";
import { createMockUser, createStarterHabits, createStarterQuests, mockBadges } from "./utils/mockData";
import { clearStorage, loadFromFirebase } from "./utils/storage";
import { getGoalTrackMeta } from "./utils/product";
import { getXPForDifficulty } from "./utils/xp";
import { getLocalWeekKey, isoToLocalDateKey, makeDueDateISO, toLocalDateKey } from "./utils/date";
import { createStarterAssistantMessages, generateAssistantReply } from "./utils/assistant";
import { AIDayDraft, createStarterReminders, createStarterSchedule, generateAISchedule, PlanningMode } from "./utils/planner";
import { createCommunityAutoReply, createStarterCommunityMessages, loadLeaderboardEntries } from "./utils/social";
import { getWeeklyBossTemplate } from "./utils/bosses";
import { buildCommunityPostingPolicy, createDefaultCommunityProfile, deriveCommunityTrustSummary, ensureCommunityProfile, moderateCommunityDraft } from "./utils/communityTrust";

import { buildRewardClaimRecord } from "./utils/rewards";
import { createDefaultMomentumState, purchaseStreakFreeze } from "./utils/momentum";

import { LandingPage } from "./pages/LandingPage";
import { AuthPage } from "./pages/AuthPage";
import { OnboardingPage, OnboardingSelection } from "./pages/OnboardingPage";
import { Dashboard } from "./pages/Dashboard";
import { QuestsPage } from "./pages/QuestsPage";
import { HabitsPage } from "./pages/HabitsPage";
import { FocusSessionPage } from "./pages/FocusSessionPage";
import { RewardsPage } from "./pages/RewardsPage";
import { StatsPage } from "./pages/StatsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { DailyDungeonPage } from "./pages/DailyDungeonPage";
import { CommunityPage } from "./pages/CommunityPage";
import { LeaderboardPage } from "./pages/LeaderboardPage";

import { AppSidebar } from "./components/AppSidebar";
import { BadgeDetailDialog } from "./components/BadgeDetailDialog";
import { BrandMark } from "./components/BrandMark";
import { CommandPalette } from "./components/CommandPalette";
import { HabitCreateDialog } from "./components/HabitCreateDialog";
import { MobileNav } from "./components/MobileNav";
import { QuestCreateDialog } from "./components/QuestCreateDialog";
import { QuestDetailDialog } from "./components/QuestDetailDialog";

function normalizePage(page: string) {
  return page === "calendar" ? "planner" : page;
}

function buildExperienceSeed(user: User) {
  const todayKey = toLocalDateKey(new Date());
  return {
    reminders: createStarterReminders(user.goalTrack || "assignments", todayKey),
    scheduleItems: createStarterSchedule(todayKey, user.goalTrack || "assignments"),
    communityMessages: createStarterCommunityMessages(user),
    assistantMessages: createStarterAssistantMessages(user.name),
  };
}

export default function App() {
  const {
    appState,
    setAppState,
    completeQuest,
    toggleHabit,
    completeFocusSession,
    selectWeeklyBoss,
    claimDailyDungeonReward,
    setDailyDungeonFocusMinMinutes,
  } = useLeveldayState({
    user: null,
    quests: [],
    habits: [],
    focusSessions: [],
    badges: mockBadges,
    currentPage: "landing",
    isOnboarded: false,
    reminders: [],
    scheduleItems: [],
    communityMessages: [],
    communityProfile: createDefaultCommunityProfile(),
    rewardClaims: [],
    assistantMessages: [],
    momentum: createDefaultMomentumState(),
  });

  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [questDialogOpen, setQuestDialogOpen] = useState(false);
  const [newQuestDialogOpen, setNewQuestDialogOpen] = useState(false);
  const [newHabitDialogOpen, setNewHabitDialogOpen] = useState(false);
  const [newQuestDefaultDueDate, setNewQuestDefaultDueDate] = useState<string | undefined>(undefined);
  const [commandOpen, setCommandOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
  const [badgeDialogOpen, setBadgeDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pendingAuth, setPendingAuth] = useState<{ uid: string; name: string; email: string } | null>(null);

  const [leaderboards, setLeaderboards] = useState<{ global: LeaderboardEntry[]; friends: LeaderboardEntry[] }>({ global: [], friends: [] });
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [assistantLoading, setAssistantLoading] = useState(false);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setPendingAuth(null);
        return;
      }

      if (appState.user?.id === firebaseUser.uid) return;

      const remoteState = await loadFromFirebase(firebaseUser.uid);
      if (remoteState?.user) {
        setPendingAuth(null);
        setAppState({
          ...remoteState,
          currentPage: remoteState.currentPage && remoteState.currentPage !== "landing" ? remoteState.currentPage : "dashboard",
          isOnboarded: true,
          communityProfile: ensureCommunityProfile(remoteState.communityProfile),
          rewardClaims: remoteState.rewardClaims ?? [],
        });
        return;
      }

      const fallbackName = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Hero";
      setPendingAuth({
        uid: firebaseUser.uid,
        name: fallbackName,
        email: firebaseUser.email || "",
      });
      setAppState((prev) => ({
        ...prev,
        currentPage: prev.isOnboarded ? prev.currentPage : "onboarding",
      }));
    });

    return () => unsubscribe();
  }, [appState.user?.id, setAppState]);

  useEffect(() => {
    let cancelled = false;

    async function syncLeaderboard() {
      if (!appState.user) {
        if (!cancelled) {
          setLeaderboards({ global: [], friends: [] });
          setLeaderboardLoading(false);
        }
        return;
      }

      if (!cancelled) setLeaderboardLoading(true);
      const next = await loadLeaderboardEntries(appState.user, appState.habits, appState.focusSessions, appState.momentum);
      if (!cancelled) {
        setLeaderboards(next);
        setLeaderboardLoading(false);
      }
    }

    void syncLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [appState.user, appState.habits, appState.focusSessions, appState.momentum]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!appState.user) return;

    setAppState((prev) => {
      if (!prev.user) return prev;
      const seeded = buildExperienceSeed(prev.user);
      const next = {
        ...prev,
        reminders: prev.reminders.length ? prev.reminders : seeded.reminders,
        scheduleItems: prev.scheduleItems.length ? prev.scheduleItems : seeded.scheduleItems,
        communityMessages: prev.communityMessages.length ? prev.communityMessages : seeded.communityMessages,
        assistantMessages: prev.assistantMessages.length ? prev.assistantMessages : seeded.assistantMessages,
      };

      const changed =
        next.reminders !== prev.reminders ||
        next.scheduleItems !== prev.scheduleItems ||
        next.communityMessages !== prev.communityMessages ||
        next.assistantMessages !== prev.assistantMessages;

      return changed ? next : prev;
    });
  }, [appState.user, setAppState]);

  const handleNavigate = (page: string) => {
    setAppState((prev) => ({ ...prev, currentPage: normalizePage(page) }));
    setMobileMenuOpen(false);
  };

  const handleAuth = async (name: string, email: string, password: string, isSignup: boolean) => {
    try {
      const credential = isSignup
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);

      if (isSignup && name) {
        await updateProfile(credential.user, { displayName: name });
      }

      const uid = credential.user.uid;
      const resolvedName = name || credential.user.displayName || email.split("@")[0];
      const remoteState = await loadFromFirebase(uid);

      if (remoteState?.user) {
        setPendingAuth(null);
        setAppState({
          ...remoteState,
          currentPage: "dashboard",
          isOnboarded: true,
          communityProfile: ensureCommunityProfile(remoteState.communityProfile),
          rewardClaims: remoteState.rewardClaims ?? [],
        });
        toast.success(`Selamat datang lagi, ${remoteState.user.name}`);
        return;
      }

      setPendingAuth({ uid, name: resolvedName, email });
      setAppState((prev) => ({ ...prev, currentPage: "onboarding" }));
    } catch (error: any) {
      toast.error("Login gagal", { description: error?.message || "Terjadi masalah saat masuk." });
    }
  };

  const handleOAuth = async (providerName: string) => {
    if (providerName !== "google") {
      toast.error("Only Google sign-in is enabled in this build.");
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);

      const uid = credential.user.uid;
      const resolvedName = credential.user.displayName || credential.user.email?.split("@")[0] || "Hero";
      const email = credential.user.email || "";
      const remoteState = await loadFromFirebase(uid);

      if (remoteState?.user) {
        setPendingAuth(null);
        setAppState({
          ...remoteState,
          currentPage: "dashboard",
          isOnboarded: true,
          communityProfile: ensureCommunityProfile(remoteState.communityProfile),
          rewardClaims: remoteState.rewardClaims ?? [],
        });
        toast.success(`Selamat datang lagi, ${remoteState.user.name}`);
        return;
      }

      setPendingAuth({ uid, name: resolvedName, email });
      setAppState((prev) => ({ ...prev, currentPage: "onboarding" }));
    } catch (error: any) {
      toast.error("Masuk dengan Google gagal", { description: error?.message || "Terjadi masalah saat masuk." });
      console.error("OAuth error:", error);
    }
  };

  const handleOnboardingComplete = ({ userClass, goal, schedule, bossId }: OnboardingSelection) => {
    const goalMeta = getGoalTrackMeta(goal);
    const newUser = createMockUser(
      pendingAuth?.name || "Hero",
      pendingAuth?.email || "hero@levelday.app",
      userClass,
    );

    if (pendingAuth?.uid) newUser.id = pendingAuth.uid;

    newUser.goalTrack = goal;
    newUser.dailyGoal = goalMeta.dailyGoal;
    newUser.weeklySchedule = schedule.length ? schedule : ["Mon", "Tue", "Wed", "Thu", "Fri"];

    const seededExperience = buildExperienceSeed(newUser);
    const bossTemplate = getWeeklyBossTemplate(bossId);

    setAppState({
      user: newUser,
      quests: createStarterQuests(goal, userClass),
      habits: createStarterHabits(goal, userClass),
      focusSessions: [],
      badges: mockBadges,
      currentPage: "dashboard",
      isOnboarded: true,
      reminders: seededExperience.reminders,
      scheduleItems: seededExperience.scheduleItems,
      communityMessages: seededExperience.communityMessages,
      communityProfile: createDefaultCommunityProfile(),
      rewardClaims: [],
      assistantMessages: seededExperience.assistantMessages,
      weeklyBoss: bossTemplate
        ? {
            weekKey: getLocalWeekKey(new Date()),
            bossId: bossTemplate.id,
            bossName: bossTemplate.name,
            maxHP: bossTemplate.maxHP,
            damage: 0,
            selectedAt: new Date().toISOString(),
            defeatedAt: undefined,
            goalTitle: goalMeta.weeklyBossGoal,
            goalSummary: `Starter weekly target for ${goalMeta.shortLabel}.`,
            rewardLabel: "Finish the week with real momentum",
          }
        : undefined,
      moodByDate: {},
      lastDailyReset: undefined,
      dailyDungeon: undefined,
      settings: {
        dailyDungeonFocusMinMinutes: 25,
      },
      momentum: createDefaultMomentumState(),
    });

    setPendingAuth(null);
    toast.success(`Welcome, ${userClass.charAt(0).toUpperCase() + userClass.slice(1)}`);
  };

  const handleLogout = async () => {
    const uid = appState.user?.id;

    try {
      await signOut(auth);
    } catch (error) {
      console.warn("Firebase signOut warning:", error);
    }

    if (uid) clearStorage(uid);

    setAppState({
      user: null,
      quests: [],
      habits: [],
      focusSessions: [],
      badges: mockBadges,
      currentPage: "landing",
      isOnboarded: false,
      reminders: [],
      scheduleItems: [],
      communityMessages: [],
      communityProfile: createDefaultCommunityProfile(),
      rewardClaims: [],
      assistantMessages: [],
      momentum: createDefaultMomentumState(),
    });

    setPendingAuth(null);
    toast.info("Logged out");
  };

  const handleCreateQuest = (quest: Quest) => {
    setAppState((prev) => ({ ...prev, quests: [...prev.quests, quest] }));
    toast.success("Quest created");
  };

  const handleCreateHabit = (habit: Habit) => {
    setAppState((prev) => ({ ...prev, habits: [...prev.habits, habit] }));
    toast.success("Habit added");
  };

  const handleUpdateProfile = (name: string, email: string) => {
    setAppState((prev) => {
      if (!prev.user) return prev;
      return {
        ...prev,
        user: {
          ...prev.user,
          name,
          email,
        },
      };
    });

    toast.success("Profile updated");
  };

  const handleExportData = () => {
    try {
      const payload = JSON.stringify(
        {
          ...appState,
          currentPage: "dashboard",
        },
        null,
        2,
      );
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `levelday-export-${toLocalDateKey(new Date())}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch (error) {
      console.error(error);
      toast.error("Export failed");
    }
  };

  const handleAddQuestAI = async () => {
    if (!appState.user) return;

    const toastId = toast.loading("Levelday is preparing a smart quest...");

    try {
      const todayKey = toLocalDateKey(new Date());
      const currentMood = appState.moodByDate?.[todayKey] || "steady";
      const template = await generateSmartQuest(appState.user, currentMood);

      const newQuest: Quest = {
        id: createId("quest"),
        title: template.title,
        description: template.description,
        difficulty: template.difficulty,
        status: "pending",
        xpReward: getXPForDifficulty(template.difficulty),
        tags: template.tags || ["smart quest"],
        subtasks: [],
        createdAt: new Date().toISOString(),
      };

      setAppState((prev) => ({ ...prev, quests: [...prev.quests, newQuest] }));
      toast.success("Smart quest added", {
        id: toastId,
        description: "A smaller next step is ready on your board.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Smart quest failed", { id: toastId, description: "Please try again." });
    }
  };

  const handleCompleteFocus = (duration: number, xpEarned: number) => {
    const now = new Date();
    const session: FocusSession = {
      id: createId("focus"),
      duration,
      startTime: new Date(now.getTime() - duration * 60 * 1000).toISOString(),
      endTime: now.toISOString(),
      xpEarned,
      completed: true,
    };

    completeFocusSession(session);
  };

  const handleAddReminder = (reminder: Omit<Reminder, "id" | "createdAt" | "completed">) => {
    const newReminder: Reminder = {
      ...reminder,
      id: createId("rem"),
      createdAt: new Date().toISOString(),
      completed: false,
    };

    setAppState((prev) => ({ ...prev, reminders: [...prev.reminders, newReminder] }));
    toast.success("Reminder ditambahkan");
  };

  const handleToggleReminder = (reminderId: string) => {
    setAppState((prev) => ({
      ...prev,
      reminders: prev.reminders.map((reminder) =>
        reminder.id === reminderId ? { ...reminder, completed: !reminder.completed } : reminder,
      ),
    }));
  };

  const handleAddScheduleItem = (item: Omit<ScheduleItem, "id">) => {
    const newItem: ScheduleItem = {
      ...item,
      id: createId("slot"),
    };

    setAppState((prev) => ({ ...prev, scheduleItems: [...prev.scheduleItems, newItem] }));
    toast.success("Blok jadwal ditambahkan");
  };

  const handleGenerateAIDraft = async (args: {
    dateKey: string;
    prompt: string;
    startTime: string;
    availableHours: number;
    mode: PlanningMode;
  }) => {
    return generateAISchedule({
      user: appState.user,
      dateKey: args.dateKey,
      quests: appState.quests,
      habits: appState.habits,
      prompt: args.prompt,
      startTime: args.startTime,
      availableHours: args.availableHours,
      mode: args.mode,
    });
  };

  const handleApplyAIDraft = (dateKey: string, draft: AIDayDraft) => {
    setAppState((prev) => ({
      ...prev,
      scheduleItems: [
        ...prev.scheduleItems.filter((item) => item.dateKey !== dateKey || item.source === "manual"),
        ...draft.blocks,
      ],
      reminders: [
        ...prev.reminders.filter((reminder) => reminder.dateKey !== dateKey || reminder.source !== "ai"),
        ...draft.reminders,
      ],
    }));

    toast.success("Draft AI diterapkan");
  };

  const handleAssistantSend = async (body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;

    const userMessage: AssistantMessage = {
      id: createId("assistant"),
      role: "user",
      body: trimmed,
      createdAt: new Date().toISOString(),
      context: "dashboard",
    };

    const todayKey = toLocalDateKey(new Date());

    setAppState((prev) => ({
      ...prev,
      assistantMessages: [...prev.assistantMessages, userMessage],
    }));
    setAssistantLoading(true);

    try {
      const reply = await generateAssistantReply(trimmed, {
        user: appState.user,
        quests: appState.quests,
        habits: appState.habits,
        reminders: appState.reminders,
        scheduleItems: appState.scheduleItems,
        mood: appState.moodByDate?.[todayKey],
        dateKey: todayKey,
      }, appState.assistantMessages);

      setAppState((prev) => ({
        ...prev,
        assistantMessages: [...prev.assistantMessages, reply],
      }));
    } catch (error: any) {
      toast.error("AI gagal merespons", {
        description: error?.message || "Periksa konfigurasi Groq atau koneksi jaringan.",
      });
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleSendCommunityMessage = async (channel: CommunityChannel, body: string) => {
    if (!appState.user) return;
    const trimmed = body.trim();
    if (!trimmed) return;

    const safeProfile = ensureCommunityProfile(appState.communityProfile);
    const trust = deriveCommunityTrustSummary({
      user: appState.user,
      messages: appState.communityMessages,
      habits: appState.habits,
      focusSessions: appState.focusSessions,
      profile: safeProfile,
    });

    const policy = buildCommunityPostingPolicy({ channel, trust, profile: safeProfile });
    if (!policy.canPost) {
      toast.error("Belum bisa kirim pesan", { description: policy.message });
      return;
    }

    const moderation = moderateCommunityDraft({
      channel,
      draft: trimmed,
      messages: appState.communityMessages,
      user: appState.user,
    });

    if (moderation.blocked) {
      toast.error("Pesan diblokir", {
        description: moderation.userMessage || "Tolong tulis ulang dengan gaya yang lebih natural.",
      });
      return;
    }

    if (moderation.flags.length && moderation.userMessage) {
      toast("Filter kualitas aktif", { description: moderation.userMessage });
    }

    const now = new Date().toISOString();
    const ownMessage = {
      id: createId("msg"),
      channel,
      author: appState.user.name,
      handle: `@${appState.user.name.toLowerCase().replace(/\s+/g, "")}`,
      body: trimmed,
      createdAt: now,
      userClass: appState.user.userClass,
      vibe: channel === "ai-lounge" ? "planning" : "live",
      isOwn: true,
      senderType: "human" as const,
      trustState: trust.state,
      moderationStatus: moderation.flags.length ? "under-review" as const : "clean" as const,
      reportCount: 0,
    };

    setAppState((prev) => {
      const profile = ensureCommunityProfile(prev.communityProfile);
      const nextProfile = {
        ...profile,
        reputationScore:
          channel === "ai-lounge"
            ? profile.reputationScore
            : profile.reputationScore + (moderation.flags.length ? 0 : 1),
        lastPostedAtByChannel: {
          ...profile.lastPostedAtByChannel,
          [channel]: now,
        },
      };

      return {
        ...prev,
        communityProfile: nextProfile,
        communityMessages: [...prev.communityMessages, ownMessage],
      };
    });

    if (channel === "ai-lounge") {
      try {
        const aiHistory = appState.communityMessages
          .filter((message) => message.channel === "ai-lounge" && (message.senderType === "ai" || message.isOwn))
          .slice(-6)
          .map((message) => ({
            id: message.id,
            role: message.senderType === "ai" ? "assistant" as const : "user" as const,
            body: message.body,
            createdAt: message.createdAt,
            context: "support" as const,
          }));

        const aiReply = await generateAssistantReply(trimmed, {
          user: appState.user,
          quests: appState.quests,
          habits: appState.habits,
          reminders: appState.reminders,
          scheduleItems: appState.scheduleItems,
          mood: appState.moodByDate?.[toLocalDateKey(new Date())],
          dateKey: toLocalDateKey(new Date()),
        }, aiHistory);

        setAppState((prev) => ({
          ...prev,
          communityMessages: [
            ...prev.communityMessages,
            {
              id: createId("msg"),
              channel,
              author: "Levelday AI",
              handle: "@ai",
              body: aiReply.body,
              createdAt: new Date().toISOString(),
              userClass: "scholar",
              vibe: "support",
              isAI: true,
              senderType: "ai",
              trustState: "trusted",
              moderationStatus: "clean",
              reportCount: 0,
            },
          ],
        }));
      } catch (error) {
        console.warn("AI lounge fallback:", error);
        setAppState((prev) => ({
          ...prev,
          communityMessages: [...prev.communityMessages, createCommunityAutoReply(channel, trimmed)],
        }));
      }
      return;
    }

    if (policy.mode === "slow") {
      toast("Mode lambat aktif", {
        description: `Akun baru bisa kirim satu pesan tiap ${policy.cooldownSeconds} detik di human room.`,
      });
    }
  };

  const handleReportCommunityMessage = (messageId: string, reason: CommunityReportReason) => {
    const target = appState.communityMessages.find((message) => message.id === messageId);
    if (!target || target.isOwn || target.senderType === "system") return;

    setAppState((prev) => {
      const profile = ensureCommunityProfile(prev.communityProfile);
      const alreadyReported = profile.reports.some((report) => report.messageId === messageId && report.reason === reason);
      if (alreadyReported) return prev;

      return {
        ...prev,
        communityProfile: {
          ...profile,
          reportsSubmitted: profile.reportsSubmitted + 1,
          reports: [
            {
              id: createId("report"),
              messageId,
              channel: target.channel,
              targetHandle: target.handle,
              reason,
              createdAt: new Date().toISOString(),
              status: "queued",
            },
            ...profile.reports,
          ],
        },
        communityMessages: prev.communityMessages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                reportCount: (message.reportCount ?? 0) + 1,
                moderationStatus: "under-review",
              }
            : message,
        ),
      };
    });

    toast.success("Laporan masuk antrean moderasi", {
      description: `${target.handle} sekarang masuk review moderation.`,
    });
  };

  const handleMuteHandle = (handle: string, nextMuted: boolean) => {
    setAppState((prev) => {
      const profile = ensureCommunityProfile(prev.communityProfile);
      const mutedHandles = nextMuted
        ? Array.from(new Set([...profile.mutedHandles, handle]))
        : profile.mutedHandles.filter((item) => item !== handle);

      return {
        ...prev,
        communityProfile: {
          ...profile,
          mutedHandles,
        },
      };
    });

    toast(nextMuted ? "Akun dibisukan" : "Bisukan dibatalkan", {
      description: `${handle} ${nextMuted ? "akan disembunyikan kecuali itu pesan milikmu" : "akan terlihat lagi"}.`,
    });
  };

  const handleBlockHandle = (handle: string, nextBlocked: boolean) => {
    setAppState((prev) => {
      const profile = ensureCommunityProfile(prev.communityProfile);
      const blockedHandles = nextBlocked
        ? Array.from(new Set([...profile.blockedHandles, handle]))
        : profile.blockedHandles.filter((item) => item !== handle);

      return {
        ...prev,
        communityProfile: {
          ...profile,
          blockedHandles,
          mutedHandles: nextBlocked
            ? Array.from(new Set([...profile.mutedHandles, handle]))
            : profile.mutedHandles.filter((item) => item !== handle),
        },
      };
    });

    toast(nextBlocked ? "Akun diblokir" : "Blokir dibatalkan", {
      description: `${handle} ${nextBlocked ? "dihapus dari human room milikmu" : "bisa muncul lagi"}.`,
    });
  };

  const handleClaimReward = (progress: RewardProgress) => {
    if (progress.state !== "ready") return;
    if ((appState.rewardClaims ?? []).some((claim) => claim.rewardId === progress.rewardId)) return;

    const claim = buildRewardClaimRecord(progress);

    setAppState((prev) => ({
      ...prev,
      rewardClaims: [claim, ...(prev.rewardClaims ?? [])],
    }));

    toast.success(`${progress.definition.title} berhasil diklaim`, {
      description:
        progress.definition.celebrationLevel === "major"
          ? "Milestone besar masuk ke riwayat reward."
          : "Reward masuk ke riwayat klaim kamu.",
    });
  };

  const handleBuyStreakFreeze = () => {
    const result = purchaseStreakFreeze(appState.momentum);

    if (!result.ok) {
      if (result.reason === "inventory-full") {
        toast.info("Inventory streak freeze penuh", {
          description: "Pakai dulu salah satu freeze sebelum beli lagi.",
        });
        return;
      }

      toast.error("Poin belum cukup", {
        description: "Selesaikan lebih banyak quest untuk menambah reward points.",
      });
      return;
    }

    setAppState((prev) => ({
      ...prev,
      momentum: result.momentum,
    }));

    toast.success("Streak freeze berhasil dibeli", {
      description: "Freeze akan otomatis dipakai saat satu hari terlewat.",
    });
  };

  const renderPage = () => {
    switch (normalizePage(appState.currentPage)) {
      case "landing":
        return <LandingPage onGetStarted={() => handleNavigate("auth")} />;
      case "auth":
        return <AuthPage onAuth={handleAuth} onOAuth={handleOAuth} />;
      case "onboarding":
        return <OnboardingPage onComplete={handleOnboardingComplete} />;
      case "dashboard": {
        if (!appState.user) return null;

        const todayKey = toLocalDateKey(new Date());
        const todayQuestsAll = appState.quests.filter((quest) => {
          const dueKey = isoToLocalDateKey(quest.dueDate);
          if (quest.isDaily) return true;
          return !dueKey || dueKey <= todayKey;
        });
        const todayQuests = todayQuestsAll.filter((quest) => quest.status !== "completed");

        return (
          <Dashboard
            user={appState.user}
            todayQuestsAll={todayQuestsAll}
            todayQuests={todayQuests}
            habits={appState.habits}
            focusSessions={appState.focusSessions}
            weeklyBoss={appState.weeklyBoss}
            dailyDungeon={appState.dailyDungeon}
            momentum={appState.momentum}
            reminders={appState.reminders}
            scheduleItems={appState.scheduleItems}
            communityMessages={appState.communityMessages}
            assistantMessages={appState.assistantMessages}
            leaderboardPreview={leaderboards.global}
            onAddQuest={() => setNewQuestDialogOpen(true)}
            onAddQuestAI={handleAddQuestAI}
            onQuestClick={(quest) => {
              setSelectedQuest(quest);
              setQuestDialogOpen(true);
            }}
            onQuestComplete={completeQuest}
            onViewAllQuests={() => handleNavigate("quests")}
            onViewAllHabits={() => handleNavigate("habits")}
            onViewDungeon={() => handleNavigate("dungeon")}
            onViewPlanner={() => handleNavigate("planner")}
            onViewCommunity={() => handleNavigate("community")}
            onViewLeaderboard={() => handleNavigate("leaderboard")}
            moodToday={appState.moodByDate?.[todayKey]}
            onMoodChange={(mood) =>
              setAppState((prev) => ({
                ...prev,
                moodByDate: {
                  ...prev.moodByDate,
                  [todayKey]: mood,
                },
              }))
            }
            onHabitOpen={() => handleNavigate("habits")}
            onHabitToggle={toggleHabit}
            onStartFocus={() => handleNavigate("focus")}
            onSelectWeeklyBoss={selectWeeklyBoss}
            onAssistantSend={handleAssistantSend}
            assistantLoading={assistantLoading}
          />
        );
      }
      case "quests":
        return (
          <QuestsPage
            quests={appState.quests}
            onAddQuest={() => setNewQuestDialogOpen(true)}
            onAddQuestAI={handleAddQuestAI}
            onQuestClick={(quest) => {
              setSelectedQuest(quest);
              setQuestDialogOpen(true);
            }}
            onCompleteQuest={completeQuest}
          />
        );
      case "planner":
        return appState.user ? (
          <CalendarPage
            user={appState.user}
            quests={appState.quests}
            habits={appState.habits}
            reminders={appState.reminders}
            scheduleItems={appState.scheduleItems}
            onQuestClick={(quest) => {
              setSelectedQuest(quest);
              setQuestDialogOpen(true);
            }}
            onCompleteQuest={completeQuest}
            onAddQuestForDate={(date) => {
              setNewQuestDefaultDueDate(makeDueDateISO(date));
              setNewQuestDialogOpen(true);
            }}
            onAddReminder={handleAddReminder}
            onToggleReminder={handleToggleReminder}
            onAddScheduleItem={handleAddScheduleItem}
            onGenerateAIDraft={handleGenerateAIDraft}
            onApplyAIDraft={handleApplyAIDraft}
          />
        ) : null;
      case "community":
        return appState.user ? (
          <CommunityPage
            user={appState.user}
            messages={appState.communityMessages}
            habits={appState.habits}
            focusSessions={appState.focusSessions}
            profile={appState.communityProfile}
            onSendMessage={handleSendCommunityMessage}
            onReportMessage={handleReportCommunityMessage}
            onMuteHandle={handleMuteHandle}
            onBlockHandle={handleBlockHandle}
          />
        ) : null;
      case "leaderboard":
        return appState.user ? (
          <LeaderboardPage user={appState.user} globalLeaderboard={leaderboards.global} friendsLeaderboard={leaderboards.friends} />
        ) : null;
      case "habits":
        return (
          <HabitsPage
            habits={appState.habits}
            onAddHabit={() => setNewHabitDialogOpen(true)}
            onHabitClick={(habit) => toggleHabit(habit.id)}
            onToggleHabit={toggleHabit}
          />
        );
      case "focus":
        return (
          <FocusSessionPage
            focusSessions={appState.focusSessions}
            weeklyBoss={appState.weeklyBoss}
            dailyDungeon={appState.dailyDungeon}
            onComplete={handleCompleteFocus}
          />
        );
      case "rewards":
        return (
          <RewardsPage
            user={appState.user}
            badges={appState.badges}
            quests={appState.quests}
            habits={appState.habits}
            focusSessions={appState.focusSessions}
            reminders={appState.reminders}
            scheduleItems={appState.scheduleItems}
            messages={appState.communityMessages}
            dailyDungeon={appState.dailyDungeon}
            weeklyBoss={appState.weeklyBoss}
            rewardClaims={appState.rewardClaims}
            communityProfile={appState.communityProfile}
            momentum={appState.momentum}
            onClaimReward={handleClaimReward}
            onBuyStreakFreeze={handleBuyStreakFreeze}
            onBadgeClick={(badge) => {
              setSelectedBadge(badge);
              setBadgeDialogOpen(true);
            }}
          />
        );
      case "stats":
        return (
          <StatsPage
            quests={appState.quests}
            habits={appState.habits}
            focusSessions={appState.focusSessions}
            moodByDate={appState.moodByDate}
          />
        );
      case "settings":
        return appState.user ? (
          <SettingsPage
            user={appState.user}
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
            onExportData={handleExportData}
          />
        ) : null;
      case "dungeon":
        return (
          <DailyDungeonPage
            dungeon={appState.dailyDungeon}
            onClaimReward={claimDailyDungeonReward}
            focusMin={appState.settings?.dailyDungeonFocusMinMinutes ?? 25}
            onChangeFocusMin={setDailyDungeonFocusMinMinutes}
            onOpenQuests={() => handleNavigate("quests")}
            onOpenHabits={() => handleNavigate("habits")}
            onOpenFocus={() => handleNavigate("focus")}
          />
        );
      default:
        return null;
    }
  };

  const isAppPage = !!appState.user && appState.isOnboarded;

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {isAppPage ? (
        <div className="relative flex overflow-x-hidden">
          <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-2xl md:hidden">
            <button className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-200" onClick={() => setMobileMenuOpen(true)}>
              Menu
            </button>
            <BrandMark size="sm" showWordmark />
            <button className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-200" onClick={() => setNewQuestDialogOpen(true)}>
              + Quest
            </button>
          </div>

          {mobileMenuOpen ? (
            <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
              <div className="absolute left-0 top-0 h-full w-[84vw] max-w-80 overflow-y-auto bg-[#080b14]/95 p-4 backdrop-blur-2xl">
                <button className="mb-4 rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-200" onClick={() => setMobileMenuOpen(false)}>
                  Close
                </button>
                <AppSidebar
                  user={appState.user!}
                  momentum={appState.momentum}
                  currentPage={appState.currentPage}
                  onNavigate={handleNavigate}
                  onAddQuest={() => {
                    setNewQuestDialogOpen(true);
                    setMobileMenuOpen(false);
                  }}
                />
              </div>
            </div>
          ) : null}

          <div className="hidden md:block">
            <AppSidebar
              user={appState.user!}
              momentum={appState.momentum}
              currentPage={appState.currentPage}
              onNavigate={handleNavigate}
              onAddQuest={() => setNewQuestDialogOpen(true)}
            />
          </div>

          <div className="min-w-0 flex-1 pb-24 md:pb-0">
            <div className="mx-auto max-w-[1500px] px-4 py-4 pt-20 sm:px-6 sm:py-6 md:pt-6 lg:px-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={normalizePage(appState.currentPage)}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                >
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <MobileNav currentPage={appState.currentPage} onNavigate={handleNavigate} />
        </div>
      ) : (
        <div>{renderPage()}</div>
      )}

      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(17, 21, 33, 0.9)",
            backdropFilter: "blur(18px)",
            border: "1px solid rgba(139, 92, 246, 0.18)",
            color: "#edf2ff",
          },
        }}
      />

      {isAppPage ? (
        <CommandPalette
          open={commandOpen}
          onOpenChange={setCommandOpen}
          quests={appState.quests}
          onNavigate={handleNavigate}
          onNewQuest={() => setNewQuestDialogOpen(true)}
          onNewAIQuest={handleAddQuestAI}
          onStartFocus={() => handleNavigate("focus")}
        />
      ) : null}

      <QuestDetailDialog
        quest={selectedQuest}
        open={questDialogOpen}
        onClose={() => setQuestDialogOpen(false)}
        onSave={(updatedQuest) => {
          setAppState((prev) => ({
            ...prev,
            quests: prev.quests.map((quest) => (quest.id === updatedQuest.id ? updatedQuest : quest)),
          }));
          setSelectedQuest(updatedQuest);
          toast.success("Quest updated");
        }}
        onComplete={completeQuest}
        onDelete={(questId) => {
          setAppState((prev) => ({
            ...prev,
            quests: prev.quests.filter((quest) => quest.id !== questId),
          }));
          setSelectedQuest(null);
          toast.success("Quest removed");
        }}
      />

      <BadgeDetailDialog badge={selectedBadge} open={badgeDialogOpen} onClose={() => setBadgeDialogOpen(false)} />

      <QuestCreateDialog
        open={newQuestDialogOpen}
        defaultDueDate={newQuestDefaultDueDate}
        weeklyBossGoal={appState.weeklyBoss?.goalTitle}
        onClose={() => {
          setNewQuestDialogOpen(false);
          setNewQuestDefaultDueDate(undefined);
        }}
        onCreate={handleCreateQuest}
      />

      <HabitCreateDialog
        open={newHabitDialogOpen}
        onClose={() => setNewHabitDialogOpen(false)}
        onCreate={handleCreateHabit}
      />

      <SpeedInsights />
    </div>
  );
}
