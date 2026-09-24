"use client";

import { useState } from "react";
import { Loader2, Lock, Send, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { postJson } from "@/components/rental/api";
import type { ReviewDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const SENTIMENTS = ["", "ضعيف", "مقبول", "جيد", "جيد جداً", "ممتاز"];

/**
 * P2 review form — rendered ONLY for bookings with status === 'COMPLETED'
 * (gated on completed bookings by the parent component).
 */
export function ReviewForm({
  bookingId,
  customerId,
  onSubmitted,
}: {
  bookingId: string;
  customerId: string;
  onSubmitted?: (review: ReviewDTO) => void;
}) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const shown = hovered || rating;

  async function submit() {
    if (!rating) {
      toast.error("اختر عدد النجوم أولاً");
      return;
    }
    setSubmitting(true);
    try {
      const data = await postJson<{ review: ReviewDTO }>("/api/reviews", {
        bookingId,
        customerId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("شكراً! تقييمك نُشر");
      setRating(0);
      setComment("");
      onSubmitted?.(data.review);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر إرسال التقييم");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-amber-200/70 bg-amber-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-amber-900">قيّم تجربتك</p>
        <div className="flex items-center gap-2" dir="ltr">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`${i} من 5 نجوم`}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(i)}
                disabled={submitting}
                className="cursor-pointer rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:pointer-events-none"
              >
                <Star
                  className={cn(
                    "size-6 transition-colors",
                    i <= shown
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/40"
                  )}
                />
              </button>
            ))}
          </div>
          {rating > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              {SENTIMENTS[rating]}
            </span>
          )}
        </div>
      </div>

      <Textarea
        rows={3}
        placeholder="شاركنا تجربتك…"
        value={comment}
        maxLength={500}
        onChange={(e) => setComment(e.target.value)}
        disabled={submitting}
        className="resize-none bg-white"
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="size-3" />
          التقييم متاح فقط بعد اكتمال الحجز
        </p>
        <Button
          size="sm"
          onClick={submit}
          disabled={!rating || submitting}
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          {submitting ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          إرسال التقييم
        </Button>
      </div>
    </div>
  );
}
