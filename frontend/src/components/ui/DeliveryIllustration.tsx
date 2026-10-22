import { useLiveBranding } from "@/hooks/use-live-branding";

/** Neutral courier artwork: company logo and semantic theme colors stay live. */
export function DeliveryIllustration({ className }: { className?: string }) {
	const { logoUrl, companyName } = useLiveBranding();

	return (
		<svg aria-hidden="true" className={className} viewBox="0 0 320 400">
			<ellipse cx="165" cy="359" rx="145" ry="16" fill="var(--primary-foreground)" opacity="0.12" />
			<g stroke="var(--primary-foreground)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round">
				<circle cx="75" cy="319" r="37" fill="var(--primary)" />
				<circle cx="252" cy="319" r="37" fill="var(--primary)" />
				<path d="M75 319h112l-30-60H91l-35 30M187 319l40-87h23M228 233l24 86" fill="var(--secondary)" />
				<path d="M83 255h78" />
				<path d="M147 181l-27 48 57 24-12 48h31l20-64-45-27 20-29" fill="var(--accent)" />
				<path d="M145 112c-21 10-32 36-24 69l70 6 1-51" fill="var(--secondary)" />
				<path d="M179 142l26 51 31 9" fill="none" />
				<circle cx="165" cy="85" r="28" fill="var(--primary)" />
				<path d="M132 84c-3-47 63-49 67 0z" fill="var(--accent)" />
			</g>
			<rect x="28" y="151" width="88" height="91" rx="14" fill="var(--card)" stroke="var(--accent)" strokeWidth="6" />
			{logoUrl ? (
				<image href={logoUrl} x="38" y="163" width="68" height="67" preserveAspectRatio="xMidYMid meet" />
			) : (
				<text x="72" y="205" textAnchor="middle" fill="var(--card-foreground)" fontFamily="var(--font-display)" fontSize="24">
					{companyName.slice(0, 2).toUpperCase()}
				</text>
			)}
		</svg>
	);
}
