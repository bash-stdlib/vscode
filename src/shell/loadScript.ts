import * as fs from "fs";
import * as path from "path";
import { extractShellFunctions } from "./parseFunctions";

export function getExternalFunctions(filePath: string): string[] {
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf-8");
    return extractShellFunctions(fileContent);
  }
  return [];
}

export function loadAllScriptsFromDirectory(dirPath: string): string {
  // Find all .sh files in the directory and its subdirectories
  const shellFiles = getFilesRecursively(dirPath, ".sh");

  console.log(`Found ${shellFiles.length} shell script files in ${dirPath}`);

  // Read and merge the content of all found files
  let consolidatedText = "";

  shellFiles.forEach((filePath) => {
    try {
      const content = fs.readFileSync(filePath, "utf8");
      // Append a newline to ensure file contents don't bleed into each other
      consolidatedText += content + "\n\n";
    } catch (error) {
      console.error(`Failed to read file at ${filePath}:`, error);
    }
  });

  return consolidatedText;
}

function getFilesRecursively(dir: string, extension: string): string[] {
  let results: string[] = [];

  if (!fs.existsSync(dir)) {
    console.error(`Directory does not exist: ${dir}`);
    return results;
  }

  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      // Recursively search subdirectories
      results = results.concat(getFilesRecursively(fullPath, extension));
    } else if (file.endsWith(extension)) {
      results.push(fullPath);
    }
  });

  return results;
}
