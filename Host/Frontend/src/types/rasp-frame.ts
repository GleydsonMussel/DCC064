/** Mensagem de um frame enviado pela Raspberry Pi (contrato atual do backend). */
export type RaspFrameMessage = {
  /** JPEG codificado em base64 (sem prefixo `data:`). */
  image: string;
  ori_mac_adress: string;
  origin_device_name: string;
};

/** Payload que o frontend pode receber: um frame ou um lote/sequência. */
export type RaspFramesPayload = RaspFrameMessage | RaspFrameMessage[];
