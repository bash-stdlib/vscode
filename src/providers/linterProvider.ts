import * as vscode from "vscode";
import {
  CONFIG_LINTER_ENABLED,
  CONFIG_LINTER_EXECUTABLE_PATH,
  CONFIG_LINTER_INTERVAL,
  LINTER_SOURCE,
} from "@/constants";
import { runLinter } from "@/shell/linter";

export class LinterProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private timeouts: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection(LINTER_SOURCE);
  }

  public activate(subscriptions: vscode.Disposable[]) {
    vscode.workspace.onDidChangeConfiguration(
      (e) => {
        if (
          e.affectsConfiguration(CONFIG_LINTER_ENABLED) ||
          e.affectsConfiguration(CONFIG_LINTER_EXECUTABLE_PATH) ||
          e.affectsConfiguration(CONFIG_LINTER_INTERVAL)
        ) {
          vscode.workspace.textDocuments.forEach(this.doLint, this);
        }
      },
      this,
      subscriptions,
    );

    vscode.workspace.onDidOpenTextDocument(this.doLint, this, subscriptions);
    vscode.workspace.onDidChangeTextDocument(
      (e) => this.doLint(e.document),
      this,
      subscriptions,
    );
    vscode.workspace.onDidCloseTextDocument(
      (textDocument) => {
        this.diagnosticCollection.delete(textDocument.uri);
        this.clearTimer(textDocument.uri.toString());
      },
      null,
      subscriptions,
    );

    // Lint all open shell files on activation
    vscode.workspace.textDocuments.forEach(this.doLint, this);
  }

  public dispose() {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
    this.timeouts.forEach((t) => clearTimeout(t));
    this.timeouts.clear();
  }

  private doLint(textDocument: vscode.TextDocument) {
    if (textDocument.languageId !== "shellscript") {
      return;
    }

    const config = vscode.workspace.getConfiguration();
    const enabled = config.get<boolean>(CONFIG_LINTER_ENABLED, false);
    if (!enabled) {
      this.diagnosticCollection.delete(textDocument.uri);
      return;
    }

    const interval = config.get<number>(CONFIG_LINTER_INTERVAL, 1000);
    const uriString = textDocument.uri.toString();

    this.clearTimer(uriString);

    const timeout = setTimeout(async () => {
      const executablePath = config.get<string>(CONFIG_LINTER_EXECUTABLE_PATH, "");
      if (!executablePath) {
        return;
      }

      const diagnostics = await runLinter(executablePath, textDocument.uri.fsPath);
      this.diagnosticCollection.set(textDocument.uri, diagnostics);
    }, interval);

    this.timeouts.set(uriString, timeout);
  }

  private clearTimer(uriString: string) {
    const existingTimeout = this.timeouts.get(uriString);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.timeouts.delete(uriString);
    }
  }
}
