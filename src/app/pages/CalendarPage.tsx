import { useMemo, useState } from "react";
import { format } from "date-fns";
import { motion } from "motion/react";
import { CalendarDays, Clock3, LoaderCircle, Plus, Sparkles, Wand2 } from "lucide-react";

import { AIDayDraft, PlanningMode, parseTimeToMinutes, sortScheduleItems } from "../utils/planner";
import { Habit, Quest, Reminder, ReminderType, ScheduleItem, ScheduleLane, User } from "../types";
import { Button } from "../components/ui/button";
import { Calendar } from "../components/ui/calendar";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { isoToLocalDateKey, makeDueDateISO, toLocalDateKey } from "../utils/date";
import { PlannerModeSelector } from "../components/planner/PlannerModeSelector";
import { FeatureHero } from "../components/FeatureHero";

interface CalendarPageProps {
  user: User;
  quests: Quest[];
  habits: Habit[];
  reminders: Reminder[];
  scheduleItems: ScheduleItem[];
  onQuestClick: (quest: Quest) => void;
  onCompleteQuest: (questId: string) => void;
  onAddQuestForDate: (date: Date) => void;
  onAddReminder: (reminder: Omit<Reminder, "id" | "createdAt" | "completed">) => void;
  onToggleReminder: (reminderId: string) => void;
  onAddScheduleItem: (item: Omit<ScheduleItem, "id">) => void;
  onGenerateAIDraft: (args: {
    dateKey: string;
    prompt: string;
    startTime: string;
    availableHours: number;
    mode: PlanningMode;
  }) => Promise<AIDayDraft>;
  onApplyAIDraft: (dateKey: string, draft: AIDayDraft) => void;
}

function dateKeyToLocalNoon(key: string): Date {
  const [y, m, d] = key.split("-").map((n) => Number(n));
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

const laneStyle: Record<ScheduleLane, string> = {
  "deep-work": "from-violet-500/25 to-fuchsia-500/15 border-violet-400/25",
  admin: "from-slate-500/20 to-slate-500/10 border-white/10",
  recovery: "from-cyan-500/20 to-cyan-500/10 border-cyan-400/25",
  ritual: "from-emerald-500/20 to-emerald-500/10 border-emerald-400/25",
  social: "from-amber-500/20 to-amber-500/10 border-amber-400/25",
};

const reminderTypes: ReminderType[] = ["quest", "focus", "habit", "life"];
const scheduleLanes: ScheduleLane[] = ["deep-work", "admin", "recovery", "ritual", "social"];

export function CalendarPage({
  user,
  quests,
  habits,
  reminders,
  scheduleItems,
  onQuestClick,
  onCompleteQuest,
  onAddQuestForDate,
  onAddReminder,
  onToggleReminder,
  onAddScheduleItem,
  onGenerateAIDraft,
  onApplyAIDraft,
}: CalendarPageProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiMulaiTime, setAiMulaiTime] = useState("09:00");
  const [aiHours, setAiHours] = useState(4);
  const [aiMode, setAiMode] = useState<PlanningMode>("steady");
  const [aiDraft, setAiDraft] = useState<AIDayDraft | null>(null);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [reminderForm, setReminderForm] = useState({ title: "", time: "09:00", type: "focus" as ReminderType, note: "" });
  const [slotForm, setSlotForm] = useState({ title: "", startTime: "13:00", endTime: "14:00", lane: "deep-work" as ScheduleLane, note: "" });

  const todayKey = toLocalDateKey(new Date());
  const selectedKey = toLocalDateKey(selectedDate);

  const daysWithQuests = useMemo(() => {
    const keys = quests
      .map((quest) => isoToLocalDateKey(quest.dueDate))
      .filter((key): key is string => !!key);
    return Array.from(new Set(keys)).map(dateKeyToLocalNoon);
  }, [quests]);

  const selectedDayQuests = useMemo(() => {
    return quests
      .filter((quest) => (isoToLocalDateKey(quest.dueDate) || todayKey) === selectedKey)
      .sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === "completed") return 1;
          if (b.status === "completed") return -1;
        }
        return (a.createdAt || "").localeCompare(b.createdAt || "");
      });
  }, [quests, selectedKey, todayKey]);

  const selectedDayPengingat = useMemo(
    () => reminders.filter((reminder) => reminder.dateKey === selectedKey).sort((a, b) => a.time.localeCompare(b.time)),
    [reminders, selectedKey],
  );

  const selectedDaySchedule = useMemo(
    () => sortScheduleItems(scheduleItems.filter((item) => item.dateKey === selectedKey)),
    [scheduleItems, selectedKey],
  );

  const totalScheduleMinutes = selectedDaySchedule.reduce(
    (sum, item) => sum + Math.max(parseTimeToMinutes(item.endTime) - parseTimeToMinutes(item.startTime), 0),
    0,
  );

  const focusLanes = selectedDaySchedule.filter((item) => item.lane === "deep-work").length;

  const generateDraft = async () => {
    setAiDraftLoading(true);
    try {
      const draft = await onGenerateAIDraft({
        dateKey: selectedKey,
        prompt: aiPrompt,
        startTime: aiMulaiTime,
        availableHours: aiHours,
        mode: aiMode,
      });
      setAiDraft(draft);
    } finally {
      setAiDraftLoading(false);
    }
  };

  const addReminder = () => {
    if (!reminderForm.title.trim()) return;
    onAddReminder({
      title: reminderForm.title.trim(),
      dateKey: selectedKey,
      time: reminderForm.time,
      type: reminderForm.type,
      note: reminderForm.note.trim() || undefined,
      source: "manual",
    });
    setReminderForm({ title: "", time: reminderForm.time, type: reminderForm.type, note: "" });
  };

  const addScheduleItem = () => {
    if (!slotForm.title.trim()) return;
    onAddScheduleItem({
      title: slotForm.title.trim(),
      dateKey: selectedKey,
      startTime: slotForm.startTime,
      endTime: slotForm.endTime,
      lane: slotForm.lane,
      note: slotForm.note.trim() || undefined,
      source: "manual",
    });
    setSlotForm({ title: "", startTime: slotForm.startTime, endTime: slotForm.endTime, lane: slotForm.lane, note: "" });
  };

  return (
    <div className="space-y-8">
      <FeatureHero
        kicker="Planner room"
        title="Planner dibuat rapi supaya bikin quest dan jadwal tetap enak di mobile maupun desktop."
        description="Pilih tanggal, tambah reminder, susun blok fokus, atau pakai AI draft. Semua tetap sederhana dan visualnya dibuat sekelas halaman fitur lain."
        tone="cyan"
        visual="planner"
        badge="daily planning"
        guide={{ title: "Panduan planner", steps: ["Pilih tanggal yang ingin kamu susun.", "Tambah reminder atau blok jadwal manual.", "Gunakan AI draft kalau ingin susunan hari lebih cepat."] }}
        stats={[
          { label: "Quest", value: String(selectedDayQuests.length) },
          { label: "Blok", value: String(selectedDaySchedule.length) },
          { label: "Reminder", value: String(selectedDayPengingat.length) },
        ]}
      />

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cinematic-panel p-6 sm:p-8"
      >
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-5">
            <div className="scene-kicker">Planner scene</div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
              Susun {format(selectedDate, "EEEE, MMM d")} jadi <span className="text-gradient">hari yang lebih terarah</span>.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              {user.name}, di sini reminder, blok jadwal, dan AI planner menyatu jadi sistem kerja yang lebih rapi. Kamu bisa susun manual atau minta AI menyiapkan draft dulu.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="soft-panel p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Jam terjadwal</div>
                <div className="mt-3 text-2xl font-semibold text-white">{Math.round(totalScheduleMinutes / 60)}h</div>
              </div>
              <div className="soft-panel p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Blok fokus</div>
                <div className="mt-3 text-2xl font-semibold text-white">{focusLanes}</div>
              </div>
              <div className="soft-panel p-4">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Pengingat</div>
                <div className="mt-3 text-2xl font-semibold text-white">{selectedDayPengingat.length}</div>
              </div>
            </div>
          </div>

          <div className="soft-panel p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="scene-kicker">Generator jadwal AI</div>
                <h2 className="mt-2 text-2xl font-semibold text-white">Susun draft harian dengan rapi</h2>
              </div>
              <div className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-violet-100">
                mode AI
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <Textarea
                value={aiPrompt}
                onChange={(event) => setAiPrompt(event.target.value)}
                placeholder="Ceritakan prioritas hari ini. Contoh: selesaikan bagian tugas paling berat sebelum siang."
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-400">Mulai</div>
                  <Input type="time" value={aiMulaiTime} onChange={(event) => setAiMulaiTime(event.target.value)} />
                </div>
                <div>
                  <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-400">Jam tersedia</div>
                  <Input type="number" min={2} max={12} value={aiHours} onChange={(event) => setAiHours(Number(event.target.value) || 4)} />
                </div>
              </div>

              <div className="min-w-0">
                <div className="mb-2 text-xs uppercase tracking-[0.24em] text-slate-400">Mode penyusunan</div>
                <PlannerModeSelector value={aiMode} onChange={setAiMode} />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={() => void generateDraft()} className="px-6" disabled={aiDraftLoading}>
                  {aiDraftLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {aiDraftLoading ? "Menyusun draft" : "Buat draft"}
                </Button>
                {aiDraft ? (
                  <Button variant="outline" onClick={() => onApplyAIDraft(selectedKey, aiDraft)} className="px-6" disabled={aiDraftLoading}>
                    <Wand2 className="h-4 w-4" />
                    Terapkan draft
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
        <section className="space-y-6">
          <Card className="p-6">
            <div className="grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
              <div className="space-y-4">
                <div className="scene-kicker">Date navigator</div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  modifiers={{ hasQuests: daysWithQuests }}
                  modifiersClassNames={{ hasQuests: "rounded-md bg-cyan-400/20 text-cyan-50" }}
                />
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-sm text-slate-300">
                  <div className="flex items-center justify-between gap-3">
                    <span>Dipilih</span>
                    <span className="font-semibold text-white">{selectedKey}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span>Hari ini</span>
                    <span className="font-semibold text-white">{todayKey}</span>
                  </div>
                  <Button variant="outline" onClick={() => onAddQuestForDate(selectedDate)} className="mt-4 w-full">
                    <Plus className="h-4 w-4" />
                    Tambah quest untuk tanggal ini
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="scene-kicker">Quest lane</div>
                <div className="space-y-3">
                  {selectedDayQuests.length ? (
                    selectedDayQuests.map((quest) => (
                      <button
                        key={quest.id}
                        type="button"
                        onClick={() => onQuestClick(quest)}
                        className="w-full rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-violet-400/30 hover:bg-violet-500/10"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="text-lg font-semibold text-white">{quest.title}</div>
                            <div className="mt-2 text-sm leading-6 text-slate-300">{quest.description || "Quest ini belum punya catatan tambahan."}</div>
                          </div>
                          <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                            {quest.status === "completed" ? "Selesai" : quest.difficulty}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                          <span>Due {quest.dueDate ? format(new Date(quest.dueDate), "MMM d") : selectedKey}</span>
                          {quest.isWeekly ? <span>Weekly boss</span> : null}
                        </div>
                        {quest.status !== "completed" ? (
                          <Button
                            type="button"
                            variant="outline"
                            className="mt-4"
                            onClick={(event) => {
                              event.stopPropagation();
                              onCompleteQuest(quest.id);
                            }}
                          >
                            Tandai selesai
                          </Button>
                        ) : null}
                      </button>
                    ))
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
                      Belum ada quest untuk tanggal ini. Tambah satu atau pakai draft AI untuk membangun hari yang lebih kuat dulu.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {aiDraft ? (
            <Card className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="scene-kicker">Draft AI</div>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{aiDraft.headline}</h3>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{aiDraft.summary}</p>
                </div>
                <Button variant="outline" onClick={() => onApplyAIDraft(selectedKey, aiDraft)}>
                  <Wand2 className="h-4 w-4" />
                  Terapkan draft ini
                </Button>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[0.6fr_0.4fr]">
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Kenapa draft ini masuk akal</div>
                  {aiDraft.narrative.map((line, index) => (
                    <div key={`${line}-${index}`} className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-200">
                      {line}
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Reminder hasil draft</div>
                  {aiDraft.reminders.map((reminder) => (
                    <div key={reminder.id} className="rounded-[22px] border border-cyan-400/15 bg-cyan-500/8 px-4 py-3 text-sm text-cyan-50">
                      <div className="font-semibold">{reminder.time} · {reminder.title}</div>
                      {reminder.note ? <div className="mt-1 text-cyan-100/80">{reminder.note}</div> : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Blok hasil AI</div>
                {aiDraft.blocks.map((block) => (
                  <div key={block.id} className={`rounded-[24px] border bg-gradient-to-br p-4 ${laneStyle[block.lane]}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-200">
                      <div className="font-semibold text-white">{block.title}</div>
                      <div>{block.startTime} - {block.endTime}</div>
                    </div>
                    {block.note ? <div className="mt-2 text-sm leading-6 text-slate-200/90">{block.note}</div> : null}
                  </div>
                ))}
              </div>
            </Card>
          ) : null}

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="scene-kicker">Jadwal aktif</div>
                <h3 className="mt-2 text-2xl font-semibold text-white">Timeline harian</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                {selectedDaySchedule.length} blok
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {selectedDaySchedule.length ? (
                selectedDaySchedule.map((item) => (
                  <div key={item.id} className={`rounded-[24px] border bg-gradient-to-br p-4 ${laneStyle[item.lane]}`}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{item.title}</div>
                        <div className="mt-1 text-sm text-slate-300">{item.startTime} - {item.endTime}</div>
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                        {item.source === "ai" ? "AI" : "Manual"}
                      </div>
                    </div>
                    {item.note ? <div className="mt-3 text-sm leading-6 text-slate-200/90">{item.note}</div> : null}
                  </div>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
                  Belum ada blok jadwal untuk tanggal ini. Buat draft AI atau tambah blok manual pertamamu.
                </div>
              )}
            </div>
          </Card>
        </section>

        <aside className="space-y-6">
          <Card className="p-6">
            <div className="scene-kicker">Quick add reminder</div>
            <h3 className="mt-2 text-xl font-semibold text-white">Tambah pengingat manual</h3>
            <div className="mt-4 space-y-3">
              <Input
                value={reminderForm.title}
                onChange={(event) => setReminderForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Contoh: mulai revisi slide jam 3"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="time"
                  value={reminderForm.time}
                  onChange={(event) => setReminderForm((prev) => ({ ...prev, time: event.target.value }))}
                />
                <select
                  value={reminderForm.type}
                  onChange={(event) => setReminderForm((prev) => ({ ...prev, type: event.target.value as ReminderType }))}
                  className="h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none"
                >
                  {reminderTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <Textarea
                value={reminderForm.note}
                onChange={(event) => setReminderForm((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="Catatan pengingat singkat"
              />
              <Button onClick={addReminder} className="w-full">
                <Clock3 className="h-4 w-4" />
                Simpan pengingat
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Pengingat hari ini</div>
              {selectedDayPengingat.length ? (
                selectedDayPengingat.map((reminder) => (
                  <button
                    key={reminder.id}
                    type="button"
                    onClick={() => onToggleReminder(reminder.id)}
                    className="w-full rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition hover:border-cyan-400/30 hover:bg-cyan-500/10"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold text-white">{reminder.time} · {reminder.title}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                        {reminder.completed ? "Done" : reminder.type}
                      </div>
                    </div>
                    {reminder.note ? <div className="mt-2 text-sm text-slate-300">{reminder.note}</div> : null}
                  </button>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  Belum ada reminder. Tambah satu atau terapkan draft AI agar lane ini terisi otomatis.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="scene-kicker">Quick add block</div>
            <h3 className="mt-2 text-xl font-semibold text-white">Tambah blok manual</h3>
            <div className="mt-4 space-y-3">
              <Input
                value={slotForm.title}
                onChange={(event) => setSlotForm((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="Contoh: revisi bab 2"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  type="time"
                  value={slotForm.startTime}
                  onChange={(event) => setSlotForm((prev) => ({ ...prev, startTime: event.target.value }))}
                />
                <Input
                  type="time"
                  value={slotForm.endTime}
                  onChange={(event) => setSlotForm((prev) => ({ ...prev, endTime: event.target.value }))}
                />
              </div>
              <select
                value={slotForm.lane}
                onChange={(event) => setSlotForm((prev) => ({ ...prev, lane: event.target.value as ScheduleLane }))}
                className="h-11 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none"
              >
                {scheduleLanes.map((lane) => (
                  <option key={lane} value={lane}>{lane}</option>
                ))}
              </select>
              <Textarea
                value={slotForm.note}
                onChange={(event) => setSlotForm((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="Catatan blok, output yang dituju, atau batasannya"
              />
              <Button onClick={addScheduleItem} className="w-full">
                <CalendarDays className="h-4 w-4" />
                Simpan blok jadwal
              </Button>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
