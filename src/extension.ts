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
    "@",
    // Trigger on letters, numbers, and underscore so completions show while typing
    ...getAlphanumericTriggers(),
  );

  context.subscriptions.push(provider);
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

      // Don't complete on bare dot
      if (namespace === "" && endsWithDot) {
        return [];
      }

      // Allow completions for root namespace (no prefix, no dot) or when dot is typed
      if (!namespace && !endsWithDot) {
        // Check if there are root-level functions or top-level namespaces
        const rootCompletions = createNamespacedCompletions(functions, "");
        if (rootCompletions.length > 0) {
          return rootCompletions;
        }
        return [];
      }

      // If namespace doesn't end with dot and doesn't contain a dot,
      // it might be a partial root-level namespace (e.g., "_te" for "_testing")
      if (!endsWithDot && !namespace.includes(".")) {
        const rootCompletions = createNamespacedCompletions(
          functions,
          "",
          namespace,
        );
        if (rootCompletions.length > 0) {
          return rootCompletions;
        }
      }

      return createNamespacedCompletions(functions, namespace);
    },
  };
}

function createNamespacedCompletions(
  functions: ShdocFunction[],
  namespace: string,
  filter?: string,
): vscode.CompletionItem[] {
  const completions: vscode.CompletionItem[] = [];

  const nextLevels = getNextNamespaceLevels(functions, namespace, filter);
  Object.entries(nextLevels).forEach(([level, fullyQualifiedName]) => {
    completions.push(createNamespaceCompletionItem(level, fullyQualifiedName));
  });

  getFunctionsInNamespace(functions, namespace).forEach((fn) => {
    completions.push(createFunctionCompletionItem(fn));
  });

  debug(
    `Returning ${completions.length} completions for namespace: "${namespace}"`,
  );
  return completions;
}

export function deactivate() {}
