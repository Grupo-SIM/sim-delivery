interface EmailMessagePreviewProps {
	companyName: string;
	logoUrl: string;
	message: string;
	subtitle: string;
	title: string;
}

/** Mirrors the transactional email shell rendered by the backend. */
export function EmailMessagePreview({ companyName, logoUrl, message, subtitle, title }: EmailMessagePreviewProps) {
	return (
		<div className="overflow-hidden rounded-[18px] border border-border bg-card text-card-foreground shadow-[0_12px_30px_rgba(0,18,255,0.12)]">
			<header className="flex items-center gap-2.5 bg-primary px-5 py-[18px] text-primary-foreground">
				{logoUrl ? (
					<img alt="" className="size-9 rounded-lg border border-primary-foreground/80 bg-card text-card-foreground object-contain p-0.5" src={logoUrl} />
				) : (
					<span className="grid size-9 place-items-center rounded-lg border border-primary-foreground/80 bg-card font-black text-primary text-xs">
						{companyName.slice(0, 1).toUpperCase()}
					</span>
				)}
				<span className="font-extrabold text-base">{companyName}</span>
			</header>
			<main className="space-y-3 px-5 py-6">
				<p className="font-extrabold text-primary text-[9px] uppercase tracking-[0.08em]">{subtitle}</p>
				<h3 className="font-extrabold text-card-foreground text-xl tracking-[-0.03em]">{title}</h3>
				<p className="whitespace-pre-wrap break-words text-card-foreground text-sm leading-6">{message}</p>
			</main>
			<footer className="border-border border-t bg-muted px-5 py-3.5 text-muted-foreground text-[9px]">
				© {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
			</footer>
		</div>
	);
}
