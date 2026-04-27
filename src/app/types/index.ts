export type UserClass = 'warrior' | 'scholar' | 'creator';

export type QuestDifficulty = 'easy' | 'normal' | 'hard';

export type QuestStatus = 'pending' | 'in_progress' | 'completed';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface User {
  id: string;
  name: string;
  email: string;
  userClass: UserClass;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXP: number;
  avatar?: string;
  joinedDate: string;
  dailyGoal?: string;
  weeklySchedule?: string[];
  goalTrack?: string;
}

export interface Quest {
  id: string;
  title: string;
  description?: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  xpReward: number;
  dueDate?: string;
  tags: string[];
  subtasks: Subtask[];
  createdAt: string;
  completedAt?: string;
  isDaily?: boolean;
  isWeekly?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  customDays?: number[];
  currentStreak: number;
  longestStreak: number;
  xpPerCompletion: number;
  completedDates: string[];
  xpAwardedDates?: string[];
  createdAt: string;
  reminderTime?: string;
  color?: string;
}

export interface FocusSession {
  id: string;
  questId?: string;
  duration: number;
  startTime: string;
  endTime?: string;
  xpEarned: number;
  completed: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  iconType: string;
  unlockedAt?: string;
  isLocked: boolean;
  requirement?: string;
}

export interface Stats {
  totalQuests: number;
  completedQuests: number;
  totalHabits: number;
  totalFocusTime: number;
  weeklyXP: number[];
  weeklyProductivity: number[];
  habitStreaks: { habitId: string; streak: number }[];
  categoryBreakdown: { category: string; count: number }[];
}

export interface WeeklyBoss {
  weekKey: string;
  bossId: string;
  bossName: string;
  maxHP: number;
  damage: number;
  selectedAt?: string;
  defeatedAt?: string;
  goalTitle?: string;
  goalSummary?: string;
  rewardLabel?: string;
}

export type ReminderType = 'quest' | 'focus' | 'habit' | 'life';

export interface Reminder {
  id: string;
  title: string;
  note?: string;
  dateKey: string;
  time: string;
  type: ReminderType;
  completed: boolean;
  source?: 'manual' | 'ai';
  createdAt: string;
}

export type ScheduleLane = 'deep-work' | 'admin' | 'recovery' | 'ritual' | 'social';

export interface ScheduleItem {
  id: string;
  title: string;
  note?: string;
  dateKey: string;
  startTime: string;
  endTime: string;
  lane: ScheduleLane;
  source?: 'manual' | 'ai';
  linkedQuestId?: string;
}

export type CommunityChannel = 'global' | 'friends' | 'ai-lounge';

export type CommunitySenderType = 'human' | 'ai' | 'system';

export type CommunityTrustState = 'new' | 'verified' | 'trusted' | 'flagged' | 'restricted';

export type CommunityReportReason = 'spam' | 'fake' | 'harassment' | 'unsafe' | 'other';

export interface CommunityMessage {
  id: string;
  channel: CommunityChannel;
  author: string;
  handle: string;
  body: string;
  createdAt: string;
  userClass?: UserClass;
  vibe?: string;
  isOwn?: boolean;
  isAI?: boolean;
  senderType?: CommunitySenderType;
  trustState?: CommunityTrustState;
  reportCount?: number;
  moderationStatus?: 'clean' | 'under-review' | 'limited';
}

export type CommunityModerationFlagType =
  | 'empty'
  | 'low-signal'
  | 'duplicate'
  | 'link'
  | 'mention-burst'
  | 'shouting';

export interface CommunityModerationFlag {
  type: CommunityModerationFlagType;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

export interface CommunityPostingPolicy {
  canPost: boolean;
  mode: 'open' | 'slow' | 'warmup' | 'review' | 'restricted';
  cooldownSeconds: number;
  message: string;
  trustState: CommunityTrustState;
}

export interface CommunityReport {
  id: string;
  messageId: string;
  channel: CommunityChannel;
  targetHandle: string;
  reason: CommunityReportReason;
  createdAt: string;
  status: 'queued' | 'reviewing' | 'actioned';
}

export interface CommunityProfile {
  reputationScore: number;
  reportsSubmitted: number;
  reportsReceived: number;
  mutedHandles: string[];
  blockedHandles: string[];
  lastPostedAtByChannel: Partial<Record<CommunityChannel, string>>;
  reports: CommunityReport[];
}

export type RewardCategory = 'daily' | 'weekly' | 'progress' | 'social' | 'loyalty' | 'exploration' | 'quality';

export type RewardTriggerType = 'counter' | 'streak' | 'quality' | 'milestone';

export type RewardCelebrationLevel = 'micro' | 'standard' | 'major';

export interface RewardDefinition {
  id: string;
  title: string;
  description: string;
  category: RewardCategory;
  rarity: Rarity;
  visualKey: string;
  triggerType: RewardTriggerType;
  metricKey: string;
  threshold: number;
  repeatable: boolean;
  celebrationLevel: RewardCelebrationLevel;
}

export interface RewardClaimRecord {
  rewardId: string;
  title: string;
  category: RewardCategory;
  celebrationLevel: RewardCelebrationLevel;
  claimedAt: string;
}

export interface RewardProgress {
  rewardId: string;
  current: number;
  target: number;
  state: 'locked' | 'ready' | 'claimed';
  ratio: number;
  definition: RewardDefinition;
  claimedAt?: string;
}

export interface RewardSnapshot {
  metrics: Record<string, number>;
  definitions: RewardDefinition[];
  progress: RewardProgress[];
  ready: RewardProgress[];
  claimed: RewardProgress[];
  upcoming: RewardProgress[];
  byCategory: Record<RewardCategory, RewardProgress[]>;
  categoryMeta: Record<RewardCategory, { label: string; accent: string }>;
  recentClaims: RewardClaimRecord[];
  legacyBadges: {
    unlocked: Badge[];
    locked: Badge[];
    rarestUnlocked: Rarity | null;
  };
}

export interface StreakFreezeUseRecord {
  dateKey: string;
  usedAt: string;
}

export interface MomentumState {
  streak: number;
  bestStreak: number;
  rewardPoints: number;
  lifetimeRewardPoints: number;
  freezeCount: number;
  freezeUses: StreakFreezeUseRecord[];
  lastActiveDateKey?: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  body: string;
  createdAt: string;
  context?: 'dashboard' | 'planner' | 'support';
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  handle: string;
  userClass: UserClass;
  level: number;
  xp: number;
  streak: number;
  rank: number;
  movement: number;
  aura: string;
  isFriend?: boolean;
  isCurrentUser?: boolean;
}

export interface AppState {
  user: User | null;
  quests: Quest[];
  habits: Habit[];
  focusSessions: FocusSession[];
  badges: Badge[];
  currentPage: string;
  isOnboarded: boolean;
  reminders: Reminder[];
  scheduleItems: ScheduleItem[];
  communityMessages: CommunityMessage[];
  communityProfile?: CommunityProfile;
  rewardClaims?: RewardClaimRecord[];
  assistantMessages: AssistantMessage[];
  weeklyBoss?: WeeklyBoss;
  moodByDate?: Record<string, string>;
  lastDailyReset?: string;
  dailyDungeon?: DailyDungeon;
  settings?: Settings;
  momentum?: MomentumState;
}

export type DailyChallengeType = 'quest' | 'habit' | 'focus';

export interface DailyChallenge {
  id: string;
  type: DailyChallengeType;
  refId: string | null;
  status: 'pending' | 'completed';
  titleSnapshot: string;
  completedAt?: number;
}

export interface DailyDungeon {
  dateKey: string;
  challenges: DailyChallenge[];
  rewardClaimed: boolean;
  createdAt: number;
  rewardClaimedAt?: number;
  reward: {
    clearXp: number;
    partialXp: number;
  };
}

export interface Settings {
  dailyDungeonFocusMinMinutes: 15 | 25;
}
