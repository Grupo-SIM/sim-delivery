# Conventions
- Follow root `AGENTS.md`; business rules belong in `docs/business-rules.md`.
- Frontend TypeScript/TSX work uses Serena first.
- Component files PascalCase; private page components live in adjacent `components/` with `index.ts`; one component per file unless composition pattern.
- TanStack Router multi-segment routes use folder/index structure. Parent with children is Outlet-only layout; original page moves to index route.
- Prefer reusable UI/domain components, deepest-owner data fetching, smallest client scope, named React imports.
- Async resource states are disjoint: render layout-preserving skeleton while any required request is pending; render unavailable/empty errors only after relevant requests settle.
- Backend DTOs use TypeBox schemas and derived `.static` types; compose via `.properties`, not `t.Intersect`; Elysia uses `response:`.
- Never edit `frontend/src/lib/api/generated/`; regenerate from backend OpenAPI.
- Unit tests colocated; integration/E2E in module `tests/`, never `__tests__`.