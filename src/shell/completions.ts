import * as vscode from "vscode";
import { ShdocFunction } from "@/shell/shdoc";
import { createMarkdownDocumentation } from "@/shell/markdown";

export function createCompletionItem(parsedFunction: ShdocFunction, label?: string): vscode.CompletionItem {
  const completionItem = new vscode.CompletionItem(
    label || parsedFunction.name,
    vscode.CompletionItemKind.Function,
  );

  completionItem.detail = getFunctionSignature(parsedFunction);
  completionItem.documentation = createMarkdownDocumentation(parsedFunction);
  completionItem.insertText = getSnippetOrName(parsedFunction, label);

  return completionItem;
}

function getFunctionSignature(parsedFunction: ShdocFunction): string {
  const argumentNames = parsedFunction.args.map((a) => a.name).join(" ");
  return `${parsedFunction.name} ${argumentNames}`.trim();
}

function getSnippetOrName(parsedFunction: ShdocFunction, label?: string): vscode.SnippetString | string {
  const nameToUse = label || parsedFunction.name;
  if (parsedFunction.args && parsedFunction.args.length > 0) {
    const snippetArguments = parsedFunction.args
      .map((arg, index) => `\${${index + 1}:${arg.name}}`)
      .join(" ");
    return new vscode.SnippetString(`${nameToUse} ${snippetArguments}`);
  }
  return nameToUse;
}
