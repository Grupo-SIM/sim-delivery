# Frontend
- Source: `frontend/src`; routes use TanStack Router file-based routing; generated tree is `routeTree.gen.ts`.
- API SDK generated under `frontend/src/lib/api/generated/`; never hand-edit it.
- UI and form rules are detailed in root `AGENTS.md` and are mandatory.
- Loading must precede unavailable/empty guards: pending required queries render skeletons matching final geometry to minimize layout shift; only settled unsuccessful/absent data may render error states.
- i18n locale files remain structurally synchronized and alphabetized; enum values are translated contracts, never raw UI text.