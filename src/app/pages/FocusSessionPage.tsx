import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Coffee, Pause, Play, RotateCcw, Sparkles, Sword, Target, Timer } from "lucide-react";

import { DailyDungeon, FocusSession, WeeklyBoss } from "../types";
import { getLocalWeekKey, isoToLocalDateKey, toLocalDateKey } from "../utils/date";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useIsMobile } from "../components/ui/use-mobile";
import { FeatureHero } from "../components/FeatureHero";

interface FocusSessionPageProps {
  focusSessions: FocusSession[];
  weeklyBoss?: WeeklyBoss;
  dailyDungeon?: DailyDungeon;
  onComplete: (duration: number, xpEarned: number) => void;
}

const DURATION_OPTIONS = [15, 25, 45, 90] as const;

type FocusDuration = (typeof DURATION_OPTIONS)[number];
type SessionMode = "focus" | "break";

function getXPForDuration(duration: FocusDuration): number {
  switch (duration) {
    case 15:
      return 15;
    case 25:
      return 30;
    case 45:
      return 55;
    case 90:
      return 100;
    default:
      return 30;
  }
}

function getBreakMinutes(duration: FocusDuration): number {
  return duration >= 45 ? 10 : 5;
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function FocusSessionPage({ focusSessions, weeklyBoss, dailyDungeon, onComplete }: FocusSessionPageProps) {
  const isMobile = useIsMobile();
  const [duration, setDuration] = useState<FocusDuration>(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [breakMinutes, setBreakMinutes] = useState(getBreakMinutes(25));
  const [mode, setMode] = useState<SessionMode>("focus");
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return undefined;

    if (timeLeft <= 0) {
      if (mode === "focus") {
        const xp = getXPForDuration(duration);
        onComplete(duration, xp);
        const nextBreakMinutes = getBreakMinutes(duration);
        setBreakMinutes(nextBreakMinutes);
        setMode("break");
        setTimeLeft(nextBreakMinutes * 60);
      } else {
        setMode("focus");
        setTimeLeft(duration * 60);
      }
      setIsActive(false);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((current) => current - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isActive, timeLeft, mode, duration, onComplete]);

  const handleDurationChange = (raw: string) => {
    const parsed = Number(raw) as FocusDuration;
    if (!DURATION_OPTIONS.includes(parsed)) return;
    setDuration(parsed);
    setBreakMinutes(getBreakMinutes(parsed));
    setMode("focus");
    setTimeLeft(parsed * 60);
    setIsActive(false);
  };

  const toggleTimer = () => {
    setIsActive((current) => !current);
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode("focus");
    setBreakMinutes(getBreakMinutes(duration));
    setTimeLeft(duration * 60);
  };

  const currentRoundMinutes = mode === "focus" ? duration : breakMinutes;
  const currentRoundSeconds = currentRoundMinutes * 60;
  const progress = currentRoundSeconds > 0
    ? ((currentRoundSeconds - timeLeft) / currentRoundSeconds) * 100
    : 0;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const todayKey = toLocalDateKey(new Date());
  const currentWeekKey = getLocalWeekKey(new Date());

  const todaySessions = useMemo(
    () => focusSessions.filter((session) => session.completed && isoToLocalDateKey(session.startTime) === todayKey),
    [focusSessions, todayKey],
  );
  const weekSessions = useMemo(
    () => focusSessions.filter((session) => session.completed && getLocalWeekKey(new Date(session.startTime)) === currentWeekKey),
    [focusSessions, currentWeekKey],
  );

  const todayMinutes = todaySessions.reduce((sum, session) => sum + session.duration, 0);
  const todayXP = todaySessions.reduce((sum, session) => sum + session.xpEarned, 0);
  const weekMinutes = weekSessions.reduce((sum, session) => sum + session.duration, 0);

  const pendingDungeonFocus = dailyDungeon?.challenges.find(
    (challenge) => challenge.type === "focus" && challenge.status !== "completed",
  );

  const loopHeadline =
    pendingDungeonFocus && weeklyBoss?.goalTitle
      ? `This sprint can push your Daily Dungeon and move ${weeklyBoss.goalTitle} forward.`
      : pendingDungeonFocus
      ? "This sprint can clear the focus part of your Daily Dungeon."
      : weeklyBoss?.goalTitle
      ? `Pakai sesi ini untuk menyiapkan quest berikutnya menuju ${weeklyBoss.goalTitle}.`
      : "Protect one session and let the rest of the day become easier to start.";

  const modeMeta =
    mode === "focus"
      ? {
          icon: <Timer className="h-5 w-5 text-purple-400" />,
          label: "Focus mode",
          description: `Finish this block to earn +${getXPForDuration(duration)} XP.`,
        }
      : {
          icon: <Coffee className="h-5 w-5 text-cyan-400" />,
          label: "Break mode",
          description: "Reset briefly, then return before friction grows again.",
        };

  return (
    <div className="space-y-6">
      <FeatureHero
        kicker="Focus chamber"
        title="Satu blok fokus cukup untuk bikin hari terasa lebih terkendali."
        description="Mode fokus tetap sederhana. Pilih durasi, tekan start, lalu pakai hasil sesi ini untuk menyiapkan quest yang benar-benar akan kamu selesaikan."
        tone="cyan"
        visual="focus"
        badge="mobile friendly"
        guide={{ title: "Panduan fokus", steps: ["Pilih durasi yang realistis untuk energi kamu.", "Tekan start dan kerjakan satu hal saja.", "Selesai sesi untuk mendapat XP lalu lanjutkan quest berikutnya."] }}
        stats={[
          { label: "Today", value: formatMinutes(todayMinutes) },
          { label: "Sessions", value: String(todaySessions.length) },
          { label: "XP", value: String(todayXP) },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Focus engine</div>
          <h1 className="mt-2 text-3xl font-semibold">Protect a block before procrastination grows teeth</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">{loopHeadline}</p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 px-4 py-3 text-sm">
          <div className="text-muted-foreground">This session</div>
          <div className="mt-1 font-medium">
            {mode === "focus" ? `${duration} min focus` : `${breakMinutes} min break`}
          </div>
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
        >
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 p-8 text-center sm:p-10">
            <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-border/60 bg-background/40 px-4 py-2 text-sm text-muted-foreground">
              {modeMeta.icon}
              <span>{modeMeta.label}</span>
            </div>

            <motion.div
              key={`${mode}-${minutes}-${seconds}`}
              initial={{ scale: 1.03 }}
              animate={{ scale: 1 }}
              className="text-6xl font-semibold tracking-tight sm:text-8xl"
            >
              <span className="bg-gradient-to-r from-purple-300 to-cyan-300 bg-clip-text text-transparent">
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </motion.div>

            <div className="mx-auto mt-6 max-w-xl">
              <Progress value={progress} />
              <div className="mt-2 text-sm text-muted-foreground">{modeMeta.description}</div>
            </div>

            {!isActive && mode === "focus" ? (
              <div className="mx-auto mt-8 max-w-xs">
                {isMobile ? (
                  <select
                    className="border-input bg-input-background rounded-md w-full h-10 px-3 py-2 text-sm"
                    value={String(duration)}
                    onChange={(event) => handleDurationChange(event.target.value)}
                  >
                    <option value="15">15 minutes · Warm start</option>
                    <option value="25">25 minutes · Pomodoro</option>
                    <option value="45">45 minutes · Deep work</option>
                    <option value="90">90 minutes · Flow state</option>
                  </select>
                ) : (
                  <Select value={String(duration)} onValueChange={handleDurationChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes · Warm start</SelectItem>
                      <SelectItem value="25">25 minutes · Pomodoro</SelectItem>
                      <SelectItem value="45">45 minutes · Deep work</SelectItem>
                      <SelectItem value="90">90 minutes · Flow state</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            ) : null}

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={toggleTimer}
                className="bg-gradient-to-r from-purple-500 to-cyan-500 px-8 text-white hover:from-purple-600 hover:to-cyan-600"
              >
                {isActive ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    {mode === "focus" ? "Start focus" : "Start break"}
                  </>
                )}
              </Button>

              <Button size="lg" variant="outline" onClick={resetTimer}>
                <RotateCcw className="mr-2 h-5 w-5" />
                Reset
              </Button>
            </div>

            <div className="mt-6 text-sm text-muted-foreground">
              {mode === "focus"
                ? `Complete this block to earn +${getXPForDuration(duration)} XP.`
                : "Break finished? Levelday will reset you into another focus block."}
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <Card className="border-border/60 bg-card/50 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live impact</div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                <div className="flex items-center gap-2 font-medium">
                  <Target className="h-4 w-4 text-primary" />
                  Daily dungeon
                </div>
                <p className="mt-2 text-muted-foreground">
                  {pendingDungeonFocus
                    ? pendingDungeonFocus.titleSnapshot
                    : "No pending focus tile right now. You can still bank progress and XP."}
                </p>
              </div>

              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                <div className="flex items-center gap-2 font-medium">
                  <Sword className="h-4 w-4 text-primary" />
                  Weekly boss
                </div>
                <p className="mt-2 text-muted-foreground">
                  {weeklyBoss?.goalTitle
                    ? `${weeklyBoss.goalTitle} · ${weeklyBoss.damage}/${weeklyBoss.maxHP} HP rusak minggu ini dari quest yang selesai.`
                    : weeklyBoss
                    ? `${weeklyBoss.bossName} aktif. Focus bantu kamu tetap konsisten, tapi damage boss datang dari quest yang selesai.`
                    : "Choose a weekly boss target so your biggest objective gets a health bar."}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/50 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Focus summary</div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                <div className="text-2xl font-semibold">{todaySessions.length}</div>
                <div className="mt-1 text-sm text-muted-foreground">Sessions today</div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                <div className="text-2xl font-semibold">{formatMinutes(todayMinutes)}</div>
                <div className="mt-1 text-sm text-muted-foreground">Focused today</div>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                <div className="text-2xl font-semibold">{todayXP}</div>
                <div className="mt-1 text-sm text-muted-foreground">XP today</div>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-border/50 bg-background/35 p-4 text-sm text-muted-foreground">
              <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Weekly footing
              </div>
              {weekSessions.length
                ? `You have protected ${formatMinutes(weekMinutes)} across ${weekSessions.length} sessions this week.`
                : "No completed focus block this week yet. The first one matters more than the perfect one."}
            </div>
          </Card>

          <Card className="border-border/60 bg-card/50 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Focus notes</div>
            <div className="mt-3 space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                Start with 15 or 25 minutes when you feel resistance. The goal is to create motion, not heroic effort.
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                Longer sessions are worth more XP, but they only help if you can begin them consistently.
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                When the timer ends, capture your next step before leaving. That keeps tomorrow lighter.
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
