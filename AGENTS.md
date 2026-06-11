# bash-stdlib Project Standards

## Testing (AAA Pattern)

- **Arrange & Act** in `setup()` blocks (create data, execute code)
- **Assert** only in tests (single, focused assertions with no messages)
- Organize scenarios into **nested sub-suites** using `suite()`
- One assertion per `test()` block for maximum granularity and readability
- Separate Arrange from Act with a **blank line** within `setup()` for clarity
- Use object parameters for helpers: `{ content, line, character }`
- Consistent variable names throughout file (never mix `doc` and `document`)
- Only setup shared test data (remove unused setup)
- No comments in tests — let names (suite, test, variables) explain intent

## Code Style

- No comments except when truly needed
- Prefer well-named variables and functions
- Use path aliases (`@/test/testHelpers`)
- Keep helper functions at top of files
- Quote dynamic shell command arguments and place flags before file paths

## Process

- Ask clarifying questions about conventions before implementing
- Create a plan (`exit_plan_mode`) before major refactoring
- Design for clarity first (object params > positional)
- Get feedback on approach early
- Verify tests pass before finishing
