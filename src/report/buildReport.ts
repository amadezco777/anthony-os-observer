import type { BlockedIssue, CategorizedIssues, ReportIssue } from "../jira/service";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

function formatIssueLine(issue: ReportIssue): string {
  return `- ${issue.key}: ${issue.summary} (${issue.statusName}, act. ${formatDate(issue.updated)})`;
}

function formatBlockedLine(issue: BlockedIssue): string {
  return `- ${issue.key}: ${issue.summary} — motivo: "${issue.reason}"`;
}

function formatSection(title: string, lines: string[]): string {
  if (lines.length === 0) {
    return `${title} (0)\nSin tareas en esta categoría.`;
  }
  return `${title} (${lines.length})\n${lines.join("\n")}`;
}

/** Arma el texto plano del resumen diario a partir de las tareas ya categorizadas. */
export function buildReport(data: CategorizedIssues, recentHours: number): string {
  const today = new Date().toISOString().slice(0, 10);

  const sections = [
    `📋 Resumen diario de Jira - ${today}`,
    formatSection("🕓 Pendientes", data.pending.map(formatIssueLine)),
    formatSection("🚧 En progreso", data.inProgress.map(formatIssueLine)),
    formatSection("⛔ Bloqueadas", data.blocked.map(formatBlockedLine)),
    formatSection(`🔄 Actualizadas en las últimas ${recentHours}h`, data.recentlyUpdated.map(formatIssueLine)),
  ];

  return sections.join("\n\n");
}
