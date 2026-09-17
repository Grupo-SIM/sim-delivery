interface EmailMessagePreviewProps {
	companyName: string;
	logoUrl: string;
	message: string;
	orderNumber: number;
}

/** Mirrors the transactional email shell rendered by the backend. */
export function EmailMessagePreview({ companyName, logoUrl, message, orderNumber }: EmailMessagePreviewProps) {
	return (
		<div className="overflow-hidden rounded-[18px] border border-[#b9e7f0] bg-white shadow-[0_12px_30px_rgba(0,18,255,0.12)]">
			<header className="flex items-center gap-2.5 bg-[#0012ff] px-5 py-[18px] text-white">
				{logoUrl ? (
					<img alt="" className="size-9 rounded-lg border border-white/80 bg-white object-contain p-0.5" src={logoUrl} />
				) : (
					<span className="grid size-9 place-items-center rounded-lg border border-white/80 bg-white font-black text-[#0012ff] text-xs">
						{companyName.slice(0, 1).toUpperCase()}
					</span>
				)}
				<span className="font-extrabold text-base">{companyName}</span>
			</header>
			<main className="space-y-3 px-5 py-6">
				<p className="font-extrabold text-[#0012ff] text-[9px] uppercase tracking-[0.08em]">Acompanhe seu pedido</p>
				<h3 className="font-extrabold text-[#1d1d36] text-xl tracking-[-0.03em]">Atualização do pedido #{orderNumber}</h3>
				<p className="whitespace-pre-wrap break-words text-[#1d1d36] text-sm leading-6">{message}</p>
			</main>
			<footer className="border-[#b9e7f0] border-t bg-[#eefbff] px-5 py-3.5 text-[#50617a] text-[9px]">
				© {new Date().getFullYear()} {companyName}. Todos os direitos reservados.
			</footer>
		</div>
	);
}
