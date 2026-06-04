"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { ConnectionStatus, LiveDisplay } from "@/hooks/useRaspWebSocket";
import type { RaspFrameMessage } from "@/types/rasp-frame";
import {
  frameLooksLikeJpeg,
  frameToDataUrl,
  getDeviceLabel,
} from "@/lib/rasp-frame";

type RaspStreamViewerProps = {
  live: LiveDisplay | null;
  frames: RaspFrameMessage[];
  status: ConnectionStatus;
  wsUrl: string;
  totalReceived: number;
  receivedFps: number;
  lastError: string | null;
  onSyncHistory: () => void;
};

export function RaspStreamViewer({
  live,
  frames,
  status,
  wsUrl,
  totalReceived,
  receivedFps,
  lastError,
  onSyncHistory,
}: RaspStreamViewerProps) {
  const [liveFollow, setLiveFollow] = useState(true);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [fitContain, setFitContain] = useState(true);
  const viewportRef = useRef<HTMLDivElement>(null);

  const total = frames.length;
  const displayIndex = liveFollow
    ? Math.max(0, total - 1)
    : Math.min(historyIndex, Math.max(0, total - 1));

  const current = liveFollow ? null : frames[displayIndex];

  const imageUrl = useMemo(() => {
    if (liveFollow) return live?.dataUrl ?? "";
    if (!current) return "";
    return frameToDataUrl(current);
  }, [liveFollow, live?.dataUrl, live?.version, current, displayIndex]);

  const deviceLabel = liveFollow
    ? live?.deviceName ?? "—"
    : current
      ? getDeviceLabel(current)
      : "—";

  const statusMeta = useMemo(() => {
    const map = {
      connecting: {
        label: "Conectando",
        dot: "bg-amber-400 animate-pulse",
        ring: "ring-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
      },
      connected: {
        label: "Conectado",
        dot: "bg-emerald-500",
        ring: "ring-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
      },
      disconnected: {
        label: "Reconectando",
        dot: "bg-red-500 animate-pulse",
        ring: "ring-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200",
      },
    } as const;
    return map[status];
  }, [status]);

  useEffect(() => {
    if (liveFollow && total > 0) {
      setHistoryIndex(total - 1);
    }
  }, [total, liveFollow]);

  const stepHistory = useCallback(
    (delta: number) => {
      onSyncHistory();
      if (total === 0) return;
      setLiveFollow(false);
      setHistoryIndex((i) => {
        const next = i + delta;
        return Math.max(0, Math.min(total - 1, next));
      });
    },
    [total, onSyncHistory],
  );

  const goLive = useCallback(() => {
    setLiveFollow(true);
    setHistoryIndex(Math.max(0, total - 1));
  }, [total]);

  const toggleFullscreen = useCallback(async () => {
    const el = viewportRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      await el.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "ArrowLeft") {
        e.preventDefault();
        stepHistory(-1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        stepHistory(1);
      } else if (e.code === "KeyL") {
        e.preventDefault();
        goLive();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepHistory, goLive]);

  const onControlsKeyDown = (e: KeyboardEvent) => {
    if (e.key === " ") e.preventDefault();
  };

  const hasStream = liveFollow ? !!live?.dataUrl : total > 0;

  if (!hasStream && total === 0) {
    return (
      <div className="flex flex-col gap-8">
        <PageHeader
          statusMeta={statusMeta}
          wsUrl={wsUrl}
          receivedFps={0}
          totalReceived={0}
          lastError={lastError}
        />

        <div className="flex min-h-[min(60vh,520px)] flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-zinc-300 bg-white/70 px-6 py-14 text-center shadow-sm dark:border-zinc-700 dark:bg-zinc-900/50">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
            <CameraIcon className="size-8" />
          </div>
          <div className="max-w-md space-y-2">
            <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
              Aguardando frames da Raspberry
            </p>
            <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
              O frontend escuta o relay WebSocket. Suba o pipeline no Host e
              confirme que a URL abaixo está correta.
            </p>
          </div>
          <SetupSteps wsUrl={wsUrl} status={status} />
        </div>
      </div>
    );
  }

  const progress = total > 1 ? ((displayIndex + 1) / total) * 100 : 100;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <PageHeader
        statusMeta={statusMeta}
        wsUrl={wsUrl}
        receivedFps={receivedFps}
        totalReceived={totalReceived}
        lastError={lastError}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-8">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-950 shadow-xl dark:border-zinc-800">
          <div
            ref={viewportRef}
            className="group relative flex aspect-video w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,#1a1a2e_0%,#0a0a0f_70%)]"
          >
            {!imageUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-9 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-400" />
              </div>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl || undefined}
              alt={`Frame de ${deviceLabel}`}
              decoding="sync"
              fetchPriority="high"
              className={`max-h-full max-w-full ${
                fitContain ? "object-contain" : "object-cover"
              } ${imageUrl ? "opacity-100" : "opacity-0"}`}
              draggable={false}
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/55 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />

            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2 sm:left-4 sm:top-4">
              <span className="rounded-md bg-black/60 px-2.5 py-1 font-mono text-xs text-white backdrop-blur-sm">
                {deviceLabel}
              </span>
              {liveFollow && status === "connected" && (
                <span className="flex items-center gap-1.5 rounded-md bg-red-600/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" />
                  Ao vivo
                </span>
              )}
            </div>

            <div className="absolute bottom-3 left-3 font-mono text-xs text-white/90 sm:bottom-4 sm:left-4">
              {liveFollow ? (
                <span>Último frame · buffer {total}</span>
              ) : (
                <span>
                  Histórico{" "}
                  <span className="text-white">{displayIndex + 1}</span>
                  <span className="text-white/50"> / {total}</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="absolute right-3 top-3 rounded-lg bg-black/50 p-2 text-white/80 opacity-0 backdrop-blur-sm transition hover:bg-black/70 hover:text-white group-hover:opacity-100 focus:opacity-100 sm:right-4 sm:top-4"
              aria-label="Tela cheia"
            >
              <ExpandIcon />
            </button>
          </div>

          <div
            className="border-t border-zinc-800 bg-zinc-900 px-3 py-3 sm:px-4 sm:py-4"
            onKeyDown={onControlsKeyDown}
          >
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#c51a4a] to-emerald-500 transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => stepHistory(-1)}
                disabled={total < 2}
                className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-40"
              >
                ← Anterior
              </button>

              <button
                type="button"
                onClick={goLive}
                disabled={liveFollow && status === "connected"}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-default disabled:opacity-50"
              >
                {liveFollow ? "Ao vivo" : "Voltar ao vivo"}
              </button>

              <button
                type="button"
                onClick={() => stepHistory(1)}
                disabled={total < 2}
                className="rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-40"
              >
                Próximo →
              </button>

              <button
                type="button"
                onClick={() => setFitContain((f) => !f)}
                className="ml-auto rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:border-zinc-500"
              >
                {fitContain ? "Ajustar" : "Preencher"}
              </button>
            </div>

            {total >= 2 && (
              <input
                type="range"
                min={0}
                max={total - 1}
                value={displayIndex}
                onChange={(e) => {
                  setLiveFollow(false);
                  setHistoryIndex(Number(e.target.value));
                }}
                className="mt-3 h-1.5 w-full cursor-pointer accent-[#c51a4a]"
                aria-label="Posição no buffer de frames"
              />
            )}
          </div>
        </section>

        <aside className="flex min-w-0 flex-col gap-4">
          {(liveFollow ? live : current) && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80 sm:p-5">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Dispositivo
              </h2>
              <dl className="grid gap-2 text-sm">
                <MetaRow
                  label="Nome"
                  value={
                    liveFollow
                      ? (live?.deviceName ?? "—")
                      : (current?.origin_device_name ?? "—")
                  }
                />
                <MetaRow
                  label="MAC"
                  value={
                    liveFollow
                      ? (live?.mac ?? "—")
                      : (current?.ori_mac_adress ?? "—")
                  }
                />
                <MetaRow
                  label="Formato"
                  value={
                    liveFollow || (current && frameLooksLikeJpeg(current))
                      ? "JPEG"
                      : "Desconhecido"
                  }
                />
              </dl>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400 sm:p-5">
            <p className="font-medium text-zinc-800 dark:text-zinc-200">Fluxo</p>
            <p className="mt-2">
              Raspberry → Rosbridge → <code className="rounded bg-zinc-200/80 px-1 py-0.5 font-mono text-[10px] dark:bg-zinc-800">process_img.py</code>{" "}
              → <code className="rounded bg-zinc-200/80 px-1 py-0.5 font-mono text-[10px] dark:bg-zinc-800">server.py</code>{" "}
              → este painel.
            </p>
            <p className="mt-2 text-zinc-500">
              Atalhos: <kbd className="rounded border border-zinc-300 px-1 dark:border-zinc-600">←</kbd>{" "}
              <kbd className="rounded border border-zinc-300 px-1 dark:border-zinc-600">→</kbd> histórico ·{" "}
              <kbd className="rounded border border-zinc-300 px-1 dark:border-zinc-600">L</kbd> ao vivo
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PageHeader({
  statusMeta,
  wsUrl,
  receivedFps,
  totalReceived,
  lastError,
}: {
  statusMeta: {
    label: string;
    dot: string;
    ring: string;
  };
  wsUrl: string;
  receivedFps: number;
  totalReceived: number;
  lastError: string | null;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-5 dark:border-zinc-800 sm:pb-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#c51a4a] to-[#8b1035] text-base font-bold text-white shadow-md shadow-[#c51a4a]/20 sm:size-12 sm:rounded-2xl sm:text-lg"
            aria-hidden
          >
            π
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl lg:text-3xl dark:text-zinc-50">
              Stream Raspberry Pi
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Visualização em tempo real dos frames segmentados (YOLO).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${statusMeta.ring}`}
          >
            <span className={`size-2 rounded-full ${statusMeta.dot}`} />
            {statusMeta.label}
          </span>
          <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 font-mono text-[11px] text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
            {receivedFps > 0 ? `${receivedFps} fps` : "— fps"} · {totalReceived}{" "}
            frames
          </span>
        </div>
      </div>

      <p className="break-all rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/80 dark:text-zinc-400">
        {wsUrl}
      </p>
      {lastError && totalReceived === 0 && statusMeta.label === "Conectado" && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          Conectado, mas sem frames válidos: {lastError}. Confirme que{" "}
          <code className="font-mono">process_img.py</code> está enviando para a
          mesma porta.
        </p>
      )}
    </header>
  );
}

function SetupSteps({
  wsUrl,
  status,
}: {
  wsUrl: string;
  status: ConnectionStatus;
}) {
  const steps = [
    "No Host: python Host/Python/server.py",
    "No Host: python Host/Python/process_img.py",
    "Raspberry publicando via Rosbridge (porta em general_config.yml)",
    `Frontend conectado em ${wsUrl}`,
  ];

  return (
    <ol className="w-full max-w-lg space-y-2 text-left text-sm text-zinc-600 dark:text-zinc-400">
      {steps.map((step, i) => (
        <li
          key={step}
          className={`flex gap-3 rounded-lg border px-3 py-2.5 ${
            i === 3 && status === "connected"
              ? "border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/40"
              : "border-zinc-200 bg-zinc-50/80 dark:border-zinc-700 dark:bg-zinc-800/40"
          }`}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            {i + 1}
          </span>
          <span className="min-w-0 break-words pt-0.5 font-mono text-xs leading-relaxed sm:text-sm">
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-950/80">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-mono text-xs text-zinc-800 sm:text-sm dark:text-zinc-100">
        {value}
      </dd>
    </div>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="size-4"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
      />
    </svg>
  );
}
