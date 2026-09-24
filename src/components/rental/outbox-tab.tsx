"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BellRing,
  ChevronDown,
  ChevronUp,
  Mail,
  Mailbox,
  PartyPopper,
  Receipt,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getJson } from "@/components/rental/api";
import {
  EmptyState,
  ErrorState,
  FadeIn,
  RowsSkeleton,
} from "@/components/rental/primitives";
import { EMAIL_TYPE_LABELS, type EmailDTO, type EmailType, type EmailsResponse } from "@/lib/types";
import { cn } from "@/lib/utils";

const EMAIL_META: Record<EmailType, { icon: LucideIcon; className: string }> = {
  PAYMENT_RECEIPT: {
    icon: Receipt,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  MERCHANT_NEW_ORDER: {
    icon: Mail,
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  LATE_WARNING: {
    icon: BellRing,
    className: "border-red-200 bg-red-50 text-red-800",
  },
  ESCROW_RELEASE: {
    icon: PartyPopper,
    className: "border-teal-200 bg-teal-50 text-teal-800",
  },
};

function fmtSentAt(iso: string): string {
  return new Date(iso).toLocaleString("ar-DZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OutboxTab() {
  const emailsQuery = useQuery({
    queryKey: ["emails"],
    queryFn: () => getJson<EmailsResponse>("/api/emails"),
    refetchInterval: 5000,
  });

  const emails = [...(emailsQuery.data?.emails ?? [])].sort(
    (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
  );

  return (
    <div className="space-y-5">
      {/* intro strip — P2 showcase */}
      <FadeIn className="rounded-2xl border border-teal-100 bg-gradient-to-l from-teal-50 to-emerald-50 p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold text-teal-950">
          <Mailbox className="size-5 text-teal-700" />
          صندوق الصادر — حنجرة المنصة
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-teal-900/80">
          كل إشعار هنا أُرسل آلياً من المنصة (محاكاة مزوّد بريد): إيصالات الدفع
          للزبون، طلبات جديدة للتاجر، إنذارات التأخير، وإشعارات فك حجز الضمان.
          أنشئ حجزاً وأكمل الدفع وشاهدها تعمل مباشرة.
        </p>
      </FadeIn>

      {emailsQuery.isPending ? (
        <RowsSkeleton count={4} height="h-32" />
      ) : emailsQuery.isError ? (
        <ErrorState onRetry={() => emailsQuery.refetch()} />
      ) : emails.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="لا إشعارات بعد"
          hint="أنشئ حجزاً وأكمل الدفع لترى حنجرة المنصة تعمل."
        />
      ) : (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            الإشعارات المُرسلة
          </h3>
          <Badge variant="secondary">{emails.length} إشعار</Badge>
        </div>
      )}

      {emails.length > 0 && (
        <div className="max-h-[70vh] space-y-3 overflow-y-auto scrollbar-thin pe-1">
          {emails.map((email) => (
            <EmailRow key={email.id} email={email} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single email row (collapsible body) ─────────────────────────────
function EmailRow({ email }: { email: EmailDTO }) {
  const [expanded, setExpanded] = useState(false);
  const meta = EMAIL_META[email.type] ?? {
    icon: Mail,
    className: "border-border bg-muted text-foreground",
  };
  const Icon = meta.icon;

  return (
    <Card className="gap-0 rounded-xl border-border p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={meta.className}>
          <Icon className="size-3" />
          {EMAIL_TYPE_LABELS[email.type] ?? email.type}
        </Badge>
        {email.bookingId && (
          <Badge
            variant="outline"
            className="font-mono text-[10px] text-muted-foreground"
          >
            الحجز: …{email.bookingId.slice(-6)}
          </Badge>
        )}
        <span className="ms-auto text-xs text-muted-foreground">
          {fmtSentAt(email.sentAt)}
        </span>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        إلى: {email.toName} ({email.toEmail})
      </p>
      <p className="mt-1 text-sm font-semibold">{email.subject}</p>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1.5 block w-full cursor-pointer rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
      >
        <p
          className={cn(
            "whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground",
            !expanded && "line-clamp-1"
          )}
        >
          {email.body}
        </p>
        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          {expanded ? (
            <>
              إخفاء <ChevronUp className="size-3" />
            </>
          ) : (
            <>
              قراءة كاملة <ChevronDown className="size-3" />
            </>
          )}
        </span>
      </button>
    </Card>
  );
}
