# Business Rules

This file is the source of truth for project-specific product and domain rules.

Use this file for rules that describe what the product is, how domain entities behave, and which edge cases are normative. Keep engineering workflow, coding style, and agent operating rules in `AGENTS.md`.

Recommended structure:

- Start with an index of business-rule sections and the intended LLM usage guide.
- For broad tasks such as domain modeling, requirements, or epic planning, provide the complete rule set.
- For focused tasks, point to the topical section relevant to the change.
- Do not invent rules. Surface open points instead of guessing.
- Keep objective rules (block) separate from behavioral rules (warn, penalize, or notify).
