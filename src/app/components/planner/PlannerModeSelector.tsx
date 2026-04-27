import { Brain, Gauge, HeartPulse } from "lucide-react";

import { PlanningMode } from "../../utils/planner";

interface PlannerModeSelectorProps {
  value: PlanningMode;
  onChange: (mode: PlanningMode) => void;
}

const planningModeMeta: Record<PlanningMode, { label: string; description: string; Icon: typeof Brain }> = {
  "locked-in": {
    label: "Gas fokus",
    description: "Minim distraksi, output lebih berat, jeda lebih sedikit.",
    Icon: Brain,
  },
  steady: {
    label: "Stabil",
    description: "Ritme seimbang untuk hari produktif yang normal.",
    Icon: Gauge,
  },
  recovery: {
    label: "Pemulihan",
    description: "Tempo lebih ringan saat energi lagi terbatas.",
    Icon: HeartPulse,
  },
};

export function PlannerModeSelector({ value, onChange }: PlannerModeSelectorProps) {
  return (
    <div className="grid gap-2 md:grid-cols-3">
      {(Object.keys(planningModeMeta) as PlanningMode[]).map((mode) => {
        const meta = planningModeMeta[mode];
        const active = value === mode;

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={active}
            className={`min-w-0 rounded-2xl border p-3 text-left transition ${
              active
                ? "border-violet-400/30 bg-violet-500/14 text-violet-100 shadow-[0_0_0_1px_rgba(167,139,250,0.08)]"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-violet-400/20"
            }`}
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${active ? "bg-violet-500/18 text-violet-100" : "bg-white/[0.05] text-slate-200"}`}>
                <meta.Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="break-words text-sm font-semibold leading-5 text-white">{meta.label}</div>
                <div className="mt-1 break-words text-[11px] leading-4 text-slate-300">{meta.description}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
