"use client";

import { RaspStreamViewer } from "@/components/RaspStreamViewer";
import { useRaspWebSocket } from "@/hooks/useRaspWebSocket";

const WS_URL = "ws://localhost:9000";

export default function Home() {
  const { frames, status } = useRaspWebSocket(WS_URL);

  const statusLabel =
    status === "connected"
      ? "conectado"
      : status === "connecting"
        ? "conectando…"
        : "reconectando…";

  return (
    <div className="relative min-h-full flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-950">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(197,26,74,0.12),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"
        aria-hidden
      />

      <main className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:py-14">
        <RaspStreamViewer
          frames={frames}
          sourceLabel={`${WS_URL} · ${statusLabel}`}
        />
      </main>
    </div>
  );
}
