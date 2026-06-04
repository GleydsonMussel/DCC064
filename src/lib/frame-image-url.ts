/** Converte JPEG em base64 (com ou sem prefixo data:) em object URL para exibição. */
export function base64ToObjectUrl(base64: string): string {
  const raw = base64.trim().replace(/^data:image\/\w+;base64,/, "");
  const binary = atob(raw);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return URL.createObjectURL(new Blob([bytes], { type: "image/jpeg" }));
}
