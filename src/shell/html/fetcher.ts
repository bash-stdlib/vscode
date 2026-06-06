import * as vscode from "vscode";
import {
  MESSAGE_PREFIX,
  ERROR_FETCH_FAILED,
  URL_MOCK_OBJECT_DOC_TEMPLATE,
  URL_STANDARD_DOC_TEMPLATE,
  URL_TESTING_DOC_TEMPLATE,
} from "@/constants";

export interface DocumentationUrls {
  mockTemplates: string;
  normal: string;
  testing: string;
}

export class DocumentationFetcher {
  public getUrls(language: string): DocumentationUrls {
    return {
      mockTemplates: URL_MOCK_OBJECT_DOC_TEMPLATE.replace("{lang}", language),
      normal: URL_STANDARD_DOC_TEMPLATE.replace("{lang}", language),
      testing: URL_TESTING_DOC_TEMPLATE.replace("{lang}", language),
    };
  }

  public async fetch(url: string): Promise<string> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(
          `${ERROR_FETCH_FAILED} from ${url}: ${response.statusText} (${response.status})`,
        );
      }
      return await response.text();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`${MESSAGE_PREFIX} ${message}`);
      throw error;
    }
  }
}
