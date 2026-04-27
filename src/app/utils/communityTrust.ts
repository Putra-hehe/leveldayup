import {
  CommunityChannel,
  CommunityMessage,
  CommunityModerationFlag,
  CommunityPostingPolicy,
  CommunityProfile,
  CommunityTrustState,
  FocusSession,
  Habit,
  User,
} from "../types";

interface TrustMeta {
  label: string;
  chipClass: string;
  note: string;
}

export interface CommunityTrustSummary {
  state: CommunityTrustState;
  score: number;
  accountAgeHours: number;
  cooldownSeconds: number;
  visibleSignals: string[];
  note: string;
  reputationScore: number;
}

export interface CommunityModerationResult {
  blocked: boolean;
  flags: CommunityModerationFlag[];
  userMessage?: string;
}

const TRUST_META: Record<CommunityTrustState, TrustMeta> = {
  new: {
    label: "New human",
    chipClass: "border-amber-400/25 bg-amber-400/12 text-amber-100",
    note: "Read-first mode. Post pelan dulu sampai perilaku akun terlihat wajar.",
  },
  verified: {
    label: "Verified human",
    chipClass: "border-white/15 bg-white/[0.08] text-slate-100",
    note: "Boleh posting normal, tetap ada pembatasan ringan untuk jaga kualitas.",
  },
  trusted: {
    label: "Trusted human",
    chipClass: "border-emerald-400/25 bg-emerald-400/12 text-emerald-100",
    note: "Sinyal akun sehat, riwayat interaksi konsisten, dan batas rate lebih longgar.",
  },
  flagged: {
    label: "Flagged",
    chipClass: "border-orange-400/25 bg-orange-400/12 text-orange-100",
    note: "Akun sedang diamati karena pola interaksi terlihat tidak sehat.",
  },
  restricted: {
    label: "Restricted",
    chipClass: "border-rose-400/25 bg-rose-400/12 text-rose-100",
    note: "Posting dibatasi sementara sampai review selesai.",
  },
};

export function createDefaultCommunityProfile(): CommunityProfile {
  return {
    reputationScore: 0,
    reportsSubmitted: 0,
    reportsReceived: 0,
    mutedHandles: [],
    blockedHandles: [],
    lastPostedAtByChannel: {},
    reports: [],
  };
}

export function ensureCommunityProfile(profile?: CommunityProfile): CommunityProfile {
  return {
    ...createDefaultCommunityProfile(),
    ...(profile ?? {}),
    mutedHandles: Array.isArray(profile?.mutedHandles) ? profile?.mutedHandles : [],
    blockedHandles: Array.isArray(profile?.blockedHandles) ? profile?.blockedHandles : [],
    reports: Array.isArray(profile?.reports) ? profile?.reports : [],
    lastPostedAtByChannel:
      profile?.lastPostedAtByChannel && typeof profile.lastPostedAtByChannel === "object"
        ? profile.lastPostedAtByChannel
        : {},
  };
}

function accountAgeHours(joinedDate?: string) {
  if (!joinedDate) return 0;
  const joined = new Date(joinedDate).getTime();
  if (!Number.isFinite(joined)) return 0;
  return Math.max(0, Math.floor((Date.now() - joined) / (1000 * 60 * 60)));
}

function normalizeText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isHumanMessage(message: CommunityMessage) {
  return (message.senderType ?? (message.isAI ? "ai" : "human")) === "human";
}

function recentOwnHumanMessages(messages: CommunityMessage[], user: User) {
  const ownHandle = `@${user.name.toLowerCase().replace(/\s+/g, "")}`;
  return messages.filter((message) => {
    if (!isHumanMessage(message)) return false;
    return message.isOwn || message.handle === ownHandle || message.author === user.name;
  });
}

export function getCommunityTrustMeta(state: CommunityTrustState): TrustMeta {
  return TRUST_META[state];
}

export function getCommunityReputationBand(score: number) {
  if (score >= 18) return { label: "Core member", tone: "text-emerald-200" };
  if (score >= 8) return { label: "Stable signal", tone: "text-cyan-200" };
  if (score >= 1) return { label: "Early signal", tone: "text-slate-200" };
  if (score <= -6) return { label: "Risky signal", tone: "text-rose-200" };
  return { label: "Unproven", tone: "text-amber-200" };
}

export function deriveCommunityTrustSummary(args: {
  user: User;
  messages: CommunityMessage[];
  habits: Habit[];
  focusSessions: FocusSession[];
  profile?: CommunityProfile;
}): CommunityTrustSummary {
  const { user, messages, habits, focusSessions } = args;
  const profile = ensureCommunityProfile(args.profile);
  const ageHours = accountAgeHours(user.joinedDate);
  const ownHumanMessages = recentOwnHumanMessages(messages, user);
  const bestStreak = habits.reduce((best, habit) => Math.max(best, habit.currentStreak, habit.longestStreak), 0);
  const completedFocus = focusSessions.filter((session) => session.completed).length;
  const humanPostCount = ownHumanMessages.filter((message) => message.channel !== "ai-lounge").length;
  const aiUsage = messages.filter((message) => message.isOwn && message.channel === "ai-lounge").length;

  let score = 0;
  if (user.email?.includes("@")) score += 1;
  if (ageHours >= 24) score += 1;
  if (ageHours >= 24 * 7) score += 1;
  if (humanPostCount >= 2) score += 1;
  if (completedFocus >= 3) score += 1;
  if (bestStreak >= 3) score += 1;
  if (aiUsage >= 1) score += 1;
  if (profile.reputationScore >= 4) score += 1;
  if (profile.reputationScore >= 12) score += 1;
  if (profile.reportsReceived >= 2) score -= 2;

  let state: CommunityTrustState = "new";
  if (profile.reportsReceived >= 4 || profile.reputationScore <= -6) state = "restricted";
  else if (profile.reportsReceived >= 2 || profile.reputationScore < 0) state = "flagged";
  else if (score >= 7) state = "trusted";
  else if (score >= 3) state = "verified";

  const visibleSignals = [
    user.email?.includes("@") ? "Email connected" : undefined,
    ageHours >= 24 ? "Account older than 24h" : undefined,
    humanPostCount >= 1 ? `${humanPostCount} human posts` : undefined,
    completedFocus >= 3 ? `${completedFocus} completed focus sessions` : undefined,
    bestStreak >= 3 ? `${bestStreak}-day consistency streak` : undefined,
    profile.reputationScore >= 4 ? `Community reputation ${profile.reputationScore}` : undefined,
    profile.reportsReceived > 0 ? `${profile.reportsReceived} report signal(s)` : undefined,
  ].filter((value): value is string => Boolean(value));

  const cooldownSeconds =
    state === "trusted"
      ? 10
      : state === "verified"
      ? 25
      : state === "flagged"
      ? 120
      : 90;

  return {
    state,
    score,
    accountAgeHours: ageHours,
    cooldownSeconds,
    visibleSignals,
    note: TRUST_META[state].note,
    reputationScore: profile.reputationScore,
  };
}

export function getPostingCooldownRemaining(args: {
  channel: CommunityChannel;
  cooldownSeconds: number;
  profile?: CommunityProfile;
}) {
  const profile = ensureCommunityProfile(args.profile);
  const postedAt = profile.lastPostedAtByChannel[args.channel];
  if (!postedAt || !args.cooldownSeconds) return 0;

  const diff = Math.floor((Date.now() - new Date(postedAt).getTime()) / 1000);
  return Math.max(0, args.cooldownSeconds - diff);
}

export function buildCommunityPostingPolicy(args: {
  channel: CommunityChannel;
  trust: CommunityTrustSummary;
  profile?: CommunityProfile;
}): CommunityPostingPolicy {
  const { channel, trust } = args;
  const profile = ensureCommunityProfile(args.profile);
  const remaining = getPostingCooldownRemaining({
    channel,
    cooldownSeconds: trust.cooldownSeconds,
    profile,
  });

  if (channel === "ai-lounge") {
    return {
      canPost: true,
      mode: "open",
      cooldownSeconds: 0,
      message: "AI lounge is always available. The AI label stays visible on every reply.",
      trustState: trust.state,
    };
  }

  if (trust.state === "restricted") {
    return {
      canPost: false,
      mode: "restricted",
      cooldownSeconds: 0,
      message: "Posting temporarily limited while the account is being reviewed.",
      trustState: trust.state,
    };
  }

  if (trust.accountAgeHours < 6) {
    return {
      canPost: false,
      mode: "warmup",
      cooldownSeconds: 0,
      message: "Human rooms use a read-first warm-up. Let the account age a little before posting.",
      trustState: trust.state,
    };
  }

  if (remaining > 0) {
    return {
      canPost: false,
      mode: trust.state === "flagged" ? "review" : "slow",
      cooldownSeconds: remaining,
      message: `Please wait ${remaining}s before posting again in this room. Slow mode protects readability and trust.`,
      trustState: trust.state,
    };
  }

  if (trust.state === "new") {
    return {
      canPost: true,
      mode: "slow",
      cooldownSeconds: trust.cooldownSeconds,
      message: "Slow mode is active. New accounts can post, but at a slower pace to keep rooms readable.",
      trustState: trust.state,
    };
  }

  if (trust.state === "flagged") {
    return {
      canPost: true,
      mode: "review",
      cooldownSeconds: trust.cooldownSeconds,
      message: "Posts may be delayed for review because the account triggered trust heuristics.",
      trustState: trust.state,
    };
  }

  return {
    canPost: true,
    mode: "open",
    cooldownSeconds: trust.cooldownSeconds,
    message:
      trust.state === "trusted"
        ? "Trusted accounts keep faster posting limits, but human rooms stay AI-free."
        : "Verified accounts can post normally. Identity remains visible on every message.",
    trustState: trust.state,
  };
}

export function moderateCommunityDraft(args: {
  channel: CommunityChannel;
  draft: string;
  messages: CommunityMessage[];
  user: User;
}): CommunityModerationResult {
  const { channel, draft, messages, user } = args;
  const trimmed = draft.trim();
  const flags: CommunityModerationFlag[] = [];

  if (!trimmed) {
    return {
      blocked: true,
      flags: [{ type: "empty", severity: "low", reason: "Empty message" }],
      userMessage: "Write something meaningful first.",
    };
  }

  if (channel !== "ai-lounge" && trimmed.length < 4) {
    flags.push({ type: "low-signal", severity: "medium", reason: "Message too short for human rooms" });
  }

  const normalized = normalizeText(trimmed);
  const ownRecent = recentOwnHumanMessages(messages, user).slice(-5);
  const duplicateCount = ownRecent.filter((message) => normalizeText(message.body) === normalized).length;
  if (duplicateCount >= 1) {
    flags.push({ type: "duplicate", severity: "high", reason: "Duplicate recent message" });
  }

  const linkCount = (trimmed.match(/https?:\/\//g) || []).length;
  if (channel !== "ai-lounge" && linkCount > 0) {
    flags.push({ type: "link", severity: "medium", reason: "Links are restricted in human rooms during early trust phases" });
  }

  const mentionCount = (trimmed.match(/@/g) || []).length;
  if (mentionCount >= 3) {
    flags.push({ type: "mention-burst", severity: "high", reason: "Too many mentions in one message" });
  }

  const uppercaseRatio = trimmed.replace(/[^A-Z]/g, "").length / Math.max(trimmed.replace(/\s/g, "").length, 1);
  if (trimmed.length > 14 && uppercaseRatio > 0.65) {
    flags.push({ type: "shouting", severity: "medium", reason: "Too much uppercase text" });
  }

  const blocked = flags.some((flag) => flag.severity === "high");

  return {
    blocked,
    flags,
    userMessage: blocked
      ? "Message looks spammy or repetitive. Please slow down and rewrite it more naturally."
      : flags.length
      ? "Message can be sent, but the system may slow it down if the room gets noisy."
      : undefined,
  };
}

export function isHandleSuppressed(handle: string, profile?: CommunityProfile) {
  const safeProfile = ensureCommunityProfile(profile);
  return safeProfile.mutedHandles.includes(handle) || safeProfile.blockedHandles.includes(handle);
}
