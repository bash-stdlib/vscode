import importPlugin from "eslint-plugin-import";
import unusedImports from "eslint-plugin-unused-imports";
import typescriptEslint from "typescript-eslint";

export default [
  {
    files: ["**/*.ts"],
  },
  {
    plugins: {
      "@typescript-eslint": typescriptEslint.plugin,
      import: importPlugin,
      "unused-imports": unusedImports,
    },

    languageOptions: {
      parser: typescriptEslint.parser,
      ecmaVersion: 2022,
      sourceType: "module",
    },

    rules: {
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/naming-convention": [
        "warn",
        {
          selector: "import",
          format: ["camelCase", "PascalCase"],
        },
      ],
      curly: "warn",
      eqeqeq: "warn",
      "import/order": [
        "error",
        {
          alphabetize: {
            order: "asc",
          },

          groups: [
            "external",
            "builtin",
            "sibling",
            "parent",
            "object",
            "index",
            "internal",
            "type",
          ],

          "newlines-between": "never",

          pathGroups: [
            {
              pattern: "@app/**",
              group: "external",
              position: "after",
            },
          ],

          pathGroupsExcludedImportTypes: ["builtin"],
        },
      ],
      semi: "warn",
      "unused-imports/no-unused-imports": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["./*", "../*"],
              message:
                "Relative imports are not allowed. Please use absolute paths or aliases.",
            },
          ],
        },
      ],
      "no-throw-literal": "warn",
    },
  },
];
