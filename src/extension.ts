import * as vscode from "vscode";
import { ShdocFunction } from "@/shell/shdoc";
import { DocumentationFetcher } from "@/shell/fetcher";
import { HtmlDocumentationParser } from "@/shell/htmlParser";
import { createCompletionItem } from "@/shell/completions";
import { createMarkdownDocumentation } from "@/shell/markdown";

export async function activate(context: vscode.ExtensionContext) {
  const functions = await fetchAllFunctions();

  const completionProvider = vscode.languages.registerCompletionItemProvider(
    "shellscript",
    {
      provideCompletionItems() {
        return functions.map(createCompletionItem);
      },
    },
  );

  const hoverProvider = vscode.languages.registerHoverProvider(
    "shellscript",
    {
      provideHover(document, position) {
        const functionNameRange = document.getWordRangeAtPosition(position, /[\w.]+/);
        if (!functionNameRange) {
          return null;
        }
        const functionName = document.getText(functionNameRange);

        const matchedFunction = functions.find((f) => f.name === functionName);
        if (matchedFunction) {
          return new vscode.Hover(createMarkdownDocumentation(matchedFunction));
        }

        return null;
      },
    }
  );

  context.subscriptions.push(completionProvider, hoverProvider);
}

async function fetchAllFunctions(): Promise<ShdocFunction[]> {
  const config = vscode.workspace.getConfiguration("bash-stdlib");
  const language = config.get<string>("documentationLanguage") || "en";

  try {
    const fetcher = new DocumentationFetcher();
    const urls = fetcher.getUrls(language);

    const [normalHtml, testingHtml] = await Promise.all([
      fetcher.fetch(urls.normal).catch(() => ""),
      fetcher.fetch(urls.testing).catch(() => ""),
    ]);

    const parser = new HtmlDocumentationParser();
    return [...parser.parse(normalHtml), ...parser.parse(testingHtml)];
  } catch (error) {
    console.error("Failed to load or parse documentation:", error);
    return [];
  }
}

export function deactivate() {}
