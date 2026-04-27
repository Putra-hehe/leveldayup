import { motion } from "motion/react";
import { Flame, Plus, ShieldCheck } from "lucide-react";

import { Habit } from "../types";
import { isoToLocalDateKey, toLocalDateKey } from "../utils/date";
import { HabitCard } from "../components/HabitCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { FeatureHero } from "../components/FeatureHero";

interface HabitsPageProps {
  habits: Habit[];
  onAddHabit: () => void;
  onHabitClick: (habit: Habit) => void;
  onToggleHabit: (habitId: string) => void;
}

export function HabitsPage({ habits, onAddHabit, onHabitClick, onToggleHabit }: HabitsPageProps) {
  const todayKey = toLocalDateKey(new Date());
  const isCompletedToday = (habit: Habit) =>
    habit.completedDates.some((date) => isoToLocalDateKey(date) === todayKey);

  const completedToday = habits.filter(isCompletedToday).length;
  const bestStreak = habits.reduce((max, habit) => Math.max(max, habit.longestStreak), 0);
  const supportScore = habits.length ? Math.round((completedToday / habits.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <FeatureHero
        kicker="Habit support"
        title="Habit dibuat ringan supaya kamu tetap jalan walau energi lagi rendah."
        description="Habit di Levelday bukan daftar yang bikin capek. Isinya rutinitas kecil yang bantu kamu lebih gampang mulai quest berikutnya."
        tone="emerald"
        visual="habit"
        badge="low friction"
        guide={{ title: "Panduan habit", steps: ["Buat habit yang sangat kecil dan bisa diulang.", "Centang habit yang selesai hari ini.", "Jaga streak untuk menopang quest saat motivasi turun."] }}
        stats={[
          { label: "Hari ini", value: `${completedToday}/${habits.length || 0}` },
          { label: "Best streak", value: String(bestStreak) },
          { label: "Support", value: `${supportScore}%` },
        ]}
      />

      <motion.div initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Habit support system</h1>
          <p className="mt-2 text-muted-foreground">
            Habits are your low-friction backup plan when motivation is unreliable.
          </p>
        </div>
        <Button
          onClick={onAddHabit}
          className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add habit
        </Button>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/20">
              <Flame className="h-6 w-6 text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{bestStreak}</div>
              <div className="text-sm text-muted-foreground">Best streak</div>
            </div>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/45 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/15">
              <ShieldCheck className="h-6 w-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-semibold">
                {completedToday}/{habits.length}
              </div>
              <div className="text-sm text-muted-foreground">Completed today</div>
            </div>
          </div>
        </Card>

        <Card className="border-border/60 bg-card/45 p-6">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Support score</div>
          <div className="mt-2 text-3xl font-semibold">{supportScore}%</div>
          <p className="mt-2 text-sm text-muted-foreground">
            The goal is not perfection. The goal is to make showing up easier tomorrow.
          </p>
        </Card>
      </div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
        {habits.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onClick={() => onHabitClick(habit)}
                onToggle={() => onToggleHabit(habit.id)}
                isCompletedToday={isCompletedToday(habit)}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed bg-card/35 p-12 text-center">
            <Flame className="mx-auto h-14 w-14 text-muted-foreground" />
            <h3 className="mt-4 text-xl font-medium">No support habits yet</h3>
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              Add 2 or 3 tiny routines that make it easier to start work before procrastination takes over.
            </p>
            <Button onClick={onAddHabit} variant="outline" className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              Create first habit
            </Button>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
