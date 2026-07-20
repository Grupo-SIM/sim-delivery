# Backend
- Source: `backend/src`; Elysia runtime on Bun.
- API changes flow backend controller/TypeBox DTO -> `cd backend && bun run export` -> `cd frontend && bun run generate`.
- DTO values are TypeBox schemas; types derive from `typeof XxxDTO.static`; flat composition spreads `.properties`.
- Elysia response typing key is `response:`, never `result:`.
- Local-only boundary applies to migrations, schemas, seeds, and external services.