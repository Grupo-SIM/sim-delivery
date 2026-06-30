import pkg from "../package.json";

const external = Object.entries(pkg.dependencies ?? {})
	.filter(([, version]) => !version.startsWith("workspace:"))
	.map(([name]) => name);

const result = await Bun.build({
	entrypoints: ["src/main.ts"],
	external,
	outdir: "./dist",
	sourcemap: "linked",
	target: "bun",
});

if (!result.success) {
	for (const log of result.logs) console.error(log);
	process.exit(1);
}
