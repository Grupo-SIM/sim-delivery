# Commands
- Install: `bun install`.
- Develop all: `bun run dev`; frontend/backend equivalents from package directory.
- Type-check affected graph: `bun run check-types`.
- Build affected graph: `bun run build`.
- Unit tests: `bun run test:unit`; all tests: `bun run test`; E2E: `bun run test:e2e`.
- Format/fix: `bun run format`.
- Backend OpenAPI export: `cd backend && bun run export`.
- Frontend SDK generate: `cd frontend && bun run generate`.
- Validate memory references: `serena memories check`.