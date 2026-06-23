import type { Band } from "@/lib/api";
import { BAND_META } from "@/lib/band";

export function BandChip({ band, className = "" }: { band: Band; className?: string }) {
  const meta = BAND_META[band];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[13px] font-extrabold tracking-wide ${className}`}
      style={{ background: meta.hex, color: band === "fresh" ? "#08321B" : band === "eat_soon" ? "#3A2700" : "#fff" }}
    >
      {meta.label.toUpperCase()}
    </span>
  );
}
