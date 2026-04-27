import { UserClass } from "../types";

export const APP_NAME = "Levelday";
export const APP_TAGLINE = "Turn procrastination into a progression loop";
export const APP_DESCRIPTION =
  "A lightweight RPG productivity app for people who want to beat procrastination with quests, focus sprints, and visible progress across study, routines, training, and projects.";

export type GoalTrackId = "assignments" | "exam-prep" | "consistency" | "portfolio" | "fitness";

export const GOAL_TRACKS: Record<
  GoalTrackId,
  {
    id: GoalTrackId;
    label: string;
    shortLabel: string;
    description: string;
    dailyGoal: string;
    weeklyBossGoal: string;
    starterQuestHint: string;
    examples: string[];
  }
> = {
  assignments: {
    id: "assignments",
    label: "Finish deadlines and tasks earlier",
    shortLabel: "Deadlines",
    description:
      "Turn large coursework, admin tasks, or overdue work into smaller quests before pressure spikes.",
    dailyGoal: "Ship one meaningful task step today.",
    weeklyBossGoal: "Finish your biggest deadline before panic takes over.",
    starterQuestHint: "Break one deadline into three smaller actions.",
    examples: ["coursework", "paperwork", "admin"],
  },
  "exam-prep": {
    id: "exam-prep",
    label: "Practice for exams or skill drills",
    shortLabel: "Skill Practice",
    description:
      "Useful for exam prep, coding drills, language practice, or any repetition-heavy learning loop.",
    dailyGoal: "Protect one focused practice block every day.",
    weeklyBossGoal: "Clear one tough topic or skill checkpoint this week.",
    starterQuestHint: "Choose one weak area and define one short practice block.",
    examples: ["exam prep", "coding drills", "language practice"],
  },
  consistency: {
    id: "consistency",
    label: "Build a routine that sticks",
    shortLabel: "Consistency",
    description:
      "Reduce friction, start smaller, and make it easier to show up for study, health, or personal routines.",
    dailyGoal: "Show up for your routine even on low-energy days.",
    weeklyBossGoal: "Complete a full week with fewer skipped sessions.",
    starterQuestHint: "Design a tiny ritual you can repeat daily.",
    examples: ["morning routine", "reading", "hydration"],
  },
  portfolio: {
    id: "portfolio",
    label: "Ship a project or side mission",
    shortLabel: "Projects",
    description:
      "Convert creative, technical, or personal goals into a sequence of clear deliverables you can see move.",
    dailyGoal: "Move one visible deliverable forward every day.",
    weeklyBossGoal: "Ship one polished milestone this week.",
    starterQuestHint: "Define the next visible milestone for your project.",
    examples: ["portfolio", "content", "build"],
  },
  fitness: {
    id: "fitness",
    label: "Train your body consistently",
    shortLabel: "Fitness",
    description:
      "Use the same quest system for gym sessions, running plans, mobility work, or body transformation goals.",
    dailyGoal: "Show up for one training or recovery action today.",
    weeklyBossGoal: "Complete your key workout target for the week and protect recovery.",
    starterQuestHint: "Pick one training milestone and define the smallest session you can start.",
    examples: ["gym", "running", "mobility"],
  },
};

export const USER_CLASS_META: Record<
  UserClass,
  {
    label: string;
    identity: string;
    description: string;
    strengths: string[];
    ritual: string;
  }
> = {
  scholar: {
    label: "Scholar",
    identity: "Calm strategist",
    description: "Best for people who want structure, clarity, and clean systems before they start.",
    strengths: ["Focus", "Planning", "Deep work"],
    ritual: "Start with a clear plan, then protect one strong focus block.",
  },
  creator: {
    label: "Creator",
    identity: "Momentum builder",
    description: "Best for builders who stay engaged when progress feels visible and emotionally rewarding.",
    strengths: ["Momentum", "Iteration", "Expression"],
    ritual: "Keep tasks visible, lightweight, and easy to start.",
  },
  warrior: {
    label: "Warrior",
    identity: "Discipline driver",
    description: "Best for people who respond to challenge, pressure, and a clear sense of progression.",
    strengths: ["Discipline", "Consistency", "Execution"],
    ritual: "Treat every completed quest like one visible hit on the boss.",
  },
};

export function getGoalTrackMeta(goalTrack?: string) {
  if (!goalTrack) return GOAL_TRACKS.assignments;
  return GOAL_TRACKS[goalTrack as GoalTrackId] ?? GOAL_TRACKS.assignments;
}

export function getUserClassMeta(userClass: UserClass) {
  return USER_CLASS_META[userClass];
}
