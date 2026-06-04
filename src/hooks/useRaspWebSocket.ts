"use client";

import { useEffect, useRef, useState } from "react";
import { isRaspFrameMessage } from "@/lib/rasp-frame";
import type { RaspFrameMessage } from "@/types/rasp-frame";

const MAX_FRAMES = 150;
const RECONNECT_DELAY_MS = 2000;

type ConnectionStatus = "connecting" | "connected" | "disconnected";

export function useRaspWebSocket(url: string = "ws://localhost:9000") {
  const [frames, setFrames] = useState<RaspFrameMessage[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  useEffect(() => {
    unmountedRef.current = false;

    function connect() {
      if (unmountedRef.current) return;

      setStatus("connecting");
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmountedRef.current) return;
        setStatus("connected");
      };

      ws.onmessage = (event: MessageEvent) => {
        if (unmountedRef.current) return;
        try {
          const parsed: unknown = JSON.parse(event.data as string);
          if (!isRaspFrameMessage(parsed)) return;
          setFrames((prev) => {
            const next = [...prev, parsed];
            return next.length > MAX_FRAMES ? next.slice(next.length - MAX_FRAMES) : next;
          });
        } catch {
          // mensagem malformada — ignorar silenciosamente
        }
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

  return { frames, status };
}
