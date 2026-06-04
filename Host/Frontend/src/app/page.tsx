"use client";

import { useMemo, useState } from "react";
import { RaspStreamViewer } from "@/components/RaspStreamViewer";
import { useRaspWebSocket } from "@/hooks/useRaspWebSocket";

const DEFAULT_WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:9000";

export default function Home() {
  const [wsUrlInput, setWsUrlInput] = useState(DEFAULT_WS_URL);
  const wsUrl = useMemo(() => wsUrlInput.trim() || DEFAULT_WS_URL, [wsUrlInput]);

  const {
    live,
    frames,
    status,
    totalReceived,
    receivedFps,
    lastError,
    syncHistory,
  } = useRaspWebSocket(wsUrl);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-100 dark:bg-zinc-950">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(197,26,74,0.1),transparent)]"
        aria-hidden
      />

      <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <section className="mb-6 rounded-xl border border-zinc-200 bg-white/90 p-4 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
          <label
            htmlFor="ws-url"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-500"
          >
            WebSocket do relay (server.py)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="ws-url"
              type="text"
              value={wsUrlInput}
              onChange={(e) => setWsUrlInput(e.target.value)}
              placeholder="ws://192.168.0.10:9000"
              className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-800 outline-none ring-[#c51a4a]/30 focus:border-[#c51a4a] focus:ring-2 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setWsUrlInput(DEFAULT_WS_URL)}
              className="shrink-0 rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Restaurar padrão
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Use o IP do Host se o navegador não estiver na mesma máquina do{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">server.py</code>.
            Variável opcional:{" "}
            <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">NEXT_PUBLIC_WS_URL</code>.
          </p>
        </section>

        <RaspStreamViewer
          live={live}
          frames={frames}
          status={status}
          wsUrl={wsUrl}
          totalReceived={totalReceived}
          receivedFps={receivedFps}
          lastError={lastError}
          onSyncHistory={syncHistory}
        />
      </main>
    </div>
  );
}
