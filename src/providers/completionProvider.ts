import * as vscode from "vscode";
import { CONFIG_EXTRA_NAMESPACES } from "@/constants";
import { debug } from "@/debug";
import {
  createNamespaceCompletionItem,
  createFunctionCompletionItem,
} from "@/providers/completion/completionItems";
import {
  extractNamespacePrefixFromLineText,
  getNextNamespaceLevels,
  getFunctionsInNamespace,
} from "@/providers/completion/namespaces";
import { getFunctionsForContext } from "@/shell/context";
import { ShdocFunction } from "@/shell/shdoc";

export function createCompletionProvider(
  allFunctions: ShdocFunction[],
  mockTemplates: ShdocFunction[],
): vscode.CompletionItemProvider {
  return {
    provideCompletionItems(document, position) {
      const functionsAvailableInContext = getFunctionsForContext(
        allFunctions,
        mockTemplates,
        document,
        position,
      );

      const lineText = document
        .lineAt(position.line)
        .text.substring(0, position.character);

      debug(`Completion requested at: "${lineText}"`);

      const { namespace, endsWithDot } =
        extractNamespacePrefixFromLineText(lineText);

      if (namespace === "" && endsWithDot) {
        return [];
      }

      const config = vscode.workspace.getConfiguration();
      const extraNamespaces =
        config.get<string[]>(CONFIG_EXTRA_NAMESPACES) || [];

      if (!namespace && !endsWithDot) {
        const rootCompletions = createNamespacedCompletions(
          functionsAvailableInContext,
          "",
          undefined,
          extraNamespaces,
        );
        if (rootCompletions.length > 0) {
          return rootCompletions;
        }
        return [];
      }

      if (!endsWithDot && !namespace.includes(".")) {
        const rootCompletions = createNamespacedCompletions(
          functionsAvailableInContext,
          "",
          namespace,
          extraNamespaces,
        );
        if (rootCompletions.length > 0) {
          const filterTextStart = position.character - namespace.length;
          const filterTextEnd = position.character;
          const rangeToReplace = new vscode.Range(
            new vscode.Position(position.line, filterTextStart),
            new vscode.Position(position.line, filterTextEnd),
          );
          rootCompletions.forEach((item) => {
            item.range = rangeToReplace;
          });
          return rootCompletions;
        }
        return [];
      }

      return createNamespacedCompletions(
        functionsAvailableInContext,
        namespace,
        undefined,
        extraNamespaces,
      );
    },
  };
}

export function createNamespacedCompletions(
  functions: ShdocFunction[],
  namespace: string,
  filter?: string,
  extraNamespaces: string[] = [],
): vscode.CompletionItem[] {
  const completions: vscode.CompletionItem[] = [];

  const nextLevels = getNextNamespaceLevels(
    functions,
    namespace,
    filter,
    extraNamespaces,
  );
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
