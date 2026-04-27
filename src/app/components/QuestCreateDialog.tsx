import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Plus,
  ShieldCheck,
  Sparkles,
  Sword,
  Target,
  Trash2,
} from "lucide-react";

import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

import { Quest, QuestDifficulty, Subtask } from "../types";
import { isoToLocalDateKey, makeDueDateISO } from "../utils/date";
import { createId } from "../utils/id";
import { getXPForDifficulty } from "../utils/xp";

interface QuestCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (quest: Quest) => void;
  defaultDueDate?: string;
  weeklyBossGoal?: string;
}

type QuestRole = "standard" | "daily" | "boss-step";

const ROLE_META: Array<{
  id: QuestRole;
  label: string;
  icon: typeof Target;
  title: string;
  description: string;
}> = [
  {
    id: "standard",
    label: "Task cepat",
    icon: Target,
    title: "Quest biasa",
    description: "Satu hasil kecil yang jelas dan bisa kamu selesaikan tanpa banyak setup.",
  },
  {
    id: "daily",
    label: "Harian",
    icon: ShieldCheck,
    title: "Support harian",
    description: "Cocok buat task ringan yang bantu kamu tetap jalan setiap hari.",
  },
  {
    id: "boss-step",
    label: "Boss mingguan",
    icon: Sword,
    title: "Boss step",
    description: "Dipakai untuk langkah yang benar-benar ngurangin HP boss mingguan.",
  },
];

const DIFFICULTY_META: Array<{
  id: QuestDifficulty;
  label: string;
  helper: string;
}> = [
  { id: "easy", label: "Easy", helper: "Cepat selesai" },
  { id: "normal", label: "Normal", helper: "Porsi aman" },
  { id: "hard", label: "Hard", helper: "Impact besar" },
];

function toDateInputValue(isoDate?: string) {
  return isoToLocalDateKey(isoDate) ?? "";
}

function fromDateInputValue(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  return makeDueDateISO(new Date(year, (month || 1) - 1, day || 1));
}

function addDays(base: Date, amount: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + amount);
  return next;
}

function createSubtask(title: string): Subtask {
  return {
    id: createId("subtask"),
    title,
    completed: false,
  };
}

function buildStarterChecklist(role: QuestRole): Subtask[] {
  if (role === "boss-step") {
    return [
      createSubtask("Siapkan bahan yang dibutuhkan"),
      createSubtask("Kerjakan bagian paling penting dulu"),
      createSubtask("Rapikan dan close task ini"),
    ];
  }

  if (role === "daily") {
    return [
      createSubtask("Mulai versi paling ringan"),
      createSubtask("Selesaikan tanpa perfeksionis"),
    ];
  }

  return [
    createSubtask("Mulai dari langkah pertama"),
    createSubtask("Selesaikan hasil kecilnya"),
  ];
}

function titlePlaceholder(role: QuestRole) {
  if (role === "boss-step") return "Contoh: Selesaikan draft presentasi utama";
  if (role === "daily") return "Contoh: Review plan besok 10 menit";
  return "Contoh: Kerjakan 5 soal statistik";
}

function fallbackTitle(role: QuestRole, weeklyBossGoal?: string) {
  if (role === "boss-step") {
    return weeklyBossGoal ? `Langkah untuk: ${weeklyBossGoal}` : "Weekly boss step";
  }

  if (role === "daily") return "Daily support quest";
  return "Quick quest";
}

export function QuestCreateDialog({
  open,
  onClose,
  onCreate,
  defaultDueDate,
  weeklyBossGoal,
}: QuestCreateDialogProps) {
  const [questRole, setQuestRole] = useState<QuestRole>("standard");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<QuestDifficulty>("normal");
  const [dueDate, setDueDate] = useState<string | undefined>(undefined);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

  useEffect(() => {
    if (!open) return;

    setQuestRole("standard");
    setTitle("");
    setDescription("");
    setDifficulty("normal");
    setDueDate(defaultDueDate);
    setShowAdvanced(false);
    setSubtasks([]);
    setNewSubtask("");
  }, [open, defaultDueDate]);

  const xpReward = useMemo(() => getXPForDifficulty(difficulty), [difficulty]);
  const selectedRole = ROLE_META.find((item) => item.id === questRole) ?? ROLE_META[0];
  const dueDateValue = toDateInputValue(dueDate);
  const canCreate = title.trim().length > 0 || description.trim().length > 0 || subtasks.length > 0;

  const addSubtask = (value?: string) => {
    const trimmed = (value ?? newSubtask).trim();
    if (!trimmed) return;
    setSubtasks((current) => [...current, createSubtask(trimmed)]);
    setNewSubtask("");
  };

  const handleCreate = () => {
    const quest: Quest = {
      id: createId("quest"),
      title: title.trim() || fallbackTitle(questRole, weeklyBossGoal),
      description: description.trim() || undefined,
      difficulty,
      status: "pending",
      xpReward,
      dueDate: dueDate || (questRole === "daily" ? makeDueDateISO(new Date()) : undefined),
      tags: [
        ...(questRole === "daily" ? ["daily support"] : []),
        ...(questRole === "boss-step" ? ["boss step"] : []),
      ],
      subtasks,
      createdAt: new Date().toISOString(),
      isDaily: questRole === "daily",
      isWeekly: questRole === "boss-step",
    };

    onCreate(quest);
    onClose();
  };

  const applyDuePreset = (preset: "today" | "tomorrow" | "weekend") => {
    const now = new Date();
    const nextDate =
      preset === "today"
        ? now
        : preset === "tomorrow"
          ? addDays(now, 1)
          : addDays(now, Math.max(1, 6 - now.getDay()));

    setDueDate(makeDueDateISO(nextDate));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-w-2xl border-border/60 bg-background/95 p-0">
        <div className="p-5 sm:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-xl sm:text-2xl">Buat quest baru</DialogTitle>
          </DialogHeader>

          <div className="mt-5 space-y-5">
            <div className="rounded-3xl border border-border/60 bg-card/45 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mode cepat</div>
                  <div className="mt-1 text-lg font-semibold">Pilih jenis quest dulu</div>
                </div>
                <Badge variant="secondary" className="rounded-full px-3 py-1">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  simple flow
                </Badge>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {ROLE_META.map(({ id, label, icon: Icon, description }) => {
                  const active = questRole === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setQuestRole(id)}
                      className={`rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]"
                          : "border-border/60 bg-background/35 hover:border-primary/35"
                      }`}
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <div className="mt-3 font-medium">{label}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 text-sm text-muted-foreground">{selectedRole.description}</p>
            </div>

            {questRole === "boss-step" && weeklyBossGoal ? (
              <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-4 text-sm text-cyan-50/90">
                <div className="font-medium text-cyan-50">Target boss minggu ini</div>
                <p className="mt-1">{weeklyBossGoal}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label htmlFor="quest-title" className="text-base font-semibold">
                  Nama quest
                </Label>
                <Badge variant="outline" className="rounded-full px-3 py-1">
                  +{xpReward} XP
                </Badge>
              </div>
              <Input
                id="quest-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder={titlePlaceholder(questRole)}
                className="h-12 rounded-2xl text-base"
              />
              <p className="text-sm text-muted-foreground">
                Tulis hasil akhirnya, bukan judul yang terlalu umum. Contoh: “Kirim draft”, bukan “Ngerjain tugas”.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-border/60 bg-card/45 p-4 sm:p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <Target className="h-4 w-4 text-primary" />
                  Difficulty
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {DIFFICULTY_META.map((item) => {
                    const active = difficulty === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setDifficulty(item.id)}
                        className={`rounded-2xl border px-3 py-3 text-center transition-all ${
                          active
                            ? "border-primary bg-primary/10 text-foreground"
                            : "border-border/60 bg-background/35 text-muted-foreground hover:border-primary/35"
                        }`}
                      >
                        <div className="font-medium">{item.label}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.16em]">{item.helper}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-border/60 bg-card/45 p-4 sm:p-5">
                <div className="flex items-center gap-2 font-semibold">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  Deadline
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => applyDuePreset("today")}>
                    Hari ini
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => applyDuePreset("tomorrow")}>
                    Besok
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => applyDuePreset("weekend")}>
                    Weekend
                  </Button>
                </div>

                <Input
                  id="quest-due-date"
                  type="date"
                  value={dueDateValue}
                  onChange={(event) => setDueDate(fromDateInputValue(event.target.value))}
                  className="mt-3 h-11 rounded-2xl"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card/45 p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setShowAdvanced((current) => !current)}
                className="flex w-full items-center justify-between gap-3 text-left"
              >
                <div>
                  <div className="text-base font-semibold">Detail opsional</div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Tambah catatan atau checklist kalau memang perlu. Kalau tidak, quest bisa langsung dibuat.
                  </p>
                </div>
                {showAdvanced ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </button>

              {showAdvanced ? (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quest-description">Catatan singkat</Label>
                    <Textarea
                      id="quest-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Opsional: definisi selesai, bahan yang dibutuhkan, atau konteks singkat."
                      rows={3}
                      className="rounded-2xl"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Label>Checklist ringan</Label>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSubtasks(buildStarterChecklist(questRole))}
                      >
                        Auto checklist
                      </Button>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={newSubtask}
                        onChange={(event) => setNewSubtask(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            addSubtask();
                          }
                        }}
                        placeholder="Tambah langkah kecil"
                        className="h-11 rounded-2xl"
                      />
                      <Button type="button" variant="outline" onClick={() => addSubtask()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah
                      </Button>
                    </div>

                    {subtasks.length ? (
                      <div className="space-y-2">
                        {subtasks.map((subtask) => (
                          <div
                            key={subtask.id}
                            className="flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/35 px-4 py-3"
                          >
                            <span className="text-sm">{subtask.title}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => setSubtasks((current) => current.filter((item) => item.id !== subtask.id))}
                              className="h-8 w-8 rounded-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleCreate}
                disabled={!canCreate}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Buat quest
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
