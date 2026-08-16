export interface JiraStatusCategory {
  key: string; // "new" | "indeterminate" | "done"
  name: string;
}

export interface JiraStatus {
  name: string;
  statusCategory: JiraStatusCategory;
}

export interface AdfNode {
  type: string;
  text?: string;
  content?: AdfNode[];
}

export interface AdfDocument {
  type: string;
  content?: AdfNode[];
}

export interface JiraComment {
  id: string;
  created: string;
  body?: AdfDocument;
}

export interface JiraIssueFields {
  summary: string;
  status: JiraStatus;
  updated: string;
  comment?: {
    comments: JiraComment[];
  };
}

export interface JiraIssue {
  key: string;
  fields: JiraIssueFields;
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
}
