import { loadConfig, type AppConfig } from "./config/env";
import { getMyIssuesReport } from "./jira/service";
import { logger } from "./logger";
import { buildReport } from "./report/buildReport";
import { sendReport } from "./telegram/client";

async function main(): Promise<void> {
  logger.info("Iniciando ejecución de anthony-os-observer");

  let config: AppConfig;
  try {
    config = loadConfig();
  } catch (err) {
    logger.error(`Error de configuración: ${(err as Error).message}`);
    process.exitCode = 1;
    return;
  }

  let reportText: string;
  try {
    const issues = await getMyIssuesReport(config);
    reportText = buildReport(issues, config.jiraRecentHours);
    logger.info(
      `Jira OK — pendientes: ${issues.pending.length}, en progreso: ${issues.inProgress.length}, ` +
        `bloqueadas: ${issues.blocked.length}, recientes: ${issues.recentlyUpdated.length}`
    );
  } catch (err) {
    const message = (err as Error).message;
    logger.error(`Error consultando Jira: ${message}`);
    try {
      await sendReport(config, `⚠️ No se pudo obtener el resumen de Jira hoy.\nError: ${message}`);
      logger.info("Se notificó el error por Telegram.");
    } catch (telegramErr) {
      logger.error(`También falló el envío a Telegram: ${(telegramErr as Error).message}`);
    }
    process.exitCode = 1;
    return;
  }

  try {
    await sendReport(config, reportText);
    logger.info("Resumen enviado a Telegram correctamente.");
  } catch (err) {
    logger.error(`Error enviando a Telegram: ${(err as Error).message}`);
    process.exitCode = 1;
    return;
  }

  logger.info("Ejecución finalizada correctamente.");
}

main().catch((err) => {
  logger.error(`Error inesperado no controlado: ${(err as Error).message}`);
  process.exitCode = 1;
});
