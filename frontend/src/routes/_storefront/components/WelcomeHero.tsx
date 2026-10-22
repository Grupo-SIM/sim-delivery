import { useLiveBranding } from "@/hooks/use-live-branding";
import { useTranslation } from "react-i18next";
import { LuArrowDown } from "react-icons/lu";
import { DeliveryIllustration } from "@/components/ui/DeliveryIllustration";
import { BrandWave } from "@/components/ui/BrandWave";

export function WelcomeHero() {
	const { t } = useTranslation();
	const branding = useLiveBranding();
	return (
		<section className="welcome-hero">
			<div className="welcome-hero-inner">
				<DeliveryIllustration className="welcome-delivery" />
				<div className="welcome-copy">
					<p className="welcome-eyebrow">{branding.welcomeEyebrow?.trim() || t("store.welcome.eyebrow")}</p>
					<h1 className="font-display">
						{t("store.welcome.title")}
						<br />
						<span>{t("store.welcome.titleAccent")}</span>
					</h1>
					<p className="welcome-description">{branding.welcomeDescription?.trim() || t("store.welcome.description")}</p>
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
