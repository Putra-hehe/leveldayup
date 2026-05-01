import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Dumbbell,
  LucideIcon,
  Palette,
  Shield,
  Sword,
  Target,
} from "lucide-react";

import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/ui/button";
import { UserClass } from "../types";
import { WEEKLY_BOSSES } from "../utils/bosses";
import { GoalTrackId, GOAL_TRACKS, USER_CLASS_META } from "../utils/product";

export interface OnboardingSelection {
  userClass: UserClass;
  goal: GoalTrackId;
  schedule: string[];
  bossId: string;
}

interface OnboardingPageProps {
  onComplete: (selection: OnboardingSelection) => void;
}

type RhythmPresetId = "light" | "steady" | "push";

const GOAL_ICONS: Record<GoalTrackId, LucideIcon> = {
  assignments: Target,
  "exam-prep": BookOpen,
  consistency: Shield,
  portfolio: Palette,
  fitness: Dumbbell,
};

const CLASS_ICONS: Record<UserClass, LucideIcon> = {
  scholar: BookOpen,
  creator: Palette,
  warrior: Sword,
};

const CLASS_ORDER: UserClass[] = ["scholar", "creator", "warrior"];

const RECOMMENDED_BOSS_BY_GOAL: Record<GoalTrackId, string> = {
  assignments: "igris",
  "exam-prep": "baran",
  consistency: "cerberus",
  portfolio: "igris",
  fitness: "cerberus",
};

const RHYTHM_PRESETS: Array<{
  id: RhythmPresetId;
  label: string;
  description: string;
  days: string[];
}> = [
  {
    id: "light",
    label: "Ringan",
    description: "3 hari aktif",
    days: ["Mon", "Wed", "Fri"],
  },
  {
    id: "steady",
    label: "Stabil",
    description: "5 hari aktif",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  },
  {
    id: "push",
    label: "Gas pol",
    description: "6 hari aktif",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
];

const TOTAL_STEPS = 3;

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [step, setStep] = useState<number>(1);
  const [selectedGoal, setSelectedGoal] = useState<GoalTrackId | null>(null);
  const [selectedClass, setSelectedClass] = useState<UserClass | null>(null);
  const [selectedRhythm, setSelectedRhythm] = useState<RhythmPresetId>("steady");
  const [selectedBossId, setSelectedBossId] = useState<string | null>(null);

  // auto-recommend boss based on goal (user can change later in step 3)
  useEffect(() => {
    if (selectedGoal && !selectedBossId) {
      setSelectedBossId(RECOMMENDED_BOSS_BY_GOAL[selectedGoal]);
    }
  }, [selectedGoal, selectedBossId]);

  const rhythm = RHYTHM_PRESETS.find((item) => item.id === selectedRhythm) ?? RHYTHM_PRESETS[1];
  const finalBoss = useMemo(
    () => WEEKLY_BOSSES.find((boss) => boss.id === selectedBossId) ?? WEEKLY_BOSSES[0],
    [selectedBossId],
  );

  const canAdvance = step === 1 ? !!selectedGoal : step === 2 ? !!selectedClass : true;

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    finalize();
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const finalize = () => {
    if (!selectedGoal || !selectedClass) return;
    onComplete({
      userClass: selectedClass,
      goal: selectedGoal,
      schedule: rhythm.days,
      bossId: finalBoss.id,
    });
  };

  // skip step 3 → use defaults
  const handleSkipStep3 = () => {
    if (!selectedGoal || !selectedClass) return;
    onComplete({
      userClass: selectedClass,
      goal: selectedGoal,
      schedule: RHYTHM_PRESETS.find((r) => r.id === "steady")!.days,
      bossId: RECOMMENDED_BOSS_BY_GOAL[selectedGoal],
    });
  };

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-2xl flex-col">
        <div className="flex items-center justify-between">
          <BrandMark size="sm" />
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Langkah {step} / {TOTAL_STEPS}
          </div>
        </div>

        {/* progress dots */}
        <div className="mt-5 flex items-center gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
            const idx = i + 1;
            const active = idx === step;
            const done = idx < step;
            return (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  done
                    ? "bg-gradient-to-r from-purple-500 to-cyan-500"
                    : active
                    ? "bg-cyan-400/70"
                    : "bg-white/10"
                }`}
              />
            );
          })}
        </div>

        <div className="mt-8 flex-1">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <div className="scene-kicker">Mulai</div>
                  <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Mau fokus ke apa minggu ini?</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Pilih satu. Kamu bisa ganti kapan aja.</p>
                </div>

                <div className="grid gap-3">
                  {Object.values(GOAL_TRACKS).map((goal) => {
                    const Icon = GOAL_ICONS[goal.id];
                    const active = selectedGoal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSelectedGoal(goal.id)}
                        className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border/60 bg-background/35 hover:border-primary/35"
                        }`}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/15 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-semibold">{goal.shortLabel}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{goal.label}</div>
                        </div>
                        {active ? (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <div className="scene-kicker">Class</div>
                  <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Pilih gaya yang cocok</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Cuma beda tone & tampilan, sistemnya sama.</p>
                </div>

                <div className="grid gap-3">
                  {CLASS_ORDER.map((id) => {
                    const Icon = CLASS_ICONS[id];
                    const meta = USER_CLASS_META[id];
                    const active = selectedClass === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedClass(id)}
                        className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                          active
                            ? "border-primary bg-primary/10"
                            : "border-border/60 bg-background/35 hover:border-primary/35"
                        }`}
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/15 text-primary">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-base font-semibold">{meta.label}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{meta.identity}</div>
                        </div>
                        {active ? (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3.5 w-3.5" />
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <div className="scene-kicker">Atur ritme (opsional)</div>
                  <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Mau ritme & boss apa?</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Lewati aja kalau mau langsung mulai. Bisa diatur lagi nanti.</p>
                </div>

                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Ritme mingguan</div>
                  <div className="grid grid-cols-3 gap-2">
                    {RHYTHM_PRESETS.map((preset) => {
                      const active = selectedRhythm === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setSelectedRhythm(preset.id)}
                          className={`rounded-2xl border p-3 text-left transition-all ${
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border/60 bg-background/35 hover:border-primary/35"
                          }`}
                        >
                          <div className="text-sm font-semibold">{preset.label}</div>
                          <div className="mt-0.5 text-xs text-muted-foreground">{preset.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Boss mingguan</div>
                  <div className="space-y-2">
                    {WEEKLY_BOSSES.map((boss) => {
                      const active = selectedBossId === boss.id;
                      const recommended =
                        selectedGoal && RECOMMENDED_BOSS_BY_GOAL[selectedGoal] === boss.id;
                      return (
                        <button
                          key={boss.id}
                          type="button"
                          onClick={() => setSelectedBossId(boss.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-all ${
                            active
                              ? "border-primary bg-primary/10"
                              : "border-border/60 bg-background/35 hover:border-primary/35"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-semibold">{boss.name.split(",")[0]}</div>
                              {recommended ? (
                                <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-cyan-200">
                                  rekomendasi
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground">{boss.maxHP} HP</div>
                          </div>
                          {active ? (
                            <Check className="h-4 w-4 text-cyan-300" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSkipStep3}
                  className="w-full text-center text-xs uppercase tracking-[0.22em] text-slate-400 underline-offset-4 hover:text-cyan-200 hover:underline"
                >
                  Lewati & pakai default
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* footer nav */}
        <div className="sticky bottom-0 mt-8 flex items-center gap-3 bg-gradient-to-t from-background via-background to-transparent pb-2 pt-4">
          {step > 1 ? (
            <Button variant="outline" onClick={handleBack} className="px-4">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          ) : null}

          <Button
            onClick={handleNext}
            disabled={!canAdvance}
            className="ml-auto flex-1 bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600 sm:flex-none sm:px-8"
          >
            {step === TOTAL_STEPS ? "Mulai" : "Lanjut"}
            {step < TOTAL_STEPS ? <ArrowRight className="h-4 w-4" /> : null}
          </Button>
        </div>
      </div>
    </div>
  );
}