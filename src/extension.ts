import * as vscode from "vscode";
import { createCompletionProvider } from "@/providers/completionProvider";
import { createHoverProvider } from "@/providers/hoverProvider";
import { LinterProvider } from "@/providers/linterProvider";
import { loadFunctions } from "@/shell/functions";
import { getAlphanumericTriggers } from "@/triggers";

export async function activate(context: vscode.ExtensionContext) {
  const functions = await loadFunctions();

  const linterProvider = new LinterProvider();
  linterProvider.activate(context.subscriptions);

  const completionProvider = vscode.languages.registerCompletionItemProvider(
    "shellscript",
    createCompletionProvider(functions),
    ".",
    "@",
    ...getAlphanumericTriggers(),
  );

  const hoverProvider = vscode.languages.registerHoverProvider(
    "shellscript",
    createHoverProvider(functions),
  );

  context.subscriptions.push(completionProvider, hoverProvider, linterProvider);
}

export function deactivate() {}
