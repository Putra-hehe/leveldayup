import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

import { db } from "../firebase";
import { CommunityChannel, CommunityMessage, FocusSession, Habit, LeaderboardEntry, MomentumState, User, UserClass } from "../types";
import { createId } from "./id";

const LEADERBOARD_COLLECTION = "leaderboard_public";

function entryScore(entry: Pick<LeaderboardEntry, "level" | "xp" | "streak">) {
  return entry.level * 600 + entry.xp * 3 + entry.streak * 45;
}

function rankEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries]
    .sort((a, b) => entryScore(b) - entryScore(a))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function deriveAura(userClass: UserClass, streak: number) {
  if (userClass === "creator") return streak >= 7 ? "Peracik Momentum" : "Penjaga Ide";
  if (userClass === "warrior") return streak >= 7 ? "Pelari Tekanan" : "Bara Disiplin";
  return streak >= 7 ? "Arsitek Fokus" : "Analis Tenang";
}

function bestHabitStreak(habits: Habit[] = []) {
  return habits.reduce((max, habit) => Math.max(max, habit.currentStreak, habit.longestStreak), 0);
}

function bestLeaderboardStreak(habits: Habit[] = [], momentum?: MomentumState) {
  const momentumBest = Math.max(momentum?.streak ?? 0, momentum?.bestStreak ?? 0);
  return Math.max(bestHabitStreak(habits), momentumBest);
}

function buildCurrentUserEntry(
  user: User,
  habits: Habit[],
  focusSessions: FocusSession[],
  momentum?: MomentumState,
): LeaderboardEntry {
  const streak = bestLeaderboardStreak(habits, momentum);
  const completedFocusCount = focusSessions.filter((session) => session.completed).length;

  return {
    id: user.id,
    name: user.name,
    handle: `@${(user.name || "user").toLowerCase().replace(/\s+/g, "")}`,
    userClass: user.userClass,
    level: user.level,
    xp: user.totalXP || user.xp,
    streak,
    movement: completedFocusCount >= 3 ? 1 : 0,
    aura: deriveAura(user.userClass, streak),
    rank: 0,
    isCurrentUser: true,
  };
}

function mapPublicLeaderboardDoc(docId: string, raw: Record<string, unknown>, currentUserId: string): LeaderboardEntry | null {
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) return null;

  const userClass = (raw.userClass as UserClass | undefined) || "scholar";
  const streak = Number.isFinite(Number(raw.streak)) ? Number(raw.streak) : 0;
  const level = Number.isFinite(Number(raw.level)) ? Number(raw.level) : 1;
  const xp = Number.isFinite(Number(raw.totalXP ?? raw.xp)) ? Number(raw.totalXP ?? raw.xp) : 0;
  const movement = Number.isFinite(Number(raw.movement)) ? Number(raw.movement) : 0;

  return {
    id: typeof raw.userId === "string" ? raw.userId : docId,
    name,
    handle: typeof raw.handle === "string" && raw.handle.trim() ? raw.handle.trim() : `@${name.toLowerCase().replace(/\s+/g, "")}`,
    userClass,
    level,
    xp,
    streak,
    movement,
    aura: typeof raw.aura === "string" && raw.aura.trim() ? raw.aura.trim() : deriveAura(userClass, streak),
    rank: 0,
    isCurrentUser: (typeof raw.userId === "string" ? raw.userId : docId) === currentUserId,
  };
}

export async function loadLeaderboardEntries(
  user: User | null,
  habits: Habit[],
  focusSessions: FocusSession[],
  momentum?: MomentumState,
) {
  if (!user) return { global: [] as LeaderboardEntry[], friends: [] as LeaderboardEntry[] };

  const fallbackCurrentUser = buildCurrentUserEntry(user, habits, focusSessions, momentum);

  try {
    const leaderboardQuery = query(collection(db, LEADERBOARD_COLLECTION), orderBy("score", "desc"), limit(50));
    const snapshot = await getDocs(leaderboardQuery);
    const entries: LeaderboardEntry[] = [];

    snapshot.forEach((docItem) => {
      const mapped = mapPublicLeaderboardDoc(docItem.id, docItem.data() as Record<string, unknown>, user.id);
      if (mapped) entries.push(mapped);
    });

    const deduped = new Map<string, LeaderboardEntry>();
    [fallbackCurrentUser, ...entries].forEach((entry) => {
      const existing = deduped.get(entry.id);
      if (!existing || entryScore(entry) >= entryScore(existing)) {
        deduped.set(entry.id, entry);
      }
    });

    const global = rankEntries([...deduped.values()]);
    const friends = global.filter((entry) => entry.isCurrentUser);

    return { global, friends };
  } catch (error) {
    console.warn("[Leaderboard] Failed to load public leaderboard:", error);
    const global = rankEntries([fallbackCurrentUser]);
    return { global, friends: global.filter((entry) => entry.isCurrentUser) };
  }
}

function makeTimestamp(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

export function createStarterCommunityMessages(user?: User | null): CommunityMessage[] {
  const learnerHandle = user ? `@${user.name.toLowerCase().replace(/\s+/g, "")}` : "@hero";

  return [
    {
      id: createId("msg"),
      channel: "global",
      author: "Levelday Trust",
      handle: "@levelday",
      body: "Global chat khusus untuk aktivitas manusia asli. Kami tidak mensimulasikan keramaian di sini.",
      createdAt: makeTimestamp(1.2),
      vibe: "trust",
      senderType: "system",
    },
    {
      id: createId("msg"),
      channel: "friends",
      author: "Levelday Trust",
      handle: "@levelday",
      body: "Friends chat hanya menampilkan pesan dari kamu atau koneksi nyata. Tidak ada akun rekayasa.",
      createdAt: makeTimestamp(1.0),
      vibe: "trust",
      senderType: "system",
    },
    {
      id: createId("msg"),
      channel: "ai-lounge",
      author: "Levelday AI",
      handle: "@ai",
      body: "Selamat datang di AI Lounge. Ruang ini khusus AI supaya kamu selalu tahu kapan sedang bicara dengan sistem, bukan manusia.",
      createdAt: makeTimestamp(0.4),
      userClass: "scholar",
      vibe: "support",
      isAI: true,
      senderType: "ai",
      trustState: "trusted",
    },
    {
      id: createId("msg"),
      channel: "ai-lounge",
      author: user?.name || "Kamu",
      handle: learnerHandle,
      body: "Bantu aku bikin restart yang rapi untuk dua jam ke depan.",
      createdAt: makeTimestamp(0.2),
      userClass: user?.userClass || "scholar",
      vibe: "planning",
      isOwn: true,
      senderType: "human",
      trustState: "verified",
    },
  ];
}

export function createCommunityAutoReply(channel: CommunityChannel, prompt: string): CommunityMessage {
  const trimmedPrompt = prompt.trim();
  const nextMove = trimmedPrompt.length > 90 ? `${trimmedPrompt.slice(0, 90)}...` : trimmedPrompt;

  return {
    id: createId("msg"),
    channel,
    author: "Levelday AI",
    handle: "@ai",
    body: `Aku menangkap poin ini: ${nextMove}\nLangkah berikut yang paling aman adalah melindungi satu blok kerja yang benar-benar bisa selesai.`,
    createdAt: new Date().toISOString(),
    userClass: "scholar",
    vibe: "support",
    isAI: true,
    senderType: "ai",
    trustState: "trusted",
  };
}
