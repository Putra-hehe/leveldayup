import { useState } from "react";
import { motion } from "motion/react";
import { Lock, Mail, Shield, User } from "lucide-react";

import { BrandMark } from "../components/BrandMark";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

interface AuthPageProps {
  onAuth: (name: string, email: string, password: string, isSignup: boolean) => Promise<void>;
  onOAuth: (provider: string) => Promise<void>;
}

export function AuthPage({ onAuth, onOAuth }: AuthPageProps) {
  const [isSignup, setIsSignup] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isBusy) return;
    if (!email || !password || (isSignup && !name)) return;

    try {
      setIsBusy(true);
      await onAuth(name || email.split("@")[0], email, password, isSignup);
    } finally {
      setIsBusy(false);
    }
  };

  const handleGoogle = async () => {
    if (isBusy) return;
    try {
      setIsBusy(true);
      await onOAuth("google");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(6,182,212,0.12),transparent_24%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden rounded-[2rem] border border-border/60 bg-card/40 p-8 backdrop-blur lg:block"
          >
            <BrandMark size="md" showTagline />
            <div className="mt-10 space-y-6">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Why Levelday works
                </div>
                <h1 className="mt-3 text-4xl font-semibold leading-tight">
                  Designed for people who freeze when a target feels too big.
                </h1>
                <p className="mt-4 text-muted-foreground">
                  Levelday turns one intimidating week into a clearer boss fight, daily dungeon, and focus loop across study, training, and personal projects.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  "Break large goals into smaller quests before overwhelm builds up.",
                  "Use short focus sessions to create real progress, not fake productivity.",
                  "Let completed quests, streaks, and boss fights make momentum visible.",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-border/50 bg-background/40 p-4">
                    <Shield className="mt-0.5 h-5 w-5 text-primary" />
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full"
          >
            <Card className="border-border/60 bg-card/55 p-6 shadow-2xl shadow-black/20 backdrop-blur sm:p-8">
              <div className="mb-8 lg:hidden">
                <BrandMark size="sm" showTagline />
              </div>

              <div className="mb-8 space-y-2">
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  {isSignup ? "Create your account" : "Welcome back"}
                </div>
                <h2 className="text-3xl font-semibold">
                  {isSignup ? "Start your first run" : "Return to your mission"}
                </h2>
                <p className="text-muted-foreground">
                  {isSignup
                    ? "Set up your class, weekly target, and first productivity loop."
                    : "Continue where you left off and keep your momentum alive."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignup ? (
                  <div className="space-y-2">
                    <Label htmlFor="name">Display name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="pl-10"
                        placeholder="What should Levelday call you?"
                        required={isSignup}
                      />
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="pl-10"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="pl-10"
                      placeholder="At least something memorable"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isBusy}
                  className="mt-2 w-full bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600"
                >
                  {isSignup ? "Create account" : "Sign in"}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border/60" />
                <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border/60" />
              </div>

              <Button type="button" variant="outline" onClick={handleGoogle} disabled={isBusy} className="w-full">
                Continue with Google
              </Button>

              <div className="mt-6 rounded-2xl border border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
                Google sign-in is the smoothest option for demos and mobile testing. If OAuth fails, add your current domain inside Firebase Authentication → Authorized domains.
              </div>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                {isSignup ? "Already have an account?" : "Need an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignup((value) => !value)}
                  className="font-medium text-primary"
                >
                  {isSignup ? "Sign in" : "Create one"}
                </button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
