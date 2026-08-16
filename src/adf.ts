import type { AdfDocument, AdfNode } from "./jira/types";

function extractFromNode(node: AdfNode): string {
  if (node.type === "text" && node.text) {
    return node.text;
  }
  if (!node.content) {
    return "";
  }
  return node.content.map(extractFromNode).join("");
}

/** Extrae texto plano de un documento en formato Atlassian Document Format (ADF). */
export function adfToPlainText(doc: AdfDocument | undefined): string {
  if (!doc?.content) {
    return "";
  }
  return doc.content
    .map(extractFromNode)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
