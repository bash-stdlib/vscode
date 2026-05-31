import * as vscode from "vscode";
import { ShdocFunction } from "@/shell/shdoc";
import { DocumentationFetcher } from "@/shell/fetcher";
import { HtmlDocumentationParser } from "@/shell/htmlParser";
import { debug } from "@/debug";
import {
  extractNamespacePrefixFromLineText,
  getNextNamespaceLevels,
  getFunctionsInNamespace,
} from "@/shell/completion";
import {
  createNamespaceCompletionItem,
  createFunctionCompletionItem,
} from "@/shell/completionItem";

export async function activate(context: vscode.ExtensionContext) {
  const functions = await loadFunctions();

  const provider = vscode.languages.registerCompletionItemProvider(
    "shellscript",
    createCompletionProvider(functions),
    ".",
  );

  context.subscriptions.push(provider);
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
      ...parser.parse(normalHtml),
      ...parser.parse(testingHtml),
    ];

    debug(`Loaded ${allFunctions.length} functions`);
    debug("Sample functions:", allFunctions.slice(0, 3));

    return allFunctions;
  } catch (error) {
    console.error("Failed to load or parse documentation:", error);
    return [];
  }
}

function createCompletionProvider(
  functions: ShdocFunction[],
): vscode.CompletionItemProvider {
  return {
    provideCompletionItems(document, position) {
      const lineText = document
        .lineAt(position.line)
        .text.substring(0, position.character);

      debug(`Completion requested at: "${lineText}"`);

      const { namespace, endsWithDot } =
        extractNamespacePrefixFromLineText(lineText);

      if (!namespace && !endsWithDot) {
        return [];
      }

      if (endsWithDot && !namespace) {
        return [];
      }

      if (endsWithDot) {
        return createNamespacedCompletions(functions, namespace);
      }

      return createNamespacedCompletions(functions, namespace);
    },
  };
}

function createNamespacedCompletions(
  functions: ShdocFunction[],
  namespace: string,
): vscode.CompletionItem[] {
  const completions: vscode.CompletionItem[] = [];

  const nextLevels = getNextNamespaceLevels(functions, namespace);
  Object.entries(nextLevels).forEach(([level, fullyQualifiedName]) => {
    completions.push(createNamespaceCompletionItem(level, fullyQualifiedName));
  });

  getFunctionsInNamespace(functions, namespace).forEach((fn) => {
    completions.push(createFunctionCompletionItem(fn));
  });

  debug(`Returning ${completions.length} completions for namespace: "${namespace}"`);
  return completions;
}

export function deactivate() {}
