import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Crown, Flame, Minus, TrendingDown, TrendingUp, Trophy, Users } from "lucide-react";

import { LeaderboardEntry, User } from "../types";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { FeatureHero } from "../components/FeatureHero";

interface LeaderboardPageProps {
  user: User;
  globalLeaderboard: LeaderboardEntry[];
  friendsLeaderboard: LeaderboardEntry[];
  isLoading?: boolean;
}

function movementIcon(value: number) {
  if (value > 0) return <TrendingUp className="h-4 w-4" />;
  if (value < 0) return <TrendingDown className="h-4 w-4" />;
  return <Minus className="h-4 w-4" />;
}

export function LeaderboardPage({ user, globalLeaderboard, friendsLeaderboard, isLoading = false }: LeaderboardPageProps) {
  const [scope, setScope] = useState<"global" | "friends">("global");
  const data = scope === "global" ? globalLeaderboard : friendsLeaderboard;
  const podium = data.slice(0, 3);
  const rest = data.slice(3);
  const currentEntry = useMemo(
    () => data.find((entry) => entry.isCurrentUser) || globalLeaderboard.find((entry) => entry.isCurrentUser),
    [data, globalLeaderboard],
  );

  return (
    <div className="space-y-8">
      <FeatureHero
        kicker="Rank board"
        title="Leaderboard dibuat lebih dramatis tapi tetap ringan dibuka di semua ukuran layar."
        description="Lihat posisi kamu, rank global atau teman, dan snapshot progres dengan visual yang lebih terasa seperti layar boss board."
        tone="amber"
        visual="leaderboard"
        badge="live ranking"
        guide={{ title: "Panduan ranking", steps: ["Lihat posisi sebagai motivasi ringan.", "Fokus pada XP dan progres diri sendiri dulu.", "Naik rank dengan quest, habit, dan focus yang konsisten."] }}
        stats={[
          { label: "Rank", value: `#${currentEntry?.rank || 1}` },
          { label: "Level", value: String(user.level) },
          { label: "Entry", value: String(data.length) },
        ]}
      />

      <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="cinematic-panel p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-5">
            <div className="scene-kicker">Papan peringkat asli</div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
              Ranking harus dibangun dari <span className="text-gradient">data pengguna nyata</span>, bukan angka rekayasa.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Global membaca snapshot publik dari koleksi leaderboard produksi. Data tidak lagi ditarik dari seluruh app state, jadi jalurnya lebih aman dan lebih siap untuk skala. Jika koneksi pertemanan belum dibangun, tab friends akan jujur menampilkan keterbatasannya daripada memalsukan kompetisi.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="soft-panel p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Peringkat kamu</div>
              <div className="mt-3 text-3xl font-semibold text-white">#{currentEntry?.rank || 1}</div>
            </div>
            <div className="soft-panel p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Level</div>
              <div className="mt-3 text-3xl font-semibold text-white">{user.level}</div>
            </div>
            <div className="soft-panel p-4">
              <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Total XP</div>
              <div className="mt-3 text-3xl font-semibold text-white">{user.totalXP}</div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="flex flex-wrap gap-3">
        {[
          { id: "global" as const, label: "Leaderboard global" },
          { id: "friends" as const, label: "Leaderboard teman" },
        ].map((option) => (
          <Button key={option.id} variant={scope === option.id ? "default" : "outline"} onClick={() => setScope(option.id)} className="px-5">
            {option.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.55fr_0.45fr]">
        <Card className="p-6 sm:p-7">
          <div className="scene-kicker">Podium</div>
          <h2 className="mt-2 text-3xl font-semibold text-white">Tiga teratas saat ini</h2>

          {podium.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {podium.map((entry, index) => (
                <div
                  key={entry.id}
                  className={`rounded-[28px] border p-5 text-center ${
                    index === 0
                      ? "border-amber-400/25 bg-amber-400/10"
                      : index === 1
                      ? "border-slate-300/18 bg-white/[0.05]"
                      : "border-orange-300/20 bg-orange-400/8"
                  }`}
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black/20 text-white">
                    <Crown className="h-6 w-6" />
                  </div>
                  <div className="mt-4 text-xs uppercase tracking-[0.24em] text-slate-300">#{entry.rank}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{entry.name}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">{entry.aura}</div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Level</div>
                      <div className="mt-2 font-semibold text-white">{entry.level}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Streak</div>
                      <div className="mt-2 font-semibold text-white">{entry.streak}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-slate-300">
              Belum ada cukup snapshot leaderboard publik untuk membentuk podium. Itu lebih baik daripada menampilkan ranking palsu.
            </div>
          )}
        </Card>

        <Card className="p-6">
          <div className="scene-kicker">Kenapa ini penting</div>
          <h2 className="mt-2 text-3xl font-semibold text-white">Kompetisi harus dipercaya</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-white">
                <Flame className="h-4 w-4 text-orange-300" />
                Streak yang terlihat harus datang dari perilaku nyata.
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-white">
                <Trophy className="h-4 w-4 text-amber-300" />
                XP dan level baru terasa berarti kalau lawannya juga nyata.
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center gap-2 text-white">
                <Users className="h-4 w-4 text-emerald-300" />
                Tab teman tidak akan diisi sampai friend graph betul-betul tersedia.
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="scene-kicker">Peringkat lengkap</div>
            <h2 className="mt-2 text-3xl font-semibold text-white">{scope === "global" ? "Medan global" : "Lingkar teman"}</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.22em] text-slate-300">
            {isLoading ? "Memuat..." : `${data.length} pengguna`}
          </div>
        </div>

        {scope === "friends" && data.length <= 1 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-slate-300">
            Friend graph belum aktif, jadi leaderboard teman belum dibangun. Saya sengaja tidak memalsukan data pertemanan di sini.
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {rest.map((entry) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between gap-4 rounded-[24px] border px-4 py-4 ${entry.isCurrentUser ? "border-violet-400/30 bg-violet-500/10" : "border-white/10 bg-white/[0.04]"}`}
            >
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/20 text-sm font-semibold text-white">#{entry.rank}</div>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">{entry.name}</div>
                  <div className="truncate text-xs uppercase tracking-[0.18em] text-slate-400">{entry.aura}</div>
                </div>
              </div>

              <div className="grid shrink-0 grid-cols-3 gap-3 text-right text-sm text-slate-300">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">XP</div>
                  <div className="mt-1 font-semibold text-white">{entry.xp}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Streak</div>
                  <div className="mt-1 font-semibold text-white">{entry.streak}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Gerak</div>
                  <div className="mt-1 inline-flex items-center gap-1 font-semibold text-white">{movementIcon(entry.movement)} {entry.movement}</div>
                </div>
              </div>
            </div>
          ))}

          {!rest.length && data.length <= 3 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-300">
              Belum ada cukup pengguna untuk daftar panjang. Sistem akan menampilkan lebih banyak nama saat data riil bertambah.
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
