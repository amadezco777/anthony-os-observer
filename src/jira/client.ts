import type { AppConfig } from "../config/env";
import type { JiraIssue, JiraSearchResponse } from "./types";

export class JiraApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "JiraApiError";
    this.status = status;
  }
}

export async function searchIssues(
  config: AppConfig,
  jql: string,
  fields: string[]
): Promise<JiraIssue[]> {
  const url = `${config.jiraBaseUrl}/rest/api/3/search/jql`;
  const auth = Buffer.from(`${config.jiraEmail}:${config.jiraApiToken}`).toString("base64");

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        jql,
        fields,
        maxResults: 100,
      }),
    });
  } catch (err) {
    throw new JiraApiError(`No se pudo conectar con Jira: ${(err as Error).message}`);
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new JiraApiError(
      `Jira respondió con error ${response.status}: ${bodyText.slice(0, 300)}`,
      response.status
    );
  }

  const data = (await response.json()) as JiraSearchResponse;
  return data.issues ?? [];
}
