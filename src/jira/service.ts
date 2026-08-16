import { adfToPlainText } from "../adf";
import type { AppConfig } from "../config/env";
import { searchIssues } from "./client";
import type { JiraIssue } from "./types";

export interface ReportIssue {
  key: string;
  summary: string;
  statusName: string;
  updated: string;
  url: string;
}

export interface BlockedIssue extends ReportIssue {
  reason: string;
}

export interface CategorizedIssues {
  pending: ReportIssue[];
  inProgress: ReportIssue[];
  recentlyUpdated: ReportIssue[];
  blocked: BlockedIssue[];
}

const BASE_FIELDS = ["summary", "status", "updated"];
const BLOCKED_FIELDS = [...BASE_FIELDS, "comment"];

function toReportIssue(issue: JiraIssue, baseUrl: string): ReportIssue {
  return {
    key: issue.key,
    summary: issue.fields.summary,
    statusName: issue.fields.status.name,
    updated: issue.fields.updated,
    url: `${baseUrl}/browse/${issue.key}`,
  };
}

function lastCommentText(issue: JiraIssue): string {
  const comments = issue.fields.comment?.comments ?? [];
  if (comments.length === 0) {
    return "(sin comentario)";
  }
  const text = adfToPlainText(comments[comments.length - 1].body);
  return text || "(sin comentario)";
}

/**
 * Trae las tareas asignadas al usuario autenticado y las agrupa por categoría.
 * Las categorías no son excluyentes: una tarea puede estar "en progreso" y
 * "bloqueada" y "actualizada recientemente" a la vez.
 */
export async function getMyIssuesReport(config: AppConfig): Promise<CategorizedIssues> {
  const mainJql = "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC";
  const blockedJql =
    "assignee = currentUser() AND flagged is not EMPTY AND resolution = Unresolved ORDER BY updated DESC";

  const [mainIssues, blockedIssues] = await Promise.all([
    searchIssues(config, mainJql, BASE_FIELDS),
    searchIssues(config, blockedJql, BLOCKED_FIELDS),
  ]);

  const recentThresholdMs = Date.now() - config.jiraRecentHours * 60 * 60 * 1000;

  const pending: ReportIssue[] = [];
  const inProgress: ReportIssue[] = [];
  const recentlyUpdated: ReportIssue[] = [];

  for (const issue of mainIssues) {
    const reportIssue = toReportIssue(issue, config.jiraBaseUrl);
    const categoryKey = issue.fields.status.statusCategory?.key;

    if (categoryKey === "new") {
      pending.push(reportIssue);
    } else if (categoryKey === "indeterminate") {
      inProgress.push(reportIssue);
    }

    if (new Date(issue.fields.updated).getTime() >= recentThresholdMs) {
      recentlyUpdated.push(reportIssue);
    }
  }

  const blocked: BlockedIssue[] = blockedIssues.map((issue) => ({
    ...toReportIssue(issue, config.jiraBaseUrl),
    reason: lastCommentText(issue),
  }));

  return { pending, inProgress, recentlyUpdated, blocked };
}
