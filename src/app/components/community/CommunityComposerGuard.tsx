import { Lock, ShieldCheck, TimerReset } from "lucide-react";

import { CommunityPostingPolicy, CommunityTrustState } from "../../types";
import { getCommunityTrustMeta } from "../../utils/communityTrust";
import { CommunityTrustBadge } from "./CommunityTrustBadge";

interface CommunityComposerGuardProps {
  policy: CommunityPostingPolicy;
  trustState: CommunityTrustState;
}

export function CommunityComposerGuard({ policy, trustState }: CommunityComposerGuardProps) {
  const meta = getCommunityTrustMeta(trustState);

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Composer state</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <CommunityTrustBadge senderType="human" trustState={trustState} />
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-slate-200">
              {policy.mode === "open"
                ? "Open posting"
                : policy.mode === "slow"
                ? "Slow mode"
                : policy.mode === "warmup"
                ? "Read-first warmup"
                : policy.mode === "review"
                ? "Review queue"
                : "Restricted"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-200">
          {policy.canPost ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <Lock className="h-4 w-4 text-amber-300" />}
          <span>{policy.canPost ? "Posting available" : "Posting paused"}</span>
        </div>
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{policy.message}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-300">
        <span className="inline-flex items-center gap-1">
          <TimerReset className="h-3.5 w-3.5 text-violet-300" />
          Cooldown {policy.cooldownSeconds}s
        </span>
        <span>{meta.note}</span>
      </div>
    </div>
  );
}
