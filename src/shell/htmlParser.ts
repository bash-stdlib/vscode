import { ShdocFunction, ShdocArg, ShdocExitCode } from "@/shell/shdoc";
import { MESSAGE_NO_DESCRIPTION } from "@/constants";

export class HtmlDocumentationParser {
  protected readonly permalinkSymbol = "";
  protected readonly noDescriptionMessage = MESSAGE_NO_DESCRIPTION;

  public parse(html: string): ShdocFunction[] {
    const sections = this.splitIntoSections(html);

    return sections
      .map((sectionContent) => this.parseFunctionSection(sectionContent))
      .filter(
        (parsedFunction): parsedFunction is ShdocFunction =>
          parsedFunction !== null,
      );
  }

  protected splitIntoSections(html: string): string[] {
    const functionSectionRegex = /<section id="[^"]+">\s*<h3>/g;
    const sections: string[] = [];
    let match;
    const indices: number[] = [];

    while ((match = functionSectionRegex.exec(html)) !== null) {
      indices.push(match.index);
    }

    for (let i = 0; i < indices.length; i++) {
      const start = indices[i];
      const end = i + 1 < indices.length ? indices[i + 1] : html.length;
      sections.push(html.substring(start, end));
    }

    return sections;
  }

  protected parseFunctionSection(sectionHtml: string): ShdocFunction | null {
    const fullFunctionName = this.extractFunctionName(sectionHtml);
    if (!fullFunctionName) {
      return null;
    }

    const { namespace, functionName } = this.parseNamespace(fullFunctionName);

    return {
      name: functionName,
      namespace,
      description: this.extractDescription(sectionHtml),
      args: this.extractArguments(sectionHtml),
      options: [],
      exitcodes: this.extractExitCodes(sectionHtml),
    };
  }

  protected extractFunctionName(sectionHtml: string): string | null {
    const h3NameMatch = sectionHtml.match(/<h3>([^<]+)/);
    if (!h3NameMatch) {
      return null;
    }

    return h3NameMatch[1].trim().replace(this.permalinkSymbol, "").trim();
  }

  protected parseNamespace(fullFunctionName: string): {
    namespace: string;
    functionName: string;
  } {
    const parts = fullFunctionName.split(".");
    if (parts.length <= 1) {
      return { namespace: "", functionName: fullFunctionName };
    }

    const functionName = parts[parts.length - 1];
    const namespace = parts.slice(0, -1).join(".");

    return { namespace, functionName };
  }

  protected extractDescription(sectionHtml: string): string {
    const firstParagraphAfterHeaderMatch = sectionHtml.match(
      /<\/h3>\s*<p>([\s\S]+?)<\/p>/,
    );
    const rawDescription = firstParagraphAfterHeaderMatch
      ? firstParagraphAfterHeaderMatch[1].trim()
      : this.noDescriptionMessage;

    return this.sanitizeText(rawDescription);
  }

  protected extractArguments(sectionHtml: string): ShdocArg[] {
    const args: ShdocArg[] = [];
    const argumentsSectionPattern =
      /<section id="(?:arguments|id\d+)">\s*<h4>Arguments[\s\S]+?<ul[^>]*>([\s\S]+?)<\/ul>/;
    const argumentsSectionMatch = sectionHtml.match(argumentsSectionPattern);

    if (argumentsSectionMatch) {
      const listItemsHtml = argumentsSectionMatch[1];
      const argListItemPattern =
        /<li>\s*<p>\s*<strong>([^<]+)<\/strong>\s*\(([^)]+)\):\s*([\s\S]+?)<\/p>\s*<\/li>/g;
      const argMatches = listItemsHtml.matchAll(argListItemPattern);

      for (const match of argMatches) {
        let argName = match[1].trim();
        // Convert ellipsis to standard notation for display
        if (argName === "…") {
          argName = "...";
        }
        args.push({
          name: argName,
          type: match[2].trim(),
          desc: this.sanitizeText(match[3]),
        });
      }
    }

    return args;
  }

  protected extractExitCodes(sectionHtml: string): ShdocExitCode[] {
    const exitCodes: ShdocExitCode[] = [];
    const exitCodesSectionPattern =
      /<section id="(?:exit-codes|id\d+)">\s*<h4>Exit codes[\s\S]+?<ul[^>]*>([\s\S]+?)<\/ul>/;
    const exitCodesSectionMatch = sectionHtml.match(exitCodesSectionPattern);

    if (exitCodesSectionMatch) {
      const listItemsHtml = exitCodesSectionMatch[1];
      const exitCodeListItemPattern =
        /<li>\s*<p>\s*<strong>([^<]+)<\/strong>:\s*([\s\S]+?)<\/p>\s*<\/li>/g;
      const exitCodeMatches = listItemsHtml.matchAll(exitCodeListItemPattern);

      for (const match of exitCodeMatches) {
        exitCodes.push({
          code: match[1].trim(),
          desc: this.sanitizeText(match[2]),
        });
      }
    }

    return exitCodes;
  }

  protected sanitizeText(htmlContent: string): string {
    const textWithoutTags = htmlContent.replace(/<[^>]+>/g, "");
    const normalizedWhitespace = textWithoutTags.replace(/\s+/g, " ");

    return normalizedWhitespace.trim();
  }
}
