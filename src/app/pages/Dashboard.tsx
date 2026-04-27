import { useMemo } from "react";
import { format } from "date-fns";
import {
  CalendarDays,
  Castle,
  ChevronRight,
  Gift,
  MessageCircle,
  Plus,
  Sparkles,
  Sword,
  Target,
  Timer,
  Trophy,
} from "lucide-react";

import {
  AssistantMessage,
  CommunityMessage,
  DailyDungeon,
  FocusSession,
  Habit,
  LeaderboardEntry,
  MomentumState,
  Quest,
  Reminder,
  ScheduleItem,
  User,
  WeeklyBoss,
} from "../types";
import { getGoalTrackMeta, getUserClassMeta } from "../utils/product";
import { isoToLocalDateKey, toLocalDateKey } from "../utils/date";
import { sortScheduleItems } from "../utils/planner";
import { AssistantPanel } from "../components/AssistantPanel";
import { LevelBadge } from "../components/LevelBadge";
import { XPBar } from "../components/XPBar";
import { WeeklyBossCard } from "../components/WeeklyBossCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

interface DashboardProps {
  user: User;
  todayQuestsAll: Quest[];
  todayQuests: Quest[];
  habits: Habit[];
  focusSessions: FocusSession[];
  weeklyBoss?: WeeklyBoss;
  dailyDungeon?: DailyDungeon;
  momentum?: MomentumState;
  reminders: Reminder[];
  scheduleItems: ScheduleItem[];
  communityMessages: CommunityMessage[];
  assistantMessages: AssistantMessage[];
  leaderboardPreview: LeaderboardEntry[];
  onAddQuest: () => void;
  onAddQuestAI: () => void;
  onQuestClick: (quest: Quest) => void;
  onQuestComplete: (questId: string) => void;
  onViewAllQuests: () => void;
  onViewAllHabits: () => void;
  onViewDungeon: () => void;
  onViewPlanner: () => void;
  onViewCommunity: () => void;
  onViewLeaderboard: () => void;
  moodToday?: string;
  onMoodChange: (mood: string) => void;
  onHabitOpen: () => void;
  onHabitToggle: (habitId: string) => void;
  onStartFocus: () => void;
  onSelectWeeklyBoss: (selection: any) => void;
  onAssistantSend: (message: string) => void | Promise<void>;
  assistantLoading?: boolean;
}

const moods = [
  { emoji: "⚡", label: "Ready", value: "ready" },
  { emoji: "🙂", label: "Steady", value: "steady" },
  { emoji: "😵", label: "Overwhelmed", value: "overwhelmed" },
  { emoji: "🫠", label: "Low energy", value: "low" },
];

const laneAccent: Record<string, string> = {
  "deep-work": "from-violet-500/25 to-fuchsia-500/10 text-violet-100 border-violet-400/20",
  admin: "from-slate-500/20 to-slate-500/10 text-slate-100 border-white/10",
  recovery: "from-cyan-500/20 to-cyan-500/10 text-cyan-50 border-cyan-400/20",
  ritual: "from-emerald-500/20 to-emerald-500/10 text-emerald-50 border-emerald-400/20",
  social: "from-amber-500/20 to-amber-500/10 text-amber-50 border-amber-400/20",
};

export function Dashboard({
  user,
  todayQuestsAll,
  todayQuests,
  habits,
  focusSessions,
  weeklyBoss,
  dailyDungeon,
  momentum,
  reminders,
  scheduleItems,
  communityMessages,
  assistantMessages,
  leaderboardPreview,
  onAddQuest,
  onAddQuestAI,
  onQuestClick,
  onQuestComplete,
  onViewAllQuests,
  onViewAllHabits,
  onViewDungeon,
  onViewPlanner,
  onViewCommunity,
  onViewLeaderboard,
  moodToday,
  onMoodChange,
  onHabitOpen,
  onHabitToggle,
  onStartFocus,
  onSelectWeeklyBoss,
  onAssistantSend,
  assistantLoading,
}: DashboardProps) {
  const classMeta = getUserClassMeta(user.userClass);
  const goalMeta = getGoalTrackMeta(user.goalTrack);
  const todayKey = toLocalDateKey(new Date());

  const completedQuests = useMemo(
    () => todayQuestsAll.filter((quest) => quest.status === "completed").length,
    [todayQuestsAll],
  );
  const completionRate = todayQuestsAll.length
    ? Math.round((completedQuests / todayQuestsAll.length) * 100)
    : 0;

  const todayFocusSessions = focusSessions.filter(
    (session) => session.completed && isoToLocalDateKey(session.startTime) === todayKey,
  );
  const todayFocusMinutes = todayFocusSessions.reduce((sum, session) => sum + session.duration, 0);
  const todayFocusXP = todayFocusSessions.reduce((sum, session) => sum + session.xpEarned, 0);

  const dungeonCompleted = dailyDungeon?.challenges.filter((challenge) => challenge.status === "completed").length ?? 0;
  const dungeonTotal = dailyDungeon?.challenges.length ?? 0;
  const dungeonPct = dungeonTotal ? Math.round((dungeonCompleted / dungeonTotal) * 100) : 0;

  const bestHabitStreak = habits.reduce((max, habit) => Math.max(max, habit.currentStreak), 0);
  const momentumStreak = momentum?.streak ?? 0;
  const rewardPoints = momentum?.rewardPoints ?? 0;
  const scheduleToday = sortScheduleItems(scheduleItems.filter((item) => item.dateKey === todayKey)).slice(0, 4);
  const remindersToday = reminders.filter((reminder) => reminder.dateKey === todayKey).slice(0, 4);
  const communityPulse = communityMessages.filter((message) => message.senderType === "human").slice(-3).reverse();

  const nextMove =
    todayQuests[0]?.title ||
    remindersToday[0]?.title ||
    weeklyBoss?.goalTitle ||
    "Protect one meaningful block before the day starts scattering.";

  const bossPct = weeklyBoss && weeklyBoss.maxHP > 0 ? Math.min(100, Math.round((weeklyBoss.damage / weeklyBoss.maxHP) * 100)) : 0;

  return (
    <div className="space-y-8">
      <section className="cinematic-panel cinematic-shell relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="ambient-orb -left-16 top-10 h-52 w-52 bg-violet-500/35" />
        <div className="ambient-orb right-0 top-0 h-52 w-52 bg-cyan-400/30" />

        <div className="grid gap-8 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <div className="metric-pill text-xs uppercase tracking-[0.26em] text-slate-300">
                {format(new Date(), "EEEE, MMMM d")}
              </div>
              <div className="metric-pill text-xs uppercase tracking-[0.26em] text-cyan-200/90">
                {goalMeta.shortLabel}
              </div>
              <div className="metric-pill text-xs uppercase tracking-[0.26em] text-violet-200/90">
                {classMeta.label}
              </div>
            </div>

            <div className="space-y-4">
              <div className="scene-kicker">Today</div>
              <h1 className="max-w-4xl text-4xl font-semibold leading-[1.04] text-white sm:text-5xl lg:text-6xl">
                {user.name}, fokus utama hari ini: <span className="text-gradient">{nextMove}</span>.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                {goalMeta.description} Lihat prioritas, fokus, dan progress kamu di satu tempat tanpa bikin kepala penuh.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Tasks done", value: `${completionRate}%`, detail: `${completedQuests}/${todayQuestsAll.length || 0} cleared`, icon: Target },
                { label: "Focus today", value: `${todayFocusMinutes} min`, detail: `${todayFocusXP} XP earned`, icon: Timer },
                {
                  label: "Streak",
                  value: `${Math.max(momentumStreak, bestHabitStreak)} days`,
                  detail: `${rewardPoints} reward points ready`,
                  icon: Gift,
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div key={stat.label} className="soft-panel p-4">
                    <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.24em] text-slate-400">
                      <span>{stat.label}</span>
                      <Icon className="h-4 w-4 text-cyan-300" />
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-white">{stat.value}</div>
                    <div className="mt-1 text-sm text-slate-400">{stat.detail}</div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button size="lg" onClick={onAddQuest} className="px-6">
                <Plus className="h-4 w-4" />
                Add task
              </Button>
              <Button size="lg" variant="outline" onClick={onAddQuestAI} className="px-6">
                <Sparkles className="h-4 w-4" />
                Suggest task
              </Button>
              <Button size="lg" variant="outline" onClick={onViewPlanner} className="px-6">
                <CalendarDays className="h-4 w-4" />
                Plan my day
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <div className="soft-panel p-5">
              <div className="flex items-center gap-4">
                <LevelBadge level={user.level} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm uppercase tracking-[0.24em] text-slate-400">Level progress</div>
                  <div className="mt-2 text-xl font-semibold text-white">Level {user.level}</div>
                  <div className="text-sm text-slate-300">{classMeta.identity}</div>
                </div>
              </div>
              <div className="mt-5">
                <XPBar currentXP={user.xp} xpToNextLevel={user.xpToNextLevel} level={user.level} showLevel={false} />
              </div>
            </div>

            <div className="soft-panel p-5">
              <div className="scene-kicker">Weekly boss</div>
              {weeklyBoss ? (
                <>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-2xl font-semibold text-white">{weeklyBoss.bossName}</div>
                      <div className="mt-1 text-sm text-slate-300">{weeklyBoss.goalTitle || weeklyBoss.goalSummary || "Selesaikan quest untuk mengurangi HP boss ini."}</div>
                    </div>
                    <div className="rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-violet-100">
                      {bossPct}%
                    </div>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400"
                      style={{ width: `${bossPct}%` }}
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm text-slate-400">
                    <span>{weeklyBoss.damage} HP rusak</span>
                    <span>{weeklyBoss.maxHP - weeklyBoss.damage} HP tersisa</span>
                  </div>
                </>
              ) : (
                <div className="mt-4 rounded-3xl border border-dashed border-white/12 bg-white/[0.03] p-5 text-sm text-slate-300">
                  Belum ada target mingguan.
                  <Button variant="outline" onClick={() => onSelectWeeklyBoss("igris")} className="mt-4 w-full">
                    <Castle className="h-4 w-4" />
                    Set weekly target
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <WeeklyBossCard boss={weeklyBoss} onSelectBoss={onSelectWeeklyBoss} />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <Card className="p-6 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="scene-kicker">Today's tasks</div>
                <h2 className="mt-2 text-3xl font-semibold text-white">Mulai dari yang paling penting</h2>
              </div>
              <Button variant="ghost" onClick={onViewAllQuests}>
                See all
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 space-y-3">
              {todayQuests.slice(0, 3).map((quest) => (
                <button
                  key={quest.id}
                  type="button"
                  onClick={() => onQuestClick(quest)}
                  className="group w-full rounded-[28px] border border-white/10 bg-white/[0.04] p-5 text-left transition hover:border-violet-400/25 hover:bg-violet-500/8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.26em] text-slate-400">
                        <span>{quest.difficulty}</span>
                        {quest.isWeekly ? <span className="rounded-full border border-violet-400/20 px-2 py-1 text-violet-100">boss-linked</span> : null}
                        {quest.isDaily ? <span className="rounded-full border border-cyan-400/20 px-2 py-1 text-cyan-100">daily</span> : null}
                      </div>
                      <div className="mt-3 text-xl font-semibold text-white">{quest.title}</div>
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">{quest.description || "Tulis hasil kecil yang jelas supaya lebih gampang mulai."}</p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={(event) => {
                        event.stopPropagation();
                        onQuestComplete(quest.id);
                      }}
                    >
                      Mark done
                    </Button>
                  </div>
                </button>
              ))}

              {!todayQuests.length ? (
                <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-slate-300">
                  Belum ada task untuk hari ini. Buat satu task kecil atau pakai planner supaya hari terasa lebih jelas.
                  <div className="mt-4">
                    <Button variant="outline" onClick={onAddQuestAI}>
                      <Sparkles className="h-4 w-4" />
                      Generate a smart quest
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="scene-kicker">Schedule</div>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Jadwal hari ini</h3>
                </div>
                <Button variant="ghost" onClick={onViewPlanner}>
                  Open planner
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                {scheduleToday.length ? (
                  scheduleToday.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-[26px] border bg-gradient-to-br px-4 py-4 ${laneAccent[item.lane] || laneAccent.admin}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.24em] text-slate-300/80">
                            {item.startTime} - {item.endTime}
                          </div>
                          <div className="mt-2 text-base font-semibold text-white">{item.title}</div>
                          {item.note ? <div className="mt-1 text-sm text-slate-200/90">{item.note}</div> : null}
                        </div>
                        <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em]">
                          {item.lane}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[26px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-300">
                    No schedule blocks yet. Generate an AI day draft or add one manually.
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="scene-kicker">Reminders</div>
                  <h3 className="mt-2 text-2xl font-semibold text-white">Yang perlu diingat</h3>
                </div>
                <Button variant="ghost" onClick={onViewPlanner}>
                  Manage
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-5 space-y-3">
                {remindersToday.length ? (
                  remindersToday.map((reminder) => (
                    <button
                      key={reminder.id}
                      type="button"
                      onClick={onViewPlanner}
                      className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-cyan-400/25 hover:bg-cyan-400/8"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{reminder.time} · {reminder.type}</div>
                          <div className="mt-2 text-sm font-semibold text-white">{reminder.title}</div>
                        </div>
                        <div className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] ${reminder.completed ? "bg-emerald-400/10 text-emerald-200" : "bg-violet-500/10 text-violet-100"}`}>
                          {reminder.completed ? "done" : reminder.source || "manual"}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
                    Add reminders so the product can nudge you before friction wins.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <AssistantPanel
            messages={assistantMessages}
            onSend={onAssistantSend}
            suggestions={["Aku lagi mentok", "Susun 2 jam ke depan", "Pecah prioritas hari ini"]}
            isLoading={assistantLoading}
          />

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="scene-kicker">Community</div>
                <h3 className="mt-2 text-2xl font-semibold text-white">Update terbaru</h3>
              </div>
              <Button variant="ghost" onClick={onViewCommunity}>
                Open community
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {communityPulse.length ? (
                communityPulse.map((message) => (
                  <div key={message.id} className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{message.author}</div>
                        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{message.channel}</div>
                      </div>
                      <MessageCircle className="h-4 w-4 text-cyan-300" />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-300">{message.body}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[26px] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm leading-7 text-slate-300">
                  Belum ada update komunitas untuk ditampilkan.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="scene-kicker">Leaderboard</div>
                <h3 className="mt-2 text-2xl font-semibold text-white">Peringkat singkat</h3>
              </div>
              <Button variant="ghost" onClick={onViewLeaderboard}>
                See leaderboard
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {leaderboardPreview.slice(0, 4).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/15 text-sm font-semibold text-white">
                      #{entry.rank}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{entry.name}</div>
                      <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{entry.aura}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">Lv {entry.level}</div>
                    <div className="text-xs text-slate-400">Streak {entry.streak}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="scene-kicker">Check-in</div>
              <h3 className="mt-2 text-2xl font-semibold text-white">Gimana kondisi kamu hari ini?</h3>
            </div>
            <Button variant="ghost" onClick={onViewAllHabits}>
              Open habits
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {moods.map((mood) => (
              <button
                key={mood.value}
                type="button"
                onClick={() => onMoodChange(mood.value)}
                className={`rounded-[24px] border px-4 py-4 text-left transition ${
                  moodToday === mood.value
                    ? "border-violet-400/35 bg-violet-500/14"
                    : "border-white/10 bg-white/[0.03] hover:border-violet-400/25 hover:bg-violet-500/8"
                }`}
              >
                <div className="text-3xl">{mood.emoji}</div>
                <div className="mt-3 text-sm font-semibold text-white">{mood.label}</div>
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {habits.slice(0, 4).map((habit) => {
              const completedToday = habit.completedDates.some((date) => isoToLocalDateKey(date) === todayKey);
              return (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => onHabitToggle(habit.id)}
                  className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-4 text-left transition hover:border-emerald-400/25 hover:bg-emerald-500/8"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{habit.title}</div>
                    <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Streak {habit.currentStreak}</div>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.22em] ${completedToday ? "bg-emerald-400/10 text-emerald-200" : "bg-white/10 text-slate-200"}`}>
                    {completedToday ? "done" : "mark"}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="scene-kicker">Dungeon pulse</div>
          <h3 className="mt-2 text-2xl font-semibold text-white">Today's plan</h3>
          <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm text-slate-300">{dungeonCompleted} of {dungeonTotal || 0} challenges cleared</div>
              <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-200">
                {dungeonPct}%
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/6">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${dungeonPct}%` }} />
            </div>
            <Button variant="outline" onClick={onViewDungeon} className="mt-5 w-full">
              <Sword className="h-4 w-4" />
              Open today's plan
            </Button>
            <Button variant="ghost" onClick={onStartFocus} className="mt-3 w-full">
              <Timer className="h-4 w-4" />
              Start focus room
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
