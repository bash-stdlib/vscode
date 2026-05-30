import * as vscode from "vscode";
import * as path from "path";
import { loadAllScriptsFromDirectory } from "./shell/loadScript";
import { extractShdocFunctions, ShdocFunction } from "./shell/shdoc";

export function activate(context: vscode.ExtensionContext) {
  let functions: ShdocFunction[] = [];

  try {
    const scriptsDir = path.join(context.extensionPath, "..", "stdlib", "src");
    const allScriptsText = loadAllScriptsFromDirectory(scriptsDir);
    functions = extractShdocFunctions(allScriptsText);
  } catch (error) {
    console.error("Failed to load or parse external script:", error);
  }

  const provider = vscode.languages.registerCompletionItemProvider(
    "shellscript",
    {
      provideCompletionItems(document, position) {
        return functions.map((parsedFunction) => {
          const completionItem = new vscode.CompletionItem(
            parsedFunction.name,
            vscode.CompletionItemKind.Function,
          );

          // 1. Signature Details
          const argSignature = parsedFunction.args.map((a) => a.name).join(" ");
          completionItem.detail =
            `${parsedFunction.name} ${argSignature}`.trim();

          // 2. Build Markdown Documentation Tooltip
          const markdown = new vscode.MarkdownString();

          // Description
          markdown.appendMarkdown(
            `**Description:**\n${parsedFunction.description}\n\n`,
          );

          // Arguments (if any)
          if (parsedFunction.args && parsedFunction.args.length > 0) {
            markdown.appendMarkdown(`**Arguments:**\n`);
            parsedFunction.args.forEach((arg) => {
              markdown.appendMarkdown(
                `* \`${arg.name}\` _(${arg.type})_ - ${arg.desc}\n`,
              );
            });
            markdown.appendMarkdown(`\n`);
          }

          // Options (if any)
          if (parsedFunction.options && parsedFunction.options.length > 0) {
            markdown.appendMarkdown(`**Options:**\n`);
            parsedFunction.options.forEach((opt) => {
              markdown.appendMarkdown(`* \`${opt.flags}\` - ${opt.desc}\n`);
            });
            markdown.appendMarkdown(`\n`);
          }

          // Exit Codes (Now dynamically reading from your parsed output!)
          if (parsedFunction.exitcodes && parsedFunction.exitcodes.length > 0) {
            markdown.appendMarkdown(`**Exit Codes:**\n`);
            parsedFunction.exitcodes.forEach((ec) => {
              markdown.appendMarkdown(`* \`${ec.code}\` - ${ec.desc}\n`);
            });
          }

          console.log(markdown);

          completionItem.documentation = markdown;

          // 3. Smart Code Snippet insertion
          if (parsedFunction.args && parsedFunction.args.length > 0) {
            const snippetArgs = parsedFunction.args
              .map((arg, index) => {
                return `\${${index + 1}:${arg.name}}`;
              })
              .join(" ");
            completionItem.insertText = new vscode.SnippetString(
              `${parsedFunction.name} ${snippetArgs}`,
            );
          } else {
            completionItem.insertText = parsedFunction.name;
          }

          console.log(completionItem.documentation);

          return completionItem;
        });
      },
    },
  );

  context.subscriptions.push(provider);
}

export function deactivate() {}
