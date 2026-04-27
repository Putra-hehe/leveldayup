import {
  BarChart3,
  CalendarDays,
  Castle,
  Flame,
  Gift,
  Home,
  MessageCircle,
  Plus,
  Settings,
  Sparkles,
  Target,
  Timer,
  Trophy,
  Users,
} from "lucide-react";

import { MomentumState, User } from "../types";
import { getGoalTrackMeta, getUserClassMeta } from "../utils/product";
import { BrandMark } from "./BrandMark";
import { LevelBadge } from "./LevelBadge";
import { Button } from "./ui/button";

interface AppSidebarProps {
  user: User;
  momentum?: MomentumState;
  currentPage: string;
  onNavigate: (page: string) => void;
  onAddQuest: () => void;
}

const sections = [
  {
    label: "Core loop",
    items: [
      { id: "dashboard", label: "Home", icon: Home },
      { id: "planner", label: "Planner", icon: CalendarDays },
      { id: "community", label: "Community", icon: MessageCircle },
      { id: "leaderboard", label: "Leaderboard", icon: Trophy },
      { id: "quests", label: "Tasks", icon: Target },
      { id: "focus", label: "Focus", icon: Timer },
    ],
  },
  {
    label: "Systems",
    items: [
      { id: "dungeon", label: "Today's plan", icon: Castle },
      { id: "habits", label: "Habits", icon: Flame },
      { id: "rewards", label: "Rewards", icon: Sparkles },
      { id: "stats", label: "Stats", icon: BarChart3 },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

export function AppSidebar({ user, momentum, currentPage, onNavigate, onAddQuest }: AppSidebarProps) {
  const classMeta = getUserClassMeta(user.userClass);
  const goalMeta = getGoalTrackMeta(user.goalTrack);
  const progress = user.xpToNextLevel > 0 ? Math.min(100, (user.xp / user.xpToNextLevel) * 100) : 0;
  const rewardPoints = momentum?.rewardPoints ?? 0;
  const streak = momentum?.streak ?? 0;
  const freezeCount = momentum?.freezeCount ?? 0;

  const normalizedPage = currentPage === "calendar" ? "planner" : currentPage;

  return (
    <aside className="sticky top-0 flex h-screen w-[300px] flex-col border-r border-white/10 bg-black/20 px-5 py-5 backdrop-blur-2xl">
      <div className="soft-panel p-5">
        <BrandMark size="sm" showTagline />

        <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-3">
            <LevelBadge level={user.level} size="sm" showCrown={false} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{user.name}</div>
              <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{classMeta.label} · {goalMeta.shortLabel}</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">{user.dailyGoal || classMeta.ritual}</p>
        </div>
      </div>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-3">
        <Button onClick={onAddQuest} className="w-full">
          <Plus className="h-4 w-4" />
          Add task
        </Button>
      </div>

      <nav className="mt-5 flex-1 space-y-6 overflow-y-auto pr-1">
        {sections.map((section) => (
          <div key={section.label}>
            <div className="px-3 text-[11px] uppercase tracking-[0.3em] text-slate-500">{section.label}</div>
            <div className="mt-3 space-y-1.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = normalizedPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className={`flex w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left transition ${
                      active
                        ? "bg-gradient-to-r from-violet-500/18 to-cyan-400/12 text-white shadow-[0_12px_40px_rgba(76,29,149,0.16)]"
                        : "text-slate-300 hover:bg-white/[0.05] hover:text-white"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? "text-cyan-200" : "text-slate-400"}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Progress to next level</div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-cyan-400" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-300">
          <span>{user.xp} / {user.xpToNextLevel} XP</span>
          <span>Lv {user.level + 1}</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-300">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
            <Gift className="mx-auto mb-1 h-4 w-4 text-violet-200" />
            {rewardPoints}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
            <Flame className="mx-auto mb-1 h-4 w-4 text-orange-200" />
            {streak}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-center">
            <Sparkles className="mx-auto mb-1 h-4 w-4 text-cyan-200" />
            {freezeCount}
          </div>
        </div>
      </div>
    </aside>
  );
}
