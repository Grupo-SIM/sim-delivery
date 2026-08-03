import type { StorefrontBranding } from "./types";

interface StorefrontFooterProps {
	branding?: StorefrontBranding;
}

export function StorefrontFooter({ branding }: StorefrontFooterProps) {
	const companyName = branding?.companyName ?? "JB Delivery";
	const year = new Date().getFullYear();
	const contactItems = [
		branding?.footerWhatsApp && {
			href: `https://wa.me/${branding.footerWhatsApp.replace(/\D/g, "")}`,
			label: branding.footerWhatsApp,
		},
		branding?.footerSupportEmail && {
			href: `mailto:${branding.footerSupportEmail}`,
			label: branding.footerSupportEmail,
		},
	].filter((item): item is { href: string; label: string } => Boolean(item));
	const socialItems = [
		branding?.footerInstagramUrl && { href: branding.footerInstagramUrl, label: "Instagram" },
		branding?.footerFacebookUrl && { href: branding.footerFacebookUrl, label: "Facebook" },
	].filter((item): item is { href: string; label: string } => Boolean(item));

	return (
		<footer className="mt-auto border-border/70 border-t bg-muted/35 pb-safe pr-safe pl-safe">
			<div className="mx-auto max-w-6xl px-5 py-9">
				<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
					{branding?.footerPaymentMethods?.length ? (
						<div className="space-y-2 text-sm">
							<p className="font-medium">Formas de pagamento</p>
							<p className="text-muted-foreground">{branding.footerPaymentMethods.join(" · ")}</p>
						</div>
					) : null}
					{contactItems.length || socialItems.length ? (
						<div className="space-y-2 text-sm">
							<p className="font-medium">Atendimento</p>
							<div className="flex flex-col items-start gap-1">
								{[...contactItems, ...socialItems].map(item => (
									<a
										className="cursor-pointer text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
										href={item.href}
										key={item.href}
										rel="noreferrer"
										target="_blank"
									>
										{item.label}
									</a>
								))}
							</div>
						</div>
					) : null}
				</div>
			</div>
		</footer>
	);
}
