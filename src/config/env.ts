import "dotenv/config";

export interface AppConfig {
  jiraBaseUrl: string;
  jiraEmail: string;
  jiraApiToken: string;
  jiraRecentHours: number;
  telegramBotToken: string;
  telegramChatId: string;
}

const REQUIRED_VARS = [
  "JIRA_BASE_URL",
  "JIRA_EMAIL",
  "JIRA_API_TOKEN",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
] as const;

export function loadConfig(): AppConfig {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missing.join(", ")}. Revisa tu archivo .env (ver .env.example).`
    );
  }

  const jiraRecentHoursRaw = process.env.JIRA_RECENT_HOURS;
  const jiraRecentHours = jiraRecentHoursRaw ? Number(jiraRecentHoursRaw) : 24;

  if (!Number.isFinite(jiraRecentHours) || jiraRecentHours <= 0) {
    throw new Error("JIRA_RECENT_HOURS debe ser un número positivo.");
  }

  return {
    jiraBaseUrl: process.env.JIRA_BASE_URL!.replace(/\/+$/, ""),
    jiraEmail: process.env.JIRA_EMAIL!,
    jiraApiToken: process.env.JIRA_API_TOKEN!,
    jiraRecentHours,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
    telegramChatId: process.env.TELEGRAM_CHAT_ID!,
  };
}
