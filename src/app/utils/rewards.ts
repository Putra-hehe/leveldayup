import {
  Badge,
  CommunityMessage,
  CommunityProfile,
  DailyDungeon,
  FocusSession,
  Habit,
  Reminder,
  RewardCategory,
  RewardClaimRecord,
  RewardDefinition,
  RewardProgress,
  RewardSnapshot,
  ScheduleItem,
  User,
  WeeklyBoss,
  Rarity,
  MomentumState,
} from "../types";

const rewardDefinitions: RewardDefinition[] = [
  { id: "reward-first-focus", title: "Percikan Pertama", description: "Selesaikan sesi fokus pertamamu. Yang penting mulai jalan dulu.", category: "daily", rarity: "common", visualKey: "spark", triggerType: "counter", metricKey: "completedFocusSessions", threshold: 1, repeatable: false, celebrationLevel: "micro" },
  { id: "reward-focus-3", title: "Ritme Fokus", description: "Selesaikan 3 sesi fokus. Sistem mulai terasa hidup saat ritme terbentuk.", category: "daily", rarity: "uncommon", visualKey: "zap", triggerType: "counter", metricKey: "completedFocusSessions", threshold: 3, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-focus-10", title: "Mesin Nyala", description: "Capai 10 sesi fokus selesai.", category: "progress", rarity: "rare", visualKey: "flame", triggerType: "counter", metricKey: "completedFocusSessions", threshold: 10, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-planner-first-apply", title: "Planner Dipakai", description: "Terapkan satu draft AI agar planner terasa berguna, bukan dekorasi.", category: "exploration", rarity: "common", visualKey: "map", triggerType: "counter", metricKey: "aiPlannerBlocks", threshold: 1, repeatable: false, celebrationLevel: "micro" },
  { id: "reward-planner-architect", title: "Arsitek Hari", description: "Punya minimal 6 blok jadwal yang tersusun rapi.", category: "exploration", rarity: "rare", visualKey: "scroll", triggerType: "counter", metricKey: "totalScheduleBlocks", threshold: 6, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-streak-3", title: "Mulai Konsisten", description: "Capai streak 3 hari untuk membuktikan loop ini nyata.", category: "progress", rarity: "uncommon", visualKey: "flame", triggerType: "streak", metricKey: "bestHabitStreak", threshold: 3, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-streak-7", title: "Penjaga Ritme", description: "Capai streak 7 hari. Ini titik saat identitas mulai terbentuk.", category: "progress", rarity: "rare", visualKey: "medal", triggerType: "streak", metricKey: "bestHabitStreak", threshold: 7, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-streak-14", title: "Mesin Konsistensi", description: "Capai streak 14 hari tanpa kehilangan arah.", category: "progress", rarity: "epic", visualKey: "crown", triggerType: "streak", metricKey: "bestHabitStreak", threshold: 14, repeatable: false, celebrationLevel: "major" },
  { id: "reward-quest-first", title: "Langkah Nyata", description: "Selesaikan 1 quest pertama.", category: "daily", rarity: "common", visualKey: "target", triggerType: "counter", metricKey: "completedQuests", threshold: 1, repeatable: false, celebrationLevel: "micro" },
  { id: "reward-quest-runner", title: "Pelari Quest", description: "Selesaikan 5 quest. Niat mulai berubah jadi eksekusi.", category: "progress", rarity: "rare", visualKey: "target", triggerType: "counter", metricKey: "completedQuests", threshold: 5, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-quest-15", title: "Penakluk Tugas", description: "Selesaikan 15 quest bermakna.", category: "progress", rarity: "epic", visualKey: "shield", triggerType: "counter", metricKey: "completedQuests", threshold: 15, repeatable: false, celebrationLevel: "major" },
  { id: "reward-reminder-kept", title: "Taat Sinyal", description: "Selesaikan 3 reminder agar sistem cue terasa berguna.", category: "daily", rarity: "uncommon", visualKey: "clock", triggerType: "counter", metricKey: "completedReminders", threshold: 3, repeatable: false, celebrationLevel: "micro" },
  { id: "reward-reminder-10", title: "Penjaga Jadwal", description: "Selesaikan 10 reminder dan tunjukkan bahwa cue bukan tempelan.", category: "weekly", rarity: "rare", visualKey: "clock", triggerType: "counter", metricKey: "completedReminders", threshold: 10, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-human-checkin", title: "Sinyal Check-in", description: "Kirim 2 check-in bermakna di room manusia.", category: "social", rarity: "uncommon", visualKey: "signal", triggerType: "counter", metricKey: "humanRoomPosts", threshold: 2, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-social-builder", title: "Penguat Komunitas", description: "Kirim 5 kontribusi manusia yang lolos tanpa report.", category: "social", rarity: "rare", visualKey: "handshake", triggerType: "counter", metricKey: "healthyHumanPosts", threshold: 5, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-trusted-human", title: "Dipercaya Komunitas", description: "Naik ke reputasi komunitas yang sehat.", category: "social", rarity: "epic", visualKey: "crest", triggerType: "milestone", metricKey: "trustReputation", threshold: 120, repeatable: false, celebrationLevel: "major" },
  { id: "reward-ai-first", title: "Partner AI", description: "Gunakan AI Lounge 3 kali untuk dukungan taktis.", category: "exploration", rarity: "uncommon", visualKey: "orbit", triggerType: "counter", metricKey: "aiRoomPrompts", threshold: 3, repeatable: false, celebrationLevel: "micro" },
  { id: "reward-ai-10", title: "Pilot Sistem", description: "Gunakan AI Lounge 10 kali dengan ritme yang sehat.", category: "exploration", rarity: "rare", visualKey: "wand", triggerType: "counter", metricKey: "aiRoomPrompts", threshold: 10, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-loyal-week", title: "Lambang Minggu Pertama", description: "Bertahan selama 7 hari. Loyalitas harus terasa pantas.", category: "loyalty", rarity: "rare", visualKey: "crest", triggerType: "milestone", metricKey: "daysSinceJoined", threshold: 7, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-loyal-month", title: "Panji Satu Bulan", description: "Bertahan 30 hari. Ini pantas dirayakan lebih besar.", category: "loyalty", rarity: "legendary", visualKey: "banner", triggerType: "milestone", metricKey: "daysSinceJoined", threshold: 30, repeatable: false, celebrationLevel: "major" },
  { id: "reward-dungeon-clear", title: "Dungeon Clear", description: "Selesaikan Daily Dungeon satu kali.", category: "weekly", rarity: "rare", visualKey: "shield", triggerType: "milestone", metricKey: "dungeonClears", threshold: 1, repeatable: false, celebrationLevel: "standard" },
  { id: "reward-weekly-boss", title: "Penakluk Weekly Boss", description: "Kalahkan weekly boss sekali. Jangan dibuat terlalu murah.", category: "weekly", rarity: "epic", visualKey: "crown", triggerType: "milestone", metricKey: "weeklyBossDefeats", threshold: 1, repeatable: false, celebrationLevel: "major" },
  { id: "reward-clean-executor", title: "Eksekutor Bersih", description: "Selesaikan minimal 3 quest, punya streak 3 hari, dan terapkan satu plan AI.", category: "quality", rarity: "epic", visualKey: "gem", triggerType: "quality", metricKey: "qualityExecution", threshold: 1, repeatable: false, celebrationLevel: "major" },
  { id: "reward-system-synergy", title: "Sinkron Sistem", description: "Gunakan quest, habit, planner, reminder, dan AI dalam satu ekosistem yang benar-benar dipakai.", category: "quality", rarity: "legendary", visualKey: "medal", triggerType: "quality", metricKey: "systemSynergy", threshold: 1, repeatable: false, celebrationLevel: "major" },
  { id: "reward-comeback", title: "Bangkit Lagi", description: "Datang kembali setelah sempat hilang, lalu mulai lagi dengan sehat.", category: "loyalty", rarity: "uncommon", visualKey: "spark", triggerType: "milestone", metricKey: "comebackMoments", threshold: 1, repeatable: false, celebrationLevel: "standard" },
];

const categoryMeta: Record<RewardCategory, { label: string; accent: string }> = {
  daily: { label: "Harian", accent: "from-cyan-500/20 to-cyan-500/5 border-cyan-400/20" },
  weekly: { label: "Mingguan", accent: "from-violet-500/20 to-violet-500/5 border-violet-400/20" },
  progress: { label: "Progres", accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-400/20" },
  social: { label: "Sosial", accent: "from-amber-500/20 to-amber-500/5 border-amber-400/20" },
  loyalty: { label: "Loyalitas", accent: "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-400/20" },
  exploration: { label: "Eksplorasi", accent: "from-sky-500/20 to-sky-500/5 border-sky-400/20" },
  quality: { label: "Kualitas", accent: "from-yellow-500/20 to-yellow-500/5 border-yellow-400/20" },
};

function daysBetween(start?: string) {
  if (!start) return 0;
  const value = new Date(start).getTime();
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor((Date.now() - value) / (1000 * 60 * 60 * 24)));
}

function getCompletedQuestsCount(quests: { status: string }[]) {
  return quests.filter((quest) => quest.status === "completed").length;
}

function getHumanRoomPosts(messages: CommunityMessage[]) {
  return messages.filter((message) => message.isOwn && message.channel !== "ai-lounge").length;
}

function getHealthyHumanPosts(messages: CommunityMessage[]) {
  return messages.filter((message) => message.isOwn && message.channel !== "ai-lounge" && (message.reportCount ?? 0) === 0).length;
}

function getAIRoomPrompts(messages: CommunityMessage[]) {
  return messages.filter((message) => message.isOwn && message.channel === "ai-lounge").length;
}

function highestRarity(points: RewardProgress[]): Rarity | null {
  const order: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];
  return points.reduce<Rarity | null>((current, point) => {
    if (!current) return point.definition.rarity;
    return order.indexOf(point.definition.rarity) > order.indexOf(current) ? point.definition.rarity : current;
  }, null);
}

export function getRewardCategoryMeta(category: RewardCategory) {
  return categoryMeta[category];
}

export function buildRewardClaimRecord(progress: RewardProgress): RewardClaimRecord {
  return {
    rewardId: progress.rewardId,
    title: progress.definition.title,
    category: progress.definition.category,
    celebrationLevel: progress.definition.celebrationLevel,
    claimedAt: new Date().toISOString(),
  };
}

export function deriveRewardSnapshot(args: {
  user: User | null;
  badges: Badge[];
  quests: { status: string }[];
  habits: Habit[];
  focusSessions: FocusSession[];
  reminders: Reminder[];
  scheduleItems: ScheduleItem[];
  messages: CommunityMessage[];
  dailyDungeon?: DailyDungeon;
  weeklyBoss?: WeeklyBoss;
  rewardClaims?: RewardClaimRecord[];
  communityProfile?: CommunityProfile;
  momentum?: MomentumState;
}): RewardSnapshot {
  const {
    user,
    badges,
    quests,
    habits,
    focusSessions,
    reminders,
    scheduleItems,
    messages,
    dailyDungeon,
    weeklyBoss,
    rewardClaims = [],
    communityProfile,
    momentum,
  } = args;

  const daysSinceJoined = daysBetween(user?.joinedDate);
  const completedQuests = getCompletedQuestsCount(quests);
  const bestHabitStreak = habits.reduce((best, habit) => Math.max(best, habit.currentStreak, habit.longestStreak), 0);
  const bestMomentumStreak = Math.max(momentum?.streak ?? 0, momentum?.bestStreak ?? 0);
  const bestStreak = Math.max(bestHabitStreak, bestMomentumStreak);
  const aiPlannerBlocks = scheduleItems.filter((item) => item.source === "ai").length;

  const metrics = {
    completedQuests,
    completedFocusSessions: focusSessions.filter((session) => session.completed).length,
    bestHabitStreak: bestStreak,
    completedReminders: reminders.filter((reminder) => reminder.completed).length,
    aiPlannerBlocks,
    totalScheduleBlocks: scheduleItems.length,
    humanRoomPosts: getHumanRoomPosts(messages),
    healthyHumanPosts: getHealthyHumanPosts(messages),
    aiRoomPrompts: getAIRoomPrompts(messages),
    daysSinceJoined,
    dungeonClears: dailyDungeon?.rewardClaimed ? 1 : 0,
    weeklyBossDefeats: weeklyBoss?.defeatedAt ? 1 : 0,
    qualityExecution: completedQuests >= 3 && bestStreak >= 3 && scheduleItems.some((item) => item.source === "ai") ? 1 : 0,
    trustReputation: Math.max(communityProfile?.reputationScore ?? 0, 0),
    systemSynergy:
      completedQuests >= 3 &&
      bestStreak >= 3 &&
      aiPlannerBlocks >= 1 &&
      reminders.some((reminder) => reminder.completed) &&
      getAIRoomPrompts(messages) >= 1
        ? 1
        : 0,
    comebackMoments: daysSinceJoined >= 3 && completedQuests >= 1 && bestStreak <= 2 ? 1 : 0,
  };

  const claimMap = new Map(rewardClaims.map((claim) => [claim.rewardId, claim]));

  const progress = rewardDefinitions.map((definition) => {
    const current = metrics[definition.metricKey as keyof typeof metrics] ?? 0;
    const claim = claimMap.get(definition.id);
    return {
      rewardId: definition.id,
      current,
      target: definition.threshold,
      state: claim ? "claimed" : current >= definition.threshold ? "ready" : "locked",
      definition,
      ratio: Math.max(0, Math.min(current / definition.threshold, 1)),
      claimedAt: claim?.claimedAt,
    } satisfies RewardProgress;
  });

  const ready = progress.filter((entry) => entry.state === "ready");
  const claimed = progress.filter((entry) => entry.state === "claimed").sort((a, b) => new Date(b.claimedAt || 0).getTime() - new Date(a.claimedAt || 0).getTime());
  const upcoming = [...progress].filter((entry) => entry.state === "locked").sort((a, b) => b.ratio - a.ratio || a.target - b.target).slice(0, 8);

  const byCategory = progress.reduce<Record<RewardCategory, RewardProgress[]>>(
    (acc, entry) => {
      const category = entry.definition.category;
      acc[category] = [...(acc[category] || []), entry].sort((a, b) => b.ratio - a.ratio || a.target - b.target);
      return acc;
    },
    { daily: [], weekly: [], progress: [], social: [], loyalty: [], exploration: [], quality: [] },
  );

  const unlockedBadges = badges.filter((badge) => !badge.isLocked);
  const lockedBadges = badges.filter((badge) => badge.isLocked);

  return {
    metrics,
    definitions: rewardDefinitions,
    progress,
    ready,
    claimed,
    upcoming,
    byCategory,
    categoryMeta,
    recentClaims: [...rewardClaims].sort((a, b) => new Date(b.claimedAt).getTime() - new Date(a.claimedAt).getTime()).slice(0, 6),
    legacyBadges: {
      unlocked: unlockedBadges,
      locked: lockedBadges,
      rarestUnlocked: highestRarity(claimed.length ? claimed : progress.filter((entry) => entry.state !== "locked")),
    },
  };
}
