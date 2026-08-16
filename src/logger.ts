import fs from "node:fs";
import path from "node:path";

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "app.log");

type LogLevel = "INFO" | "WARN" | "ERROR";

function write(level: LogLevel, message: string): void {
  const line = `[${new Date().toISOString()}] [${level}] ${message}`;

  if (level === "ERROR") {
    console.error(line);
  } else {
    console.log(line);
  }

  try {
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.appendFileSync(LOG_FILE, line + "\n");
  } catch {
    // Si no se puede escribir el archivo de log no debe interrumpir la ejecución.
  }
}

export const logger = {
  info: (message: string): void => write("INFO", message),
  warn: (message: string): void => write("WARN", message),
  error: (message: string): void => write("ERROR", message),
};
