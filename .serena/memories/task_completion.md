# Completion
- Scope checks to changed packages when possible.
- Run type-check: `bun run check-types`.
- Run build: `bun run build`; route file changes require build to regenerate `routeTree.gen.ts`.
- Run affected package unit tests: `bun run test:unit` or package-local equivalent.
- Run formatter/linter relevant to changed files and revert unrelated formatter changes.
- Create atomic Conventional Commit with package scope using global Git identity: `git -c commit.gpgsign=false commit -m "type(scope): summary"`.
- User adjustments amend/rebase prior delivery instead of noisy follow-up commit.
- Never push.