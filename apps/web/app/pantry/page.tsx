"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPantry, patchPantryItem, type PantryItem } from "@/lib/api";
import { BAND_META } from "@/lib/band";

const URGENT_THRESHOLD_DAYS = 3;

export default function PantryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({ queryKey: ["pantry"], queryFn: getPantry });

  const resolveMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "used" | "wasted" }) =>
      patchPantryItem(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pantry"] });
      queryClient.invalidateQueries({ queryKey: ["waste-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
    },
  });

  const urgent = (items ?? []).filter((i) => i.days_remaining <= URGENT_THRESHOLD_DAYS);
  const fresh = (items ?? []).filter((i) => i.days_remaining > URGENT_THRESHOLD_DAYS);
  const expiringCount = urgent.length;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-fresco-sheet">
      <div className="flex items-start justify-between px-[22px] pb-3.5 pt-[max(60px,calc(env(safe-area-inset-top)+24px))]">
        <div>
          <div className="font-display text-[34px] font-extrabold leading-none tracking-tight text-fresco-ink">
            Pantry
          </div>
          <div className="mt-1.5 text-sm text-fresco-muted">
            {items?.length ?? 0} items
            {expiringCount > 0 && (
              <>
                {" · "}
                <span className="font-bold text-fresco-now">{expiringCount} expiring soon</span>
              </>
            )}
          </div>
        </div>
        <Link
          href="/trader"
          className="mt-1.5 flex items-center gap-1.5 rounded-full bg-fresco-ink px-3 py-2 font-mono text-[11px] font-bold text-fresco-freshMint"
          aria-label="Trader / Pro batch grading"
        >
          PRO
        </Link>
      </div>

      <div className="flex-1 px-[22px] pb-4">
        {isLoading && <div className="font-mono text-sm text-fresco-faint">Loading pantry…</div>}

        {!isLoading && (items?.length ?? 0) === 0 && (
          <div className="mt-6 rounded-card bg-white p-6 text-center shadow-sm">
            <div className="text-[15px] font-semibold text-fresco-ink">Nothing in your Pantry yet</div>
            <div className="mt-1 text-sm text-fresco-muted">Scan something to start tracking it here.</div>
            <button
              onClick={() => router.push("/scan")}
              className="mt-4 rounded-2xl bg-fresco-green px-5 py-2.5 text-sm font-bold text-white"
            >
              Scan an item
            </button>
          </div>
        )}

        {urgent.length > 0 && (
          <>
            <SectionLabel color="#FB4E3D">USE NOW · EXPIRING</SectionLabel>
            {urgent.map((item) => (
              <PantryRow
                key={item.id}
                item={item}
                onUsed={() => resolveMutation.mutate({ id: item.id, status: "used" })}
                onWasted={() => resolveMutation.mutate({ id: item.id, status: "wasted" })}
              />
            ))}
          </>
        )}

        {fresh.length > 0 && (
          <>
            <SectionLabel color="#15B86E">FRESH · PLENTY OF TIME</SectionLabel>
            {fresh.map((item) => (
              <PantryRow
                key={item.id}
                item={item}
                onUsed={() => resolveMutation.mutate({ id: item.id, status: "used" })}
                onWasted={() => resolveMutation.mutate({ id: item.id, status: "wasted" })}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="mb-2.5 mt-4 font-mono text-[11px] tracking-wide first:mt-0" style={{ color }}>
      {children}
    </div>
  );
}

function PantryRow({
  item,
  onUsed,
  onWasted,
}: {
  item: PantryItem;
  onUsed: () => void;
  onWasted: () => void;
}) {
  const meta = BAND_META[item.band];
  const daysLabel = item.days_remaining <= 0 ? "Today" : `${item.days_remaining} day${item.days_remaining === 1 ? "" : "s"}`;
  const scannedDaysAgo = Math.max(
    0,
    Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86_400_000)
  );

  return (
    <div className="mb-2.5 flex items-center gap-3.5 rounded-card bg-white p-3.5 shadow-sm">
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px]"
        style={{ background: meta.bg }}
      >
        <div className="h-6 w-6 rounded-full" style={{ background: meta.hex }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-bold text-fresco-ink">{item.name}</div>
        <div className="truncate text-[13px] text-fresco-muted">
          scanned {scannedDaysAgo === 0 ? "today" : `${scannedDaysAgo}d ago`} · score {item.score}
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-xl font-extrabold leading-none" style={{ color: meta.text }}>
          {daysLabel}
        </div>
        <div className="font-mono text-[10px] text-fresco-faint">USE-BY</div>
      </div>
      <div className="ml-1 flex shrink-0 flex-col gap-1.5">
        <button
          onClick={onUsed}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-fresco-fresh/15 text-fresco-green"
          aria-label="Mark used"
          title="Mark used"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onWasted}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-fresco-now/15 text-fresco-now"
          aria-label="Mark wasted"
          title="Mark wasted"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
