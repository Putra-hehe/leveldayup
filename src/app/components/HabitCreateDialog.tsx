import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useIsMobile } from "./ui/use-mobile";
import { Habit } from "../types";
import { createId } from "../utils/id";

/**
 * Dialog for creating a new habit. Unlike the original implementation which
 * immediately created a habit with fixed defaults, this component lets the
 * user customise the habit's title, description, frequency, XP reward and
 * colour before adding it to their list. It also falls back to native
 * <select> on mobile devices to avoid blank-page issues caused by Radix
 * components on certain mobile browsers. The parent component should
 * supply the `open` and `onCreate`/`onClose` props.
 */
interface HabitCreateDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (habit: Habit) => void;
}

// Days of the week for custom frequency. Sunday = 0 to Saturday = 6.
const WEEK_DAYS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export function HabitCreateDialog({ open, onClose, onCreate }: HabitCreateDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">("daily");
  const [customDays, setCustomDays] = useState<number[]>([]);
  const [xpPerCompletion, setXpPerCompletion] = useState(10);
  const [color, setColor] = useState("#8b5cf6");

  // Detect small mobile screens to decide between native and Radix select.
  const isMobile = useIsMobile();

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) return;
    // initialise defaults when dialog opens
    setTitle("");
    setDescription("");
    setFrequency("daily");
    setCustomDays([]);
    setXpPerCompletion(10);
    setColor("#8b5cf6");
  }, [open]);

  const handleToggleDay = (day: number) => {
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleCreate = () => {
    // Build habit object with custom fields. If frequency isn't custom,
    // omit customDays to keep the state clean.
    const newHabit: Habit = {
      id: createId("habit"),
      title: title.trim() || "New Habit",
      description: description.trim() || undefined,
      frequency,
      customDays: frequency === "custom" ? customDays.sort() : undefined,
      currentStreak: 0,
      longestStreak: 0,
      xpPerCompletion: xpPerCompletion || 10,
      completedDates: [],
      createdAt: new Date().toISOString(),
      color,
    };
    onCreate(newHabit);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Habit</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="habit-title">Title</Label>
            <Input
              id="habit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Habit name"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="habit-description">Description</Label>
            <Textarea
              id="habit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Habit description (optional)"
              rows={3}
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label htmlFor="habit-frequency">Frequency</Label>
            {isMobile ? (
              <select
                id="habit-frequency"
                className="border-input bg-input-background rounded-md w-full h-9 px-3 py-2 text-sm"
                value={frequency}
                onChange={(e) => {
                  const value = e.target.value as any;
                  setFrequency(value);
                }}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            ) : (
              <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Day-of-week checkboxes if custom frequency */}
            {frequency === "custom" && (
              <div className="grid grid-cols-7 gap-1 mt-2">
                {WEEK_DAYS.map((day) => (
                  <label
                    key={day.value}
                    className="flex flex-col items-center text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      className="mb-1 accent-primary"
                      checked={customDays.includes(day.value)}
                      onChange={() => handleToggleDay(day.value)}
                    />
                    {day.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* XP Per Completion */}
          <div className="space-y-2">
            <Label htmlFor="habit-xp">XP per Completion</Label>
            <Input
              id="habit-xp"
              type="number"
              min={0}
              value={xpPerCompletion}
              onChange={(e) => setXpPerCompletion(parseInt(e.target.value, 10) || 0)}
            />
          </div>

          {/* Colour Picker */}
          <div className="space-y-2">
            <Label htmlFor="habit-color">Colour</Label>
            <input
              id="habit-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-12 h-8 border border-border rounded"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white"
            >
              Create Habit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}