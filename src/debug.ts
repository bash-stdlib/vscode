import * as vscode from "vscode";

export function debug(message: string, data?: unknown): void {
  const config = vscode.workspace.getConfiguration("bash-stdlib");
  const debugEnabled = config.get<boolean>("debug", false);

  if (debugEnabled) {
    if (data !== undefined) {
      debug.logger(`[stdlib-completion] ${message}`, data);
    } else {
      debug.logger(`[stdlib-completion] ${message}`);
    }
  }
}

export namespace debug {
  export let logger = console.log;
}
