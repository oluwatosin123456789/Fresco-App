"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { getScan, imageUrl, postPantryItem } from "@/lib/api";
import { BandChip } from "@/components/BandChip";
import { ImageSlot } from "@/components/ImageSlot";
import { BAND_META } from "@/lib/band";

export default function ScanResultPage() {
  const params = useParams<{ scanId: string }>();
  const scanId = Number(params.scanId);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [reminderSet, setReminderSet] = useState(false);

  const { data: scan, isLoading } = useQuery({
    queryKey: ["scan", scanId],
    queryFn: () => getScan(scanId),
    enabled: Number.isFinite(scanId),
  });

  const saveMutation = useMutation({
    mutationFn: () => postPantryItem(scanId, "fridge"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pantry"] });
    },
  });

  if (isLoading || !scan) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-fresco-sheet font-mono text-sm text-fresco-faint">
        Loading verdict…
      </div>
    );
  }

  const meta = BAND_META[scan.band];

  return (
    <div className="relative min-h-[100dvh] bg-fresco-sheet">
      <div className="relative h-[340px]">
        <ImageSlot
          src={imageUrl(scan.image_url)}
          alt={scan.produce_name}
          placeholder={`${scan.produce_name} photo`}
          className="absolute inset-0 h-full w-full"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(11,20,16,0.35) 0%, rgba(11,20,16,0) 30%, rgba(11,20,16,0) 55%, #F3F1E9 100%)",
          }}
        />
        <button
          onClick={() => router.push("/scan")}
          className="absolute left-[18px] top-[max(18px,env(safe-area-inset-top))] mt-11 flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white/85 backdrop-blur-md"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#11221A" strokeWidth="2.4">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
        <div className="absolute right-[18px] top-[max(18px,env(safe-area-inset-top))] mt-11">
          <BandChip band={scan.band} />
        </div>
        <div className="absolute inset-x-[22px] bottom-3.5 flex items-end justify-between">
          <div>
            <div className="font-mono text-xs tracking-wide text-fresco-muted">IDENTIFIED</div>
            <div className="font-display text-[34px] font-extrabold leading-none tracking-tight text-fresco-ink">
              {scan.produce_name}
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-[60px] font-extrabold leading-[0.8] tracking-tight" style={{ color: meta.hex }}>
              {scan.score}
            </div>
            <div className="font-mono text-[11px] text-fresco-faint">/100 SCORE</div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 px-[22px] pt-1">
        <div className="flex-1 rounded-card bg-white p-4 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F6A723" strokeWidth="2">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19" strokeLinecap="round" />
          </svg>
          <div className="mt-2 font-display text-[26px] font-extrabold leading-none text-fresco-ink">{scan.days_counter} days</div>
          <div className="mt-1 text-[13px] text-fresco-muted">on the counter</div>
        </div>
        <div className="flex-1 rounded-card bg-white p-4 shadow-sm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15B86E" strokeWidth="2">
            <rect x="6" y="2.5" width="12" height="19" rx="3" />
            <path d="M6 11h12M10 6v2M10 14v2" strokeLinecap="round" />
          </svg>
          <div className="mt-2 font-display text-[26px] font-extrabold leading-none text-fresco-ink">{scan.days_fridge} days</div>
          <div className="mt-1 text-[13px] text-fresco-muted">in the fridge</div>
        </div>
      </div>

      <div className="mx-[22px] mt-3.5 rounded-[20px] bg-white p-5 shadow-sm">
        <div className="text-[16px] font-medium leading-relaxed text-fresco-inkSoft">{scan.verdict}</div>
        {scan.flagged && (
          <div className="mt-3.5 flex flex-wrap gap-2">
            <div
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-bold"
              style={{ background: meta.bg, color: meta.text }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.hex }} />
              FLAGGED · {scan.flagged}
            </div>
          </div>
        )}
        <div className="mt-3 flex items-center gap-2 border-t border-fresco-ink/[0.07] pt-3 font-mono text-[11px] text-fresco-faint">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A988E" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
          </svg>
          {scan.confidence}% CONFIDENCE · SURFACE READ ONLY
        </div>
      </div>

      <div className="px-[22px] pb-9 pt-4">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || saveMutation.isSuccess}
          className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-fresco-green py-4 text-base font-bold text-white shadow-[0_8px_22px_rgba(15,138,79,0.32)] disabled:opacity-80"
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M5 7h14l-1.2 12.5a2 2 0 01-2 1.8H8.2a2 2 0 01-2-1.8L5 7z" />
            <path d="M8.5 7V5.5a3.5 3.5 0 017 0V7" strokeLinecap="round" />
          </svg>
          {saveMutation.isSuccess ? "Saved to Pantry" : saveMutation.isPending ? "Saving…" : "Save to Pantry"}
        </button>
        <div className="mt-3 flex gap-3">
          <Link
            href="/cook"
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-fresco-ink/10 bg-white py-3.5 text-[15px] font-bold text-fresco-ink"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0F8A4F" strokeWidth="2">
              <path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z" />
              <path d="M5 19c3-7 7-9 11-10" strokeLinecap="round" />
            </svg>
            Recipes
          </Link>
          <button
            onClick={() => setReminderSet(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-fresco-ink/10 bg-white py-3.5 text-[15px] font-bold text-fresco-ink"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#0F8A4F" strokeWidth="2">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 1.5M9 2.5h6" strokeLinecap="round" />
            </svg>
            {reminderSet ? "Reminder set" : "Remind"}
          </button>
        </div>
      </div>
    </div>
  );
}
