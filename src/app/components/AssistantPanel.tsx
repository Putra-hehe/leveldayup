import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Bot, LoaderCircle, Sparkles } from "lucide-react";

import { AssistantMessage } from "../types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AssistantPanelProps {
  messages: AssistantMessage[];
  onSend: (message: string) => void | Promise<void>;
  title?: string;
  subtitle?: string;
  placeholder?: string;
  suggestions?: string[];
  isLoading?: boolean;
}

export function AssistantPanel({
  messages,
  onSend,
  title = "AI planner pendamping",
  subtitle = "Minta bantuan untuk fokus, langkah berikutnya, atau susun rencana yang lebih realistis.",
  placeholder = "Contoh: bantu susun 2 jam ke depan biar tidak berantakan...",
  suggestions = ["Aku lagi mentok", "Pecah tugas utamaku", "Susun 2 jam ke depan"],
  isLoading = false,
}: AssistantPanelProps) {
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);

  const recentMessages = useMemo(() => messages.slice(-6), [messages]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    const value = draft.trim();
    if (!value || isSending || isLoading) return;

    setIsSending(true);
    try {
      await Promise.resolve(onSend(value));
      setDraft("");
    } finally {
      setIsSending(false);
    }
  };

  const busy = isSending || isLoading;

  return (
    <div className="cinematic-panel relative overflow-hidden p-5 sm:p-6">
      <div className="absolute right-4 top-4 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.26em] text-cyan-100/80">
        AI aktif
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/30 via-violet-400/10 to-cyan-400/20 text-violet-100 shadow-lg shadow-violet-500/20">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <div className="scene-kicker">Ruang bantu AI</div>
          <h3 className="mt-1 text-2xl font-semibold text-white">{title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{subtitle}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {recentMessages.length ? (
          recentMessages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "assistant"
                  ? "max-w-[92%] rounded-3xl rounded-tl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 text-slate-100"
                  : "ml-auto max-w-[88%] rounded-3xl rounded-tr-md border border-violet-400/20 bg-violet-500/14 px-4 py-3 text-sm leading-6 text-violet-50"
              }
            >
              {message.body.split("\n").map((line, index) => (
                <div key={`${message.id}-${index}`}>{line}</div>
              ))}
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-slate-300">
            Tanyakan rencana, minta bantuan fokus, atau suruh AI memecah tugas jadi langkah kecil.
          </div>
        )}

        {busy ? (
          <div className="max-w-[92%] rounded-3xl rounded-tl-md border border-cyan-400/15 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-50">
            <div className="flex items-center gap-2">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              AI sedang menyusun respons yang lebih relevan...
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={busy}
            onClick={() => void onSend(suggestion)}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-200 transition hover:border-violet-400/30 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="mr-2 inline h-3.5 w-3.5" />
            {suggestion}
          </button>
        ))}
      </div>

      <form onSubmit={(event) => void submit(event)} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          className="h-12 flex-1"
          disabled={busy}
        />
        <Button type="submit" className="h-12 px-5 sm:px-6" disabled={busy || !draft.trim()}>
          {busy ? "Memproses" : "Kirim"}
          {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
