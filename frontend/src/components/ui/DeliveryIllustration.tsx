import artwork from "@/assets/delivery.svg?raw";
import { useLiveBranding } from "@/hooks/use-live-branding";

/** Supplied courier artwork follows the active company palette and backpack logo. */
export function DeliveryIllustration({ className }: { className?: string }) {
	const { logoUrl } = useLiveBranding();

	return (
		<svg aria-hidden="true" className={className} viewBox="0 310 530 430">
			{/* Trusted, bundled vector artwork; company content stays outside raw markup. */}
			<g dangerouslySetInnerHTML={{ __html: artwork.replace(/<svg[^>]*>|<\/svg>/g, "") }} />
			{logoUrl && (
				<image href={logoUrl} x="120" y="430" width="104" height="77" preserveAspectRatio="xMidYMid meet" />
			)}
		</svg>
	);
}
