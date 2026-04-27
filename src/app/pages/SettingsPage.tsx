import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Bell, Download, LogOut, Palette, ShieldCheck, User as UserIcon } from "lucide-react";

import { User } from "../types";
import { getGoalTrackMeta, getUserClassMeta, APP_NAME, APP_TAGLINE } from "../utils/product";
import { BrandMark } from "../components/BrandMark";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { FeatureHero } from "../components/FeatureHero";

interface SettingsPageProps {
  user: User;
  onLogout: () => void | Promise<void>;
  onUpdateProfile: (name: string, email: string) => void;
  onExportData: () => void;
}

export function SettingsPage({ user, onLogout, onUpdateProfile, onExportData }: SettingsPageProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [questReminder, setQuestReminder] = useState(true);
  const [habitReminder, setHabitReminder] = useState(true);
  const [levelCelebration, setLevelCelebration] = useState(true);
  const [focusReminder, setFocusReminder] = useState(false);

  useEffect(() => {
    setName(user.name);
    setEmail(user.email);
  }, [user.name, user.email]);

  const classMeta = getUserClassMeta(user.userClass);
  const goalMeta = getGoalTrackMeta(user.goalTrack);
  const hasProfileChanges = name.trim() !== user.name || email.trim() !== user.email;

  return (
    <div className="space-y-6 max-w-5xl">
      <FeatureHero
        kicker="System settings"
        title="Atur profil dan sistem tanpa bikin menunya terasa berat."
        description="Halaman settings dibuat lebih simpel: profil, notifikasi, export data, dan logout. Semuanya tetap aman dipakai di mobile maupun desktop."
        tone="cyan"
        visual="settings"
        badge="lightweight"
        guide={{ title: "Panduan settings", steps: ["Ubah nama atau email lalu simpan perubahan.", "Atur rasa notifikasi agar tidak mengganggu.", "Export data sebelum reset atau pindah perangkat."] }}
        stats={[
          { label: "Class", value: classMeta.label },
          { label: "Goal", value: goalMeta.shortLabel },
          { label: "Level", value: String(user.level) },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <BrandMark size="sm" showTagline />
          <h1 className="mt-5 text-3xl font-semibold">Settings & account</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Keep your profile clean, export your current build, and make sure Levelday stays lightweight enough to use every day.
          </p>
        </div>

        <Card className="border-border/60 bg-card/45 p-4">
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current build</div>
          <div className="mt-2 font-medium">{classMeta.label} · {goalMeta.shortLabel}</div>
          <div className="mt-1 text-sm text-muted-foreground">Level {user.level} · {user.totalXP} total XP</div>
        </Card>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-6"
        >
          <Card className="border-border/60 bg-card/50 p-6">
            <div className="mb-6 flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-primary" />
              <h3>Profile</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
                    <div className="font-medium">{classMeta.label}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{classMeta.identity}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Goal track</Label>
                  <div className="rounded-xl border border-border/60 bg-secondary/40 p-3">
                    <div className="font-medium">{goalMeta.shortLabel}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{goalMeta.dailyGoal}</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => onUpdateProfile(name.trim() || user.name, email.trim() || user.email)}
                  disabled={!hasProfileChanges}
                  className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600"
                >
                  Save changes
                </Button>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/50 p-6">
            <div className="mb-6 flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h3>Notification feel</h3>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Quest reminders</p>
                  <p className="text-sm text-muted-foreground">Useful when your week is deadline-heavy.</p>
                </div>
                <Switch checked={questReminder} onCheckedChange={setQuestReminder} />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Habit reminders</p>
                  <p className="text-sm text-muted-foreground">Good for building a routine that survives low-energy days.</p>
                </div>
                <Switch checked={habitReminder} onCheckedChange={setHabitReminder} />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">XP and level-up celebration</p>
                  <p className="text-sm text-muted-foreground">Keep the progression feedback visible and motivating.</p>
                </div>
                <Switch checked={levelCelebration} onCheckedChange={setLevelCelebration} />
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Focus nudges</p>
                  <p className="text-sm text-muted-foreground">Minimal reminders to restart when a break gets too long.</p>
                </div>
                <Switch checked={focusReminder} onCheckedChange={setFocusReminder} />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <Card className="border-border/60 bg-card/50 p-6">
            <div className="mb-6 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3>Product snapshot</h3>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                <div className="font-medium text-foreground">Core loop</div>
                <p className="mt-1">Quest selesai → XP naik → level up → boss mingguan kehilangan HP.</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                <div className="font-medium text-foreground">Daily goal</div>
                <p className="mt-1">{user.dailyGoal || goalMeta.dailyGoal}</p>
              </div>
              <div className="rounded-2xl border border-border/50 bg-background/35 p-4">
                <div className="font-medium text-foreground">Class ritual</div>
                <p className="mt-1">{classMeta.ritual}</p>
              </div>
            </div>
          </Card>

          <Card className="border-border/60 bg-card/50 p-6">
            <div className="mb-6 flex items-center gap-3">
              <Download className="h-5 w-5 text-primary" />
              <h3>Data & handoff</h3>
            </div>

            <p className="text-sm text-muted-foreground">
              Export your current state as JSON so you can review progress, migrate data, or attach a snapshot to a product demo.
            </p>

            <Button variant="outline" className="mt-5 w-full justify-start" onClick={onExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export current data
            </Button>
          </Card>

          <Card className="border-border/60 bg-card/50 p-6">
            <div className="mb-6 flex items-center gap-3">
              <Palette className="h-5 w-5 text-primary" />
              <h3>Appearance</h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" className="rounded-2xl border-2 border-primary bg-gradient-to-br from-purple-500/10 to-cyan-500/10 p-4 text-left">
                <div className="mb-3 h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500" />
                <div className="font-medium">Dark mode</div>
                <div className="mt-1 text-sm text-muted-foreground">Current and recommended</div>
              </button>
              <button type="button" className="rounded-2xl border-2 border-border p-4 text-left opacity-60">
                <div className="mb-3 h-10 w-10 rounded-xl bg-white" />
                <div className="font-medium">Light mode</div>
                <div className="mt-1 text-sm text-muted-foreground">Reserved for later polish</div>
              </button>
            </div>
          </Card>

          <Card className="border-destructive/30 bg-card/50 p-6">
            <Button
              onClick={onLogout}
              variant="outline"
              className="w-full justify-start border-destructive/40 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </Card>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-center text-sm text-muted-foreground"
      >
        <p>{APP_NAME} v1.1.0</p>
        <p className="mt-1">{APP_TAGLINE}</p>
      </motion.div>
    </div>
  );
}
