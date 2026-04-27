import * as admin from "firebase-admin";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret, defineString } from "firebase-functions/params";

admin.initializeApp();

const REGION = process.env.FUNCTION_REGION || "asia-southeast1";
const GROQ_API_KEY = defineSecret("GROQ_API_KEY");
const GROQ_MODEL = defineString("GROQ_MODEL", { default: "llama-3.3-70b-versatile" });
const GROQ_SERVICE_TIER = defineString("GROQ_SERVICE_TIER", { default: "on_demand" });

function sanitizeMessages(raw: unknown) {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const role = typeof (item as { role?: unknown }).role === "string" ? (item as { role: string }).role : "user";
      const content = typeof (item as { content?: unknown }).content === "string" ? (item as { content: string }).content.trim() : "";
      if (!content) return null;
      if (!["system", "user", "assistant"].includes(role)) return null;
      return { role, content: content.slice(0, 6000) };
    })
    .filter(Boolean) as Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

export const aiChatProxy = onCall(
  {
    region: REGION,
    secrets: [GROQ_API_KEY],
    maxInstances: 20,
    timeoutSeconds: 60,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Login diperlukan untuk memakai AI.");
    }

    const messages = sanitizeMessages(request.data?.messages);
    if (!messages.length) {
      throw new HttpsError("invalid-argument", "messages wajib berisi percakapan yang valid.");
    }

    const temperature = Number.isFinite(Number(request.data?.temperature)) ? Number(request.data.temperature) : 0.7;
    const maxCompletionTokens = Number.isFinite(Number(request.data?.maxCompletionTokens))
      ? Math.min(1200, Math.max(120, Number(request.data.maxCompletionTokens)))
      : 420;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY.value()}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL.value(),
        service_tier: GROQ_SERVICE_TIER.value(),
        temperature,
        max_completion_tokens: maxCompletionTokens,
        messages,
      }),
    });

    const data = (await response.json().catch(() => null)) as any;
    if (!response.ok) {
      throw new HttpsError("internal", data?.error?.message || "Groq request gagal.");
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      throw new HttpsError("internal", "Groq tidak mengembalikan konten yang valid.");
    }

    return {
      content: content.trim(),
      provider: "groq",
      model: GROQ_MODEL.value(),
    };
  },
);

function deriveAura(userClass: string, streak: number) {
  if (userClass === "creator") return streak >= 7 ? "Peracik Momentum" : "Penjaga Ide";
  if (userClass === "warrior") return streak >= 7 ? "Pelari Tekanan" : "Bara Disiplin";
  return streak >= 7 ? "Arsitek Fokus" : "Analis Tenang";
}

function bestHabitStreak(habits: Array<{ currentStreak?: unknown; longestStreak?: unknown }> = []) {
  return habits.reduce((max, habit) => {
    const current = Number.isFinite(Number(habit.currentStreak)) ? Number(habit.currentStreak) : 0;
    const longest = Number.isFinite(Number(habit.longestStreak)) ? Number(habit.longestStreak) : 0;
    return Math.max(max, current, longest);
  }, 0);
}

function bestMomentumStreak(momentum?: { streak?: unknown; bestStreak?: unknown } | null) {
  const streak = Number.isFinite(Number(momentum?.streak)) ? Number(momentum?.streak) : 0;
  const bestStreak = Number.isFinite(Number(momentum?.bestStreak)) ? Number(momentum?.bestStreak) : 0;
  return Math.max(streak, bestStreak);
}

export const syncLeaderboardPublic = onDocumentWritten(
  {
    document: "appState/{userId}",
    region: REGION,
    retry: false,
  },
  async (event) => {
    const userId = event.params.userId as string;
    const after = event.data?.after;
    const ref = admin.firestore().collection("leaderboard_public").doc(userId);

    if (!after?.exists) {
      await ref.delete().catch(() => undefined);
      return;
    }

    const data = after.data() as any;
    const user = data?.user;
    if (!user?.id || !user?.name) {
      await ref.delete().catch(() => undefined);
      return;
    }

    const habits = Array.isArray(data?.habits) ? data.habits : [];
    const focusSessions = Array.isArray(data?.focusSessions) ? data.focusSessions : [];
    const momentum = data?.momentum && typeof data.momentum === "object" ? data.momentum : undefined;
    const streak = Math.max(bestHabitStreak(habits), bestMomentumStreak(momentum));
    const totalXP = Number.isFinite(Number(user.totalXP ?? user.xp)) ? Number(user.totalXP ?? user.xp) : 0;
    const level = Number.isFinite(Number(user.level)) ? Number(user.level) : 1;
    const movement = focusSessions.filter((session: any) => session?.completed).length >= 3 ? 1 : 0;
    const userClass = typeof user.userClass === "string" ? user.userClass : "scholar";
    const score = level * 600 + totalXP * 3 + streak * 45;

    await ref.set(
      {
        userId: user.id,
        name: String(user.name).slice(0, 60),
        handle: `@${String(user.name).toLowerCase().replace(/\s+/g, "").slice(0, 24)}`,
        userClass,
        level,
        totalXP,
        streak,
        movement,
        aura: deriveAura(userClass, streak),
        score,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  },
);
