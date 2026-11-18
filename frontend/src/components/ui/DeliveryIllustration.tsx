import { useEffect, useState } from "react";
import { useLiveBranding } from "@/hooks/use-live-branding";
import { cdnResizedUrl } from "@/lib/media-url";

/** Supplied courier artwork follows the active company palette and backpack logo. */
export function DeliveryIllustration({ className }: { className?: string }) {
	const { logoUrl } = useLiveBranding();
	const [artwork, setArtwork] = useState("");

	// The vector is ~350 KB of path data: load it as its own chunk after first render instead of in the entry path.
	useEffect(() => {
		let active = true;
		import("@/assets/delivery.svg?raw").then(module => {
			if (active) setArtwork(module.default.replace(/<svg[^>]*>|<\/svg>/g, ""));
		});
		return () => {
			active = false;
		};
	}, []);

	return (
		<svg aria-hidden="true" className={className} viewBox="0 310 530 430">
			{/* Trusted, bundled vector artwork; company content stays outside raw markup. */}
			<g dangerouslySetInnerHTML={{ __html: artwork }} />
			{logoUrl && (
				<image href={cdnResizedUrl(logoUrl, 320)} x="120" y="430" width="104" height="77" preserveAspectRatio="xMidYMid meet" />
			)}
		</svg>
	);
}
