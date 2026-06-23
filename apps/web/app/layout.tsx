import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { TabBar } from "@/components/TabBar";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-bricolage",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-hanken",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Fresco — see freshness before you spend it",
  description:
    "Point your camera at any fruit or vegetable. Fresco reads its freshness, predicts how many days it has left, and tells you what to do before it spoils.",
  manifest: "/manifest.json",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#0F8A4F",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bricolage.variable} ${hanken.variable} ${spaceMono.variable}`}>
      <body>
        <Providers>
          <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-fresco-sheet">
            <main className="flex-1 overflow-y-auto">{children}</main>
            <TabBar />
          </div>
        </Providers>
      </body>
    </html>
  );
}
