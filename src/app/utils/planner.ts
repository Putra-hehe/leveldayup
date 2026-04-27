import { Habit, Quest, Reminder, ScheduleItem, ScheduleLane, User } from "../types";
import { createId } from "./id";
import { isoToLocalDateKey, toLocalDateKey } from "./date";
import { ChatCompletionMessage, requestChatCompletion, resolveAIExecutionConfig } from "./aiClient";

export type PlanningMode = "locked-in" | "steady" | "recovery";

export interface AIDayDraft {
  headline: string;
  summary: string;
  narrative: string[];
  blocks: ScheduleItem[];
  reminders: Reminder[];
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function parseTimeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map((value) => Number(value));
  return (hours || 0) * 60 + (minutes || 0);
}

export function minutesToTime(totalMinutes: number) {
  const safe = Math.max(0, totalMinutes);
  const hours = Math.floor(safe / 60) % 24;
  const minutes = safe % 60;
  return `${pad(hours)}:${pad(minutes)}`;
}

function addBlock(
  blocks: ScheduleItem[],
  dateKey: string,
  title: string,
  startMinutes: number,
  duration: number,
  lane: ScheduleLane,
  note?: string,
  source: "manual" | "ai" = "ai",
  linkedQuestId?: string,
) {
  const endMinutes = startMinutes + duration;
  blocks.push({
    id: createId("slot"),
    title,
    note,
    dateKey,
    startTime: minutesToTime(startMinutes),
    endTime: minutesToTime(endMinutes),
    lane,
    source,
    linkedQuestId,
  });
  return endMinutes;
}

function readableDay(dateKey: string) {
  const dt = new Date(`${dateKey}T12:00:00`);
  return dt.toLocaleDateString("id-ID", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

function questPriorityValue(quest: Quest, dateKey: string) {
  const dueKey = isoToLocalDateKey(quest.dueDate) || dateKey;
  const duePressure = dueKey <= dateKey ? 2 : 0;
  const weeklyBoost = quest.isWeekly ? 1 : 0;
  const difficultyBoost = quest.difficulty === "hard" ? 2 : quest.difficulty === "normal" ? 1 : 0;
  return duePressure * 10 + weeklyBoost * 4 + difficultyBoost * 2;
}

function pickRelevantQuests(quests: Quest[], dateKey: string) {
  return [...quests]
    .filter((quest) => quest.status !== "completed")
    .sort((a, b) => questPriorityValue(b, dateKey) - questPriorityValue(a, dateKey))
    .slice(0, 3);
}

function pickRelevantHabits(habits: Habit[]) {
  return habits.slice(0, 2);
}

export function sortScheduleItems(items: ScheduleItem[]) {
  return [...items].sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
}

export function createStarterReminders(goalTrack = "assignments", dateKey = toLocalDateKey(new Date())): Reminder[] {
  const nextDate = new Date(`${dateKey}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + 1);
  const tomorrowKey = toLocalDateKey(nextDate);

  const goalSpecific: Record<string, Reminder[]> = {
    assignments: [
      {
        id: createId("rem"),
        title: "Mulai draft pertama yang masih berantakan",
        note: "Yang penting bergerak dulu, bukan langsung rapi.",
        dateKey,
        time: "09:00",
        type: "quest",
        completed: false,
        source: "manual",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId("rem"),
        title: "Kemasi deadline berikutnya jadi satu sprint",
        note: "Pilih bagian terkecil yang tetap kelihatan hasilnya.",
        dateKey: tomorrowKey,
        time: "20:30",
        type: "focus",
        completed: false,
        source: "manual",
        createdAt: new Date().toISOString(),
      },
    ],
    "exam-prep": [
      {
        id: createId("rem"),
        title: "Latihan recall satu ronde",
        note: "Lima menit pertama tanpa lihat catatan.",
        dateKey,
        time: "08:30",
        type: "focus",
        completed: false,
        source: "manual",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId("rem"),
        title: "Tinjau bab yang paling lemah",
        note: "Tambal yang bocor, jangan baca ulang semuanya.",
        dateKey: tomorrowKey,
        time: "19:30",
        type: "quest",
        completed: false,
        source: "manual",
        createdAt: new Date().toISOString(),
      },
    ],
    consistency: [
      {
        id: createId("rem"),
        title: "Buka ritual dan mulai",
        note: "Dua menit juga cukup untuk dihitung sebagai start.",
        dateKey,
        time: "07:30",
        type: "habit",
        completed: false,
        source: "manual",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId("rem"),
        title: "Tentukan langkah pertama besok",
        dateKey,
        time: "21:00",
        type: "life",
        completed: false,
        source: "manual",
        createdAt: new Date().toISOString(),
      },
    ],
    portfolio: [
      {
        id: createId("rem"),
        title: "Rilis satu update yang terlihat",
        note: "Kemajuan yang bisa dilihat lebih penting daripada perfeksionisme tersembunyi.",
        dateKey,
        time: "10:00",
        type: "quest",
        completed: false,
        source: "manual",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId("rem"),
        title: "Catat build notes sebelum tutup hari",
        dateKey,
        time: "20:45",
        type: "life",
        completed: false,
        source: "manual",
        createdAt: new Date().toISOString(),
      },
    ],
    fitness: [
      {
        id: createId("rem"),
        title: "Lindungi sesi utama",
        note: "Siapkan perlengkapan dari awal.",
        dateKey,
        time: "06:30",
        type: "habit",
        completed: false,
        source: "manual",
        createdAt: new Date().toISOString(),
      },
      {
        id: createId("rem"),
        title: "Catat recovery sebelum tidur",
        dateKey,
        time: "21:15",
        type: "life",
        completed: false,
        source: "manual",
        createdAt: new Date().toISOString(),
      },
    ],
  };

  return goalSpecific[goalTrack] || goalSpecific.assignments;
}

export function createStarterSchedule(dateKey = toLocalDateKey(new Date()), goalTrack = "assignments"): ScheduleItem[] {
  const library: Record<string, ScheduleItem[]> = {
    assignments: [
      {
        id: createId("slot"),
        title: "Pemetaan misi",
        note: "Tentukan satu deadline yang paling penting hari ini.",
        dateKey,
        startTime: "08:30",
        endTime: "08:50",
        lane: "admin",
        source: "manual",
      },
      {
        id: createId("slot"),
        title: "Kerja mendalam: draft pertama",
        note: "Kejar halaman yang nyata, bukan rapi dulu.",
        dateKey,
        startTime: "09:00",
        endTime: "10:15",
        lane: "deep-work",
        source: "manual",
      },
      {
        id: createId("slot"),
        title: "Jalan reset",
        note: "Jauhkan diri sebentar sebelum sprint kedua.",
        dateKey,
        startTime: "10:15",
        endTime: "10:30",
        lane: "recovery",
        source: "manual",
      },
    ],
    "exam-prep": [
      {
        id: createId("slot"),
        title: "Pemanasan recall",
        note: "Putaran pertama tanpa lihat catatan.",
        dateKey,
        startTime: "08:00",
        endTime: "08:20",
        lane: "ritual",
        source: "manual",
      },
      {
        id: createId("slot"),
        title: "Blok drill fokus",
        note: "Tambal topik terlemah saja.",
        dateKey,
        startTime: "08:30",
        endTime: "09:40",
        lane: "deep-work",
        source: "manual",
      },
      {
        id: createId("slot"),
        title: "Reset memori",
        dateKey,
        startTime: "09:40",
        endTime: "10:00",
        lane: "recovery",
        source: "manual",
      },
    ],
    consistency: [
      {
        id: createId("slot"),
        title: "Ritual pembuka kecil",
        note: "Mulai sebelum motivasi sempat menawar.",
        dateKey,
        startTime: "07:30",
        endTime: "07:45",
        lane: "ritual",
        source: "manual",
      },
      {
        id: createId("slot"),
        title: "Satu sprint terlindungi",
        note: "45 menit nyata tetap berarti.",
        dateKey,
        startTime: "08:00",
        endTime: "08:45",
        lane: "deep-work",
        source: "manual",
      },
      {
        id: createId("slot"),
        title: "Persiapan tutup hari",
        dateKey,
        startTime: "20:30",
        endTime: "20:50",
        lane: "admin",
        source: "manual",
      },
    ],
    portfolio: [
      {
        id: createId("slot"),
        title: "Ignisi kreatif",
        note: "Buka referensi dan pilih bagian yang bisa terlihat hasilnya.",
        dateKey,
        startTime: "09:00",
        endTime: "09:20",
        lane: "ritual",
        source: "manual",
      },
      {
        id: createId("slot"),
        title: "Blok build",
        note: "Dorong satu bagian ke kondisi yang bisa ditunjukkan.",
        dateKey,
        startTime: "09:30",
        endTime: "10:45",
        lane: "deep-work",
        source: "manual",
      },
      {
        id: createId("slot"),
        title: "Tangkap dan poles",
        dateKey,
        startTime: "11:00",
        endTime: "11:30",
        lane: "admin",
        source: "manual",
      },
    ],
    fitness: [
      {
        id: createId("slot"),
        title: "Persiapan dan pemanasan",
        note: "Buat memulai terasa tanpa gesekan.",
        dateKey,
        startTime: "06:30",
        endTime: "06:50",
        lane: "ritual",
        source: "manual",
      },
      {
        id: createId("slot"),
        title: "Sesi latihan utama",
        note: "Kerjakan target utama lebih dulu.",
        dateKey,
        startTime: "07:00",
        endTime: "08:05",
        lane: "deep-work",
        source: "manual",
      },
      {
        id: createId("slot"),
        title: "Log recovery",
        dateKey,
        startTime: "20:45",
        endTime: "21:00",
        lane: "admin",
        source: "manual",
      },
    ],
  };

  return sortScheduleItems(library[goalTrack] || library.assignments);
}

interface GenerateAIScheduleArgs {
  user: User | null;
  dateKey: string;
  quests: Quest[];
  habits: Habit[];
  prompt: string;
  startTime: string;
  availableHours: number;
  mode: PlanningMode;
}

function buildLocalSchedule(args: GenerateAIScheduleArgs): AIDayDraft {
  const { user, dateKey, quests, habits, prompt, startTime, availableHours, mode } = args;
  const selectedQuests = pickRelevantQuests(quests, dateKey);
  const selectedHabits = pickRelevantHabits(habits);
  const blocks: ScheduleItem[] = [];
  const reminders: Reminder[] = [];

  let cursor = parseTimeToMinutes(startTime || "09:00");
  const minutesBudget = Math.max(90, Math.round((availableHours || 4) * 60));
  const focusBlock = mode === "locked-in" ? 80 : mode === "steady" ? 60 : 45;
  const breakBlock = mode === "locked-in" ? 12 : mode === "steady" ? 15 : 18;
  const cap = cursor + minutesBudget;

  cursor = addBlock(
    blocks,
    dateKey,
    "Sinkron sistem",
    cursor,
    15,
    "admin",
    prompt ? `Brief AI: ${prompt}` : "Review tekanan aktif lalu commit ke blok pertama.",
  );

  selectedQuests.forEach((quest, index) => {
    if (cursor + focusBlock > cap) return;

    const labelPrefix = index === 0 && prompt ? "Sprint prioritas" : quest.isWeekly ? "Serang boss mingguan" : "Sprint quest";
    cursor = addBlock(
      blocks,
      dateKey,
      `${labelPrefix}: ${quest.title}`,
      cursor,
      focusBlock,
      "deep-work",
      quest.description || "Jaga scope tetap sempit supaya hasilnya kelihatan.",
      "ai",
      quest.id,
    );

    if (cursor + breakBlock > cap) return;
    cursor = addBlock(
      blocks,
      dateKey,
      mode === "recovery" ? "Reset panjang" : "Istirahat recovery",
      cursor,
      breakBlock,
      "recovery",
      mode === "recovery"
        ? "Benar-benar menjauh sebentar supaya blok berikutnya tidak terasa berat."
        : "Gerak, minum, atau rapikan tab sebelum lanjut.",
    );
  });

  selectedHabits.slice(0, 1).forEach((habit) => {
    if (cursor + 20 > cap) return;
    cursor = addBlock(
      blocks,
      dateKey,
      `Ritual: ${habit.title}`,
      cursor,
      20,
      "ritual",
      habit.description || "Pakai ritual ini untuk menurunkan friksi sebelum sprint berikutnya.",
    );
  });

  if (cursor + 20 <= cap) {
    addBlock(
      blocks,
      dateKey,
      "Review penutup",
      cursor,
      20,
      "admin",
      "Catat apa yang bergerak, apa yang masih macet, dan langkah pertama untuk besok.",
    );
  }

  const firstBlock = blocks.find((block) => block.lane === "deep-work") || blocks[0];
  const lastBlock = blocks[blocks.length - 1];

  if (firstBlock) {
    const reminderMinutes = Math.max(parseTimeToMinutes(firstBlock.startTime) - 15, 0);
    reminders.push({
      id: createId("rem"),
      title: `Siapkan ${firstBlock.title}`,
      note: "Kurangi friksi sebelum blok dimulai.",
      dateKey,
      time: minutesToTime(reminderMinutes),
      type: "focus",
      completed: false,
      source: "ai",
      createdAt: new Date().toISOString(),
    });
  }

  if (lastBlock) {
    reminders.push({
      id: createId("rem"),
      title: "Tutup loop hari ini",
      note: "Catat progres dan amankan langkah pembuka besok.",
      dateKey,
      time: lastBlock.endTime,
      type: "life",
      completed: false,
      source: "ai",
      createdAt: new Date().toISOString(),
    });
  }

  const headline = `${mode === "locked-in" ? "Rencana intens" : mode === "recovery" ? "Rencana ringan" : "Rencana seimbang"} untuk ${readableDay(dateKey)}`;
  const summary = user
    ? `${user.name}, draft ini menaruh satu kemenangan yang terlihat di awal lalu menjaga recovery supaya ritme harimu tidak putus.`
    : "Draft ini menaruh satu kemenangan yang terlihat di awal lalu menjaga recovery supaya ritme harimu tidak putus.";

  const narrative = [
    selectedQuests[0]
      ? `Mulai dari ${selectedQuests[0].title.toLowerCase()} saat perhatian terbaikmu masih tersedia.`
      : "Mulai dari deliverable yang terlihat, bukan ambisi yang masih samar.",
    mode === "locked-in"
      ? "Blok fokus dibuat lebih panjang, jadi anggap jeda sebagai reset wajib, bukan bonus."
      : mode === "recovery"
        ? "Draft ini sengaja dibuat lebih ringan supaya memulai terasa realistis meski energi sedang rendah."
        : "Ritmenya bergantian antara progres nyata dan recovery cepat supaya momentummu bertahan.",
    prompt
      ? `Brief kamu ikut dipakai di draft ini: ${prompt}.`
      : "Tambahkan brief pribadi lain kali supaya draft lebih pas dengan tekanan hari itu.",
  ];

  return {
    headline,
    summary,
    narrative,
    blocks: sortScheduleItems(blocks),
    reminders,
  };
}

function stripCodeFence(value: string) {
  return value.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
}

function normalizeLane(value: string): ScheduleLane {
  const valid: ScheduleLane[] = ["deep-work", "admin", "recovery", "ritual", "social"];
  return valid.includes(value as ScheduleLane) ? (value as ScheduleLane) : "deep-work";
}

function normalizeReminderType(value: string): Reminder["type"] {
  const valid: Reminder["type"][] = ["quest", "focus", "habit", "life"];
  return valid.includes(value as Reminder["type"]) ? (value as Reminder["type"]) : "focus";
}

function coerceTime(value: string, fallback: string) {
  return /^\d{2}:\d{2}$/.test(value) ? value : fallback;
}

function sanitizeDraftFromModel(raw: unknown, args: GenerateAIScheduleArgs): AIDayDraft | null {
  if (!raw || typeof raw !== "object") return null;

  const source = raw as {
    headline?: unknown;
    summary?: unknown;
    narrative?: unknown;
    blocks?: unknown;
    reminders?: unknown;
  };

  const blocksInput = Array.isArray(source.blocks) ? source.blocks : [];
  const remindersInput = Array.isArray(source.reminders) ? source.reminders : [];
  if (!blocksInput.length) return null;

  const blocks: ScheduleItem[] = blocksInput
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const block = entry as Record<string, unknown>;
      const title = typeof block.title === "string" ? block.title.trim() : "Blok fokus";
      const startTime = coerceTime(typeof block.startTime === "string" ? block.startTime : "", args.startTime);
      const endTime = coerceTime(typeof block.endTime === "string" ? block.endTime : "", minutesToTime(parseTimeToMinutes(startTime) + 45));
      const note = typeof block.note === "string" ? block.note.trim() : undefined;
      const linkedQuestTitle = typeof block.linkedQuestTitle === "string" ? block.linkedQuestTitle.trim().toLowerCase() : "";
      const linkedQuest = linkedQuestTitle
        ? args.quests.find((quest) => quest.title.trim().toLowerCase() === linkedQuestTitle)
        : undefined;

      if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) return null;

      return {
        id: createId("slot"),
        title,
        note,
        dateKey: args.dateKey,
        startTime,
        endTime,
        lane: normalizeLane(typeof block.lane === "string" ? block.lane : "deep-work"),
        source: "ai" as const,
        linkedQuestId: linkedQuest?.id,
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item);

  if (!blocks.length) return null;

  const reminders: Reminder[] = remindersInput
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const reminder = entry as Record<string, unknown>;
      return {
        id: createId("rem"),
        title: typeof reminder.title === "string" && reminder.title.trim() ? reminder.title.trim() : "Pengingat fokus",
        note: typeof reminder.note === "string" ? reminder.note.trim() : undefined,
        dateKey: args.dateKey,
        time: coerceTime(typeof reminder.time === "string" ? reminder.time : "", args.startTime),
        type: normalizeReminderType(typeof reminder.type === "string" ? reminder.type : "focus"),
        completed: false,
        source: "ai" as const,
        createdAt: new Date().toISOString(),
      };
    })
    .filter((item): item is NonNullable<typeof item> => !!item);

  return {
    headline:
      typeof source.headline === "string" && source.headline.trim()
        ? source.headline.trim()
        : `Draft AI untuk ${readableDay(args.dateKey)}`,
    summary:
      typeof source.summary === "string" && source.summary.trim()
        ? source.summary.trim()
        : "AI menyusun blok fokus, recovery, dan penutup agar harimu lebih terarah.",
    narrative: Array.isArray(source.narrative)
      ? source.narrative.filter((item): item is string => typeof item === "string" && !!item.trim()).slice(0, 4)
      : [],
    blocks: sortScheduleItems(blocks),
    reminders,
  };
}

function buildPlannerPrompt(args: GenerateAIScheduleArgs) {
  const quests = pickRelevantQuests(args.quests, args.dateKey);
  const habits = pickRelevantHabits(args.habits);

  return [
    "Kamu adalah AI planner Levelday untuk pengguna Indonesia.",
    "Tugasmu menyusun draft jadwal harian yang realistis, rapi, dan bisa dijalankan.",
    "Jawab HANYA dalam JSON valid tanpa markdown.",
    "Gunakan bahasa Indonesia natural untuk headline, summary, narrative, title, dan note.",
    "Buat blok yang realistis dan tidak bertabrakan.",
    "Setiap blok harus punya startTime dan endTime format HH:MM.",
    "Gunakan lane hanya salah satu dari: deep-work, admin, recovery, ritual, social.",
    "Gunakan reminder type hanya salah satu dari: quest, focus, habit, life.",
    "Usahakan ada 3 sampai 6 blocks, minimal satu deep-work dan satu recovery atau admin penutup.",
    `Tanggal: ${args.dateKey}. Mulai sekitar: ${args.startTime}. Waktu tersedia: ${args.availableHours} jam. Mode: ${args.mode}.`,
    args.user ? `Nama user: ${args.user.name}. Kelas: ${args.user.userClass}.` : "",
    args.prompt ? `Brief user: ${args.prompt}` : "Brief user kosong. Tetap prioritaskan struktur yang masuk akal.",
    quests.length ? `Quest relevan: ${quests.map((quest) => quest.title).join(" | ")}.` : "Belum ada quest aktif.",
    habits.length ? `Habit relevan: ${habits.map((habit) => `${habit.title} (streak ${habit.currentStreak})`).join(" | ")}.` : "Belum ada habit relevan.",
    'Format JSON: {"headline":"...","summary":"...","narrative":["..."],"blocks":[{"title":"...","startTime":"09:00","endTime":"10:00","lane":"deep-work","note":"...","linkedQuestTitle":"judul quest opsional"}],"reminders":[{"title":"...","time":"08:45","type":"focus","note":"..."}]}'
  ]
    .filter(Boolean)
    .join("\n");
}

async function fetchPlannerDraftFromProvider(args: GenerateAIScheduleArgs): Promise<AIDayDraft> {
  const execution = resolveAIExecutionConfig();
  const messages: ChatCompletionMessage[] = [
    { role: "system", content: buildPlannerPrompt(args) },
    { role: "user", content: "Susun draft jadwal harian sekarang." },
  ];

  const response = await requestChatCompletion({
    messages,
    temperature: execution.provider === "groq" ? 0.45 : 0.55,
    maxCompletionTokens: 900,
  });

  const parsed = JSON.parse(stripCodeFence(response));
  const normalized = sanitizeDraftFromModel(parsed, args);
  if (!normalized) {
    throw new Error("AI_PLANNER_INVALID_DRAFT");
  }

  return normalized;
}

export async function generateAISchedule(args: GenerateAIScheduleArgs): Promise<AIDayDraft> {
  try {
    return await fetchPlannerDraftFromProvider(args);
  } catch (error) {
    console.warn("[AI Planner] Falling back to local draft:", error);
    return buildLocalSchedule(args);
  }
}
