import * as vscode from "vscode";
import { ShdocFunction } from "./shdoc";
import { debug } from "@/debug";

export function createNamespaceCompletionItem(
  namespace: string,
): vscode.CompletionItem {
  const item = new vscode.CompletionItem(
    namespace,
    vscode.CompletionItemKind.Module,
  );
  item.insertText = namespace;
  item.detail = "namespace";
  return item;
}

export function createFunctionCompletionItem(
  parsedFunction: ShdocFunction,
): vscode.CompletionItem {
  const displayName = parsedFunction.namespace
    ? `${parsedFunction.namespace}.${parsedFunction.name}`
    : parsedFunction.name;

  const completionItem = new vscode.CompletionItem(
    displayName,
    vscode.CompletionItemKind.Function,
  );

  if (parsedFunction.namespace) {
    completionItem.sortText = `${parsedFunction.namespace}_${parsedFunction.name}`;
  }

  const argSignature = parsedFunction.args.map((a) => a.name).join(" ");
  completionItem.detail = `${displayName} ${argSignature}`.trim();

  completionItem.documentation = buildFunctionDocumentation(parsedFunction);
  completionItem.insertText = createSnippetText(parsedFunction);

  return completionItem;
}

function buildFunctionDocumentation(
  parsedFunction: ShdocFunction,
): vscode.MarkdownString {
  const markdown = new vscode.MarkdownString();
  markdown.isTrusted = true;

  markdown.appendMarkdown(
    `**Description:**\n${parsedFunction.description}\n\n`,
  );

  if (parsedFunction.args && parsedFunction.args.length > 0) {
    markdown.appendMarkdown(`**Arguments:**\n`);
    parsedFunction.args.forEach((arg) => {
      markdown.appendMarkdown(
        `* \`${arg.name}\` _(${arg.type})_ - ${arg.desc}\n`,
      );
    });
    markdown.appendMarkdown(`\n`);
  }

  if (parsedFunction.options && parsedFunction.options.length > 0) {
    markdown.appendMarkdown(`**Options:**\n`);
    parsedFunction.options.forEach((opt) => {
      markdown.appendMarkdown(`* \`${opt.flags}\` - ${opt.desc}\n`);
    });
    markdown.appendMarkdown(`\n`);
  }

  if (parsedFunction.exitcodes && parsedFunction.exitcodes.length > 0) {
    markdown.appendMarkdown(`**Exit Codes:**\n`);
    parsedFunction.exitcodes.forEach((ec) => {
      markdown.appendMarkdown(`* \`${ec.code}\` - ${ec.desc}\n`);
    });
  }

  debug(
    `${parsedFunction.namespace}.${parsedFunction.name} documentation length: ${markdown.value.length}`,
  );

  return markdown;
}

function createSnippetText(
  parsedFunction: ShdocFunction,
): string | vscode.SnippetString {
  if (parsedFunction.args && parsedFunction.args.length > 0) {
    const snippetArgs = parsedFunction.args
      .map((arg, index) => {
        return `\${${index + 1}:${arg.name}}`;
      })
      .join(" ");
    return new vscode.SnippetString(`${parsedFunction.name} ${snippetArgs}`);
  }

  return parsedFunction.name;
}
