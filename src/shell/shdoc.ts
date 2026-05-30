export interface ShdocArg {
  name: string;
  type: string;
  desc: string;
}

export interface ShdocOption {
  flags: string;
  desc: string;
}

export interface ShdocFunction {
  name: string;
  description: string;
  args: ShdocArg[];
  options: ShdocOption[];
  exitcodes: { code: string; desc: string }[];
}

export function extractShdocFunctions(documentText: string): ShdocFunction[] {
  const parsedFunctions: ShdocFunction[] = [];
  const lines = documentText.split(/\r?\n/);

  // Matches function definitions
  const functionRegex = /^(stdlib\.[a-z0-9_\.]+)\s*\(\s*\)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match = functionRegex.exec(line);

    if (match) {
      const functionName = match[1];

      // 1. Gather all comment lines immediately above the function
      const commentLines: string[] = [];
      let j = i - 1;
      while (j >= 0 && lines[j].trim().startsWith("#")) {
        // Strip the leading '#' and clean up whitespace
        commentLines.unshift(lines[j].trim().replace(/^#\s*/, ""));
        j--;
      }

      // 2. Parse the shdoc annotations from this comment block
      let description = "";
      const args: ShdocFunction["args"] = [];
      const options: ShdocFunction["options"] = [];
      const exitcodes: ShdocFunction["exitcodes"] = [];

      let inDescriptionSection = true;

      commentLines.forEach((comment) => {
        // When we hit any @ tag, we're no longer in the description fallback area
        if (comment.startsWith("@")) {
          inDescriptionSection = false;
        }

        if (comment.startsWith("@description")) {
          description = comment.replace("@description", "").trim();
          inDescriptionSection = true;
        } else if (comment.startsWith("@arg")) {
          // Format: @arg $1 string A value to print
          const parts = comment.split(/\s+/);
          if (parts.length >= 4) {
            args.push({
              name: parts[1],
              type: parts[2],
              desc: parts.slice(3).join(" "),
            });
          }
        } else if (comment.startsWith("@option")) {
          // Format: @option -v<val> |--value=<val> Set a value.
          const matchOpt = comment.match(
            /^@option\s+([^A-Zaz0-9\s].+?)\s{2,}(.+)$|^@option\s+(.+?)\s+(.+)$/,
          );
          if (matchOpt) {
            options.push({
              flags: (matchOpt[1] || matchOpt[3]).trim(),
              desc: (matchOpt[2] || matchOpt[4]).trim(),
            });
          }
        } else if (comment.startsWith("@exitcode")) {
          // Format: @exitcode 0 If successful.
          const parts = comment.split(/\s+/);
          if (parts.length >= 3) {
            exitcodes.push({
              code: parts[1],
              desc: parts.slice(2).join(" "),
            });
          }
        } else if (inDescriptionSection && !comment.startsWith("@")) {
          // Multi-line description support
          description += (description ? "\n" : "") + comment;
        }
      });

      parsedFunctions.push({
        name: functionName,
        description: description || "No description provided.",
        args,
        options,
        exitcodes,
      });
    }
  }

  return parsedFunctions;
}
