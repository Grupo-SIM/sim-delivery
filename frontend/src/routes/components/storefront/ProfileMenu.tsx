import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { LuLogOut, LuReceiptText, LuUser } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/auth";

interface ProfileMenuProps {
	logoutTo?: "/" | "/login";
	onlyLogout?: boolean;
}

function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileMenu({ logoutTo = "/", onlyLogout = false }: ProfileMenuProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const hydrated = useAuthStore(state => state.hydrated);
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const user = useAuthStore(state => state.user);
	const logout = useAuthStore(state => state.logout);
	const [open, setOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		function onPointerDown(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
		}
		document.addEventListener("mousedown", onPointerDown);
		return () => document.removeEventListener("mousedown", onPointerDown);
	}, [open]);

	if (!hydrated) return <span className="h-10 w-10 rounded-full bg-muted" />;

	if (!isAuthenticated || !user) {
		return (
			<Link
				className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground text-sm transition hover:opacity-90"
				to="/identify"
			>
				{t("store.account.signIn")}
			</Link>
		);
	}

	async function handleLogout() {
		setOpen(false);
		await logout();
		void navigate({ to: logoutTo });
	}

	return (
		<div className="relative" ref={menuRef}>
			<button
				aria-expanded={open}
				aria-haspopup="menu"
				className="flex cursor-pointer items-center gap-2 rounded-full p-0.5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				onClick={() => setOpen(value => !value)}
				type="button"
			>
				{user.image ? (
					<img alt="" className="h-10 w-10 rounded-full object-cover" src={user.image} />
				) : (
					<span className="grid h-10 w-10 place-items-center rounded-full bg-primary font-semibold text-primary-foreground text-sm">
						{initials(user.name)}
					</span>
				)}
			</button>

			{open && (
				<div
					className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
					role="menu"
				>
					<div className="border-border border-b px-4 py-3">
						<p className="truncate font-semibold text-sm">{user.name}</p>
						<p className="truncate text-muted-foreground text-xs">{user.email}</p>
					</div>
					{!onlyLogout && <Link
						className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-muted"
						onClick={() => setOpen(false)}
						role="menuitem"
						to="/orders"
					>
						<LuReceiptText aria-hidden className="size-4 text-muted-foreground" />
						{t("store.account.myOrders")}
					</Link>}
					{!onlyLogout && <Link
						className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-muted"
						onClick={() => setOpen(false)}
						role="menuitem"
						to="/profile"
					>
						<LuUser aria-hidden className="size-4 text-muted-foreground" />
						{t("store.account.myProfile")}
					</Link>}
					<button
						className="flex w-full cursor-pointer items-center gap-2.5 border-border border-t px-4 py-2.5 text-destructive text-sm transition hover:bg-muted"
						onClick={handleLogout}
						role="menuitem"
						type="button"
					>
						<LuLogOut aria-hidden className="size-4" />
						{t("store.account.signOut")}
					</button>
				</div>
			)}
		</div>
	);
}
