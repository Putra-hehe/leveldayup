import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Gem, Gift, Sparkles, Star, Trophy } from 'lucide-react';

import {
  Badge as BadgeType,
  CommunityMessage,
  CommunityProfile,
  DailyDungeon,
  FocusSession,
  Habit,
  MomentumState,
  Quest,
  Reminder,
  RewardClaimRecord,
  RewardProgress,
  ScheduleItem,
  User,
  WeeklyBoss,
} from '../types';
import { BadgeCard } from '../components/BadgeCard';
import { RewardTrackCard } from '../components/rewards/RewardTrackCard';
import { FeatureHero } from '../components/FeatureHero';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { deriveRewardSnapshot } from '../utils/rewards';
import { MAX_STREAK_FREEZES, STREAK_FREEZE_COST } from '../utils/momentum';

interface RewardsPageProps {
  user: User | null;
  badges: BadgeType[];
  quests: Quest[];
  habits: Habit[];
  focusSessions: FocusSession[];
  reminders: Reminder[];
  scheduleItems: ScheduleItem[];
  messages: CommunityMessage[];
  dailyDungeon?: DailyDungeon;
  weeklyBoss?: WeeklyBoss;
  rewardClaims?: RewardClaimRecord[];
  communityProfile?: CommunityProfile;
  momentum?: MomentumState;
  onClaimReward: (progress: RewardProgress) => void;
  onBadgeClick: (badge: BadgeType) => void;
  onBuyStreakFreeze: () => void;
}

export function RewardsPage({
  user,
  badges,
  quests,
  habits,
  focusSessions,
  reminders,
  scheduleItems,
  messages,
  dailyDungeon,
  weeklyBoss,
  rewardClaims,
  communityProfile,
  momentum,
  onClaimReward,
  onBadgeClick,
  onBuyStreakFreeze,
}: RewardsPageProps) {
  const snapshot = useMemo(
    () =>
      deriveRewardSnapshot({
        user,
        badges,
        quests,
        habits,
        focusSessions,
        reminders,
        scheduleItems,
        messages,
        dailyDungeon,
        weeklyBoss,
        rewardClaims,
        communityProfile,
        momentum,
      }),
    [user, badges, quests, habits, focusSessions, reminders, scheduleItems, messages, dailyDungeon, weeklyBoss, rewardClaims, communityProfile, momentum],
  );

  const unlockedBadges = snapshot.legacyBadges.unlocked;
  const lockedBadges = snapshot.legacyBadges.locked;
  const nextSiap = snapshot.ready[0];
  const rewardPoints = momentum?.rewardPoints ?? 0;
  const currentStreak = momentum?.streak ?? 0;
  const bestStreak = Math.max(momentum?.streak ?? 0, momentum?.bestStreak ?? 0);
  const freezeCount = momentum?.freezeCount ?? 0;
  const freezeUses = momentum?.freezeUses ?? [];

  return (
    <div className="space-y-8">
      <FeatureHero
        kicker="Reward vault"
        title="Reward dibuat jelas supaya progres terasa, bukan sekadar numpuk badge."
        description="Halaman reward sekarang punya visual hero seperti fitur lain. Kamu bisa cepat lihat reward yang siap diklaim, progres badge, dan stok reward point tanpa layar terasa penuh."
        tone="amber"
        visual="rewards"
        badge="clear milestones"
        guide={{ title: "Panduan reward", steps: ["Lihat reward yang sudah siap diklaim.", "Klaim badge atau point setelah syarat terpenuhi.", "Pakai reward sebagai penguat progres, bukan distraksi."] }}
        stats={[
          { label: 'Siap klaim', value: String(snapshot.ready.length) },
          { label: 'Sudah klaim', value: String(snapshot.claimed.length) },
          { label: 'Reward point', value: String(rewardPoints) },
        ]}
      />

      <motion.section
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="cinematic-panel p-6 sm:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <div className="scene-kicker">Sistem reward</div>
            <h1 className="mt-2 max-w-4xl text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
              Reward harus terasa <span className="text-gradient">layak didapat, jelas, dan memotivasi</span>.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Variasi reward dibangun bertingkat. Ada daily, social, quality, loyalty, dan milestone besar. Tujuannya bukan bikin user banjir badge, tapi bikin progression terasa jelas.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <Card className="p-5 text-center">
              <Trophy className="mx-auto h-8 w-8 text-yellow-300" />
              <div className="mt-3 text-3xl font-semibold text-white">{snapshot.ready.length}</div>
              <p className="mt-1 text-sm text-slate-300">Siap klaim</p>
            </Card>
            <Card className="p-5 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-cyan-300" />
              <div className="mt-3 text-3xl font-semibold text-white">{snapshot.upcoming.length}</div>
              <p className="mt-1 text-sm text-slate-300">Milestone berikutnya</p>
            </Card>
            <Card className="p-5 text-center">
              <Gem className="mx-auto h-8 w-8 text-violet-300" />
              <div className="mt-3 text-3xl font-semibold text-white">{snapshot.claimed.length}</div>
              <p className="mt-1 text-sm text-slate-300">Sudah diklaim</p>
            </Card>
            <Card className="p-5 text-center">
              <Star className="mx-auto h-8 w-8 text-cyan-300" />
              <div className="mt-3 text-3xl font-semibold text-white">{Math.round((unlockedBadges.length / Math.max(badges.length, 1)) * 100)}%</div>
              <p className="mt-1 text-sm text-slate-300">Progres vault</p>
            </Card>
          </div>
        </div>
      </motion.section>

      {nextSiap ? (
        <Card className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="scene-kicker">Momen klaim</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">{nextSiap.definition.title} siap diklaim</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                Jangan tunggu reward menumpuk. Claim satu per satu supaya momentum tetap terasa dan hierarki reward tidak blur.
              </p>
            </div>
            <Button type="button" size="lg" onClick={() => onClaimReward(nextSiap)}>
              Klaim sekarang
            </Button>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[0.7fr_0.3fr]">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="scene-kicker">Target berikutnya</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Reward berikutnya yang benar-benar berarti</h2>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs uppercase tracking-[0.16em] text-slate-200">
              Tampilan anti-jenuh
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {snapshot.upcoming.map((progress) => (
              <RewardTrackCard key={progress.rewardId} progress={progress} />
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="scene-kicker">Klaim terbaru</div>
          <h3 className="mt-2 text-2xl font-semibold text-white">Dirayakan, bukan ditumpuk</h3>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
            {snapshot.recentClaims.length ? snapshot.recentClaims.map((claim) => (
              <div key={claim.rewardId} className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{claim.title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{claim.category}</div>
                  </div>
                  <div className="text-right text-xs text-slate-300">
                    <div>{claim.celebrationLevel}</div>
                    <div>{new Date(claim.claimedAt).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                Belum ada reward yang diklaim. Setelah user mulai aktif, bagian ini akan jadi catatan progres yang terasa lebih personal.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.68fr_0.32fr]">
        <Card className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="scene-kicker">Momentum wallet</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Poin quest untuk beli streak freeze</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300">
                Setiap quest yang selesai memberi reward points. Saat inventory freeze kosong, kamu bisa pakai poin ini untuk menjaga streak tetap hidup saat satu hari ke-skip.
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              onClick={onBuyStreakFreeze}
              disabled={rewardPoints < STREAK_FREEZE_COST || freezeCount >= MAX_STREAK_FREEZES}
            >
              Beli streak freeze · {STREAK_FREEZE_COST} poin
            </Button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card className="p-5 text-center">
              <Gem className="mx-auto h-8 w-8 text-violet-300" />
              <div className="mt-3 text-3xl font-semibold text-white">{rewardPoints}</div>
              <p className="mt-1 text-sm text-slate-300">Reward points</p>
            </Card>
            <Card className="p-5 text-center">
              <Sparkles className="mx-auto h-8 w-8 text-cyan-300" />
              <div className="mt-3 text-3xl font-semibold text-white">{currentStreak}</div>
              <p className="mt-1 text-sm text-slate-300">Streak aktif</p>
            </Card>
            <Card className="p-5 text-center">
              <Gift className="mx-auto h-8 w-8 text-emerald-300" />
              <div className="mt-3 text-3xl font-semibold text-white">{freezeCount}/{MAX_STREAK_FREEZES}</div>
              <p className="mt-1 text-sm text-slate-300">Freeze tersimpan</p>
            </Card>
          </div>
        </Card>

        <Card className="p-6">
          <div className="scene-kicker">Streak status</div>
          <h3 className="mt-2 text-2xl font-semibold text-white">Cadangan untuk hari yang berat</h3>
          <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <span>Best streak</span>
                <span className="font-semibold text-white">{bestStreak} hari</span>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between gap-3">
                <span>Freeze dipakai</span>
                <span className="font-semibold text-white">{freezeUses.length}</span>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
              {freezeUses.length ? (
                <>
                  <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Terakhir menyelamatkan streak</div>
                  <div className="mt-2 font-medium text-white">{freezeUses[0].dateKey}</div>
                </>
              ) : (
                <div>Belum ada freeze yang terpakai. Simpan satu agar streak tidak langsung putus saat ada hari darurat.</div>
              )}
            </div>
          </div>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Tabs defaultValue="ready">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="ready">Siap</TabsTrigger>
            <TabsTrigger value="claimed">Diklaim</TabsTrigger>
            <TabsTrigger value="momentum">Momentum</TabsTrigger>
            <TabsTrigger value="social">Sosial</TabsTrigger>
            <TabsTrigger value="vault">Vault</TabsTrigger>
          </TabsList>

          <TabsContent value="ready" className="mt-6 space-y-6">
            {snapshot.ready.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {snapshot.ready.map((progress) => (
                  <RewardTrackCard key={progress.rewardId} progress={progress} onClaim={onClaimReward} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Gift className="mx-auto h-16 w-16 text-slate-400" />
                <h3 className="mt-4 text-xl font-semibold text-white">No reward siap diklaim yet</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Itu bukan masalah. Yang penting sekarang progression-nya sudah terbaca jelas, jadi user tahu persis apa yang perlu dilakukan berikutnya.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="claimed" className="mt-6 space-y-6">
            {snapshot.claimed.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {snapshot.claimed.map((progress) => (
                  <RewardTrackCard key={progress.rewardId} progress={progress} onClaim={onClaimReward} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Sparkles className="mx-auto h-16 w-16 text-slate-400" />
                <h3 className="mt-4 text-xl font-semibold text-white">Belum ada reward yang diklaim</h3>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  Begitu reward pertama diklaim, halaman ini mulai berfungsi sebagai catatan progression yang bisa dilihat kembali.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="momentum" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...snapshot.byCategory.daily, ...snapshot.byCategory.progress, ...snapshot.byCategory.quality, ...snapshot.byCategory.weekly].map((progress) => (
                <RewardTrackCard key={progress.rewardId} progress={progress} onClaim={onClaimReward} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="social" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[...snapshot.byCategory.social, ...snapshot.byCategory.loyalty, ...snapshot.byCategory.exploration].map((progress) => (
                <RewardTrackCard key={progress.rewardId} progress={progress} onClaim={onClaimReward} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="vault" className="mt-6 space-y-6">
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="p-6 text-center">
                <Trophy className="mx-auto h-8 w-8 text-yellow-300" />
                <div className="mt-3 text-3xl font-semibold text-white">{unlockedBadges.length}</div>
                <p className="mt-1 text-sm text-slate-300">Badge terbuka</p>
              </Card>
              <Card className="p-6 text-center">
                <Gift className="mx-auto h-8 w-8 text-violet-300" />
                <div className="mt-3 text-3xl font-semibold text-white">{lockedBadges.length}</div>
                <p className="mt-1 text-sm text-slate-300">Masih terkunci</p>
              </Card>
              <Card className="p-6 text-center">
                <Star className="mx-auto h-8 w-8 text-cyan-300" />
                <div className="mt-3 text-3xl font-semibold text-white">{Math.round((unlockedBadges.length / Math.max(badges.length, 1)) * 100)}%</div>
                <p className="mt-1 text-sm text-slate-300">Progres vault</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {unlockedBadges.concat(lockedBadges).map((badge) => (
                <BadgeCard key={badge.id} badge={badge} onClick={() => onBadgeClick(badge)} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
