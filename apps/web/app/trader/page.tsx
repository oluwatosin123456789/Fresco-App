"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { postTraderBatch, type TraderBatch } from "@/lib/api";

export default function TraderPage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: (files: File[]) => postTraderBatch(files),
  });

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length > 0) mutation.mutate(files);
    e.target.value = "";
  }

  function exportQcLog(batch: TraderBatch) {
    const blob = new Blob([JSON.stringify(batch, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fresco-qc-log-batch-${batch.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const batch = mutation.data;

  return (
    <div className="min-h-[100dvh] bg-fresco-sheet">
      <div className="rounded-b-[26px] bg-fresco-green px-[22px] pb-[22px] pt-[max(60px,calc(env(safe-area-inset-top)+24px))]">
        <div className="flex items-center justify-between">
          <div className="font-display text-[30px] font-extrabold tracking-tight text-white">Batch grade</div>
          <span className="rounded-full bg-fresco-freshMint px-3 py-1.5 font-mono text-[11px] font-bold text-fresco-green">
            PRO
          </span>
        </div>
        <div className="mt-1.5 text-sm text-white/88">
          {batch ? `Crate · ${batch.item_count} items graded` : "Upload photos of a crate to grade it"}
        </div>
      </div>

      <div className="px-[22px] pb-10 pt-4.5">
        {!batch && !mutation.isPending && (
          <div className="rounded-card bg-white p-6 text-center shadow-sm">
            <div className="text-[15px] font-semibold text-fresco-ink">No batch graded yet</div>
            <div className="mt-1 text-sm text-fresco-muted">
              Select several produce photos at once to grade the whole crate.
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="mt-4 rounded-2xl bg-fresco-green px-5 py-2.5 text-sm font-bold text-white"
            >
              Upload crate photos
            </button>
          </div>
        )}

        {mutation.isPending && (
          <div className="rounded-card bg-white p-6 text-center font-mono text-sm text-fresco-faint shadow-sm">
            Grading batch…
          </div>
        )}

        {batch && (
          <>
            <div className="rounded-[22px] bg-white p-5 shadow-sm">
              <div className="font-mono text-[11px] tracking-wide text-fresco-faint">QUALITY DISTRIBUTION</div>
              <div className="mt-3.5 flex h-6 overflow-hidden rounded-lg">
                <div style={{ width: `${batch.distribution.fresh_pct}%`, background: "#15B86E" }} />
                <div style={{ width: `${batch.distribution.soon_pct}%`, background: "#F6A723" }} />
                <div style={{ width: `${batch.distribution.now_pct}%`, background: "#FB4E3D" }} />
              </div>
              <div className="mt-4 flex justify-between">
                <DistStat pct={batch.distribution.fresh_pct} count={batch.distribution.fresh_count} label="Fresh" color="#15B86E" />
                <DistStat pct={batch.distribution.soon_pct} count={batch.distribution.soon_count} label="Eat-soon" color="#C8851A" />
                <DistStat pct={batch.distribution.now_pct} count={batch.distribution.now_count} label="Use-now" color="#FB4E3D" />
              </div>
            </div>

            <div className="mt-3.5 rounded-[22px] bg-white p-5 shadow-sm">
              <div className="text-base font-bold text-fresco-ink">Quality-based pricing</div>
              {batch.pricing.map((tier) => (
                <div key={tier.band} className="mt-3.5 flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: tier.band === "fresh" ? "#15B86E" : tier.band === "eat_soon" ? "#F6A723" : "#FB4E3D" }}
                  />
                  <div className="flex-1 text-sm text-fresco-inkSoft">{tier.label}</div>
                  <div
                    className="font-display text-base font-extrabold"
                    style={{ color: tier.band === "fresh" ? "#11221A" : tier.band === "eat_soon" ? "#C8851A" : "#FB4E3D" }}
                  >
                    {tier.adjustment_label}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3.5 flex gap-3">
              <button
                onClick={() => exportQcLog(batch)}
                className="flex flex-1 flex-col gap-2 rounded-card bg-fresco-ink p-4 text-left text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7FE3AB" strokeWidth="2">
                  <path d="M9 12l2 2 4-4M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V5a2 2 0 012-2z" />
                </svg>
                <div className="text-sm font-bold">Export QC log</div>
                <div className="font-mono text-[10px] text-[#9DB0A6]">PHOTO-BACKED · TIMESTAMPED</div>
              </button>
              <div className="flex flex-1 flex-col gap-2 rounded-card border-[1.5px] border-dashed border-fresco-fresh bg-fresco-fresh/10 p-4">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F8A4F" strokeWidth="2">
                  <circle cx="12" cy="9" r="6" />
                  <path d="M9 14l-1.5 7L12 19l4.5 2L15 14" strokeLinejoin="round" />
                </svg>
                <div className="text-sm font-bold text-fresco-green">Freshness cert</div>
                <div className="font-mono text-[10px] text-[#3F7A57]">VERIFIED · SHAREABLE</div>
              </div>
            </div>

            <button
              onClick={() => inputRef.current?.click()}
              className="mt-3.5 w-full rounded-2xl border border-fresco-ink/10 bg-white py-3 text-sm font-bold text-fresco-ink"
            >
              Grade another batch
            </button>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  );
}

function DistStat({ pct, count, label, color }: { pct: number; count: number; label: string; color: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-extrabold leading-none" style={{ color }}>
        {pct}%
      </div>
      <div className="mt-0.5 text-xs text-fresco-muted">
        {label} · {count}
      </div>
    </div>
  );
}
