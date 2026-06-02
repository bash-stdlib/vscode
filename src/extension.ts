import * as vscode from "vscode";
import { debug } from "@/debug";
import { DocumentationFetcher } from "@/shell/html/fetcher";
import { HtmlDocumentationParser } from "@/shell/html/htmlParser";
import { createCompletionProvider } from "@/shell/providers/completionProvider";
import { createHoverProvider } from "@/shell/providers/hoverProvider";
import { ShdocFunction } from "@/shell/shdoc";

export async function activate(context: vscode.ExtensionContext) {
  const functions = await loadFunctions();

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

  context.subscriptions.push(completionProvider, hoverProvider);
}

function getAlphanumericTriggers(): string[] {
  const triggers: string[] = [];
  // Add lowercase letters
  for (let i = 97; i <= 122; i++) {
    triggers.push(String.fromCharCode(i));
  }
  // Add uppercase letters
  for (let i = 65; i <= 90; i++) {
    triggers.push(String.fromCharCode(i));
  }
  // Add numbers
  for (let i = 0; i <= 9; i++) {
    triggers.push(i.toString());
  }
  // Add underscore for bash naming conventions
  triggers.push("_");
  return triggers;
}

async function loadFunctions(): Promise<ShdocFunction[]> {
  const config = vscode.workspace.getConfiguration("bash-stdlib");
  const language = config.get<string>("documentationLanguage") || "en";

  try {
    const fetcher = new DocumentationFetcher();
    const urls = fetcher.getUrls(language);

    const [normalHtml, testingHtml] = await Promise.all([
      fetcher.fetch(urls.normal),
      fetcher.fetch(urls.testing),
    ]);

    const parser = new HtmlDocumentationParser();
    const allFunctions = [
      ...parser.parse(normalHtml, { isTesting: false }),
      ...parser.parse(testingHtml, { isTesting: true }),
    ];

    debug(`Loaded ${allFunctions.length} functions`);
    debug("Sample functions:", allFunctions.slice(0, 3));

    return allFunctions;
  } catch (error) {
    console.error("Failed to load or parse documentation:", error);
    return [];
  }
}

export function deactivate() {}
