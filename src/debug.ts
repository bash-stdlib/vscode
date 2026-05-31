import * as vscode from "vscode";

export function debug(message: string, data?: unknown): void {
  const config = vscode.workspace.getConfiguration("bash-stdlib");
  const debugEnabled = config.get<boolean>("debug", false);

  if (debugEnabled) {
    if (data !== undefined) {
      console.log(`[stdlib-completion] ${message}`, data);
    } else {
      console.log(`[stdlib-completion] ${message}`);
    }
  }
}

