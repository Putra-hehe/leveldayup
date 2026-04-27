import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  Castle,
  Gift,
  LayoutDashboard,
  MessageCircle,
  Plus,
  Settings,
  Sparkles,
  Timer,
  Flame,
  ListTodo,
  Trophy,
} from "lucide-react";

import { Quest } from "../types";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quests: Quest[];
  onNavigate: (page: string) => void;
  onNewQuest: () => void;
  onNewAIQuest: () => void;
  onStartFocus: () => void;
}

export function CommandPalette({
  open,
  onOpenChange,
  quests,
  onNavigate,
  onNewQuest,
  onNewAIQuest,
  onStartFocus,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const matchingQuests = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return quests.filter((quest) => quest.title.toLowerCase().includes(q)).slice(0, 6);
  }, [quests, query]);

  const run = (fn: () => void) => {
    fn();
    onOpenChange(false);
    setQuery("");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, actions, or quests" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>No matching page or quest.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(() => onNavigate("dashboard"))}>
            <LayoutDashboard />
            Command deck
            <CommandShortcut>G H</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("planner"))}>
            <CalendarDays />
            AI planner
            <CommandShortcut>G P</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("community"))}>
            <MessageCircle />
            Community chat
            <CommandShortcut>G C</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("leaderboard"))}>
            <Trophy />
            Leaderboard
            <CommandShortcut>G L</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("quests"))}>
            <ListTodo />
            Quest board
            <CommandShortcut>G Q</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("dungeon"))}>
            <Castle />
            Daily dungeon
            <CommandShortcut>G D</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("habits"))}>
            <Flame />
            Habits
            <CommandShortcut>G T</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("focus"))}>
            <Timer />
            Focus room
            <CommandShortcut>G F</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("rewards"))}>
            <Gift />
            Reward vault
            <CommandShortcut>G R</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("stats"))}>
            <BarChart3 />
            Progress analytics
            <CommandShortcut>G S</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(() => onNavigate("settings"))}>
            <Settings />
            Settings
            <CommandShortcut>G ,</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(onNewQuest)}>
            <Plus />
            Create quest
            <CommandShortcut>N Q</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onNewAIQuest)}>
            <Sparkles />
            Generate smart quest
            <CommandShortcut>N A</CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={() => run(onStartFocus)}>
            <Timer />
            Start focus sprint
            <CommandShortcut>N F</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        {matchingQuests.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Matching quests">
              {matchingQuests.map((quest) => (
                <CommandItem key={quest.id} onSelect={() => run(() => onNavigate("quests"))}>
                  <ListTodo />
                  {quest.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
