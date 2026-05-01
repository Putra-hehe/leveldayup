import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  ChevronRight,
  Gift,
  MessageCircle,
  Plus,
  Sparkles,
  Sword,
  Target,
  Timer,
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
import { getGoalTrackMeta } from "../utils/product";
import { isoToLocalDateKey, toLocalDateKey } from "../utils/date";
import { sortScheduleItems } from "../utils/planner";
import { AssistantPanel } from "../components/AssistantPanel";
import { LevelBadge } from "../components/LevelBadge";
import { XPBar } from "../components/XPBar";
import { WeeklyBossCard } from "../components/WeeklyBossCard";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

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
  { emoji: "🫠", label: "Low", value: "low" },
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
  const goalMeta = getGoalTrackMeta(user.goalTrack);
  const todayKey = toLocalDateKey(new Date());
  const [activeTab, setActiveTab] = useState<string>("today");
  const [assistantOpen, setAssistantOpen] = useState<boolean>(false);

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
    weeklyBoss?.goalTitle ||
    "Pilih satu tugas penting hari ini.";

  const bossPct = weeklyBoss && weeklyBoss.maxHP > 0 ? Math.min(100, Math.round((weeklyBoss.damage / weeklyBoss.maxHP) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* === COMPACT HERO === */}
      <section className="cinematic-panel cinematic-shell relative overflow-hidden p-5 sm:p-7">
        <div className="ambient-orb -left-12 top-6 h-40 w-40 bg-violet-500/30" />
        <div className="ambient-orb right-0 top-0 h-40 w-40 bg-cyan-400/25" />

        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="metric-pill text-[10px] uppercase tracking-[0.22em] text-slate-300">
                {format(new Date(), "EEE, MMM d")}
              </div>
              <div className="metric-pill text-[10px] uppercase tracking-[0.22em] text-cyan-200/90">
                {goalMeta.shortLabel}
              </div>
            </div>

            <div>
              <div className="scene-kicker">Hari ini</div>
              <h1 className="mt-2 text-2xl font-semibold leading-tight text-white sm:text-3xl">
                {user.name}, fokus: <span className="text-gradient">{nextMove}</span>
              </h1>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={onAddQuest}>
                <Plus className="h-4 w-4" />
                Task baru
              </Button>
              <Button size="sm" variant="outline" onClick={onStartFocus}>
                <Timer className="h-4 w-4" />
                Mulai fokus
              </Button>
              <Button size="sm" variant="ghost" onClick={onAddQuestAI}>
                <Sparkles className="h-4 w-4" />
                AI suggest
              </Button>
            </div>
          </div>

          {/* Right: compact level + boss */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="soft-panel p-4">
              <div className="flex items-center gap-3">
                <LevelBadge level={user.level} />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Level</div>
                  <div className="text-base font-semibold text-white">Lv {user.level}</div>
                </div>
              </div>
              <div className="mt-3">
                <XPBar currentXP={user.xp} xpToNextLevel={user.xpToNextLevel} level={user.level} showLevel={false} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("boss")}
              className="soft-panel p-4 text-left transition hover:border-violet-400/30"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Weekly boss</div>
                {weeklyBoss ? (
                  <div className="rounded-full border border-violet-400/20 bg-violet-500/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-violet-100">
                    {bossPct}%
                  </div>
                ) : null}
              </div>
              {weeklyBoss ? (
                <>
                  <div className="mt-2 truncate text-sm font-semibold text-white">{weeklyBoss.bossName}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400"
                      style={{ width: `${bossPct}%` }}
                    />
                  </div>
                </>
              ) : (
                <div className="mt-2 text-xs text-slate-400">Belum dipilih. Tap untuk set.</div>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* === COMPACT STAT STRIP === */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: "Tugas", value: `${completionRate}%`, detail: `${completedQuests}/${todayQuestsAll.length || 0}`, icon: Target },
          { label: "Fokus", value: `${todayFocusMinutes}m`, detail: `${todayFocusXP} XP`, icon: Timer },
          {
            label: "Streak",
            value: `${Math.max(momentumStreak, bestHabitStreak)}d`,
            detail: `${rewardPoints} poin`,
            icon: Gift,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="soft-panel p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                <span>{stat.label}</span>
                <Icon className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-xl font-semibold text-white sm:text-2xl">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* === MAIN AREA — TABS === */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="today">Hari ini</TabsTrigger>
          <TabsTrigger value="plan">Plan</TabsTrigger>
          <TabsTrigger value="boss">Boss</TabsTrigger>
          <TabsTrigger value="habits">Habit</TabsTrigger>
          <TabsTrigger value="social">Sosial</TabsTrigger>
        </TabsList>

        {/* TAB: HARI INI — focused on tasks */}
        <TabsContent value="today" className="space-y-4">
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="scene-kicker">Tugas hari ini</div>
                <h2 className="mt-1 text-xl font-semibold text-white sm:text-2xl">Mulai dari yang penting</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewAllQuests}>
                Semua
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {todayQuests.slice(0, 3).map((quest) => (
                <button
                  key={quest.id}
                  type="button"
                  onClick={() => onQuestClick(quest)}
                  className="group w-full rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-violet-400/25 hover:bg-violet-500/8"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-slate-400">
                        <span>{quest.difficulty}</span>
                        {quest.isWeekly ? <span className="rounded-full border border-violet-400/20 px-1.5 py-0.5 text-violet-100">boss</span> : null}
                        {quest.isDaily ? <span className="rounded-full border border-cyan-400/20 px-1.5 py-0.5 text-cyan-100">daily</span> : null}
                      </div>
                      <div className="mt-2 text-base font-semibold text-white">{quest.title}</div>
                      {quest.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-300">{quest.description}</p>
                      ) : null}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(event) => {
                        event.stopPropagation();
                        onQuestComplete(quest.id);
                      }}
                    >
                      Done
                    </Button>
                  </div>
                </button>
              ))}

              {!todayQuests.length ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-6 text-center text-sm text-slate-300">
                  Belum ada task hari ini.
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <Button size="sm" onClick={onAddQuest}>
                      <Plus className="h-4 w-4" />
                      Tambah
                    </Button>
                    <Button variant="outline" size="sm" onClick={onAddQuestAI}>
                      <Sparkles className="h-4 w-4" />
                      AI suggest
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          {/* Quick check-in (mood) - simple, just here on today tab */}
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="scene-kicker">Mood cek</div>
              {moodToday ? (
                <div className="text-[10px] uppercase tracking-[0.22em] text-emerald-200">tersimpan</div>
              ) : null}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => onMoodChange(mood.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 transition ${
                    moodToday === mood.value
                      ? "border-violet-400/35 bg-violet-500/14"
                      : "border-white/10 bg-white/[0.03] hover:border-violet-400/25"
                  }`}
                >
                  <div className="text-2xl">{mood.emoji}</div>
                  <div className="text-[11px] font-medium text-white">{mood.label}</div>
                </button>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* TAB: PLAN — schedule + reminders */}
        <TabsContent value="plan" className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="scene-kicker">Jadwal</div>
                <h3 className="mt-1 text-lg font-semibold text-white">Hari ini</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewPlanner}>
                Planner
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {scheduleToday.length ? (
                scheduleToday.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border bg-gradient-to-br px-4 py-3 ${laneAccent[item.lane] || laneAccent.admin}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-300/80">
                          {item.startTime} – {item.endTime}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-white">{item.title}</div>
                        {item.note ? <div className="mt-1 text-xs text-slate-200/90">{item.note}</div> : null}
                      </div>
                      <div className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]">
                        {item.lane}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
                  Belum ada jadwal. Buka planner untuk atur.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="scene-kicker">Pengingat</div>
                <h3 className="mt-1 text-lg font-semibold text-white">Yang perlu diingat</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewPlanner}>
                Atur
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {remindersToday.length ? (
                remindersToday.map((reminder) => (
                  <button
                    key={reminder.id}
                    type="button"
                    onClick={onViewPlanner}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:border-cyan-400/25"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-400">{reminder.time} · {reminder.type}</div>
                        <div className="mt-1 truncate text-sm font-semibold text-white">{reminder.title}</div>
                      </div>
                      <div className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${reminder.completed ? "bg-emerald-400/10 text-emerald-200" : "bg-violet-500/10 text-violet-100"}`}>
                        {reminder.completed ? "done" : reminder.source || "manual"}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  Belum ada pengingat hari ini.
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* TAB: BOSS — full weekly boss card */}
        <TabsContent value="boss" className="space-y-4">
          <WeeklyBossCard boss={weeklyBoss} onSelectBoss={onSelectWeeklyBoss} />

          <Card className="p-5">
            <div className="scene-kicker">Daily dungeon</div>
            <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-slate-300">{dungeonCompleted} dari {dungeonTotal || 0} selesai</div>
                <div className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-200">
                  {dungeonPct}%
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${dungeonPct}%` }} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button variant="outline" size="sm" onClick={onViewDungeon}>
                  <Sword className="h-4 w-4" />
                  Buka dungeon
                </Button>
                <Button variant="ghost" size="sm" onClick={onStartFocus}>
                  <Timer className="h-4 w-4" />
                  Focus room
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* TAB: HABITS — habit list */}
        <TabsContent value="habits" className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="scene-kicker">Habit</div>
                <h3 className="mt-1 text-lg font-semibold text-white">Cek hari ini</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewAllHabits}>
                Semua
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {habits.slice(0, 6).map((habit) => {
                const completedToday = habit.completedDates.some((date) => isoToLocalDateKey(date) === todayKey);
                return (
                  <button
                    key={habit.id}
                    type="button"
                    onClick={() => onHabitToggle(habit.id)}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left transition hover:border-emerald-400/25"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{habit.title}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Streak {habit.currentStreak}</div>
                    </div>
                    <div className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${completedToday ? "bg-emerald-400/10 text-emerald-200" : "bg-white/10 text-slate-200"}`}>
                      {completedToday ? "done" : "mark"}
                    </div>
                  </button>
                );
              })}

              {!habits.length ? (
                <div className="col-span-full rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-center text-sm text-slate-300">
                  Belum ada habit. Tambahkan satu yang ringan dulu.
                  <div className="mt-3">
                    <Button size="sm" variant="outline" onClick={onHabitOpen}>
                      <Plus className="h-4 w-4" />
                      Habit baru
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </Card>
        </TabsContent>

        {/* TAB: SOCIAL — community + leaderboard */}
        <TabsContent value="social" className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="scene-kicker">Komunitas</div>
                <h3 className="mt-1 text-lg font-semibold text-white">Update terbaru</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewCommunity}>
                Buka
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {communityPulse.length ? (
                communityPulse.map((message) => (
                  <div key={message.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{message.author}</div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{message.channel}</div>
                      </div>
                      <MessageCircle className="h-4 w-4 shrink-0 text-cyan-300" />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-300">{message.body}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                  Belum ada update.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="scene-kicker">Leaderboard</div>
                <h3 className="mt-1 text-lg font-semibold text-white">Peringkat</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={onViewLeaderboard}>
                Lihat semua
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {leaderboardPreview.slice(0, 4).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-500/15 text-xs font-semibold text-white">
                      #{entry.rank}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{entry.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{entry.aura}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">Lv {entry.level}</div>
                    <div className="text-[10px] text-slate-400">Streak {entry.streak}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* === FLOATING ASSISTANT (collapsible) === */}
      <div className="fixed bottom-20 right-4 z-30 sm:bottom-6 sm:right-6">
        {assistantOpen ? (
          <div className="w-[min(92vw,360px)] rounded-2xl border border-white/10 bg-card/95 shadow-2xl backdrop-blur">
            <div className="flex items-center justify-between border-b border-white/10 p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <div className="text-sm font-semibold text-white">Asisten</div>
              </div>
              <button
                type="button"
                onClick={() => setAssistantOpen(false)}
                className="rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                aria-label="Close assistant"
              >
                ×
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-3">
              <AssistantPanel
                messages={assistantMessages}
                onSend={onAssistantSend}
                suggestions={["Aku lagi mentok", "Susun 2 jam ke depan", "Pecah prioritas"]}
                isLoading={assistantLoading}
              />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAssistantOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/30 transition hover:scale-105 sm:h-14 sm:w-14"
            aria-label="Open assistant"
          >
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        )}
      </div>
    </div>
  );
}
