"use client";

import { useEffect, useRef, useState } from "react";
import { frameToDataUrl, parseRaspFrame } from "@/lib/rasp-frame";
import type { RaspFrameMessage } from "@/types/rasp-frame";

const MAX_HISTORY = 40;
const RECONNECT_DELAY_MS = 2000;
const FPS_UPDATE_MS = 1000;
const HISTORY_SYNC_EVERY = 4;

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export type LiveDisplay = {
  dataUrl: string;
  version: number;
  deviceName: string;
  mac: string;
};

function messageToText(data: MessageEvent["data"]): string {
  if (typeof data === "string") return data;
  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(
      data.buffer,
      data.byteOffset,
      data.byteLength,
    );
  }
  if (data instanceof Blob) {
    throw new Error("blob-async");
  }
  return String(data);
}

export function useRaspWebSocket(url: string = "ws://localhost:9000") {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [live, setLive] = useState<LiveDisplay | null>(null);
  const [frames, setFrames] = useState<RaspFrameMessage[]>([]);
  const [totalReceived, setTotalReceived] = useState(0);
  const [receivedFps, setReceivedFps] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const historyRef = useRef<RaspFrameMessage[]>([]);
  const arrivalTimesRef = useRef<number[]>([]);
  const totalRef = useRef(0);
  const versionRef = useRef(0);
  const pendingLiveRef = useRef<LiveDisplay | null>(null);

  const recordArrival = () => {
    const now = performance.now();
    const times = arrivalTimesRef.current;
    times.push(now);
    const cutoff = now - 2000;
    while (times.length > 0 && times[0] < cutoff) times.shift();
  };

  const pushFrame = (frame: RaspFrameMessage) => {
    recordArrival();
    setLastError(null);
    totalRef.current += 1;
    versionRef.current += 1;

    pendingLiveRef.current = {
      dataUrl: frameToDataUrl(frame),
      version: versionRef.current,
      deviceName: frame.origin_device_name,
      mac: frame.ori_mac_adress,
    };

    const hist = historyRef.current;
    hist.push(frame);
    if (hist.length > MAX_HISTORY) hist.shift();

    setLive(pendingLiveRef.current);
    setTotalReceived(totalRef.current);

    if (totalRef.current % HISTORY_SYNC_EVERY === 0) {
      setFrames(hist.slice());
    }
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      const times = arrivalTimesRef.current;
      if (times.length <= 1) {
        setReceivedFps(times.length);
        return;
      }
      const span = times[times.length - 1] - times[0];
      setReceivedFps(
        span > 0
          ? Math.round(((times.length - 1) / span) * 1000)
          : times.length,
      );
    }, FPS_UPDATE_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    unmountedRef.current = false;

    async function handleMessage(raw: MessageEvent["data"]) {
      try {
        let text: string;
        try {
          text = messageToText(raw);
        } catch {
          if (raw instanceof Blob) {
            text = await raw.text();
          } else {
            throw new Error("formato não suportado");
          }
        }

        const parsed: unknown = JSON.parse(text);
        const single = parseRaspFrame(parsed);
        if (single) {
          pushFrame(single);
          return;
        }
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const frame = parseRaspFrame(item);
            if (frame) pushFrame(frame);
          }
          return;
        }
        setLastError("JSON sem campo image válido");
      } catch {
        setLastError("Mensagem WebSocket inválida");
      }
    }

    function connect() {
      if (unmountedRef.current) return;

      setStatus("connecting");
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) return;
        setStatus("connected");
        setLive(null);
        setFrames([]);
        setTotalReceived(0);
        setLastError(null);
        pendingLiveRef.current = null;
        historyRef.current = [];
        arrivalTimesRef.current = [];
        totalRef.current = 0;
        versionRef.current = 0;
      };

      ws.onmessage = (event: MessageEvent) => {
        if (unmountedRef.current) return;
        void handleMessage(event.data);
      };

      ws.onclose = () => {
        if (unmountedRef.current) return;
        setStatus("disconnected");
        timeoutRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      unmountedRef.current = true;
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [url]);

  const syncHistory = () => setFrames(historyRef.current.slice());

  return {
    live,
    frames,
    status,
    totalReceived,
    receivedFps,
    lastError,
    syncHistory,
  };
}
