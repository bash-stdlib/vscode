# bash-stdlib README

VS Code extension that provides intelligent autocompletion and documentation for the bash-stdlib library functions.

## Features

- **Hierarchical namespace completion**: Type `stdlib.` to see available namespaces, then drill down through the hierarchy (e.g., `stdlib.array.assert.`)
- **Function documentation**: Hover over completion suggestions to see full function documentation including arguments, options, and exit codes
- **Smart code snippets**: Automatically inserts function arguments as snippet placeholders for quick parameter filling

## Extension Settings

This extension contributes the following settings:

- `bash-stdlib.documentationLanguage`: Set the language for function documentation (currently supports `en`)
- `bash-stdlib.debug`: Enable debug logging for completion provider activity (default: `false`)

## Debug Logging

To enable debug logging, set the `bash-stdlib.debug` setting to `true` in your VS Code settings:

**User settings** (`~/.config/Code/User/settings.json`):

```json
{
  "bash-stdlib.debug": true
}
```

**Workspace settings** (`.vscode/settings.json`):

```json
{
  "bash-stdlib.debug": true
}
```

Then check the debug console (View → Debug Console) to see logs including:

- Number of functions loaded
- Completion requests and their context
- Available namespace levels
- Number of completions returned

---

## Working with the Extension

### Requirements

- VS Code 1.0 or later
- A bash-stdlib documentation source (remote HTML documentation is automatically fetched)

### Release Notes

#### 1.0.0

- Initial release with intelligent namespace-aware completion
- Hierarchical function browsing through dot-separated namespaces
- Full documentation tooltips for all functions

---

**Enjoy!**
