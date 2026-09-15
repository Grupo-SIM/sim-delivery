import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { LuArrowLeft, LuBell, LuLayoutDashboard, LuLogOut, LuReceiptText, LuUser } from "react-icons/lu";
import { getStaffAreaPath, isOperationalStaff, isStaff } from "@/lib/staff-guard";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";

interface ProfileMenuProps {
	logoutTo?: "/" | "/identify";
	onlyLogout?: boolean;
	showBackToCustomerArea?: boolean;
}

interface MenuPosition {
	right: number;
	top: number;
}

function initials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileMenu({
	logoutTo = "/",
	onlyLogout = false,
	showBackToCustomerArea = false,
}: ProfileMenuProps) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const currentPath = useLocation({ select: location => `${location.pathname}${location.searchStr}` });
	const hydrated = useAuthStore(state => state.hydrated);
	const isAuthenticated = useAuthStore(state => state.isAuthenticated);
	const user = useAuthStore(state => state.user);
	const role = useAuthStore(state => state.role);
	const logout = useAuthStore(state => state.logout);
	const [open, setOpen] = useState(false);
	const [menuPosition, setMenuPosition] = useState<MenuPosition>({ right: 0, top: 0 });
	const triggerRef = useRef<HTMLButtonElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (!open || !triggerRef.current) return;

		function positionMenu() {
			if (!triggerRef.current) return;
			const rect = triggerRef.current.getBoundingClientRect();
			setMenuPosition({ right: window.innerWidth - rect.right, top: rect.bottom + 8 });
		}

		positionMenu();
		window.addEventListener("resize", positionMenu);
		window.addEventListener("scroll", positionMenu, true);
		return () => {
			window.removeEventListener("resize", positionMenu);
			window.removeEventListener("scroll", positionMenu, true);
		};
	}, [open]);

	useEffect(() => {
		if (!open) return;
		function onPointerDown(event: MouseEvent) {
			const target = event.target as Node;
			if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
		}
		document.addEventListener("mousedown", onPointerDown);
		return () => document.removeEventListener("mousedown", onPointerDown);
	}, [open]);

	if (!hydrated) return <span className="h-10 w-10 rounded-full bg-muted" />;

	if (!isAuthenticated || !user) {
		return (
			<Link
				className="rounded-full bg-primary px-4 py-2 font-semibold text-primary-foreground text-sm transition hover:opacity-90"
				search={{ redirectTo: currentPath }}
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
		<div className="relative">
			<button
				aria-expanded={open}
				aria-haspopup="menu"
				className="flex cursor-pointer items-center gap-2 rounded-full p-0.5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				onClick={() => setOpen(value => !value)}
				ref={triggerRef}
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

			{open &&
				typeof document !== "undefined" &&
				createPortal(
					<div
						className="fixed z-[9999] w-60 overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
						ref={menuRef}
						role="menu"
						style={{ right: menuPosition.right, top: menuPosition.top }}
					>
						<div className="border-border border-b px-4 py-3">
							<p className="truncate font-semibold text-sm">{user.name}</p>
							<p className="truncate text-muted-foreground text-xs">{user.email}</p>
						</div>
						{!onlyLogout && (
							<Link
								className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-muted"
								onClick={() => setOpen(false)}
								role="menuitem"
								to="/profile"
							>
								<LuUser aria-hidden className="size-4 text-muted-foreground" />
								{t("store.account.myProfile")}
							</Link>
						)}
						{!onlyLogout && (
							<Link
								className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-muted"
								onClick={() => setOpen(false)}
								role="menuitem"
								to="/preferences"
							>
								<LuBell aria-hidden className="size-4 text-muted-foreground" />
								{t("store.account.preferences.title")}
							</Link>
						)}
						{!onlyLogout && (
							<Link
								className="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-muted"
								onClick={() => setOpen(false)}
								role="menuitem"
								to="/orders"
							>
								<LuReceiptText aria-hidden className="size-4 text-muted-foreground" />
								{t("store.account.myOrders")}
							</Link>
						)}
						{!onlyLogout && isStaff(role) && (
							<Link
								className="flex cursor-pointer items-center gap-2.5 border-border border-t px-4 py-2.5 text-sm transition hover:bg-muted sm:hidden"
								onClick={() => setOpen(false)}
								role="menuitem"
								to={getStaffAreaPath(role)}
							>
								<LuLayoutDashboard aria-hidden className="size-4 text-muted-foreground" />
								{t(isOperationalStaff(role) ? "store.account.staffOrders" : "store.account.staffAdmin")}
							</Link>
						)}
						{showBackToCustomerArea && isStaff(role) && (
							<Link
								className="flex cursor-pointer items-center gap-2.5 border-border border-t px-4 py-2.5 text-sm transition hover:bg-muted"
								onClick={() => setOpen(false)}
								role="menuitem"
								to="/"
							>
								<LuArrowLeft aria-hidden className="size-4 text-muted-foreground" />
								{t("store.account.backToCustomerArea")}
							</Link>
						)}
						<button
							className={cn(
								"flex w-full cursor-pointer items-center gap-2.5 px-4 py-2.5 text-destructive text-sm transition hover:bg-muted",
								!isStaff(role) && "border-border border-t",
							)}
							onClick={handleLogout}
							role="menuitem"
							type="button"
						>
							<LuLogOut aria-hidden className="size-4" />
							{t("store.account.signOut")}
						</button>
					</div>,
					document.body,
				)}
		</div>
	);
}
