"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { RaspFrameMessage } from "@/types/rasp-frame";
import {
  frameLooksLikeJpeg,
  frameToDataUrl,
  getDeviceLabel,
} from "@/lib/rasp-frame";

const DEFAULT_FPS = 10;
const MIN_FPS = 1;
const MAX_FPS = 30;

type RaspStreamViewerProps = {
  frames: RaspFrameMessage[];
  sourceLabel?: string;
};

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden>
      <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
    </svg>
  );
}

function IconChevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5" aria-hidden>
      {direction === "left" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
      )}
    </svg>
  );
}

function IconExpand() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50/80 px-3 py-2.5 dark:bg-zinc-900/80">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 truncate font-mono text-sm text-zinc-800 dark:text-zinc-100">
        {value}
      </dd>
    </div>
  );
}

export function RaspStreamViewer({
  frames,
  sourceLabel = "Dados locais",
}: RaspStreamViewerProps) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(DEFAULT_FPS);
  const [fitContain, setFitContain] = useState(true);
  const [imgLoaded, setImgLoaded] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);

  const total = frames.length;
  const current = frames[index];
  const canPlay = total > 1;
  const progress = total > 1 ? ((index + 1) / total) * 100 : 100;

  const dataUrl = useMemo(
    () => (current ? frameToDataUrl(current) : ""),
    [current],
  );

  const status = playing
    ? "reproduzindo"
    : canPlay
      ? "pausado"
      : "preview";

  const goTo = useCallback(
    (next: number) => {
      if (total === 0) return;
      setImgLoaded(false);
      setIndex(((next % total) + total) % total);
    },
    [total],
  );

  const step = useCallback(
    (delta: number) => goTo(index + delta),
    [goTo, index],
  );

  const togglePlay = useCallback(() => {
    if (!canPlay) return;
    setPlaying((p) => !p);
  }, [canPlay]);

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
    if (playing) {
      setImgLoaded(false);
      setIndex(frames.length > 0 ? frames.length - 1 : 0);
    } else {
      setIndex(0);
      setImgLoaded(false);
    }
  }, [frames]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing || !canPlay) return;
    const intervalMs = 1000 / fps;
    const id = window.setInterval(() => {
      setImgLoaded(false);
      setIndex((i) => (i + 1) % total);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [playing, canPlay, fps, total]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        step(1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, step]);

  const onControlsKeyDown = (e: KeyboardEvent) => {
    if (e.key === " ") e.preventDefault();
  };

  if (total === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-8 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
        <span className="flex size-14 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-7" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3" />
          </svg>
        </span>
        <p className="text-lg font-medium text-zinc-700 dark:text-zinc-200">
          Nenhum frame disponível
        </p>
        <p className="max-w-sm text-sm text-zinc-500">
          Quando a Raspberry enviar mensagens com o campo{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">image</code>
          , eles aparecerão aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200/80 pb-6 dark:border-zinc-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c51a4a] to-[#8b1035] text-lg font-bold text-white shadow-lg shadow-[#c51a4a]/25"
              aria-hidden
            >
              π
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
                Monitor de captura
              </h1>
              <p className="mt-1 max-w-lg text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Visualização em tempo quase real dos frames JPEG enviados pelo
                dispositivo.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={status} />
            <span className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 font-mono text-[11px] text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              {sourceLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <StatPill label="Dispositivo" value={getDeviceLabel(current)} />
          <StatPill label="Frames" value={String(total)} highlight={canPlay} />
          <StatPill
            label="Sequência"
            value={canPlay ? "Pronta para reproduzir" : "Frame único (preview)"}
          />
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-200/90 bg-zinc-950 shadow-xl shadow-zinc-900/10 ring-1 ring-black/5 dark:border-zinc-800">
          <div
            ref={viewportRef}
            className="group relative flex aspect-video w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,_#1a1a2e_0%,_#0a0a0f_70%)]"
          >
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-8 animate-spin rounded-full border-2 border-zinc-600 border-t-emerald-400" />
              </div>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={dataUrl}
              src={dataUrl}
              alt={`Frame ${index + 1} de ${getDeviceLabel(current)}`}
              onLoad={() => setImgLoaded(true)}
              className={`max-h-full max-w-full transition-opacity duration-150 ${
                fitContain ? "object-contain" : "object-cover"
              } ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              draggable={false}
            />

            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/50 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />

            <div className="absolute left-4 top-4 flex items-center gap-2">
              <span className="rounded-md bg-black/55 px-2 py-1 font-mono text-xs text-white/90 backdrop-blur-sm">
                {getDeviceLabel(current)}
              </span>
              {playing && (
                <span className="flex items-center gap-1.5 rounded-md bg-red-500/90 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                  <span className="size-1.5 animate-pulse rounded-full bg-white" />
                  Live
                </span>
              )}
            </div>

            <div className="absolute bottom-4 left-4 font-mono text-xs text-white/80">
              Frame <span className="text-white">{index + 1}</span>
              <span className="text-white/50"> / {total}</span>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="absolute right-4 top-4 rounded-lg bg-black/50 p-2 text-white/80 opacity-0 backdrop-blur-sm transition hover:bg-black/70 hover:text-white group-hover:opacity-100 focus:opacity-100"
              aria-label="Tela cheia"
            >
              <IconExpand />
            </button>
          </div>

          <div
            className="border-t border-zinc-800 bg-zinc-900/95 px-4 py-4"
            onKeyDown={onControlsKeyDown}
          >
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <ControlButton
                onClick={() => step(-1)}
                disabled={!canPlay}
                label="Frame anterior"
              >
                <IconChevron direction="left" />
              </ControlButton>

              <button
                type="button"
                onClick={togglePlay}
                disabled={!canPlay}
                className="flex h-10 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {playing ? <IconPause /> : <IconPlay />}
                {playing ? "Pausar" : "Reproduzir"}
              </button>

              <ControlButton
                onClick={() => step(1)}
                disabled={!canPlay}
                label="Próximo frame"
              >
                <IconChevron direction="right" />
              </ControlButton>

              <div className="hidden h-8 w-px bg-zinc-700 sm:block" />

              <label className="flex flex-1 items-center gap-2 text-xs text-zinc-400 sm:min-w-[140px] sm:flex-none">
                <span className="shrink-0 font-medium">FPS</span>
                <input
                  type="range"
                  min={MIN_FPS}
                  max={MAX_FPS}
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  disabled={!canPlay}
                  className="h-1.5 flex-1 cursor-pointer accent-emerald-500 disabled:opacity-40"
                />
                <span className="w-7 shrink-0 text-right font-mono tabular-nums text-zinc-300">
                  {fps}
                </span>
              </label>

              <button
                type="button"
                onClick={() => setFitContain((f) => !f)}
                className="ml-auto rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition hover:border-zinc-500 hover:text-white"
              >
                {fitContain ? "Ajustar" : "Preencher"}
              </button>
            </div>

            {canPlay ? (
              <input
                type="range"
                min={0}
                max={total - 1}
                value={index}
                onChange={(e) => {
                  setPlaying(false);
                  setImgLoaded(false);
                  setIndex(Number(e.target.value));
                }}
                className="mt-3 h-1.5 w-full cursor-pointer accent-emerald-500"
                aria-label="Posição na sequência"
              />
            ) : (
              <p className="mt-3 text-center text-xs text-zinc-500">
                Envie vários frames em sequência para habilitar reprodução.
                Atalhos:{" "}
                <kbd className="rounded border border-zinc-700 px-1">←</kbd>{" "}
                <kbd className="rounded border border-zinc-700 px-1">→</kbd>{" "}
                <kbd className="rounded border border-zinc-700 px-1">Espaço</kbd>
              </p>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Informações do dispositivo
            </h2>
            <dl className="grid gap-2">
              <MetaRow label="Nome" value={current.origin_device_name} />
              <MetaRow label="MAC de origem" value={current.ori_mac_adress} />
              <MetaRow
                label="Formato"
                value={frameLooksLikeJpeg(current) ? "JPEG (base64)" : "Desconhecido"}
              />
            </dl>
          </div>

          <div className="rounded-2xl border border-zinc-200/90 bg-gradient-to-br from-zinc-50 to-white p-5 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 dark:text-zinc-400">
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              Como funciona
            </p>
            <p className="mt-2">
              Cada mensagem da Raspberry traz um JPEG em{" "}
              <code className="rounded bg-zinc-200/80 px-1 py-0.5 font-mono text-[10px] text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                image
              </code>
              . Uma lista de mensagens forma o fluxo exibido no painel.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: "reproduzindo" | "pausado" | "preview";
}) {
  const styles = {
    reproduzindo: "bg-emerald-500/15 text-emerald-700 ring-emerald-500/30 dark:text-emerald-300",
    pausado: "bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:text-amber-300",
    preview: "bg-zinc-500/15 text-zinc-600 ring-zinc-500/30 dark:text-zinc-400",
  };
  const labels = {
    reproduzindo: "Reproduzindo",
    pausado: "Pausado",
    preview: "Preview estático",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "reproduzindo"
            ? "animate-pulse bg-emerald-500"
            : status === "pausado"
              ? "bg-amber-500"
              : "bg-zinc-400"
        }`}
      />
      {labels[status]}
    </span>
  );
}

function StatPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2 ${
        highlight
          ? "border-emerald-200/80 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/40"
          : "border-zinc-200/80 bg-white/80 dark:border-zinc-800 dark:bg-zinc-900/50"
      }`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      <p className="mt-0.5 text-sm font-medium text-zinc-800 dark:text-zinc-100">
        {value}
      </p>
    </div>
  );
}

function ControlButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-10 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
