import { PrismaPg } from "@prisma/adapter-pg";
import { Kysely, PostgresAdapter, PostgresIntrospector, PostgresQueryCompiler } from "kysely";
import kyselyExtension from "prisma-extension-kysely";
import type { DB } from "../out/kysely/types";
import type { PrismaClient } from "../out/prisma/client.ts";
import "dotenv/config";

const env = globalThis.process?.env;

// PrismaPg connects lazily, so importing this module never opens a connection. Build-only
// steps that import the client transitively (e.g. `prisma generate`, the OpenAPI export,
// type-checking) must not require a live DATABASE_URL. We therefore fall back to a harmless
// placeholder when it is absent and only fail when a query is actually issued.
const databaseUrl = env?.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/example";

export const adapter = new PrismaPg({
	connectionString: databaseUrl,
	connectionTimeoutMillis: Number(env?.PRISMA_POOL_CONNECTION_TIMEOUT_MS || 5000),
	idleTimeoutMillis: Number(env?.PRISMA_POOL_IDLE_TIMEOUT_MS || 30000),
	keepAlive: true,
	keepAliveInitialDelayMillis: Number(env?.PRISMA_POOL_KEEP_ALIVE_DELAY_MS || 10000),
	max: Number(env?.PRISMA_POOL_MAX || 20),
	maxLifetimeSeconds: Number(env?.PRISMA_POOL_MAX_LIFETIME_SECONDS || 300),
	// Keeping a minimum idle pool defeats idleTimeoutMillis: stale sockets can survive
	// indefinitely and fail the next query after the database or network closes them.
	min: Number(env?.PRISMA_POOL_MIN || 0),
});

export const prismaExtensionKysely = () =>
	kyselyExtension({
		kysely: driver =>
			new Kysely<DB>({
				dialect: {
					createAdapter: () => new PostgresAdapter(),
					createDriver: () => driver,
					createIntrospector: db => new PostgresIntrospector(db),
					createQueryCompiler: () => new PostgresQueryCompiler(),
				},
			}),
	});

export type KyselyInstance = Kysely<DB>;
export type PrismaClientInstance = InstanceType<typeof PrismaClient>;

export * from "../out/prisma/client.ts";
