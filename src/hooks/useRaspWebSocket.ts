"use client";

import { useEffect, useRef, useState } from "react";
import { isRaspFrameMessage } from "@/lib/rasp-frame";
import type { RaspFrameMessage } from "@/types/rasp-frame";

const MAX_FRAMES = 120;
const RECONNECT_DELAY_MS = 2000;
const FPS_WINDOW_MS = 2000;

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useRaspWebSocket(url: string = "ws://localhost:9000") {
  const [frames, setFrames] = useState<RaspFrameMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const [totalReceived, setTotalReceived] = useState(0);
  const [receivedFps, setReceivedFps] = useState(0);

  const wsRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);
  const arrivalTimesRef = useRef<number[]>([]);

  const latestFrame =
    frames.length > 0 ? frames[frames.length - 1] : undefined;

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
      setTotalReceived((n) => n + 1);
      setFrames((prev) => {
        const next = [...prev, frame];
        return next.length > MAX_FRAMES
          ? next.slice(next.length - MAX_FRAMES)
          : next;
      });
    }

    function handleMessage(raw: string) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isRaspFrameMessage(parsed)) {
          pushFrame(parsed);
          return;
        }
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (isRaspFrameMessage(item)) pushFrame(item);
          }
        }
      } catch {
        // mensagem malformada
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
        setTotalReceived(0);
        arrivalTimesRef.current = [];
        setReceivedFps(0);
      };

      ws.onmessage = (event: MessageEvent) => {
        if (unmountedRef.current) return;
        handleMessage(event.data as string);
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
    status,
    totalReceived,
    receivedFps,
  };
}
