"use client";

import { useEffect, useRef, useState } from "react";
import { parseRaspFrame } from "@/lib/rasp-frame";
import type { RaspFrameMessage } from "@/types/rasp-frame";

const MAX_FRAMES = 120;
const RECONNECT_DELAY_MS = 2000;
const FPS_WINDOW_MS = 2000;

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

async function messageToText(data: MessageEvent["data"]): Promise<string> {
  if (typeof data === "string") return data;
  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }
  if (ArrayBuffer.isView(data)) {
    return new TextDecoder().decode(data);
  }
  if (data instanceof Blob) {
    return data.text();
  }
  return String(data);
}

export function useRaspWebSocket(url: string = "ws://localhost:9000") {
  const [frames, setFrames] = useState<RaspFrameMessage[]>([]);
  const [latestFrame, setLatestFrame] = useState<RaspFrameMessage | null>(null);
  const [frameVersion, setFrameVersion] = useState(0);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [totalReceived, setTotalReceived] = useState(0);
  const [receivedFps, setReceivedFps] = useState(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  const arrivalTimesRef = useRef<number[]>([]);

  useEffect(() => {
    unmountedRef.current = false;

    function recordArrival() {
      const now = Date.now();
      const times = arrivalTimesRef.current;
      times.push(now);
      const cutoff = now - FPS_WINDOW_MS;
      while (times.length > 0 && times[0] < cutoff) times.shift();
      setReceivedFps(
        times.length <= 1
          ? times.length
          : Math.round(
              ((times.length - 1) / (times[times.length - 1] - times[0])) *
                1000,
            ) || times.length,
      );
    }

    function pushFrame(frame: RaspFrameMessage) {
      recordArrival();
      setLastError(null);
      setTotalReceived((n) => n + 1);
      setFrameVersion((v) => v + 1);
      setLatestFrame(frame);
      setFrames((prev) => {
        const next = [...prev, frame];
        return next.length > MAX_FRAMES
          ? next.slice(next.length - MAX_FRAMES)
          : next;
      });
    }

    async function handleMessage(raw: MessageEvent["data"]) {
      try {
        const text = await messageToText(raw);
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
        setLastError("Mensagem JSON sem campo image válido");
      } catch {
        setLastError("Mensagem WebSocket inválida (não é JSON)");
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
        setFrames([]);
        setLatestFrame(null);
        setFrameVersion(0);
        setTotalReceived(0);
        setLastError(null);
        arrivalTimesRef.current = [];
        setReceivedFps(0);
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

      ws.onerror = () => {
        ws.close();
      };
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

  return {
    frames,
    latestFrame,
    frameVersion,
    status,
    totalReceived,
    receivedFps,
    lastError,
  };
}
