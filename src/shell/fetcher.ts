import * as vscode from "vscode";
import { BASH_STDLIB_PREFIX, FETCH_ERROR_MESSAGE } from "@/shell/constants";

export async function fetchDocumentation(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`${FETCH_ERROR_MESSAGE} from ${url}: ${response.statusText} (${response.status})`);
    }
    return await response.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`${BASH_STDLIB_PREFIX} ${message}`);
    throw error;
  }
}
