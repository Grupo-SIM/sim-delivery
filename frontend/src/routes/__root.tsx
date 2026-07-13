import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useSyncSession } from "@/hooks/useSyncSession";

function RootComponent() {
	useSyncSession();

	return (
		<div className="min-h-screen bg-background text-foreground">
			<main>
				<Outlet />
			</main>
		</div>
	);
}

export const Route = createRootRoute({
	component: RootComponent,
});
