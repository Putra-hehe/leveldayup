import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  BookOpen,
  Check,
  Dumbbell,
  LucideIcon,
  Palette,
  Shield,
  Sword,
  Target,
} from "lucide-react";

import { FeatureHero } from "../components/FeatureHero";
import { BrandMark } from "../components/BrandMark";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
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

const CLASS_META: Array<{ id: UserClass; icon: LucideIcon; accent: string }> = [
  { id: "scholar", icon: BookOpen, accent: "from-cyan-500/20 to-sky-500/10" },
  { id: "creator", icon: Palette, accent: "from-fuchsia-500/20 to-violet-500/10" },
  { id: "warrior", icon: Sword, accent: "from-orange-500/20 to-rose-500/10" },
];

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
    description: "3 hari utama. Cocok kalau kamu baru mulai lagi.",
    days: ["Mon", "Wed", "Fri"],
  },
  {
    id: "steady",
    label: "Stabil",
    description: "Ritme kerja normal 5 hari tanpa terlalu padat.",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  },
  {
    id: "push",
    label: "Gas pol",
    description: "6 hari aktif untuk minggu yang sedang berat.",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  },
];

export function OnboardingPage({ onComplete }: OnboardingPageProps) {
  const [selectedGoal, setSelectedGoal] = useState<GoalTrackId>("assignments");
  const [selectedClass, setSelectedClass] = useState<UserClass>("scholar");
  const [selectedRhythm, setSelectedRhythm] = useState<RhythmPresetId>("steady");
  const [selectedBossId, setSelectedBossId] = useState<string>(RECOMMENDED_BOSS_BY_GOAL.assignments);
  const [bossTouched, setBossTouched] = useState(false);

  useEffect(() => {
    if (!bossTouched) {
      setSelectedBossId(RECOMMENDED_BOSS_BY_GOAL[selectedGoal]);
    }
  }, [selectedGoal, bossTouched]);

  const goalMeta = GOAL_TRACKS[selectedGoal];
  const classMeta = USER_CLASS_META[selectedClass];
  const rhythm = RHYTHM_PRESETS.find((item) => item.id === selectedRhythm) ?? RHYTHM_PRESETS[1];
  const selectedBoss = useMemo(
    () => WEEKLY_BOSSES.find((boss) => boss.id === selectedBossId) ?? WEEKLY_BOSSES[0],
    [selectedBossId],
  );

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <BrandMark size="sm" showTagline />

        <FeatureHero
          kicker="First login"
          title="Masuk cepat, pilih gaya main, lalu langsung mulai minggu ini."
          description="Onboarding dibuat satu layar saja. Pilih fokus utama, class, ritme mingguan, lalu boss mingguan yang ingin kamu kalahkan. Setelah itu Levelday langsung isi starter quest dan habit yang ringan."
          tone="cyan"
          visual="onboarding"
          badge="setup < 1 menit"
          guide={{ title: "Panduan awal", steps: ["Pilih fokus utama yang paling penting minggu ini.", "Pilih class yang menggambarkan gaya kerja kamu.", "Pilih boss mingguan lalu masuk ke dashboard."] }}
          stats={[
            { label: "Goal", value: goalMeta.shortLabel },
            { label: "Class", value: USER_CLASS_META[selectedClass].label },
            { label: "Boss", value: selectedBoss.name.split(",")[0] },
          ]}
        />

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-border/60 bg-card/50 p-5 sm:p-6">
                <div className="scene-kicker">1. Fokus utama</div>
                <h2 className="mt-3 text-2xl font-semibold">Kamu mau dorong area apa dulu?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pilihan ini menentukan starter quest, habit pendukung, dan arah boss mingguan.
                </p>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {Object.values(GOAL_TRACKS).map((goal) => {
                    const Icon = GOAL_ICONS[goal.id];
                    const active = selectedGoal === goal.id;
                    return (
                      <button
                        key={goal.id}
                        type="button"
                        onClick={() => setSelectedGoal(goal.id)}
                        className={`rounded-[1.4rem] border p-4 text-left transition-all ${
                          active
                            ? "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]"
                            : "border-border/60 bg-background/35 hover:border-primary/35"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/15 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          {active ? <Badge className="rounded-full">Dipilih</Badge> : null}
                        </div>
                        <div className="mt-4 text-base font-semibold">{goal.label}</div>
                        <p className="mt-2 text-sm text-muted-foreground">{goal.description}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="border-border/60 bg-card/50 p-5 sm:p-6">
                <div className="scene-kicker">2. Class</div>
                <h2 className="mt-3 text-2xl font-semibold">Pilih vibe yang paling cocok</h2>
                <p className="mt-2 text-sm text-muted-foreground">Sistemnya sama, tone dan starter loop-nya yang dibedakan.</p>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {CLASS_META.map(({ id, icon: Icon, accent }) => {
                    const active = selectedClass === id;
                    const meta = USER_CLASS_META[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedClass(id)}
                        className={`rounded-[1.4rem] border bg-gradient-to-br p-4 text-left transition-all ${accent} ${
                          active ? "border-primary shadow-[0_0_0_1px_rgba(139,92,246,0.22)]" : "border-border/60"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-background/40 text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          {active ? <Check className="h-5 w-5 text-cyan-300" /> : null}
                        </div>
                        <div className="mt-4 text-lg font-semibold">{meta.label}</div>
                        <div className="mt-1 text-sm text-foreground/90">{meta.identity}</div>
                        <p className="mt-3 text-sm text-muted-foreground">{meta.description}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-border/60 bg-card/50 p-5 sm:p-6">
                <div className="scene-kicker">3. Ritme mingguan</div>
                <h2 className="mt-3 text-2xl font-semibold">Pilih ritme yang realistis</h2>
                <p className="mt-2 text-sm text-muted-foreground">Biar setup awal tidak terlalu berat dan tetap enak dipakai tiap hari.</p>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {RHYTHM_PRESETS.map((preset) => {
                    const active = selectedRhythm === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedRhythm(preset.id)}
                        className={`rounded-[1.4rem] border p-4 text-left transition-all ${
                          active
                            ? "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]"
                            : "border-border/60 bg-background/35 hover:border-primary/35"
                        }`}
                      >
                        <div className="text-lg font-semibold">{preset.label}</div>
                        <p className="mt-2 text-sm text-muted-foreground">{preset.description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {preset.days.map((day) => (
                            <span key={day} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-200">
                              {day}
                            </span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          </div>

          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <Card className="border-border/60 bg-card/50 p-5 sm:p-6">
                <div className="scene-kicker">4. Weekly boss</div>
                <h2 className="mt-3 text-2xl font-semibold">Boss mana yang mau kamu lawan?</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Boss mingguan dipilih di awal. HP boss akan berkurang saat kamu menyelesaikan quest.
                </p>

                <div className="mt-5 space-y-3">
                  {WEEKLY_BOSSES.map((boss) => {
                    const active = selectedBossId === boss.id;
                    const recommended = RECOMMENDED_BOSS_BY_GOAL[selectedGoal] === boss.id;
                    return (
                      <button
                        key={boss.id}
                        type="button"
                        onClick={() => {
                          setBossTouched(true);
                          setSelectedBossId(boss.id);
                        }}
                        className={`w-full rounded-[1.4rem] border p-4 text-left transition-all ${
                          active
                            ? "border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(139,92,246,0.2)]"
                            : "border-border/60 bg-background/35 hover:border-primary/35"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold">{boss.name}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{boss.tagline}</div>
                          </div>
                          <div className="text-right">
                            <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-200">
                              {boss.maxHP} HP
                            </div>
                            {recommended ? <div className="mt-2 text-[11px] uppercase tracking-[0.18em] text-cyan-200">rekomendasi</div> : null}
                          </div>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">{boss.rewardText}</p>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
              <Card className="border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-card/70 to-purple-500/10 p-5 sm:p-6">
                <div className="scene-kicker">Ringkasan setup</div>
                <h2 className="mt-3 text-2xl font-semibold">Build awal kamu siap</h2>

                <div className="mt-5 space-y-3 text-sm text-muted-foreground">
                  <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                    <div className="font-medium text-foreground">Goal minggu ini</div>
                    <p className="mt-1">{goalMeta.weeklyBossGoal}</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                    <div className="font-medium text-foreground">Ritual class</div>
                    <p className="mt-1">{classMeta.ritual}</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                    <div className="font-medium text-foreground">Hari aktif</div>
                    <p className="mt-1">{rhythm.days.join(" • ")}</p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                    <div className="font-medium text-foreground">Boss pilihan</div>
                    <p className="mt-1">{selectedBoss.name}</p>
                  </div>
                </div>

                <Button
                  onClick={() =>
                    onComplete({
                      userClass: selectedClass,
                      goal: selectedGoal,
                      schedule: rhythm.days,
                      bossId: selectedBoss.id,
                    })
                  }
                  className="mt-5 w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600"
                >
                  Masuk ke dashboard
                </Button>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
