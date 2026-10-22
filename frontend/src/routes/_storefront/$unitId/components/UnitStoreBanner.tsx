import { useState } from "react";
import { useTranslation } from "react-i18next";

export function UnitStoreBanner({ urls }: { urls: string[] }) {
	const { t } = useTranslation();
	const [selected, setSelected] = useState(0);
	const active = selected < urls.length ? selected : 0;
	if (!urls.length) return null;

	return (
		<section aria-label={t("store.unit.bannerCarousel")} className="storefront-banner">
			<div className="mx-auto">
				<img alt="" className="store-banner-image" src={urls[active]} />
				{urls.length > 1 && (
					<div className="store-banner-pagination">
						{urls.map((url, index) => (
							<button aria-label={`${t("store.unit.bannerCarousel")} ${index + 1}`} aria-pressed={active === index} key={`${url}-${index}`} onClick={() => setSelected(index)} type="button" />
						))}
					</div>
				)}
			</div>
		</section>
	);
}
