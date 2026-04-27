import { CalendarDays, Home, MessageCircle, Timer, Trophy } from "lucide-react";

interface MobileNavProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

const menuItems = [
  { id: "dashboard", icon: Home, label: "Home" },
  { id: "planner", icon: CalendarDays, label: "Planner" },
  { id: "community", icon: MessageCircle, label: "Community" },
  { id: "focus", icon: Timer, label: "Focus" },
  { id: "leaderboard", icon: Trophy, label: "Top" },
];

export function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  const normalizedPage = currentPage === "calendar" ? "planner" : currentPage;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/55 pb-[env(safe-area-inset-bottom)] backdrop-blur-2xl md:hidden">
      <div className="flex items-center justify-around px-2 py-2.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = normalizedPage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex min-w-[64px] flex-col items-center gap-1 rounded-2xl px-3 py-2 text-[11px] transition ${
                active ? "bg-violet-500/14 text-white" : "text-slate-400"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-cyan-200" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
