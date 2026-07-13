import type { StorefrontBranding } from "./types";

interface StorefrontBannerProps {
	branding?: StorefrontBranding;
}

export function StorefrontBanner({ branding }: StorefrontBannerProps) {
	if (!branding?.bannerUrl) return null;

	return (
		<div className="border-border/70 border-b">
			<img alt="" className="h-40 w-full object-cover sm:h-56" src={branding.bannerUrl} />
		</div>
	);
}
