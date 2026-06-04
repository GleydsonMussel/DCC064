"use client";

import { useEffect, useRef, useState } from "react";
import { base64ToObjectUrl } from "@/lib/frame-image-url";
import type { RaspFrameMessage } from "@/types/rasp-frame";

/** Object URL do JPEG do frame, sem recriar o `<img>` a cada render. */
export function useFrameImageUrl(frame: RaspFrameMessage | undefined): string {
  const [url, setUrl] = useState("");
  const urlRef = useRef("");

  useEffect(() => {
    const revoke = (u: string) => {
      if (u) URL.revokeObjectURL(u);
    };

    if (!frame?.image) {
      revoke(urlRef.current);
      urlRef.current = "";
      setUrl("");
      return;
    }

    let objectUrl = "";
    try {
      objectUrl = base64ToObjectUrl(frame.image);
    } catch {
      return;
    }

    revoke(urlRef.current);
    urlRef.current = objectUrl;
    setUrl(objectUrl);

    return () => {
      revoke(urlRef.current);
      urlRef.current = "";
    };
  }, [frame?.image]);

  return url;
}
