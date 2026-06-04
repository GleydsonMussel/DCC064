import type { RaspFrameMessage, RaspFramesPayload } from "@/types/rasp-frame";

const JPEG_MAGIC = "/9j/";

export function normalizeFramesPayload(payload: RaspFramesPayload): RaspFrameMessage[] {
  return Array.isArray(payload) ? payload : [payload];
}

export function isRaspFrameMessage(value: unknown): value is RaspFrameMessage {
  if (!value || typeof value !== "object") return false;
  const frame = value as Record<string, unknown>;
  return (
    typeof frame.image === "string" &&
    typeof frame.ori_mac_adress === "string" &&
    typeof frame.origin_device_name === "string"
  );
}

/** Converte o campo `image` em URL exibível no `<img>`. */
export function frameToDataUrl(frame: RaspFrameMessage): string {
  const raw = frame.image.trim();
  if (raw.startsWith("data:")) return raw;
  return `data:image/jpeg;base64,${raw}`;
}

export function frameLooksLikeJpeg(frame: RaspFrameMessage): boolean {
  return frame.image.startsWith(JPEG_MAGIC) || frame.image.includes(JPEG_MAGIC);
}

export function getDeviceLabel(frame: RaspFrameMessage): string {
  return frame.origin_device_name || "Dispositivo desconhecido";
}
