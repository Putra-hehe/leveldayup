import { motion } from "motion/react";
import {
  BarChart3,
  Bell,
  CalendarDays,
  Castle,
  CheckCircle2,
  Flame,
  Gift,
  MessageCircle,
  Orbit,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Sword,
  Target,
  Timer,
  Trophy,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "./ui/utils";

type FeatureHeroTone = "violet" | "cyan" | "emerald" | "amber" | "rose";
type FeatureHeroVisual =
  | "quest"
  | "boss"
  | "habit"
  | "focus"
  | "dungeon"
  | "stats"
  | "planner"
  | "community"
  | "rewards"
  | "leaderboard"
  | "settings"
  | "onboarding"
  | "calendar";

interface FeatureHeroStat {
  label: string;
  value: string;
}

interface FeatureHeroGuide {
  title?: string;
  steps: string[];
}

interface FeatureHeroProps {
  kicker: string;
  title: string;
  description: string;
  tone?: FeatureHeroTone;
  visual?: FeatureHeroVisual;
  badge?: string;
  stats?: FeatureHeroStat[];
  guide?: FeatureHeroGuide;
  actions?: ReactNode;
  className?: string;
}

const toneClassMap: Record<FeatureHeroTone, string> = {
  violet: "feature-hero-tone-violet",
  cyan: "feature-hero-tone-cyan",
  emerald: "feature-hero-tone-emerald",
  amber: "feature-hero-tone-amber",
  rose: "feature-hero-tone-rose",
};

const visualMeta: Record<FeatureHeroVisual, { icon: typeof Sword; label: string }> = {
  quest: { icon: Sword, label: "Quest" },
  boss: { icon: Shield, label: "Boss" },
  habit: { icon: Flame, label: "Habit" },
  focus: { icon: Timer, label: "Focus" },
  dungeon: { icon: Castle, label: "Dungeon" },
  stats: { icon: BarChart3, label: "Stats" },
  planner: { icon: CalendarDays, label: "Planner" },
  calendar: { icon: CalendarDays, label: "Calendar" },
  community: { icon: MessageCircle, label: "Party" },
  rewards: { icon: Gift, label: "Reward" },
  leaderboard: { icon: Trophy, label: "Rank" },
  settings: { icon: SlidersHorizontal, label: "System" },
  onboarding: { icon: Sparkles, label: "Start" },
};

function VisualScene({ visual }: { visual: FeatureHeroVisual }) {
  const meta = visualMeta[visual];
  const Icon = meta.icon;

  if (visual === "quest") {
    return (
      <div className="feature-scene feature-scene-quest">
        <div className="feature-orbit-ring" />
        {["Boss step", "Daily", "Hard"].map((label, index) => (
          <motion.div
            key={label}
            className={`feature-quest-card feature-quest-card-${index + 1}`}
            animate={{ y: [0, -8, 0], rotate: index === 1 ? [1, -2, 1] : [-1, 2, -1] }}
            transition={{ duration: 3.5 + index * 0.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{label}</span>
          </motion.div>
        ))}
        <div className="feature-center-emblem"><Sword className="h-11 w-11" /></div>
      </div>
    );
  }

  if (visual === "focus") {
    return (
      <div className="feature-scene feature-scene-focus">
        <div className="feature-focus-ring"><span>25</span><small>min</small></div>
        <div className="feature-focus-wave feature-focus-wave-1" />
        <div className="feature-focus-wave feature-focus-wave-2" />
        <div className="feature-focus-chip"><Zap className="h-4 w-4" /> Deep work</div>
      </div>
    );
  }

  if (visual === "habit") {
    return (
      <div className="feature-scene feature-scene-habit">
        <div className="feature-streak-lane">
          {[1, 2, 3, 4, 5].map((day) => (
            <motion.div
              key={day}
              className="feature-streak-dot"
              animate={{ scale: [1, 1.16, 1], opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 2, delay: day * 0.18, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flame className="h-4 w-4" />
            </motion.div>
          ))}
        </div>
        <div className="feature-center-emblem"><Flame className="h-11 w-11" /></div>
        <div className="feature-habit-label">streak shield</div>
      </div>
    );
  }

  if (visual === "dungeon") {
    return (
      <div className="feature-scene feature-scene-dungeon">
        <Castle className="feature-castle" />
        <div className="feature-dungeon-path">
          {["Quest", "Habit", "Focus", "Reward"].map((label, index) => (
            <motion.div
              key={label}
              className="feature-dungeon-tile"
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 2.8, delay: index * 0.22, repeat: Infinity, ease: "easeInOut" }}
            >
              {label}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  if (visual === "stats") {
    return (
      <div className="feature-scene feature-scene-stats">
        {[54, 78, 38, 92, 64].map((height, index) => (
          <motion.div
            key={height + index}
            className="feature-stat-bar"
            style={{ height: `${height}%` }}
            animate={{ scaleY: [0.78, 1, 0.78] }}
            transition={{ duration: 2.5, delay: index * 0.18, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <div className="feature-analytics-badge"><BarChart3 className="h-4 w-4" /> weekly XP</div>
      </div>
    );
  }

  if (visual === "planner" || visual === "calendar") {
    return (
      <div className="feature-scene feature-scene-planner">
        {["08:00 Focus", "10:30 Quest", "16:00 Review"].map((label, index) => (
          <motion.div
            key={label}
            className="feature-timeline-item"
            animate={{ x: [0, index % 2 ? 8 : -8, 0] }}
            transition={{ duration: 3.2, delay: index * 0.25, repeat: Infinity, ease: "easeInOut" }}
          >
            <span />{label}
          </motion.div>
        ))}
        <div className="feature-calendar-card"><CalendarDays className="h-8 w-8" /><strong>Today plan</strong></div>
      </div>
    );
  }

  if (visual === "community") {
    return (
      <div className="feature-scene feature-scene-community">
        {["Need boost?", "Quest clear!", "+1 party"].map((label, index) => (
          <motion.div
            key={label}
            className={`feature-chat-bubble feature-chat-bubble-${index + 1}`}
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 3, delay: index * 0.28, repeat: Infinity, ease: "easeInOut" }}
          >
            {label}
          </motion.div>
        ))}
        <div className="feature-center-emblem"><MessageCircle className="h-11 w-11" /></div>
      </div>
    );
  }

  if (visual === "rewards") {
    return (
      <div className="feature-scene feature-scene-rewards">
        <motion.div className="feature-chest" animate={{ rotate: [0, -2, 2, 0], y: [0, -6, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
          <Gift className="h-14 w-14" />
        </motion.div>
        <div className="feature-loot feature-loot-1">+XP</div>
        <div className="feature-loot feature-loot-2">badge</div>
        <div className="feature-loot feature-loot-3">point</div>
      </div>
    );
  }

  if (visual === "leaderboard") {
    return (
      <div className="feature-scene feature-scene-leaderboard">
        {[2, 1, 3].map((rank, index) => (
          <motion.div
            key={rank}
            className={`feature-podium feature-podium-${rank}`}
            animate={{ y: [0, rank === 1 ? -8 : -4, 0] }}
            transition={{ duration: 3, delay: index * 0.2, repeat: Infinity, ease: "easeInOut" }}
          >
            #{rank}
          </motion.div>
        ))}
        <Trophy className="feature-trophy" />
      </div>
    );
  }

  if (visual === "settings") {
    return (
      <div className="feature-scene feature-scene-settings">
        {["Profile", "Notifikasi", "Export"].map((label, index) => (
          <motion.div
            key={label}
            className="feature-setting-row"
            animate={{ opacity: [0.76, 1, 0.76] }}
            transition={{ duration: 2.5, delay: index * 0.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Bell className="h-4 w-4" />
            <span>{label}</span>
            <i />
          </motion.div>
        ))}
      </div>
    );
  }

  if (visual === "boss") {
    return (
      <div className="feature-scene feature-scene-boss">
        <div className="feature-boss-shadow" />
        <Shield className="feature-boss-icon" />
        <div className="feature-boss-hp"><span /></div>
        <div className="feature-boss-copy">quest damage</div>
      </div>
    );
  }

  return (
    <div className="feature-scene feature-scene-onboarding">
      <div className="feature-rank-ladder">
        {["E", "D", "C", "B", "A", "S"].map((rank, index) => (
          <motion.span
            key={rank}
            animate={{ y: [0, -6, 0], opacity: [0.72, 1, 0.72] }}
            transition={{ duration: 2.4, delay: index * 0.13, repeat: Infinity, ease: "easeInOut" }}
          >
            {rank}
          </motion.span>
        ))}
      </div>
      <div className="feature-center-emblem"><Icon className="h-11 w-11" /></div>
    </div>
  );
}

export function FeatureHero({
  kicker,
  title,
  description,
  tone = "violet",
  visual = "onboarding",
  badge,
  stats = [],
  guide,
  actions,
  className,
}: FeatureHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("cinematic-panel cinematic-shell feature-hero-wrapper overflow-hidden p-5 sm:p-7", toneClassMap[tone], className)}
    >
      <div className="ambient-orb -left-10 top-0 h-44 w-44 bg-violet-500/30" />
      <div className="ambient-orb right-0 top-0 h-40 w-40 bg-cyan-400/25" />

      <div className="grid items-center gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="scene-kicker">{kicker}</div>
            {badge ? (
              <div className="metric-pill flex items-center gap-2 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-200">
                <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
                {badge}
              </div>
            ) : null}
          </div>

          <div>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight text-white sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">{description}</p>
          </div>

          {guide?.steps?.length ? (
            <div className="feature-guide-panel">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-cyan-100/90">
                <Orbit className="h-3.5 w-3.5" />
                {guide.title || "Panduan cepat"}
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {guide.steps.slice(0, 3).map((step, index) => (
                  <div key={`${step}-${index}`} className="feature-guide-step">
                    <span>{index + 1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {stats.length ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="soft-panel p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{stat.label}</div>
                  <div className="mt-2 text-xl font-semibold text-white">{stat.value}</div>
                </div>
              ))}
            </div>
          ) : null}

          {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
        </div>

        <div className="feature-hero-stage" aria-hidden="true">
          <div className="feature-hero-grid" />
          <div className="feature-energy-stream feature-energy-stream-1" />
          <div className="feature-energy-stream feature-energy-stream-2" />
          <VisualScene visual={visual} />
          <div className="feature-hero-platform" />
        </div>
      </div>
    </motion.section>
  );
}
