"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  {
    href: "/scan",
    label: "Scan",
    icon: (active: boolean) => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="6" width="18" height="14" rx="3" />
        <circle cx="12" cy="13" r="3.3" />
        <path d="M8 6l1.4-2.5h5.2L16 6" />
      </svg>
    ),
  },
  {
    href: "/pantry",
    label: "Pantry",
    icon: () => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 8h16l-1.3 11.2a2 2 0 01-2 1.8H7.3a2 2 0 01-2-1.8L4 8z" />
        <path d="M8.5 8V6a3.5 3.5 0 017 0v2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/cook",
    label: "Cook",
    icon: () => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z" />
        <path d="M5 19c3-7 7-9 11-10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/saved",
    label: "Saved",
    icon: () => (
      <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="12" width="4" height="8" rx="1" />
        <rect x="10" y="7" width="4" height="13" rx="1" />
        <rect x="16" y="9" width="4" height="11" rx="1" />
      </svg>
    ),
  },
];

const HIDDEN_PREFIXES = ["/scan", "/trader"];

export function TabBar() {
  const pathname = usePathname();
  if (HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))) return null;

  return (
    <nav className="flex shrink-0 items-center justify-around border-t border-fresco-ink/[0.07] bg-white px-2 pb-7 pt-2.5">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-col items-center gap-1"
            style={{ color: active ? "#0F8A4F" : "#9AA8A0" }}
          >
            {tab.icon(active)}
            <span className="text-[11px]" style={{ fontWeight: active ? 700 : 600 }}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
