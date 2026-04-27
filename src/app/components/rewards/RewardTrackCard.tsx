import { Award, Compass, Crown, Flame, Gem, Map, Shield, Sparkles, Target, Trophy, Users, Zap, CalendarClock, HeartHandshake, ScrollText, Medal, WandSparkles } from "lucide-react";

import { RewardProgress } from "../../types";
import { getRewardCategoryMeta } from "../../utils/rewards";
import { getRarityColor } from "../../utils/xp";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

interface RewardTrackCardProps {
  progress: RewardProgress;
  onClaim?: (progress: RewardProgress) => void;
}

const iconMap = {
  spark: Sparkles,
  map: Map,
  flame: Flame,
  target: Target,
  signal: Users,
  orbit: Compass,
  crest: Award,
  gem: Gem,
  shield: Shield,
  crown: Crown,
  banner: Trophy,
  zap: Zap,
  clock: CalendarClock,
  handshake: HeartHandshake,
  scroll: ScrollText,
  medal: Medal,
  wand: WandSparkles,
};

const rarityLabel = {
  common: "umum",
  uncommon: "spesial",
  rare: "langka",
  epic: "epik",
  legendary: "legendaris",
} as const;

export function RewardTrackCard({ progress, onClaim }: RewardTrackCardProps) {
  const { definition } = progress;
  const Icon = iconMap[definition.visualKey as keyof typeof iconMap] || Award;
  const category = getRewardCategoryMeta(definition.category);
  const isReady = progress.state === "ready";
  const isClaimed = progress.state === "claimed";

  return (
    <div className={`rounded-[28px] border bg-gradient-to-br p-5 ${category.accent}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-slate-300">{category.label}</div>
            <h4 className="mt-1 text-lg font-semibold text-white">{definition.title}</h4>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${getRarityColor(definition.rarity)}`}>
          {rarityLabel[definition.rarity]}
        </span>
      </div>

      <p className="mt-4 text-sm leading-7 text-slate-200">{definition.description}</p>

      <div className="mt-5 space-y-2">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-300">
          <span>{isClaimed ? "Sudah diklaim" : isReady ? "Siap dirayakan" : "Progres"}</span>
          <span>
            {Math.min(progress.current, progress.target)} / {progress.target}
          </span>
        </div>
        <Progress value={progress.ratio * 100} className="h-2 bg-white/10" />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="text-xs leading-6 text-slate-300">
          {isClaimed
            ? `Diklaim ${progress.claimedAt ? new Date(progress.claimedAt).toLocaleDateString("id-ID") : "baru saja"}`
            : isReady
            ? "Reward ini sudah siap diklaim."
            : "Lanjutkan progres untuk membuka milestone ini."}
        </div>

        {onClaim ? (
          <Button
            type="button"
            variant={isClaimed ? "outline" : isReady ? "default" : "outline"}
            size="sm"
            disabled={!isReady || isClaimed}
            onClick={() => onClaim(progress)}
          >
            {isClaimed ? "Sudah" : isReady ? "Klaim" : "Terkunci"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
