import { ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";

import { CommunitySenderType, CommunityTrustState } from "../../types";
import { getCommunityTrustMeta } from "../../utils/communityTrust";

interface CommunityTrustBadgeProps {
  senderType: CommunitySenderType;
  trustState?: CommunityTrustState;
  compact?: boolean;
}

export function CommunityTrustBadge({ senderType, trustState = "verified", compact = false }: CommunityTrustBadgeProps) {
  if (senderType === "ai") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-cyan-400/25 bg-cyan-400/12 px-2.5 py-1 text-cyan-100 ${compact ? "text-[10px]" : "text-xs"}`}>
        <ShieldCheck className="h-3.5 w-3.5" />
        AI
      </span>
    );
  }

  if (senderType === "system") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-amber-400/25 bg-amber-400/12 px-2.5 py-1 text-amber-100 ${compact ? "text-[10px]" : "text-xs"}`}>
        <ShieldAlert className="h-3.5 w-3.5" />
        System
      </span>
    );
  }

  const meta = getCommunityTrustMeta(trustState);
  const Icon = trustState === "restricted" ? ShieldX : trustState === "flagged" ? ShieldAlert : ShieldCheck;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${meta.chipClass} ${compact ? "text-[10px]" : "text-xs"}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}
