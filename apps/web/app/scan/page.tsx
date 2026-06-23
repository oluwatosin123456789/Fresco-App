"use client";

import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { postScan } from "@/lib/api";

const STEPS = ["Identify", "Grade freshness", "Predict shelf life", "Recommend actions"];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const [mode, setMode] = useState<"single" | "basket">("single");
  const [stepIndex, setStepIndex] = useState(0);

  const mutation = useMutation({
    mutationFn: async (blob: Blob) => {
      const [scan] = await Promise.all([postScan(blob), sleep(1500)]);
      return scan;
    },
    onSuccess: (scan) => {
      router.push(`/scan/${scan.id}`);
    },
  });

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          setCameraReady(true);
        }
      })
      .catch(() => setCameraError(true));

    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    if (!mutation.isPending) {
      setStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 420);
    return () => clearInterval(interval);
  }, [mutation.isPending]);

  function captureFromVideo() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1080;
    canvas.height = video.videoHeight || 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) mutation.mutate(blob);
    }, "image/jpeg", 0.9);
  }

  function handleShutter() {
    if (mode === "basket") {
      router.push("/trader");
      return;
    }
    if (cameraReady && !cameraError) {
      captureFromVideo();
    } else {
      fileInputRef.current?.click();
    }
  }

  function handleFileChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) mutation.mutate(file);
    e.target.value = "";
  }

  const analyzing = mutation.isPending;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#0B1410] text-white">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 h-full w-full object-cover"
        style={{ opacity: cameraReady && !cameraError ? 1 : 0 }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(11,20,16,0.55) 0%, rgba(11,20,16,0.05) 24%, rgba(11,20,16,0.05) 58%, rgba(11,20,16,0.9) 100%)",
        }}
      />

      {!analyzing ? (
        <>
          <div className="absolute left-0 right-0 top-[max(24px,env(safe-area-inset-top))] flex justify-center pt-6">
            <div className="flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-[18px] py-2.5 text-sm font-semibold backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-fresco-fresh shadow-[0_0_8px_#15B86E]" />
              Fill the circle with one item
            </div>
          </div>

          <div className="absolute left-1/2 top-1/2 h-[252px] w-[252px] -translate-x-1/2 -translate-y-[54%]">
            <div className="absolute inset-0 rounded-full border-2 border-white/55" style={{ boxShadow: "0 0 0 9999px rgba(11,20,16,0.32)" }} />
            {(["tl", "tr", "bl", "br"] as const).map((corner) => (
              <span
                key={corner}
                className="absolute h-[34px] w-[34px] border-fresco-fresh"
                style={{
                  top: corner.startsWith("t") ? -2 : undefined,
                  bottom: corner.startsWith("b") ? -2 : undefined,
                  left: corner.endsWith("l") ? -2 : undefined,
                  right: corner.endsWith("r") ? -2 : undefined,
                  borderTopWidth: corner.startsWith("t") ? 3 : 0,
                  borderBottomWidth: corner.startsWith("b") ? 3 : 0,
                  borderLeftWidth: corner.endsWith("l") ? 3 : 0,
                  borderRightWidth: corner.endsWith("r") ? 3 : 0,
                  borderTopLeftRadius: corner === "tl" ? 12 : undefined,
                  borderTopRightRadius: corner === "tr" ? 12 : undefined,
                  borderBottomLeftRadius: corner === "bl" ? 12 : undefined,
                  borderBottomRightRadius: corner === "br" ? 12 : undefined,
                }}
              />
            ))}
            <div className="absolute -bottom-[30px] left-1/2 -translate-x-1/2 whitespace-nowrap font-mono text-[11px] text-white/75">
              AUTO-DETECTING…
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-[max(46px,env(safe-area-inset-bottom))] flex flex-col items-center gap-5">
            <div className="flex rounded-full border border-white/20 bg-white/15 p-1 backdrop-blur-md">
              <button
                className="rounded-full px-5 py-1.5 text-[13px] font-bold"
                style={{ background: mode === "single" ? "#fff" : "transparent", color: mode === "single" ? "#11221A" : "rgba(255,255,255,0.8)" }}
                onClick={() => setMode("single")}
              >
                Single
              </button>
              <button
                className="rounded-full px-5 py-1.5 text-[13px] font-semibold"
                style={{ background: mode === "basket" ? "#fff" : "transparent", color: mode === "basket" ? "#11221A" : "rgba(255,255,255,0.8)" }}
                onClick={() => setMode("basket")}
              >
                Basket
              </button>
            </div>

            <div className="flex w-[280px] items-center justify-between">
              <Link
                href="/pantry"
                className="flex h-12 w-12 items-center justify-center rounded-[13px] border border-white/25 bg-white/15"
                aria-label="Go to Pantry"
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                  <path d="M4 8h16l-1.3 11.2a2 2 0 01-2 1.8H7.3a2 2 0 01-2-1.8L4 8z" />
                  <path d="M8.5 8V6a3.5 3.5 0 017 0v2" strokeLinecap="round" />
                </svg>
              </Link>
              <button
                onClick={handleShutter}
                className="flex h-[78px] w-[78px] items-center justify-center rounded-full border-4 border-white/85 p-[5px] animate-fresco-pulse"
                aria-label="Capture"
              >
                <span className="h-full w-full rounded-full bg-fresco-fresh shadow-[0_6px_20px_rgba(21,184,110,0.5)]" />
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 w-12 items-center justify-center rounded-[13px] border border-white/25 bg-white/15"
                aria-label="Upload a photo instead"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
                  <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col">
          <div className="absolute left-1/2 top-1/2 h-[262px] w-[262px] -translate-x-1/2 -translate-y-[58%] overflow-hidden rounded-full border-2 border-fresco-fresh/70 shadow-[0_0_40px_rgba(21,184,110,0.25)]">
            <div className="absolute left-0 right-0 h-[3px] animate-fresco-scan bg-gradient-to-r from-transparent via-fresco-fresh to-transparent shadow-[0_0_16px_3px_rgba(21,184,110,0.7)]" />
          </div>
          <div className="absolute left-0 right-0 top-[62px] animate-fresco-blink text-center font-mono text-xs tracking-[2px] text-fresco-freshMint">
            READING FRESHNESS…
          </div>
          <div className="absolute inset-x-6 bottom-16 rounded-[22px] border border-white/15 bg-white/10 p-5 backdrop-blur-lg">
            {STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-3 py-1.5" style={{ opacity: i <= stepIndex ? 1 : 0.5 }}>
                {i < stepIndex ? (
                  <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-fresco-fresh">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : i === stepIndex ? (
                  <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-fresco-fresh">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                      <path d="M4 12l5 5L20 6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                ) : (
                  <span className="h-[26px] w-[26px] rounded-full border-2 border-white/40" />
                )}
                <span className="flex-1 text-[15px] font-semibold">{step}</span>
                {i === stepIndex && <span className="font-mono text-[13px] text-fresco-soon">scoring…</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {mutation.isError && !analyzing && (
        <div className="absolute inset-x-6 top-24 rounded-2xl bg-fresco-now/90 p-3 text-center text-sm font-semibold">
          Couldn&apos;t read that photo — try again.
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChosen}
      />
    </div>
  );
}
