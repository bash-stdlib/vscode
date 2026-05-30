# bash-stdlib Project Standards

## Testing (AAA Pattern)

- **Arrange & Act** in `setup()` blocks (create data, execute code)
- **Assert** only in tests (single, focused assertions with no messages)
- Use object parameters for helpers: `{ content, line, character }`
- Consistent variable names throughout file (never mix `doc` and `document`)
- Only setup shared test data (remove unused setup)
- No comments in tests — let names explain intent

## Code Style

- No comments except when truly needed
- Prefer well-named variables and functions
- Use path aliases (`@/test/testHelpers`)
- Keep helper functions at top of files

## Process

- Ask clarifying questions about conventions before implementing
- Create a plan (`exit_plan_mode`) before major refactoring
- Design for clarity first (object params > positional)
- Get feedback on approach early
- Verify tests pass before finishing
