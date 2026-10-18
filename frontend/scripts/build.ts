import { $ } from "bun";

await $`bun run inject`;
await $`tsc -b`;
await $`vite build`;
