import { Link } from "@tanstack/react-router";
import type { IconType } from "react-icons";

interface NavItemProps {
	exact?: boolean;
	icon: IconType;
	label: string;
	onNavigate?: () => void;
	to: string;
}

export function AdminNavItem({ exact = false, icon: Icon, label, onNavigate, to }: NavItemProps) {
	return (
		<Link
			activeOptions={{ exact }}
			activeProps={{ className: "bg-primary text-primary-foreground font-semibold" }}
			className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground text-sm transition-colors hover:bg-muted hover:text-foreground"
			onClick={onNavigate}
			to={to}
		>
			<Icon className="size-4 shrink-0" />
			{label}
		</Link>
	);
}
