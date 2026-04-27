import { AssistantMessage, Habit, Quest, Reminder, ScheduleItem, User } from "../types";
import { createId } from "./id";
import { isoToLocalDateKey, toLocalDateKey } from "./date";
import { ChatCompletionMessage, requestChatCompletion, resolveAIExecutionConfig } from "./aiClient";

interface AssistantContext {
  user: User | null;
  quests: Quest[];
  habits: Habit[];
  reminders: Reminder[];
  scheduleItems: ScheduleItem[];
  mood?: string;
  dateKey?: string;
}

function dueSoonQuests(quests: Quest[], dateKey: string) {
  return quests.filter((quest) => {
    if (quest.status === "completed") return false;
    const dueKey = isoToLocalDateKey(quest.dueDate);
    return !dueKey || dueKey <= dateKey;
  });
}

function activeReminders(reminders: Reminder[], dateKey: string) {
  return reminders.filter((reminder) => reminder.dateKey === dateKey && !reminder.completed);
}

function todayBlocks(scheduleItems: ScheduleItem[], dateKey: string) {
  return scheduleItems.filter((item) => item.dateKey === dateKey);
}

function breakdownText(quest?: Quest) {
  if (!quest) {
    return [
      "1. Tentukan hasil kecil yang mau terlihat.",
      "2. Kerjakan fokus 15 menit.",
      "3. Berhenti saat kamu sudah tahu langkah berikutnya.",
    ].join("\n");
  }

  const defaultSteps = [
    `Buka semua hal yang dibutuhkan untuk ${quest.title.toLowerCase()}.`,
    "Selesaikan bagian terkecil yang tetap punya hasil nyata.",
    "Tinggalkan catatan singkat agar mudah lanjut lagi.",
  ];

  const subtasks = quest.subtasks?.length ? quest.subtasks.map((subtask) => subtask.title) : defaultSteps;
  return subtasks
    .slice(0, 3)
    .map((step, index) => `${index + 1}. ${step}`)
    .join("\n");
}

function getSystemPrompt(context: AssistantContext) {
  const todayKey = context.dateKey || toLocalDateKey(new Date());
  const urgentQuests = dueSoonQuests(context.quests, todayKey).slice(0, 3);
  const reminderList = activeReminders(context.reminders, todayKey).slice(0, 3);
  const blocks = todayBlocks(context.scheduleItems, todayKey).slice(0, 4);
  const strongestHabit = [...context.habits].sort((a, b) => b.currentStreak - a.currentStreak)[0];

  return [
    "Kamu adalah AI planner Levelday untuk pengguna Indonesia.",
    "Gaya bicara harus hangat, ringkas, taktis, manusiawi, dan tidak norak.",
    "Selalu jelas bahwa kamu AI, bukan manusia.",
    "Utamakan Bahasa Indonesia natural yang cepat dipahami.",
    "Jangan terlalu panjang. Default 4 sampai 8 kalimat kecuali user minta detail.",
    "Kalau user bingung atau capek, sederhanakan dan beri langkah yang bisa langsung dijalankan.",
    "Kalau cocok, beri 2 sampai 4 langkah konkret atau opsi berikutnya.",
    "Jangan memuji berlebihan. Fokus pada membantu user bergerak maju.",
    context.user ? `Nama user: ${context.user.name}. Kelas user: ${context.user.userClass}.` : "",
    context.mood ? `Mood hari ini: ${context.mood}.` : "",
    urgentQuests.length
      ? `Quest penting saat ini: ${urgentQuests.map((quest) => quest.title).join(", ")}.`
      : "Belum ada quest penting yang aktif.",
    reminderList.length
      ? `Reminder aktif hari ini: ${reminderList.map((item) => `${item.time} ${item.title}`).join(" | ")}.`
      : "Belum ada reminder aktif hari ini.",
    blocks.length
      ? `Blok jadwal hari ini: ${blocks.map((item) => `${item.startTime}-${item.endTime} ${item.title}`).join(" | ")}.`
      : "Belum ada blok jadwal hari ini.",
    strongestHabit
      ? `Habit terkuat user: ${strongestHabit.title} dengan streak ${strongestHabit.currentStreak}.`
      : "Belum ada habit kuat yang bisa dijadikan anchor.",
  ]
    .filter(Boolean)
    .join("\n");
}

function toHistoryMessages(history: AssistantMessage[] = []): ChatCompletionMessage[] {
  return history.slice(-6).map((message) => ({
    role: message.role,
    content: message.body,
  }));
}

export function createStarterAssistantMessages(userName = "Hunter"): AssistantMessage[] {
  return [
    {
      id: createId("assistant"),
      role: "assistant",
      body: `Halo ${userName}, aku AI planner Levelday. Aku bisa bantu kamu nyusun langkah berikutnya, bikin rencana singkat, atau ngerapihin pikiran saat lagi mentok.`,
      createdAt: new Date().toISOString(),
      context: "dashboard",
    },
  ];
}

export function buildAssistantReply(prompt: string, context: AssistantContext): AssistantMessage {
  const dateKey = context.dateKey || toLocalDateKey(new Date());
  const cleaned = prompt.trim();
  const lower = cleaned.toLowerCase();
  const urgentQuests = dueSoonQuests(context.quests, dateKey);
  const topQuest = urgentQuests[0];
  const remindersToday = activeReminders(context.reminders, dateKey);
  const blocksToday = todayBlocks(context.scheduleItems, dateKey);
  const bestHabit = [...context.habits].sort((a, b) => b.currentStreak - a.currentStreak)[0];

  let body = "";

  if (
    lower.includes("stuck") ||
    lower.includes("overwhelmed") ||
    lower.includes("bingung") ||
    lower.includes("capek") ||
    lower.includes("mentok")
  ) {
    body = [
      "Turunkan tekanannya dulu. Kamu tidak perlu beresin semuanya sekarang.",
      topQuest
        ? `Mulai dari langkah kecil ini: buka ${topQuest.title.toLowerCase()} lalu kerjakan sampai ada satu hasil yang kelihatan.`
        : "Mulai dari satu blok 10 menit untuk tugas yang paling bikin kepikiran.",
      remindersToday[0]
        ? `Kamu sudah punya cue di jam ${remindersToday[0].time}. Pakai itu sebagai sinyal mulai ulang.`
        : "Pasang satu sinyal mulai ulang, lalu jalan sebelum motivasi datang.",
    ].join("\n\n");
  } else if (
    lower.includes("plan") ||
    lower.includes("schedule") ||
    lower.includes("jadwal") ||
    lower.includes("hari ini") ||
    lower.includes("rencana")
  ) {
    body = [
      blocksToday.length
        ? `Blok terkuatmu hari ini mulai jam ${blocksToday[0].startTime} untuk ${blocksToday[0].title.toLowerCase()}.`
        : "Jadwalmu masih cukup longgar untuk dibentuk. Mulai dari satu blok fokus yang sengaja dijaga, lalu sisakan ruang recovery.",
      topQuest
        ? `Taruh ${topQuest.title.toLowerCase()} di bagian awal hari sebelum tugas yang lebih ringan.`
        : "Taruh tugas paling penting lebih dulu meski bentuknya masih belum rapi.",
      "Kalau mau, aku bisa bantu pecah jadi urutan 2 jam ke depan yang lebih realistis.",
    ].join("\n\n");
  } else if (
    lower.includes("break") ||
    lower.includes("step") ||
    lower.includes("subtask") ||
    lower.includes("pecah")
  ) {
    body = `Oke, kita pecah dulu.\n\n${breakdownText(topQuest)}\n\nFokus dulu ke langkah pertama. Jangan pikirkan semuanya sekaligus.`;
  } else if (lower.includes("motivate") || lower.includes("motivation") || lower.includes("semangat")) {
    body = [
      "Momentum tidak datang dari nunggu mood yang pas. Momentum datang dari langkah berikutnya yang cukup kecil untuk dijalankan.",
      topQuest
        ? `Target paling bersihmu sekarang adalah ${topQuest.title.toLowerCase()}. Selesaikan satu bagian, lalu biarkan progres yang bikin semangat.`
        : "Pilih satu blok yang berarti lalu biarkan rasa selesai jadi pemicu berikutnya.",
      bestHabit
        ? `Streak terbaikmu sekarang ${bestHabit.currentStreak} di ${bestHabit.title.toLowerCase()}. Pakai identitas itu sebagai anchor.`
        : "Anggap dirimu sebagai orang yang tetap jalan meski harinya tidak ideal.",
    ].join("\n\n");
  } else {
    body = [
      "Aku bisa bantu nurunin overwhelm, nentuin langkah berikutnya, bikin rencana singkat, atau mecah tugas jadi bagian kecil.",
      topQuest
        ? `Target paling actionable saat ini adalah ${topQuest.title.toLowerCase()}.`
        : "Sistemmu sekarang paling butuh satu prioritas yang kelihatan jelas.",
      context.mood === "overwhelmed"
        ? "Karena mood hari ini lagi berat, mulai dari blok 10 sampai 15 menit dulu sebelum nambah beban."
        : "Ketik kebutuhanmu dengan gaya santai, aku akan bantu rapiin jadi langkah nyata.",
    ].join("\n\n");
  }

  return {
    id: createId("assistant"),
    role: "assistant",
    body,
    createdAt: new Date().toISOString(),
    context: "support",
  };
}

async function fetchProviderAssistantReply(
  prompt: string,
  context: AssistantContext,
  history: AssistantMessage[] = [],
) {
  const execution = resolveAIExecutionConfig();
  const messages: ChatCompletionMessage[] = [
    { role: "system", content: getSystemPrompt(context) },
    ...toHistoryMessages(history),
    { role: "user", content: prompt.trim() },
  ];

  return requestChatCompletion({
    messages,
    temperature: execution.provider === "groq" ? 0.65 : 0.7,
    maxCompletionTokens: 420,
  });
}

export async function generateAssistantReply(
  prompt: string,
  context: AssistantContext,
  history: AssistantMessage[] = [],
): Promise<AssistantMessage> {
  try {
    const body = await fetchProviderAssistantReply(prompt, context, history);
    return {
      id: createId("assistant"),
      role: "assistant",
      body,
      createdAt: new Date().toISOString(),
      context: "support",
    };
  } catch (error) {
    console.warn("[AI Assistant] Falling back to local planner reply:", error);
    return buildAssistantReply(prompt, context);
  }
}
