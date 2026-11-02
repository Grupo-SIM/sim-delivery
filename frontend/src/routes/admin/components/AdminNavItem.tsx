import { Link } from "@tanstack/react-router";
import type { IconType } from "react-icons";
import { LuTriangleAlert } from "react-icons/lu";
import { Tooltip } from "@/components/ui/Tooltip";

interface NavItemProps {
	exact?: boolean;
	icon: IconType;
	label: string;
	onNavigate?: () => void;
	to: string;
	/** Tooltip text; when set, a warning marker is shown next to the label. */
	warning?: string;
}

export function AdminNavItem({ exact = false, icon: Icon, label, onNavigate, to, warning }: NavItemProps) {
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
			{warning && (
				<Tooltip content={warning}>
					<LuTriangleAlert aria-label={warning} className="size-4 shrink-0 text-destructive" />
				</Tooltip>
			)}
		</Link>
	);
}
