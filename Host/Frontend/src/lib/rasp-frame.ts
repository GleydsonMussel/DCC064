import type { RaspFrameMessage, RaspFramesPayload } from "@/types/rasp-frame";

const JPEG_MAGIC = "/9j/";

export function normalizeFramesPayload(payload: RaspFramesPayload): RaspFrameMessage[] {
  return Array.isArray(payload) ? payload : [payload];
}

/** Aceita variações de nomes de campo vindas do backend. */
export function parseRaspFrame(value: unknown): RaspFrameMessage | null {
  if (!value || typeof value !== "object") return null;
  const frame = value as Record<string, unknown>;

  const image = frame.image;
  if (typeof image !== "string" || image.length < 32) return null;

  const mac =
    frame.ori_mac_adress ??
    frame.origin_mac_adress ??
    frame.mac_adress ??
    "";
  const name =
    frame.origin_device_name ??
    frame.device_name ??
    "dispositivo";

  return {
    image: image.trim(),
    ori_mac_adress: String(mac),
    origin_device_name: String(name),
  };
}

export function isRaspFrameMessage(value: unknown): value is RaspFrameMessage {
  return parseRaspFrame(value) !== null;
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
