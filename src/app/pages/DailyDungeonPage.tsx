import { DailyChallenge, DailyDungeon } from "../types";
import { Progress } from "../components/ui/progress";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import { Castle, CheckCircle2, Flame, Hourglass, Sparkles, Sword, Target, Timer } from "lucide-react";
import { FeatureHero } from "../components/FeatureHero";

interface DailyDungeonPageProps {
  dungeon?: DailyDungeon;
  onClaimReward: () => void;
  focusMin: 15 | 25;
  onChangeFocusMin: (minutes: 15 | 25) => void;
  onOpenQuests: () => void;
  onOpenHabits: () => void;
  onOpenFocus: () => void;
}

function iconForChallenge(challenge: DailyChallenge) {
  switch (challenge.type) {
    case "quest":
      return <Sword className="h-5 w-5 text-primary" />;
    case "habit":
      return <Flame className="h-5 w-5 text-orange-400" />;
    case "focus":
    default:
      return <Timer className="h-5 w-5 text-cyan-400" />;
  }
}

function labelForChallenge(challenge: DailyChallenge) {
  switch (challenge.type) {
    case "quest":
      return "Quest";
    case "habit":
      return "Habit";
    case "focus":
    default:
      return "Focus";
  }
}

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1, 12, 0, 0, 0);
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function DailyDungeonPage({
  dungeon,
  onClaimReward,
  focusMin,
  onChangeFocusMin,
  onOpenQuests,
  onOpenHabits,
  onOpenFocus,
}: DailyDungeonPageProps) {
  if (!dungeon) {
    return (
      <div className="space-y-6">
        <FeatureHero
          kicker="Daily dungeon"
          title="Kalau hari terasa berat, cukup clear beberapa tile saja dulu."
          description="Dungeon harian sengaja dibuat kecil. Tujuannya bukan bikin kamu makin sibuk, tapi bantu balikin momentum dengan langkah yang paling realistis."
          tone="amber"
          visual="dungeon"
          badge="quick recovery"
          guide={{ title: "Panduan dungeon", steps: ["Buka quest, habit, atau focus untuk memancing dungeon hari ini.", "Selesaikan tile kecil satu per satu.", "Klaim reward setelah partial clear atau full clear."] }}
        />

        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Daily dungeon</div>
          <h1 className="mt-2 text-3xl font-semibold">Short daily run</h1>
          <p className="mt-2 text-muted-foreground">
            Levelday has not generated today&apos;s dungeon yet. Open a quest or start a focus session and the system will build one.
          </p>
        </div>
      </div>
    );
  }

  const totalChallenges = dungeon.challenges.length;
  const completedCount = dungeon.challenges.filter((challenge) => challenge.status === "completed").length;
  const progressValue = totalChallenges ? (completedCount / totalChallenges) * 100 : 0;
  const partialThreshold = Math.ceil(totalChallenges * 0.4);

  const runStatus =
    completedCount === totalChallenges
      ? "clear"
      : completedCount >= partialThreshold
      ? "partial"
      : "active";

  const canClaim = !dungeon.rewardClaimed && runStatus !== "active";

  const statusCopy =
    runStatus === "clear"
      ? "Full clear"
      : runStatus === "partial"
      ? "Partial clear"
      : "In progress";

  return (
    <div className="space-y-6">
      <FeatureHero
        kicker="Daily dungeon"
        title="Satu run kecil cukup untuk menyelamatkan momentum hari ini."
        description="Clear tile satu per satu, ambil reward kalau sudah layak, lalu balik lagi ke quest utama. Simple, cepat, dan tetap terasa progresnya."
        tone="amber"
        visual="dungeon"
        badge="3-5 langkah"
        guide={{ title: "Panduan dungeon", steps: ["Lihat tile yang tersedia hari ini.", "Tekan tombol arah untuk membuka fitur yang dibutuhkan.", "Klaim reward saat syarat clear sudah terpenuhi."] }}
        stats={[
          { label: "Clear", value: `${completedCount}/${totalChallenges}` },
          { label: "Status", value: statusCopy },
          { label: "Reward", value: `+${dungeon.reward.clearXp} XP` },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Daily dungeon</div>
          <h1 className="mt-2 text-3xl font-semibold">Short daily run</h1>
          <p className="mt-2 max-w-3xl text-muted-foreground">
            Use the dungeon to shrink the day into a handful of winnable moves. It is intentionally small so you can recover momentum fast.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/45 px-4 py-3 text-right text-sm">
          <div className="text-muted-foreground">{formatDateLabel(dungeon.dateKey)}</div>
          <div className="mt-1 font-medium">{statusCopy}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/60 bg-card/50 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Run progress</div>
              <h2 className="mt-2 text-2xl font-semibold">{completedCount} of {totalChallenges} cleared</h2>
            </div>
            <div className="rounded-full border border-border/50 bg-background/35 px-3 py-1.5 text-sm">
              {Math.round(progressValue)}%
            </div>
          </div>

          <div className="mt-5">
            <Progress value={progressValue} />
            <div className="mt-2 text-sm text-muted-foreground">
              Partial reward unlocks at {partialThreshold}/{totalChallenges}. Full clear grants +{dungeon.reward.clearXp} XP.
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {dungeon.challenges.map((challenge, index) => {
              const completed = challenge.status === "completed";
              return (
                <div
                  key={challenge.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    completed
                      ? "border-green-500/20 bg-green-500/10"
                      : "border-border/50 bg-background/35"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-background/60">
                      {iconForChallenge(challenge)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          {labelForChallenge(challenge)}
                        </span>
                        <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                      </div>
                      <div className={`mt-2 font-medium ${completed ? "text-muted-foreground line-through" : ""}`}>
                        {challenge.titleSnapshot}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-400" />
                      ) : (
                        <Hourglass className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Reward chest
            </div>
            <h3 className="mt-3 text-2xl font-semibold">Claim today&apos;s XP when you earn it</h3>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                Partial clear: <span className="font-medium text-foreground">+{dungeon.reward.partialXp} XP</span>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                Full clear: <span className="font-medium text-foreground">+{dungeon.reward.clearXp} XP</span>
              </div>
            </div>

            <Button onClick={onClaimReward} disabled={!canClaim} className="mt-5 w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600">
              {dungeon.rewardClaimed
                ? "Reward claimed"
                : canClaim
                ? runStatus === "clear"
                  ? `Claim full reward (+${dungeon.reward.clearXp} XP)`
                  : `Claim partial reward (+${dungeon.reward.partialXp} XP)`
                : "Complete more steps first"}
            </Button>

            <p className="mt-3 text-sm text-muted-foreground">
              The dungeon is not meant to replace your week. It exists to keep momentum alive when the bigger plan feels heavy.
            </p>
          </Card>

          <Card className="border-border/60 bg-card/50 p-6">
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Quick launchers</div>
            <h3 className="mt-2 text-xl font-semibold">Clear a tile from here</h3>
            <div className="mt-4 grid gap-3">
              <Button variant="outline" className="justify-start" onClick={onOpenQuests}>
                <Target className="mr-2 h-4 w-4" />
                Open quest board
              </Button>
              <Button variant="outline" className="justify-start" onClick={onOpenHabits}>
                <Flame className="mr-2 h-4 w-4" />
                Open habits
              </Button>
              <Button variant="outline" className="justify-start" onClick={onOpenFocus}>
                <Timer className="mr-2 h-4 w-4" />
                Start focus session
              </Button>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/50 p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Castle className="h-4 w-4 text-primary" />
              Focus requirement
            </div>
            <h3 className="mt-2 text-xl font-semibold">Set the minimum sprint for focus tiles</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Keep it at 15 minutes for low-energy days, or 25 minutes if you want the dungeon to demand a fuller Pomodoro.
            </p>

            <ToggleGroup
              type="single"
              value={String(focusMin)}
              onValueChange={(value) => {
                if (value === "15" || value === "25") {
                  onChangeFocusMin(value === "15" ? 15 : 25);
                }
              }}
              className="mt-4 justify-start"
            >
              <ToggleGroupItem value="15" className={focusMin === 15 ? "bg-primary text-primary-foreground" : ""}>
                15 min
              </ToggleGroupItem>
              <ToggleGroupItem value="25" className={focusMin === 25 ? "bg-primary text-primary-foreground" : ""}>
                25 min
              </ToggleGroupItem>
            </ToggleGroup>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default DailyDungeonPage;
