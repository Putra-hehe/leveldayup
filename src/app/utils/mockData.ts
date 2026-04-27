import { Badge, Habit, Quest, User, UserClass } from "../types";
import { createId } from "./id";
import { makeDueDateISO } from "./date";
import { GoalTrackId, getGoalTrackMeta } from "./product";

export const createMockUser = (
  name: string,
  email: string,
  userClass: UserClass,
): User => {
  return {
    id: createId("user"),
    name,
    email,
    userClass,
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    totalXP: 0,
    joinedDate: new Date().toISOString(),
    dailyGoal: "Protect one meaningful progress block today.",
    weeklySchedule: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    goalTrack: "assignments",
  };
};

function buildQuest(partial: Omit<Quest, "id" | "createdAt">): Quest {
  return {
    id: createId("quest"),
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

function buildHabit(partial: Omit<Habit, "id" | "createdAt">): Habit {
  return {
    id: createId("habit"),
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export function createStarterQuests(
  goalTrack: string = "assignments",
  userClass: UserClass = "scholar",
): Quest[] {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const inThreeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const goal = getGoalTrackMeta(goalTrack);
  const classHint =
    userClass === "scholar"
      ? "Keep it structured and measurable."
      : userClass === "creator"
      ? "Keep it concrete so momentum stays high."
      : "Treat it like a clear objective, not a vague wish.";

  const library: Record<GoalTrackId, Quest[]> = {
    assignments: [
      buildQuest({
        title: "Break your biggest deadline into 3 quest steps",
        description: `Write the deliverable, due date, and first action. ${classHint}`,
        difficulty: "normal",
        status: "pending",
        xpReward: 25,
        dueDate: makeDueDateISO(today),
        tags: ["deadline", "planning"],
        subtasks: [
          { id: createId("subtask"), title: "Name the deadline and due date", completed: false },
          { id: createId("subtask"), title: "Define the smallest useful next step", completed: false },
          { id: createId("subtask"), title: "Schedule one focus sprint", completed: false },
        ],
      }),
      buildQuest({
        title: "Complete one 25-minute progress sprint",
        description: "Start before you feel ready. The goal is momentum, not perfection.",
        difficulty: "easy",
        status: "pending",
        xpReward: 10,
        dueDate: makeDueDateISO(today),
        tags: ["focus", "progress"],
        subtasks: [],
      }),
      buildQuest({
        title: "Draft or finish one visible section of the task",
        description: "Aim for a version you can improve later, not a perfect first pass.",
        difficulty: "hard",
        status: "pending",
        xpReward: 50,
        dueDate: makeDueDateISO(inThreeDays),
        tags: ["deadline", "progress"],
        subtasks: [],
        isWeekly: true,
      }),
    ],
    "exam-prep": [
      buildQuest({
        title: "Choose one weak topic or skill to clear this week",
        description: `Pick the area that creates the most avoidance. ${classHint}`,
        difficulty: "normal",
        status: "pending",
        xpReward: 25,
        dueDate: makeDueDateISO(today),
        tags: ["practice", "planning"],
        subtasks: [
          { id: createId("subtask"), title: "List what already feels strong", completed: false },
          { id: createId("subtask"), title: "List what still feels blurry", completed: false },
          { id: createId("subtask"), title: "Pick one resource or drill", completed: false },
        ],
      }),
      buildQuest({
        title: "Run one recall or practice sprint without overthinking",
        description: "Test yourself, notice the gaps, then patch them.",
        difficulty: "hard",
        status: "pending",
        xpReward: 50,
        dueDate: makeDueDateISO(tomorrow),
        tags: ["practice", "drill"],
        subtasks: [],
      }),
      buildQuest({
        title: "Summarize one chapter, concept set, or drill pattern",
        description: "Keep only the points you want to remember under pressure.",
        difficulty: "normal",
        status: "pending",
        xpReward: 25,
        dueDate: makeDueDateISO(inThreeDays),
        tags: ["practice", "summary"],
        subtasks: [],
        isWeekly: true,
      }),
    ],
    consistency: [
      buildQuest({
        title: "Design a tiny ritual you can repeat daily",
        description: `Use ${goal.starterQuestHint.toLowerCase()} ${classHint}`,
        difficulty: "easy",
        status: "pending",
        xpReward: 10,
        dueDate: makeDueDateISO(today),
        tags: ["routine", "setup"],
        subtasks: [
          { id: createId("subtask"), title: "Choose a start time", completed: false },
          { id: createId("subtask"), title: "Pick the place or setup you use", completed: false },
          { id: createId("subtask"), title: "Define the first 5-minute action", completed: false },
        ],
      }),
      buildQuest({
        title: "Show up for one no-excuses focus session",
        description: "The win is starting, not doing everything today.",
        difficulty: "normal",
        status: "pending",
        xpReward: 25,
        dueDate: makeDueDateISO(today),
        tags: ["routine", "focus"],
        subtasks: [],
        isDaily: true,
      }),
      buildQuest({
        title: "Prepare tomorrow's first quest before you log off",
        description: "Reduce the friction that usually creates tomorrow's procrastination.",
        difficulty: "easy",
        status: "pending",
        xpReward: 10,
        dueDate: makeDueDateISO(tomorrow),
        tags: ["routine", "planning"],
        subtasks: [],
      }),
    ],
    portfolio: [
      buildQuest({
        title: "Define this week's visible project milestone",
        description: `Choose something you can show, not just something you can think about. ${classHint}`,
        difficulty: "normal",
        status: "pending",
        xpReward: 25,
        dueDate: makeDueDateISO(today),
        tags: ["project", "planning"],
        subtasks: [
          { id: createId("subtask"), title: "Name the milestone", completed: false },
          { id: createId("subtask"), title: "List 2 or 3 build steps", completed: false },
          { id: createId("subtask"), title: "Choose one piece to ship first", completed: false },
        ],
      }),
      buildQuest({
        title: "Ship one focused build sprint",
        description: "Push the project forward even if the result is still rough.",
        difficulty: "hard",
        status: "pending",
        xpReward: 50,
        dueDate: makeDueDateISO(tomorrow),
        tags: ["project", "build"],
        subtasks: [],
      }),
      buildQuest({
        title: "Polish one visible part of your project",
        description: "Improve the part someone could actually see in a demo or review.",
        difficulty: "normal",
        status: "pending",
        xpReward: 25,
        dueDate: makeDueDateISO(inThreeDays),
        tags: ["project", "polish"],
        subtasks: [],
        isWeekly: true,
      }),
    ],
    fitness: [
      buildQuest({
        title: "Choose this week's main training target",
        description: `Pick one body goal to focus on first, such as strength, endurance, mobility, or recovery. ${classHint}`,
        difficulty: "normal",
        status: "pending",
        xpReward: 25,
        dueDate: makeDueDateISO(today),
        tags: ["fitness", "planning"],
        subtasks: [
          { id: createId("subtask"), title: "Name the training focus", completed: false },
          { id: createId("subtask"), title: "Choose your session count for the week", completed: false },
          { id: createId("subtask"), title: "Prepare the first workout window", completed: false },
        ],
      }),
      buildQuest({
        title: "Complete one starter workout or mobility block",
        description: "Make the first session light enough to start, but real enough to count.",
        difficulty: "easy",
        status: "pending",
        xpReward: 10,
        dueDate: makeDueDateISO(today),
        tags: ["fitness", "training"],
        subtasks: [],
      }),
      buildQuest({
        title: "Protect your key session for the week",
        description: "Hit the workout that matters most, then log the result so the next step stays obvious.",
        difficulty: "hard",
        status: "pending",
        xpReward: 50,
        dueDate: makeDueDateISO(inThreeDays),
        tags: ["fitness", "consistency"],
        subtasks: [],
        isWeekly: true,
      }),
    ],
  };

  return library[(goalTrack as GoalTrackId) ?? "assignments"] ?? library.assignments;
}

export function createStarterHabits(
  goalTrack: string = "assignments",
  userClass: UserClass = "scholar",
): Habit[] {
  const universal = buildHabit({
    title: "Start with the smallest useful step",
    description: "Open the file, mat, note, or setup you need before distractions win.",
    frequency: "daily",
    currentStreak: 0,
    longestStreak: 0,
    xpPerCompletion: 10,
    completedDates: [],
    color: "#8b5cf6",
  });

  const classHabit =
    userClass === "creator"
      ? buildHabit({
          title: "Leave a visible progress log",
          description: "Write one line about what moved forward today.",
          frequency: "daily",
          currentStreak: 0,
          longestStreak: 0,
          xpPerCompletion: 10,
          completedDates: [],
          color: "#ec4899",
        })
      : userClass === "warrior"
      ? buildHabit({
          title: "Finish one real block before reward time",
          description: "Delay the easy dopamine until one real session is done.",
          frequency: "daily",
          currentStreak: 0,
          longestStreak: 0,
          xpPerCompletion: 15,
          completedDates: [],
          color: "#f97316",
        })
      : buildHabit({
          title: "Review your plan before you start",
          description: "Take 2 minutes to confirm what winning today actually means.",
          frequency: "daily",
          currentStreak: 0,
          longestStreak: 0,
          xpPerCompletion: 10,
          completedDates: [],
          color: "#06b6d4",
        });

  const goalHabitMap: Record<GoalTrackId, Habit> = {
    assignments: buildHabit({
      title: "Check deadlines before opening distractions",
      description: "A quick deadline scan helps prevent surprise panic later.",
      frequency: "daily",
      currentStreak: 0,
      longestStreak: 0,
      xpPerCompletion: 10,
      completedDates: [],
      color: "#10b981",
    }),
    "exam-prep": buildHabit({
      title: "Review one concept or drill from memory",
      description: "Recall beats passive review when you want progress to stick.",
      frequency: "daily",
      currentStreak: 0,
      longestStreak: 0,
      xpPerCompletion: 15,
      completedDates: [],
      color: "#22c55e",
    }),
    consistency: buildHabit({
      title: "Prepare tomorrow's setup before you stop",
      description: "Make it easier to start than to delay.",
      frequency: "daily",
      currentStreak: 0,
      longestStreak: 0,
      xpPerCompletion: 10,
      completedDates: [],
      color: "#f59e0b",
    }),
    portfolio: buildHabit({
      title: "Capture one shippable idea",
      description: "Write the next small improvement instead of trusting memory.",
      frequency: "daily",
      currentStreak: 0,
      longestStreak: 0,
      xpPerCompletion: 10,
      completedDates: [],
      color: "#a855f7",
    }),
    fitness: buildHabit({
      title: "Prepare your gear before resistance shows up",
      description: "Reduce friction so it feels easier to start the session than skip it.",
      frequency: "daily",
      currentStreak: 0,
      longestStreak: 0,
      xpPerCompletion: 10,
      completedDates: [],
      color: "#38bdf8",
    }),
  };

  return [universal, classHabit, goalHabitMap[(goalTrack as GoalTrackId) ?? "assignments"] ?? goalHabitMap.assignments];
}

export const mockQuests: Quest[] = createStarterQuests();
export const mockHabits: Habit[] = createStarterHabits();

export const mockBadges: Badge[] = [
  {
    id: "badge-first-quest",
    name: "First Clear",
    description: "Complete your first quest.",
    rarity: "common",
    iconType: "award",
    isLocked: true,
    requirement: "Complete 1 quest",
  },
  {
    id: "badge-streak-starter",
    name: "Streak Starter",
    description: "Build a 3-day habit streak.",
    rarity: "uncommon",
    iconType: "flame",
    isLocked: true,
    requirement: "Get a 3-day streak",
  },
  {
    id: "badge-dungeon",
    name: "Daily Delver",
    description: "Clear one Daily Dungeon.",
    rarity: "rare",
    iconType: "shield",
    isLocked: true,
    requirement: "Clear 1 daily dungeon",
  },
  {
    id: "badge-boss",
    name: "Gate Breaker",
    description: "Defeat a Weekly Boss.",
    rarity: "epic",
    iconType: "sword",
    isLocked: true,
    requirement: "Defeat 1 weekly boss",
  },
  {
    id: "badge-quest-master",
    name: "Quest Master",
    description: "Complete 25 quests.",
    rarity: "rare",
    iconType: "trophy",
    isLocked: true,
    requirement: "Complete 25 quests",
  },
  {
    id: "badge-focus-monk",
    name: "Focus Monk",
    description: "Complete 40 focus sessions.",
    rarity: "epic",
    iconType: "zap",
    isLocked: true,
    requirement: "Complete 40 focus sessions",
  },
  {
    id: "badge-semester-climber",
    name: "Semester Climber",
    description: "Reach level 10.",
    rarity: "legendary",
    iconType: "crown",
    isLocked: true,
    requirement: "Reach level 10",
  },
];
