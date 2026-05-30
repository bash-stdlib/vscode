import * as vscode from "vscode";

export async function fetchDocumentation(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch documentation from ${url}: ${response.statusText} (${response.status})`);
    }
    return await response.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Bash STDLIB: ${message}`);
    throw error;
  }
}

export function getDocumentationUrls(language: string): { normal: string, testing: string } {
  return {
    normal: `https://bash-stdlib.readthedocs.io/${language}/latest/reference/src/REFERENCE_COMPLETE.html`,
    testing: `https://bash-stdlib.readthedocs.io/${language}/latest/reference_testing/src/testing/REFERENCE_COMPLETE.html`
  };
}
