import { MoreHorizontal, ShieldBan, ShieldOff, TriangleAlert } from "lucide-react";

import { CommunityMessage, CommunityReportReason } from "../../types";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface MessageActionMenuProps {
  message: CommunityMessage;
  isMuted: boolean;
  isBlocked: boolean;
  onReport: (messageId: string, reason: CommunityReportReason) => void;
  onMuteToggle: (handle: string, nextMuted: boolean) => void;
  onBlockToggle: (handle: string, nextBlocked: boolean) => void;
}

export function MessageActionMenu({
  message,
  isMuted,
  isBlocked,
  onReport,
  onMuteToggle,
  onBlockToggle,
}: MessageActionMenuProps) {
  if (message.isOwn || message.senderType === "system") return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-300 hover:text-white">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60 border-white/10 bg-[#0b1220]/95 text-slate-100 backdrop-blur-2xl">
        <DropdownMenuLabel className="text-slate-200">Safety actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onReport(message.id, "spam")}>Report as spam</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onReport(message.id, "fake")}>Report as fake account</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onReport(message.id, "harassment")}>Report as harassment</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onReport(message.id, "unsafe")}>
          <TriangleAlert className="h-4 w-4" />
          Report unsafe content
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onMuteToggle(message.handle, !isMuted)}>
          <ShieldOff className="h-4 w-4" />
          {isMuted ? `Unmute ${message.handle}` : `Mute ${message.handle}`}
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={() => onBlockToggle(message.handle, !isBlocked)}>
          <ShieldBan className="h-4 w-4" />
          {isBlocked ? `Unblock ${message.handle}` : `Block ${message.handle}`}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
