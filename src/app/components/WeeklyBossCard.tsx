import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Crown, Shield, Skull, Sword, Target } from "lucide-react";

import { WeeklyBoss } from "../types";
import { WEEKLY_BOSSES } from "../utils/bosses";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface WeeklyBossSelection {
  bossId: string;
  goalTitle?: string;
  goalSummary?: string;
  rewardLabel?: string;
}

interface WeeklyBossCardProps {
  boss?: WeeklyBoss;
  onSelectBoss: (selection: string | WeeklyBossSelection) => void;
}

export function WeeklyBossCard({ boss, onSelectBoss }: WeeklyBossCardProps) {
  const [open, setOpen] = useState(false);
  const [selectedBossId, setSelectedBossId] = useState(WEEKLY_BOSSES[0]?.id ?? "igris");
  const [goalTitle, setGoalTitle] = useState("");
  const [goalSummary, setGoalSummary] = useState("");
  const [rewardLabel, setRewardLabel] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedBossId(boss?.bossId ?? WEEKLY_BOSSES[0]?.id ?? "igris");
    setGoalTitle(boss?.goalTitle ?? "");
    setGoalSummary(boss?.goalSummary ?? "");
    setRewardLabel(boss?.rewardLabel ?? "");
  }, [open, boss?.bossId, boss?.goalSummary, boss?.goalTitle, boss?.rewardLabel]);

  const selectedTemplate = useMemo(
    () => WEEKLY_BOSSES.find((item) => item.id === selectedBossId) ?? WEEKLY_BOSSES[0],
    [selectedBossId],
  );

  const { progressPct, clampedDamage } = useMemo(() => {
    if (!boss) return { progressPct: 0, clampedDamage: 0 };
    const damage = Math.max(0, Math.min(boss.maxHP || 0, boss.damage || 0));
    const pct = boss.maxHP > 0 ? Math.round((damage / boss.maxHP) * 100) : 0;
    return { progressPct: Math.min(100, Math.max(0, pct)), clampedDamage: damage };
  }, [boss]);

  const isDefeated = !!boss?.defeatedAt;
  const canSave = !!selectedBossId;

  return (
    <>
      <Card className="relative overflow-hidden border-red-500/20 bg-gradient-to-br from-red-500/10 via-card/60 to-purple-500/10 p-6">
        <div className="weekly-boss-aura" />
        <div className="weekly-boss-sparks" aria-hidden="true">
          <span /><span /><span />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20">
              <Skull className="h-6 w-6 text-red-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-semibold">Weekly Boss</h3>
                {isDefeated ? <Badge variant="secondary">Defeated</Badge> : null}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Boss mingguan turun HP saat kamu menyelesaikan quest. Ini target besar yang ingin kamu clear sebelum minggu berakhir.
              </p>
            </div>
          </div>

          <Button
            variant={boss ? "outline" : "default"}
            className={boss ? "" : "bg-gradient-to-r from-red-500 to-purple-500 text-white hover:from-red-600 hover:to-purple-600"}
            onClick={() => setOpen(true)}
          >
            {boss ? "Edit boss" : "Plan this week"}
          </Button>
        </div>

        {boss ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4 rounded-2xl border border-border/50 bg-background/35 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Boss body</div>
                  <div className="mt-1 text-lg font-medium">{boss.bossName}</div>
                  {boss.goalTitle ? (
                    <div className="mt-2 flex items-start gap-2 text-sm text-foreground">
                      <Target className="mt-0.5 h-4 w-4 text-primary" />
                      <span>{boss.goalTitle}</span>
                    </div>
                  ) : null}
                </div>
                <Badge variant="secondary">{boss.maxHP} HP</Badge>
              </div>

              {boss.goalSummary ? (
                <p className="text-sm text-muted-foreground">{boss.goalSummary}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Define the outcome clearly so Levelday can feel like a system, not a pile of tasks.
                </p>
              )}

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Damage dealt</span>
                  <span>
                    {clampedDamage} / {boss.maxHP} HP
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full bg-gradient-to-r from-red-500 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 0.35 }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/50 bg-background/35 p-5">
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-red-100">Panduan boss mingguan</div>
                <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <li>1. Pilih satu target besar untuk minggu ini.</li>
                  <li>2. Pecah target itu menjadi beberapa quest kecil.</li>
                  <li>3. Selesaikan quest untuk memberi damage sampai boss kalah.</li>
                </ol>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                <Shield className="h-3.5 w-3.5" />
                Quest yang selesai akan langsung memberi damage ke boss.
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/45 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Why this matters</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Weekly Boss bikin target utama minggu ini kelihatan jelas, jadi tidak baru terasa berat saat deadline sudah dekat.
                </p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/45 p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Reward</div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {boss.rewardLabel || selectedTemplate?.rewardText || "Pick a small reward that makes the win feel real."}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-background/25 p-5 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">Panduan boss mingguan</div>
            <div className="mt-2">Pilih boss, hubungkan ke target mingguan, lalu kalahkan lewat quest yang benar-benar selesai.</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <span className="rounded-xl bg-card/45 p-3">1. Pilih boss</span>
              <span className="rounded-xl bg-card/45 p-3">2. Tulis target</span>
              <span className="rounded-xl bg-card/45 p-3">3. Clear quest</span>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl border-border/60 bg-card/95">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sword className="h-5 w-5" />
              Plan your Weekly Boss
            </DialogTitle>
            <DialogDescription>
              Pilih boss yang kamu suka, lalu sambungkan ke satu target mingguan yang jelas dan realistis.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3">
              {WEEKLY_BOSSES.map((item) => {
                const active = selectedBossId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedBossId(item.id)}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-border/60 bg-background/35 hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="mt-1 text-sm text-muted-foreground">{item.tagline}</div>
                      </div>
                      <Badge variant="secondary">{item.maxHP} HP</Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{item.rewardText}</p>
                  </button>
                );
              })}
            </div>

            <div className="space-y-4 rounded-2xl border border-border/60 bg-background/35 p-5">
              <div className="space-y-2">
                <Label htmlFor="boss-goal-title">What target is this boss guarding?</Label>
                <Input
                  id="boss-goal-title"
                  value={goalTitle}
                  onChange={(event) => setGoalTitle(event.target.value)}
                  placeholder="Contoh: Selesaikan draft presentasi utama (boleh dikosongkan dulu)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="boss-goal-summary">Win condition</Label>
                <Textarea
                  id="boss-goal-summary"
                  value={goalSummary}
                  onChange={(event) => setGoalSummary(event.target.value)}
                  rows={4}
                  placeholder="What does a real weekly win look like? Keep it measurable and simple."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="boss-reward">Optional reward</Label>
                <Input
                  id="boss-reward"
                  value={rewardLabel}
                  onChange={(event) => setRewardLabel(event.target.value)}
                  placeholder="Saturday afternoon guilt-free"
                />
              </div>

              <div className="rounded-2xl border border-border/50 bg-card/45 p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 text-foreground">
                  <Crown className="h-4 w-4 text-yellow-400" />
                  Levelday works best when the boss is one clear weekly outcome.
                </div>
                <p className="mt-2">
                  Isi target kalau sudah tahu hasil akhirnya. Kalau belum, pilih boss dulu juga tidak masalah dan bisa diedit nanti.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!canSave) return;
                onSelectBoss({
                  bossId: selectedBossId,
                  goalTitle: goalTitle.trim() || selectedTemplate?.tagline || undefined,
                  goalSummary: goalSummary.trim() || undefined,
                  rewardLabel: rewardLabel.trim() || undefined,
                });
                setOpen(false);
              }}
              disabled={!canSave}
              className="bg-gradient-to-r from-red-500 to-purple-500 text-white hover:from-red-600 hover:to-purple-600"
            >
              Save boss plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
