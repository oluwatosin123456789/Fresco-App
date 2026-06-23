import type { Band } from "./api";

export const BAND_META: Record<
  Band,
  { label: string; hex: string; bg: string; text: string }
> = {
  fresh: { label: "Fresh", hex: "#15B86E", bg: "#E6F6EC", text: "#0F8A4F" },
  eat_soon: { label: "Eat soon", hex: "#F6A723", bg: "#FDF0DA", text: "#9A6A00" },
  use_now: { label: "Use now", hex: "#FB4E3D", bg: "#FEE6E1", text: "#C7321F" },
};

export function bandFromScore(score: number): Band {
  if (score >= 67) return "fresh";
  if (score >= 34) return "eat_soon";
  return "use_now";
}
