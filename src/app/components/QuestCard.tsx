import { motion } from "motion/react";
import { Calendar, CheckCircle2, Circle, Clock, Flag, Repeat, Tag, Trophy } from "lucide-react";
import { format } from "date-fns";

import { Quest } from "../types";
import { getDifficultyColor } from "../utils/xp";
import { isoToLocalDateKey, toLocalDateKey } from "../utils/date";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface QuestCardProps {
  quest: Quest;
  onClick?: () => void;
  onComplete?: () => void;
}

export function QuestCard({ quest, onClick, onComplete }: QuestCardProps) {
  const completedSubtasks = quest.subtasks.filter((subtask) => subtask.completed).length;
  const totalSubtasks = quest.subtasks.length;
  const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const todayKey = toLocalDateKey(new Date());
  const dueKey = isoToLocalDateKey(quest.dueDate);
  const isOverdue = !!dueKey && dueKey < todayKey && quest.status !== "completed";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="cursor-pointer border-border/60 bg-card/45 p-4 backdrop-blur transition-all hover:border-primary/50"
        onClick={onClick}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start gap-2">
                {quest.status === "completed" ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-400" />
                ) : quest.status === "in_progress" ? (
                  <Clock className="mt-0.5 h-5 w-5 text-cyan-400" />
                ) : (
                  <Circle className="mt-0.5 h-5 w-5 text-muted-foreground" />
                )}
                <div className="min-w-0 flex-1">
                  <h3 className={`leading-snug ${quest.status === "completed" ? "text-muted-foreground line-through" : ""}`}>
                    {quest.title}
                  </h3>
                  {quest.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{quest.description}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {quest.status !== "completed" && onComplete ? (
                <Button
                  variant="ghost"
                  size="icon"
                  title="Mark as complete"
                  onClick={(event) => {
                    event.stopPropagation();
                    onComplete();
                  }}
                  className="h-8 w-8"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              ) : null}
              <Badge className={getDifficultyColor(quest.difficulty)}>{quest.difficulty}</Badge>
            </div>
          </div>

          {totalSubtasks > 0 ? (
            <div>
              <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {quest.dueDate ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${isOverdue ? "bg-red-500/10 text-red-300" : "bg-secondary text-secondary-foreground"}`}>
                  <Calendar className="h-3 w-3" />
                  {isOverdue ? "Overdue" : format(new Date(quest.dueDate), "MMM dd")}
                </span>
              ) : null}
              {quest.isDaily ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-1 text-purple-200">
                  <Repeat className="h-3 w-3" />
                  Daily
                </span>
              ) : null}
              {quest.isWeekly ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-1 text-red-200">
                  <Flag className="h-3 w-3" />
                  Boss step
                </span>
              ) : null}
              {quest.tags.length ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
                  <Tag className="h-3 w-3" />
                  {quest.tags.slice(0, 2).join(" • ")}
                </span>
              ) : null}
            </div>

            <div className="inline-flex items-center gap-1 text-xs font-medium text-purple-300">
              <Trophy className="h-3 w-3" />
              +{quest.xpReward} XP
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
