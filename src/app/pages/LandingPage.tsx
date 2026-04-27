import { motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  Compass,
  Crown,
  Flame,
  MessageCircle,
  Sparkles,
  Swords,
  Timer,
} from "lucide-react";

import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { APP_DESCRIPTION, APP_TAGLINE } from "../utils/product";

interface LandingPageProps {
  onGetStarted: () => void;
}

const storyCards = [
  {
    title: "Cinematic command deck",
    description: "A dashboard that feels like a mission room, not a flat task wall.",
    icon: Compass,
  },
  {
    title: "Integrated AI planner",
    description: "Generate a believable day draft with schedule blocks, recovery, and reminders.",
    icon: Bot,
  },
  {
    title: "Community energy",
    description: "Global chat, friends chat, and an AI lounge that keeps the product feeling alive.",
    icon: MessageCircle,
  },
  {
    title: "Progress that feels real",
    description: "Boss fights, streaks, XP, ranks, and momentum loops tied to actual work.",
    icon: Crown,
  },
];

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-8">
      <div className="ambient-orb left-[-4rem] top-[6rem] h-72 w-72 bg-violet-500/50" />
      <div className="ambient-orb right-[-3rem] top-[12rem] h-64 w-64 bg-cyan-400/40" />
      <div className="ambient-orb bottom-[-2rem] left-[32%] h-72 w-72 bg-fuchsia-500/35" />

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75 }}
          className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center"
        >
          <div className="space-y-8">
            <BrandMark size="lg" showTagline />

            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-100 shadow-lg shadow-violet-500/10">
              <Sparkles className="h-4 w-4" />
              {APP_TAGLINE}
            </div>

            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.05] text-white sm:text-6xl xl:text-7xl">
                A cinematic productivity RPG for people who need help <span className="text-gradient">starting</span>.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
                {APP_DESCRIPTION} The new build adds an immersive dashboard, AI scheduling, reminders, community chat, and a competitive loop that makes progress feel alive.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" onClick={onGetStarted} className="px-8">
                Enter Levelday
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div className="soft-panel flex items-center gap-3 px-5 py-3 text-sm text-slate-300">
                <Timer className="h-4 w-4 text-cyan-300" />
                Designed for study pressure, portfolio work, routines, and recovery.
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "AI planner", value: "Draft your day in blocks" },
                { label: "Community", value: "Global, friends, AI lounge" },
                { label: "Leaderboard", value: "Ranks, streaks, movement" },
              ].map((item) => (
                <div key={item.label} className="soft-panel px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.26em] text-slate-400">{item.label}</div>
                  <div className="mt-2 text-sm font-medium text-white">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.12 }}
            className="relative"
          >
            <div className="cinematic-panel cinematic-shell p-6 sm:p-7">
              <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-5">
                  <div className="soft-panel p-5">
                    <div className="scene-kicker">Mission control</div>
                    <h2 className="mt-2 text-2xl font-semibold text-white">Your day, staged like a scene</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {[
                        { label: "Boss HP", value: "74%", icon: Swords },
                        { label: "Streak", value: "12 days", icon: Flame },
                        { label: "Focus", value: "2 blocks", icon: Timer },
                      ].map((item) => {
                        const Icon = item.icon;
                        return (
                          <div key={item.label} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-slate-400">
                              <Icon className="h-3.5 w-3.5 text-cyan-300" />
                              {item.label}
                            </div>
                            <div className="mt-3 text-xl font-semibold text-white">{item.value}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="soft-panel p-5">
                    <div className="scene-kicker">Planner</div>
                    <div className="mt-3 space-y-3">
                      {[
                        ["09:00", "Deep work: first draft", "deep-work"],
                        ["10:30", "Recovery break", "recovery"],
                        ["11:00", "Ritual: review weak points", "ritual"],
                      ].map(([time, title, lane]) => (
                        <div key={title} className="flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3">
                          <div className="w-16 text-sm font-medium text-cyan-200">{time}</div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white">{title}</div>
                            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{lane}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="soft-panel p-5">
                    <div className="scene-kicker">AI lounge</div>
                    <div className="mt-3 space-y-3">
                      <div className="rounded-3xl rounded-tl-md border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-6 text-slate-100">
                        Ask me for a restart plan, a smaller next step, or a focused daily draft.
                      </div>
                      <div className="ml-auto max-w-[88%] rounded-3xl rounded-tr-md border border-violet-400/20 bg-violet-500/14 px-4 py-3 text-sm text-violet-50">
                        I feel blocked by a big assignment.
                      </div>
                      <div className="rounded-3xl rounded-tl-md border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm leading-6 text-cyan-50">
                        Start with one ugly paragraph in a 15 minute sprint, then reassess instead of spiraling.
                      </div>
                    </div>
                  </div>

                  <div className="soft-panel p-5">
                    <div className="scene-kicker">Leaderboard pulse</div>
                    <div className="mt-4 space-y-3">
                      {[
                        ["#01", "Lyra Vale", "+2"],
                        ["#02", "Jin Mercer", "+1"],
                        ["#03", "You", "new"],
                      ].map(([rank, name, move]) => (
                        <div key={name} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-3">
                          <div>
                            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{rank}</div>
                            <div className="text-sm font-medium text-white">{name}</div>
                          </div>
                          <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                            {move}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {storyCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.06, duration: 0.5 }}
              >
                <Card className="hover-lift h-full p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/15 text-cyan-100">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-white">{card.title}</h3>
                    <p className="text-sm leading-7 text-slate-300">{card.description}</p>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
