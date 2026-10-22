import { useTranslation } from "react-i18next";
import { LuArrowDown } from "react-icons/lu";
import { BrandWave } from "@/components/ui/BrandWave";

export function WelcomeHero() {
	const { t } = useTranslation();
	return (
		<section className="welcome-hero">
			<div className="welcome-hero-inner">
				<img alt="" className="welcome-delivery" src="/storefront/delivery.webp" />
				<div className="welcome-copy">
					<p className="welcome-eyebrow">{t("store.welcome.eyebrow")}</p>
					<h1 className="font-display">
						{t("store.welcome.title")}
						<br />
						<span>{t("store.welcome.titleAccent")}</span>
					</h1>
					<p className="welcome-description">{t("store.welcome.description")}</p>
					<a className="welcome-order" href="#unidades">
						{t("store.welcome.order")}
						<span>
							<LuArrowDown aria-hidden />
						</span>
					</a>
				</div>
			</div>
			<BrandWave />
		</section>
	);
}
