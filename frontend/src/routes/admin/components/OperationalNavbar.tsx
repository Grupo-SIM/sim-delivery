import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LuLogOut } from "react-icons/lu";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores";

export function OperationalNavbar() {
	const { t } = useTranslation();
	const { logout } = useAuthStore();
	const navigate = useNavigate();

	async function handleLogout() {
		await logout();
		void navigate({ to: "/login" });
	}

	return (
		<header className="sticky top-0 z-20 flex items-center justify-between border-border border-b bg-card px-4 py-3">
			<span className="font-semibold text-sm">Admin</span>
			<Button onClick={() => void handleLogout()} size="sm" type="button" variant="outline">
				<LuLogOut className="size-4" />
				{t("admin.dashboard.nav.logout")}
			</Button>
		</header>
	);
}
