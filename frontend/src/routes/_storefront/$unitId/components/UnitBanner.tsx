interface UnitBannerProps {
	bannerUrl?: string | null;
}

export function UnitBanner({ bannerUrl }: UnitBannerProps) {
	if (!bannerUrl) return null;

	return (
		<div className="border-border/70 border-b">
			<img alt="" className="h-40 w-full object-cover sm:h-56" src={bannerUrl} />
		</div>
	);
}
