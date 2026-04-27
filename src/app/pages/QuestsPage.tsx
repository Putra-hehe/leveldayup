import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Filter, Plus, Search, Sparkles, Sword, Target, Trophy } from "lucide-react";

import { Quest, QuestDifficulty } from "../types";
import { QuestCard } from "../components/QuestCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card } from "../components/ui/card";
import { FeatureHero } from "../components/FeatureHero";
import { isoToLocalDateKey, toLocalDateKey } from "../utils/date";

interface QuestsPageProps {
  quests: Quest[];
  onAddQuest: () => void;
  onAddQuestAI: () => void;
  onQuestClick: (quest: Quest) => void;
  onCompleteQuest: (questId: string) => void;
}

type QuestTab = "active" | "scheduled" | "cleared";

export function QuestsPage({ quests, onAddQuest, onAddQuestAI, onQuestClick, onCompleteQuest }: QuestsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestDifficulty | "all">("all");
  const [activeTab, setActiveTab] = useState<QuestTab>("active");

  const todayKey = toLocalDateKey(new Date());

  const filteredBySearchAndDifficulty = useMemo(() => {
    return quests.filter((quest) => {
      const matchesSearch =
        !searchQuery ||
        quest.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quest.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quest.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDifficulty = selectedDifficulty === "all" || quest.difficulty === selectedDifficulty;
      return matchesSearch && matchesDifficulty;
    });
  }, [quests, searchQuery, selectedDifficulty]);

  const activeQuests = filteredBySearchAndDifficulty
    .filter((quest) => {
      if (quest.status === "completed") return false;
      const dueKey = isoToLocalDateKey(quest.dueDate);
      return !dueKey || dueKey <= todayKey;
    })
    .sort((a, b) => {
      const aDue = isoToLocalDateKey(a.dueDate) ?? todayKey;
      const bDue = isoToLocalDateKey(b.dueDate) ?? todayKey;
      return aDue.localeCompare(bDue);
    });

  const scheduledQuests = filteredBySearchAndDifficulty
    .filter((quest) => {
      if (quest.status === "completed") return false;
      const dueKey = isoToLocalDateKey(quest.dueDate);
      return !!dueKey && dueKey > todayKey;
    })
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  const clearedQuests = filteredBySearchAndDifficulty
    .filter((quest) => quest.status === "completed")
    .sort((a, b) => (b.completedAt || "").localeCompare(a.completedAt || ""));

  const bossSteps = quests.filter((quest) => !!quest.isWeekly && quest.status !== "completed").length;
  const dailySupport = quests.filter((quest) => !!quest.isDaily && quest.status !== "completed").length;

  const renderQuestList = (items: Quest[], emptyState: { title: string; description: string; action?: string; onAction?: () => void }) => {
    if (!items.length) {
      return (
        <Card className="border-dashed bg-card/30 p-12 text-center">
          <Sword className="mx-auto h-16 w-16 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">{emptyState.title}</h3>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">{emptyState.description}</p>
          {emptyState.action && emptyState.onAction ? (
            <Button onClick={emptyState.onAction} variant="outline" className="mt-6">
              <Plus className="mr-2 h-4 w-4" />
              {emptyState.action}
            </Button>
          ) : null}
        </Card>
      );
    }

    return (
      <div className="space-y-3">
        {items.map((quest) => (
          <QuestCard
            key={quest.id}
            quest={quest}
            onClick={() => onQuestClick(quest)}
            onComplete={quest.status === "completed" ? undefined : () => onCompleteQuest(quest.id)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <FeatureHero
        kicker="Quest board"
        title="Pecah target besar jadi quest yang gampang dimainkan."
        description="Bikin task sesederhana mungkin: satu hasil kecil, deadline jelas, lalu selesai. Quest yang selesai juga akan memberi damage ke boss mingguan."
        tone="violet"
        visual="quest"
        badge="simple mode"
        guide={{ title: "Panduan quest", steps: ["Tekan New quest untuk membuat tugas kecil.", "Pilih Boss step kalau quest ini bagian dari target mingguan.", "Tekan clear saat selesai agar XP dan damage boss masuk."] }}
        stats={[
          { label: "Aktif", value: String(activeQuests.length) },
          { label: "Boss step", value: String(bossSteps) },
          { label: "Clear", value: String(clearedQuests.length) },
        ]}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Quest board</div>
          <h1 className="mt-2 text-3xl font-semibold">Turn big pressure into clear steps</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Levelday works best when your goals look playable. Keep active quests short, and use boss steps for weekly pressure.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onAddQuest}
            className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white hover:from-purple-600 hover:to-cyan-600"
          >
            <Plus className="mr-2 h-4 w-4" />
            New quest
          </Button>
          <Button
            onClick={onAddQuestAI}
            className="bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white hover:from-indigo-600 hover:to-fuchsia-600"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Smart quest
          </Button>
        </div>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{activeQuests.length}</div>
              <div className="text-sm text-muted-foreground">Active now</div>
            </div>
          </div>
        </Card>

        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/40">
              <Sword className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{bossSteps}</div>
              <div className="text-sm text-muted-foreground">Boss steps active</div>
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Use boss steps for the one weekly target you cannot afford to ignore.</p>
        </Card>

        <Card className="border-border/60 bg-card/50 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10">
              <Trophy className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-semibold">{dailySupport}</div>
              <div className="text-sm text-muted-foreground">Daily support quests</div>
            </div>
          </div>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col gap-4 lg:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search quests, tags, or keywords"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-3 py-2 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" />
            Difficulty
          </div>
          {(["all", "easy", "normal", "hard"] as const).map((difficulty) => (
            <Button
              key={difficulty}
              variant={selectedDifficulty === difficulty ? "default" : "outline"}
              onClick={() => setSelectedDifficulty(difficulty)}
              size="sm"
              className="capitalize"
            >
              {difficulty}
            </Button>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as QuestTab)}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="active">Active ({activeQuests.length})</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled ({scheduledQuests.length})</TabsTrigger>
            <TabsTrigger value="cleared">Cleared ({clearedQuests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {renderQuestList(activeQuests, {
              title: "No active quests right now",
              description: "Create one clear action you can finish today. Smaller quests beat vague pressure every time.",
              action: "Create quest",
              onAction: onAddQuest,
            })}
          </TabsContent>

          <TabsContent value="scheduled" className="mt-6">
            {renderQuestList(scheduledQuests, {
              title: "Nothing scheduled ahead",
              description: "If your week is heavy, schedule the next one or two quest steps before deadlines start deciding for you.",
            })}
          </TabsContent>

          <TabsContent value="cleared" className="mt-6">
            {renderQuestList(clearedQuests, {
              title: "No cleared quests yet",
              description: "Once you start finishing quests, this tab becomes proof that the week is actually moving.",
            })}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
