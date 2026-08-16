import type { AppConfig } from "../config/env";

export class TelegramApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "TelegramApiError";
    this.status = status;
  }
}

const MAX_MESSAGE_LENGTH = 4000;

function splitIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  const lines = text.split("\n");
  let current = "";

  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > maxLength) {
      if (current) {
        chunks.push(current);
      }
      current = line;
    } else {
      current = candidate;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function sendSingleMessage(config: AppConfig, text: string): Promise<void> {
  const url = `https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: config.telegramChatId,
        text,
        disable_web_page_preview: true,
      }),
    });
  } catch (err) {
    throw new TelegramApiError(`No se pudo conectar con Telegram: ${(err as Error).message}`);
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new TelegramApiError(
      `Telegram respondió con error ${response.status}: ${bodyText.slice(0, 300)}`,
      response.status
    );
  }
}

/** Envía el texto a Telegram, dividiéndolo en varios mensajes si excede el límite de 4096 caracteres. */
export async function sendReport(config: AppConfig, text: string): Promise<void> {
  const chunks = splitIntoChunks(text, MAX_MESSAGE_LENGTH);
  for (const chunk of chunks) {
    await sendSingleMessage(config, chunk);
  }
}
