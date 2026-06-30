# Task Completion
- For code changes, run the narrowest relevant validation first, then broader checks if the touched surface is shared.
- Common final checks: `bun build` for full repo validation and `bun format` when formatting/lint fixes are relevant.
- For frontend-only changes, prefer `cd frontend && bun build` when full repo build is unnecessary.
- For backend-only changes, prefer `cd backend && bun build`; if endpoint contracts changed, follow the export/generate SDK flow from `AGENTS.md`.
- Before reporting done, check `git status --short` and mention any tests or validations that could not be run.