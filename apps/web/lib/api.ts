import { getDeviceId } from "./device";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type Band = "fresh" | "eat_soon" | "use_now";

export type Scan = {
  id: number;
  produce_name: string;
  produce_type: string;
  score: number;
  band: Band;
  confidence: number;
  flagged: string | null;
  verdict: string;
  days_counter: number;
  days_fridge: number;
  image_url: string;
  created_at: string;
};

export type PantryItem = {
  id: number;
  scan_id: number | null;
  name: string;
  produce_type: string;
  score: number;
  band: Band;
  days_counter: number;
  days_fridge: number;
  storage: "counter" | "fridge";
  status: "active" | "used" | "wasted";
  image_url: string | null;
  created_at: string;
  use_by: string;
  days_remaining: number;
};

export type Recipe = {
  id: number;
  title: string;
  subtitle: string;
  minutes: number;
  tags: string[];
  uses_expiring: number;
  image_url: string | null;
  placeholder: string;
  badge: string | null;
};

export type WasteStats = {
  kg_saved: number;
  money_saved: number;
  co2e_avoided_kg: number;
  streak_days: number;
  week: { day: string; value: number; highlight: boolean }[];
  week_saved_label: string;
};

export type TraderItem = {
  id: number;
  produce_name: string;
  produce_type: string;
  score: number;
  band: Band;
  confidence: number;
};

export type TraderBatch = {
  id: number;
  item_count: number;
  created_at: string;
  distribution: {
    fresh_pct: number;
    soon_pct: number;
    now_pct: number;
    fresh_count: number;
    soon_count: number;
    now_count: number;
  };
  items: TraderItem[];
  pricing: { band: Band; label: string; adjustment_label: string }[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      "X-Device-Id": getDeviceId(),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export function postScan(file: Blob): Promise<Scan> {
  const form = new FormData();
  form.append("image", file, "scan.jpg");
  return request<Scan>("/scans", { method: "POST", body: form });
}

export function getScan(id: number): Promise<Scan> {
  return request<Scan>(`/scans/${id}`);
}

export function getPantry(): Promise<PantryItem[]> {
  return request<PantryItem[]>("/pantry");
}

export function postPantryItem(
  scanId: number,
  storage: "counter" | "fridge" = "fridge"
): Promise<PantryItem> {
  return request<PantryItem>("/pantry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scan_id: scanId, storage }),
  });
}

export function patchPantryItem(
  id: number,
  status: "used" | "wasted"
): Promise<PantryItem> {
  return request<PantryItem>(`/pantry/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function deletePantryItem(id: number): Promise<void> {
  return request<void>(`/pantry/${id}`, { method: "DELETE" });
}

export function getRecipes(): Promise<Recipe[]> {
  return request<Recipe[]>("/recipes");
}

export function getWasteStats(): Promise<WasteStats> {
  return request<WasteStats>("/stats/waste-saved");
}

export function postTraderBatch(files: Blob[]): Promise<TraderBatch> {
  const form = new FormData();
  files.forEach((f, i) => form.append("images", f, `item-${i}.jpg`));
  return request<TraderBatch>("/trader/batch", { method: "POST", body: form });
}

export function imageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}
