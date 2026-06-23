"use client";

import { useQuery } from "@tanstack/react-query";
import { getWasteStats } from "@/lib/api";

export default function SavedPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["waste-stats"], queryFn: getWasteStats });

  return (
    <div className="min-h-[100dvh] bg-fresco-ink text-white">
      <div className="px-[22px] pb-4 pt-[max(60px,calc(env(safe-area-inset-top)+24px))]">
        <div className="font-display text-[30px] font-extrabold leading-none tracking-tight">You saved</div>

        {isLoading || !stats ? (
          <div className="mt-6 font-mono text-sm text-fresco-faint">Loading…</div>
        ) : (
          <>
            <div
              className="mt-[18px] rounded-[26px] p-[26px] shadow-[0_14px_36px_rgba(15,138,79,0.4)]"
              style={{ background: "linear-gradient(135deg,#15B86E,#0F8A4F)" }}
            >
              <div className="font-display text-[74px] font-extrabold leading-[0.82] tracking-tight">
                {stats.kg_saved}
                <span className="text-[30px]"> kg</span>
              </div>
              <div className="mt-2.5 text-[15px] text-white/90">produce rescued from the bin</div>
              <div className="mt-[18px] flex gap-2.5">
                <div className="flex-1 rounded-2xl bg-white/[0.18] p-3">
                  <div className="font-display text-[22px] font-extrabold">
                    ₦{stats.money_saved.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-white/85">money kept</div>
                </div>
                <div className="flex-1 rounded-2xl bg-white/[0.18] p-3">
                  <div className="font-display text-[22px] font-extrabold">{stats.co2e_avoided_kg} kg</div>
                  <div className="text-[11px] text-white/85">CO₂e avoided</div>
                </div>
              </div>
            </div>

            <div className="mt-3.5 flex items-center gap-3.5 rounded-[20px] bg-fresco-card p-4">
              <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-fresco-soon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                  <path d="M12 2c1 4-2 5-2 8a4 4 0 008 0c0-1-.5-2-1-3 2 1 3 3 3 6a8 8 0 11-16 0c0-5 5-7 8-11z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-display text-xl font-extrabold">{stats.streak_days}-day fresh streak</div>
                <div className="text-[13px] text-[#9DB0A6]">Zero waste logged {stats.streak_days} days running</div>
              </div>
            </div>

            <div className="mt-3.5 rounded-[20px] bg-fresco-card p-[18px]">
              <div className="flex items-baseline justify-between">
                <div className="text-[15px] font-bold">This week</div>
                <div className="font-mono text-xs text-fresco-freshMint">{stats.week_saved_label}</div>
              </div>
              <div className="mt-4 flex h-24 items-end gap-2">
                {stats.week.map((d, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                    <div
                      className="w-full rounded-md"
                      style={{
                        height: `${Math.max(8, (d.value / Math.max(...stats.week.map((w) => w.value), 1)) * 96)}px`,
                        background: d.highlight ? "#7FE3AB" : d.value > 0 ? "#15B86E" : "#2E5641",
                      }}
                    />
                    <span className="text-[10px]" style={{ color: d.highlight ? "#7FE3AB" : "#7C9187" }}>
                      {d.day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
