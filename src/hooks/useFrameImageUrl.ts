"use client";

import { useEffect, useRef, useState } from "react";
import { base64ToObjectUrl } from "@/lib/frame-image-url";
import { frameToDataUrl } from "@/lib/rasp-frame";
import type { RaspFrameMessage } from "@/types/rasp-frame";

/**
 * Gera URL exibível para o frame. `version` força atualização a cada mensagem WS
 * (não depender só da string gigante de base64 no array de deps do React).
 */
export function useFrameImageUrl(
  frame: RaspFrameMessage | undefined,
  version: number,
): string {
  const [url, setUrl] = useState("");
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (!frame?.image || version === 0) {
      setUrl("");
      return;
    }

    try {
      const objectUrl = base64ToObjectUrl(frame.image);
      objectUrlRef.current = objectUrl;
      setUrl(objectUrl);
    } catch {
      setUrl(frameToDataUrl(frame));
    }
  }, [frame, version]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  return url;
}
