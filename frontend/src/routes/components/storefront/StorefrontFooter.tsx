import type { StorefrontBranding } from "./types";

interface StorefrontFooterProps {
	branding?: StorefrontBranding;
}

export function StorefrontFooter({ branding }: StorefrontFooterProps) {
	const companyName = branding?.companyName ?? "JB Delivery";
	const year = new Date().getFullYear();

	return (
		<footer className="mt-auto border-border/70 border-t bg-muted/35">
			<div className="mx-auto max-w-6xl px-5 py-9">
				<div className="space-y-3">
					<div className="flex items-center gap-3">
						{branding?.logoUrl && (
							<img alt="" className="h-10 w-10 rounded-lg object-contain" src={branding.logoUrl} />
						)}
						<p className="font-display text-lg">{companyName}</p>
					</div>
					<p className="max-w-xl text-muted-foreground text-sm">
						{branding?.footerText ?? `© ${year} ${companyName}. Todos os direitos reservados.`}
					</p>
					<p className="text-muted-foreground text-xs">Desenvolvido por JB Delivery</p>
				</div>
			</div>
		</footer>
	);
}
