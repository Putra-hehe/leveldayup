import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Bot,
  CheckCircle2,
  Globe2,
  Send,
  ShieldCheck,
  ShieldMinus,
  ShieldX,
  Sparkles,
  Users,
} from "lucide-react";

import {
  CommunityChannel,
  CommunityMessage,
  CommunityProfile,
  CommunityReportReason,
  FocusSession,
  Habit,
  User,
} from "../types";
import { CommunityComposerGuard } from "../components/community/CommunityComposerGuard";
import { CommunityTrustBadge } from "../components/community/CommunityTrustBadge";
import { MessageActionMenu } from "../components/community/MessageActionMenu";
import { FeatureHero } from "../components/FeatureHero";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import {
  buildCommunityPostingPolicy,
  deriveCommunityTrustSummary,
  ensureCommunityProfile,
  getCommunityReputationBand,
  isHandleSuppressed,
} from "../utils/communityTrust";

interface CommunityPageProps {
  user: User;
  messages: CommunityMessage[];
  habits: Habit[];
  focusSessions: FocusSession[];
  profile?: CommunityProfile;
  onSendMessage: (channel: CommunityChannel, body: string) => void;
  onReportMessage: (messageId: string, reason: CommunityReportReason) => void;
  onMuteHandle: (handle: string, nextMuted: boolean) => void;
  onBlockHandle: (handle: string, nextBlocked: boolean) => void;
}

const rooms: {
  id: CommunityChannel;
  label: string;
  icon: typeof Globe2;
  description: string;
  audience: "human" | "ai";
  trustPromise: string;
  suggestions: string[];
}[] = [
  {
    id: "global",
    label: "Global chat",
    icon: Globe2,
    audience: "human",
    description: "Ruang publik untuk update singkat, progress nyata, dan interaksi antar member asli.",
    trustPromise: "Human-only. Jangan isi ruangan ini dengan AI, bot, atau fake activity.",
    suggestions: [
      "Baru selesai 1 fokus block, lanjut 1 lagi.",
      "Ada yang punya cara cepat buat restart setelah terdistraksi?",
      "Hari ini target saya cuma satu tugas berat dulu.",
    ],
  },
  {
    id: "friends",
    label: "Friends chat",
    icon: Users,
    audience: "human",
    description: "Ruang yang lebih personal untuk accountability, check-in, dan obrolan ringan dengan orang yang kamu kenal.",
    trustPromise: "Private human layer. Cocok untuk relasi kecil yang butuh rasa aman dan konteks personal.",
    suggestions: [
      "Tolong cek saya lagi 45 menit ya.",
      "Saya mau mulai, target saya satu task dulu.",
      "Bantu saya pilih next move yang paling realistis.",
    ],
  },
  {
    id: "ai-lounge",
    label: "AI lounge",
    icon: Bot,
    audience: "ai",
    description: "Ruang khusus AI untuk ngobrol, merapikan pikiran, dan meminta bantuan taktis tanpa membingungkan user dengan interaksi manusia.",
    trustPromise: "AI-only. Semua balasan di sini datang dari sistem dan harus terlihat jelas sebagai AI.",
    suggestions: [
      "Bikin rencana 2 jam ke depan yang realistis.",
      "Saya stuck. Pecah tugas ini jadi langkah kecil.",
      "Tolong review prioritas saya hari ini.",
    ],
  },
];

function getMessageBubbleClass(message: CommunityMessage) {
  const senderType = message.senderType ?? (message.isAI ? "ai" : "human");

  if (senderType === "ai") {
    return message.isOwn
      ? "max-w-[88%] rounded-3xl rounded-tr-md border border-violet-400/20 bg-violet-500/14 px-4 py-3 text-sm leading-7 text-violet-50"
      : "max-w-[88%] rounded-3xl rounded-tl-md border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm leading-7 text-cyan-50";
  }

  if (senderType === "system") {
    return "max-w-[88%] rounded-3xl rounded-tl-md border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm leading-7 text-amber-50";
  }

  return message.isOwn
    ? "max-w-[82%] rounded-3xl rounded-tr-md border border-violet-400/20 bg-violet-500/14 px-4 py-3 text-sm leading-7 text-violet-50"
    : "max-w-[88%] rounded-3xl rounded-tl-md border border-white/10 bg-white/[0.05] px-4 py-3 text-sm leading-7 text-slate-100";
}

export function CommunityPage({
  user,
  messages,
  habits,
  focusSessions,
  profile,
  onSendMessage,
  onReportMessage,
  onMuteHandle,
  onBlockHandle,
}: CommunityPageProps) {
  const [channel, setChannel] = useState<CommunityChannel>("global");
  const [draft, setDraft] = useState("");
  const safeProfile = useMemo(() => ensureCommunityProfile(profile), [profile]);

  const roomMessages = useMemo(
    () => messages.filter((message) => message.channel === channel).slice(-24),
    [messages, channel],
  );

  const visibleMessages = useMemo(
    () => roomMessages.filter((message) => message.isOwn || !isHandleSuppressed(message.handle, safeProfile)),
    [roomMessages, safeProfile],
  );

  const hiddenCount = roomMessages.length - visibleMessages.length;

  const trust = useMemo(
    () => deriveCommunityTrustSummary({ user, messages, habits, focusSessions, profile: safeProfile }),
    [user, messages, habits, focusSessions, safeProfile],
  );

  const policy = useMemo(
    () => buildCommunityPostingPolicy({ channel, trust, profile: safeProfile }),
    [channel, trust, safeProfile],
  );

  const channelMeta = rooms.find((room) => room.id === channel) || rooms[0];
  const ChannelIcon = channelMeta.icon;
  const reputationBand = getCommunityReputationBand(trust.reputationScore);

  const humanParticipants = useMemo(() => {
    return Array.from(
      new Set(
        visibleMessages
          .filter((message) => (message.senderType ?? (message.isAI ? "ai" : "human")) === "human")
          .map((message) => message.author),
      ),
    );
  }, [visibleMessages]);

  const send = () => {
    const value = draft.trim();
    if (!value) return;
    onSendMessage(channel, value);
    setDraft("");
  };

  return (
    <div className="space-y-8">
      <FeatureHero
        kicker="Community layer"
        title="Community dibuat hidup tapi tetap jujur: room manusia dan AI dibedakan dengan jelas."
        description="Visual fitur komunitas sekarang lebih konsisten dengan halaman lain. Kamu bisa cepat lihat room aktif, reputasi, dan jumlah partisipan tanpa tampilannya terasa ribet."
        tone="emerald"
        visual="community"
        badge="trusted signals"
        guide={{ title: "Panduan komunitas", steps: ["Bagikan progres atau minta dorongan saat stuck.", "Jaga pesan tetap suportif dan aman.", "Pakai komunitas sebagai party, bukan tempat membandingkan diri."] }}
        stats={[
          { label: "Pesan", value: String(visibleMessages.length) },
          { label: "Human", value: String(humanParticipants.length) },
          { label: "Reputasi", value: reputationBand.label },
        ]}
      />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="cinematic-panel p-6 sm:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center">
          <div className="space-y-5">
            <div className="scene-kicker">Community layer</div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] text-white sm:text-5xl">
              Social energy should feel <span className="text-gradient">alive without faking life</span>.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Bedakan ruang manusia dan ruang AI secara tegas. Human rooms harus jujur, AI room harus jelas, dan user tidak boleh merasa ditipu demi engagement palsu.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {rooms.map((room) => {
              const Icon = room.icon;
              const active = room.id === channel;
              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => setChannel(room.id)}
                  className={`rounded-[28px] border p-4 text-left transition ${
                    active
                      ? "border-violet-400/30 bg-violet-500/12"
                      : "border-white/10 bg-white/[0.04] hover:border-violet-400/20 hover:bg-violet-500/8"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="h-5 w-5 text-cyan-200" />
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
                        room.audience === "ai"
                          ? "border-cyan-400/25 bg-cyan-400/12 text-cyan-100"
                          : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                      }`}
                    >
                      {room.audience === "ai" ? "AI room" : "Human room"}
                    </span>
                  </div>
                  <div className="mt-4 text-sm font-semibold text-white">{room.label}</div>
                  <div className="mt-2 text-xs leading-6 text-slate-300">{room.description}</div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_0.28fr]">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-white/10 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-cyan-500/15 text-cyan-100">
                  <ChannelIcon className="h-5 w-5" />
                </div>
                <div>
                  <div className="scene-kicker">Current room</div>
                  <h2 className="mt-1 text-2xl font-semibold text-white">{channelMeta.label}</h2>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${
                    channelMeta.audience === "ai"
                      ? "border-cyan-400/25 bg-cyan-400/12 text-cyan-100"
                      : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                  }`}
                >
                  {channelMeta.audience === "ai" ? "AI-only room" : "Human-only room"}
                </span>
                <CommunityTrustBadge senderType="human" trustState={trust.state} />
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">{channelMeta.description}</p>
            <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-200">
              <span className="font-semibold text-white">Trust rule:</span> {channelMeta.trustPromise}
            </div>
            {hiddenCount > 0 ? (
              <div className="mt-4 rounded-[18px] border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                {hiddenCount} message disembunyikan karena akun tersebut Anda mute atau block.
              </div>
            ) : null}
          </div>

          <div className="max-h-[560px] space-y-4 overflow-y-auto px-6 py-6">
            {visibleMessages.map((message) => {
              const mine = !!message.isOwn;
              const senderType = message.senderType ?? (message.isAI ? "ai" : "human");
              const isMuted = safeProfile.mutedHandles.includes(message.handle);
              const isBlocked = safeProfile.blockedHandles.includes(message.handle);
              return (
                <div key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                  <div className={getMessageBubbleClass(message)}>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-300/85">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{message.author}</span>
                        <span>{message.handle}</span>
                        <CommunityTrustBadge senderType={senderType} trustState={message.trustState} compact />
                        {message.moderationStatus === "under-review" ? (
                          <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-100">
                            under review
                          </span>
                        ) : null}
                      </div>
                      <MessageActionMenu
                        message={message}
                        isMuted={isMuted}
                        isBlocked={isBlocked}
                        onReport={onReportMessage}
                        onMuteToggle={onMuteHandle}
                        onBlockToggle={onBlockHandle}
                      />
                    </div>
                    <div className="whitespace-pre-wrap break-words">{message.body}</div>
                    <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {typeof message.reportCount === "number" && message.reportCount > 0 ? <span>{message.reportCount} report</span> : null}
                    </div>
                  </div>
                </div>
              );
            })}

            {!visibleMessages.some((message) => (message.senderType ?? (message.isAI ? "ai" : "human")) === "human") && channelMeta.audience === "human" ? (
              <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.03] px-6 py-10 text-center">
                <Users className="mx-auto h-10 w-10 text-slate-500" />
                <h3 className="mt-4 text-lg font-semibold text-white">No real member activity yet</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-slate-300">
                  Room ini sengaja tidak diisi palsu. Saat belum ada user lain yang aktif, sistem akan jujur bilang sepi.
                </p>
              </div>
            ) : null}
          </div>

          <div className="border-t border-white/10 px-6 py-5">
            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
              <div className="space-y-4">
                <CommunityComposerGuard policy={policy} trustState={trust.state} />

                <div className="flex flex-wrap gap-2">
                  {channelMeta.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setDraft(suggestion)}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-left text-xs text-slate-200 transition hover:border-violet-400/20 hover:bg-violet-500/8"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex w-full max-w-xl items-end gap-3 lg:w-[420px]">
                <Input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={channelMeta.audience === "ai" ? "Message AI..." : "Post to real members..."}
                  className="h-14 flex-1 rounded-[22px] border-white/10 bg-white/[0.04] text-base text-white placeholder:text-slate-400"
                  disabled={!policy.canPost && channelMeta.audience === "human"}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") send();
                  }}
                />
                <Button type="button" size="lg" onClick={send} disabled={!draft.trim() || (!policy.canPost && channelMeta.audience === "human") }>
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="scene-kicker">Trust overview</div>
            <div className="mt-3 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Your status</div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-lg font-semibold text-white">
                  {user.name}
                  <CommunityTrustBadge senderType="human" trustState={trust.state} />
                </div>
                <div className="mt-2 text-sm leading-7 text-slate-300">{trust.note}</div>
              </div>
              <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Reputation</div>
                <div className="mt-2 text-3xl font-semibold text-white">{trust.reputationScore}</div>
                <div className={`mt-1 text-xs ${reputationBand.tone}`}>{reputationBand.label}</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-300" />
                  <span className="font-medium">Visible trust signals</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {trust.visibleSignals.length ? trust.visibleSignals.map((signal) => (
                    <span key={signal} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200">
                      {signal}
                    </span>
                  )) : (
                    <span className="text-sm text-slate-300">Belum ada sinyal kuat. Akun masih dalam fase observasi.</span>
                  )}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="h-4 w-4 text-violet-300" />
                  <span className="font-medium">Moderation shield</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-slate-300">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Reports sent</div>
                    <div className="mt-2 text-xl font-semibold text-white">{safeProfile.reportsSubmitted}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Reports received</div>
                    <div className="mt-2 text-xl font-semibold text-white">{safeProfile.reportsReceived}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Muted handles</div>
                    <div className="mt-2 text-xl font-semibold text-white">{safeProfile.mutedHandles.length}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                    <div className="text-xs uppercase tracking-[0.16em] text-slate-400">Blocked handles</div>
                    <div className="mt-2 text-xl font-semibold text-white">{safeProfile.blockedHandles.length}</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="scene-kicker">Room health</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">Keep it readable</h3>
            <div className="mt-5 space-y-3 text-sm leading-7 text-slate-300">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="h-4 w-4 text-cyan-300" />
                  <span className="font-medium">Visible participants</span>
                </div>
                <p className="mt-2">{humanParticipants.length ? humanParticipants.join(", ") : "Belum ada member manusia yang aktif di room ini."}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-white">
                  <ShieldMinus className="h-4 w-4 text-amber-300" />
                  <span className="font-medium">Mute first, block when needed</span>
                </div>
                <p className="mt-2">Mute cocok untuk noise. Block cocok untuk akun yang jelas tidak Anda inginkan muncul lagi. Report dipakai saat perilakunya patut direview.</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-center gap-2 text-white">
                  <ShieldX className="h-4 w-4 text-rose-300" />
                  <span className="font-medium">No fake room health</span>
                </div>
                <p className="mt-2">Kalau room sepi, sistem mengaku sepi. Itu lebih baik daripada engagement palsu yang merusak trust.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
