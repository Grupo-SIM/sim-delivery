# Project Overview
- TypeScript monorepo template using Bun workspaces.
- Workspaces: `backend`, `frontend`, and `packages/*`.
- Root orchestration uses Turborepo scripts (`dev`, `build`, `start`).
- Backend is Bun/Elysia-style TypeScript with TypeBox DTO conventions from `AGENTS.md`.
- Frontend is Vite/TanStack Router style TypeScript/React, with strict component co-location and i18n synchronization rules.
- Local agent workflow uses Serena as the primary semantic tool for TypeScript/TSX code and Codex hooks in `.codex/hooks.json`.