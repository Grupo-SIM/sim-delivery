import { Link } from "@tanstack/react-router";
import { useLiveBranding } from "@/hooks/use-live-branding";

export function AdminBrand() {
	const { companyName, logoUrl } = useLiveBranding();

	return (
		<Link
			aria-label={companyName}
			className="flex min-w-0 cursor-pointer items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground"
			to="/"
		>
			{logoUrl ? (
				<img alt="" className="admin-brand-logo shrink-0 object-contain" src={logoUrl} />
			) : (
				<span className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary-foreground/40 font-black text-lg">
					{companyName.slice(0, 2).toUpperCase()}
				</span>
			)}
		</Link>
	);
}
