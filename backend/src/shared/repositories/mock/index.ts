import type { KernelUnitOfWork, Repositories } from "@/shared/repositories";
import { createMockStore, type MockStore } from "./stores";

/** Builds the kernel repo set over a shared in-memory store (unit tests). */
export function buildMockRepositories(store: MockStore): Repositories {
	return {};
}

export interface MockKernel {
	store: MockStore;
	repos: Repositories;
	uow: KernelUnitOfWork;
}

/**
 * A complete in-memory kernel for unit tests: a shared store, the repo set over it,
 * and a Unit of Work whose `run` just invokes the callback (arrays are in-process, so
 * atomicity is trivially satisfied — no transaction needed).
 */
export function createMockKernel(): MockKernel {
	const store = createMockStore();
	const repos = buildMockRepositories(store);
	const uow: KernelUnitOfWork = {
		repos,
		run: fn => fn(repos),
	};
	return { repos, store, uow };
}

export { createMockStore, type MockStore };
