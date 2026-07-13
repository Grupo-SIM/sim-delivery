import { $ } from "bun";

await $`bun turbo frontend#inject --force`;
await $`tsc -b`;
await $`vite build`;
