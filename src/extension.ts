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
      provideCompletionItems(document, position) {
        const wordRange = document.getWordRangeAtPosition(position, /[\w.]+/);

        const fullWordBeforeCursor = wordRange
            ? document.getText(new vscode.Range(wordRange.start, position))
            : "";

        const lastDotIndex = fullWordBeforeCursor.lastIndexOf(".");
        const prefix = lastDotIndex !== -1 ? fullWordBeforeCursor.substring(0, lastDotIndex + 1) : "";

        const range = wordRange
            ? new vscode.Range(wordRange.start.translate(0, prefix.length), wordRange.end)
            : new vscode.Range(position, position);

        const items: vscode.CompletionItem[] = [];
        const nextSegments = new Set<string>();

        functions.forEach((f) => {
          if (f.name.startsWith(prefix)) {
            const remainder = f.name.substring(prefix.length);
            const segments = remainder.split(".");
            const nextSegment = segments[0];

            if (segments.length > 1) {
              if (!nextSegments.has(nextSegment)) {
                nextSegments.add(nextSegment);
                const item = new vscode.CompletionItem(nextSegment, vscode.CompletionItemKind.Module);
                item.range = range;
                item.command = { command: "editor.action.triggerSuggest", title: "Re-trigger completions..." };
                items.push(item);
              }
            } else {
              const item = createCompletionItem(f, nextSegment);
              item.range = range;
              items.push(item);
            }
          }
        });

        // Handle root level suggestion if nothing is typed yet
        if (prefix === "" && !fullWordBeforeCursor.includes("stdlib")) {
            const stdlibItem = new vscode.CompletionItem("stdlib", vscode.CompletionItemKind.Module);
            stdlibItem.command = { command: "editor.action.triggerSuggest", title: "Re-trigger completions..." };
            items.push(stdlibItem);
        }

        return items;
      },
    },
    "."
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
