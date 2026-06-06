import { debug } from "@/debug";
import { ShdocFunction } from "@/shell/shdoc";

export function extractNamespacePrefixFromLineText(lineText: string): {
  namespace: string;
  endsWithDot: boolean;
} {
  const match = lineText.match(/([@\w.]+)\.?$/);
  if (!match) {
    return { namespace: "", endsWithDot: false };
  }

  const namespace = match[1].replace(/\.$/, "");
  const endsWithDot = lineText.endsWith(".");

  debug(`Typed: "${namespace}", endsWithDot: ${endsWithDot}`);

  return { namespace, endsWithDot };
}

export function getNextNamespaceLevels(
  functions: ShdocFunction[],
  currentNamespace: string,
  filter?: string,
  extraNamespaces: string[] = [],
): { [key: string]: string } {
  const prefix = currentNamespace ? currentNamespace + "." : "";
  const levels: { [key: string]: string } = {};

  const allNamespaces = [
    ...functions.map((fn) => fn.namespace || ""),
    ...extraNamespaces,
  ];

  allNamespaces.forEach((fullNamespace) => {
    if (prefix === "" && fullNamespace !== "") {
      const nextLevel = fullNamespace.split(".")[0];
      levels[nextLevel] = nextLevel;
    } else if (prefix !== "" && fullNamespace.startsWith(prefix)) {
      const remaining = fullNamespace.slice(prefix.length);
      const nextLevel = remaining.split(".")[0];
      if (nextLevel) {
        const fullyQualifiedName = currentNamespace + "." + nextLevel;
        levels[nextLevel] = fullyQualifiedName;
      }
    }
  });

  if (filter) {
    const filtered: { [key: string]: string } = {};
    Object.entries(levels).forEach(([key, value]) => {
      if (key.startsWith(filter)) {
        filtered[key] = value;
      }
    });
    debug(
      `Next levels (filtered by "${filter}"): ${JSON.stringify(filtered, null, 2)}`,
    );
    return filtered;
  }

  debug(`Next levels: ${JSON.stringify(levels, null, 2)}`);
  return levels;
}

export function getFunctionsInNamespace(
  functions: ShdocFunction[],
  namespace: string,
): ShdocFunction[] {
  const filtered = functions.filter((fn) => fn.namespace === namespace);
  debug(`Functions in namespace "${namespace}": ${filtered.length}`);
  return filtered;
}
