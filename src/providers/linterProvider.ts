import * as vscode from "vscode";
import {
  CONFIG_LINTER_ENABLED,
  CONFIG_LINTER_EXECUTABLE_PATH,
  CONFIG_LINTER_EXTRA_FUNCTIONS,
  CONFIG_LINTER_EXTRA_NAMESPACES,
  CONFIG_LINTER_IGNORED_CODES,
  CONFIG_LINTER_INTERVAL,
  CONFIG_LINTER_PYTHON_PATH,
  LINTER_SOURCE,
} from "@/constants";
import { runLinter } from "@/shell/linter";

export class LinterProvider {
  protected diagnosticCollection: vscode.DiagnosticCollection;
  protected timeouts: Map<string, NodeJS.Timeout> = new Map();
  protected batchTimeout: NodeJS.Timeout | undefined;

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection(LINTER_SOURCE);
  }

  public activate(subscriptions: vscode.Disposable[]) {
    vscode.workspace.onDidChangeConfiguration(
      (e) => {
        if (
          e.affectsConfiguration(CONFIG_LINTER_ENABLED) ||
          e.affectsConfiguration(CONFIG_LINTER_EXECUTABLE_PATH) ||
          e.affectsConfiguration(CONFIG_LINTER_PYTHON_PATH) ||
          e.affectsConfiguration(CONFIG_LINTER_INTERVAL) ||
          e.affectsConfiguration(CONFIG_LINTER_EXTRA_NAMESPACES) ||
          e.affectsConfiguration(CONFIG_LINTER_EXTRA_FUNCTIONS) ||
          e.affectsConfiguration(CONFIG_LINTER_IGNORED_CODES)
        ) {
          this.doBatchLint();
        }
      },
      this,
      subscriptions,
    );

    vscode.workspace.onDidOpenTextDocument(
      (doc) => this.doLint(doc),
      this,
      subscriptions,
    );
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

    this.doBatchLint();
  }

  public dispose() {
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
    this.timeouts.forEach((t) => clearTimeout(t));
    this.timeouts.clear();
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
  }

  protected doBatchLint() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    const config = vscode.workspace.getConfiguration();
    const enabled = config.get<boolean>(CONFIG_LINTER_ENABLED, false);
    if (!enabled) {
      this.diagnosticCollection.clear();
      return;
    }

    const interval = config.get<number>(CONFIG_LINTER_INTERVAL, 500);
    this.batchTimeout = setTimeout(async () => {
      const shellDocs = vscode.workspace.textDocuments.filter(
        (doc) => doc.languageId === "shellscript" && doc.uri.scheme === "file",
      );
      if (shellDocs.length === 0) {
        return;
      }

      const filePaths = shellDocs.map((doc) => doc.uri.fsPath);
      await this.runLinterForFiles(filePaths);
    }, interval);
  }

  protected doLint(textDocument: vscode.TextDocument) {
    if (
      textDocument.languageId !== "shellscript" ||
      textDocument.uri.scheme !== "file"
    ) {
      return;
    }

    const config = vscode.workspace.getConfiguration();
    const enabled = config.get<boolean>(CONFIG_LINTER_ENABLED, false);
    if (!enabled) {
      this.diagnosticCollection.delete(textDocument.uri);
      return;
    }

    const interval = config.get<number>(CONFIG_LINTER_INTERVAL, 500);
    const uriString = textDocument.uri.toString();

    this.clearTimer(uriString);

    const timeout = setTimeout(async () => {
      await this.runLinterForFiles([textDocument.uri.fsPath]);
    }, interval);

    this.timeouts.set(uriString, timeout);
  }

  protected async runLinterForFiles(filePaths: string[]) {
    const config = vscode.workspace.getConfiguration();
    const executablePath = config.get<string>(
      CONFIG_LINTER_EXECUTABLE_PATH,
      "",
    );
    const pythonPath = config.get<string>(CONFIG_LINTER_PYTHON_PATH, "python3");

    if (!executablePath) {
      return;
    }

    const extraNamespaces = config.get<string[]>(
      CONFIG_LINTER_EXTRA_NAMESPACES,
      [],
    );
    const extraFunctions = config.get<string[]>(
      CONFIG_LINTER_EXTRA_FUNCTIONS,
      [],
    );
    const ignoredCodes = config.get<string[]>(CONFIG_LINTER_IGNORED_CODES, []);
    const results = await runLinter(
      executablePath,
      filePaths,
      pythonPath,
      extraNamespaces,
      extraFunctions,
      ignoredCodes,
    );

    results.forEach((result) => {
      const uri = vscode.Uri.file(result.filePath);
      this.diagnosticCollection.set(uri, result.diagnostics);
    });
  }

  protected clearTimer(uriString: string) {
    const existingTimeout = this.timeouts.get(uriString);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.timeouts.delete(uriString);
    }
  }
}
