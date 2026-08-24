import { useTranslation } from "react-i18next";
import { ScrollArea } from "@/components/ui/ScrollArea";
import { PromotionalSlide } from "./PromotionalSlide";
import type { PromotionalImage } from "./types";

interface PromotionalCarouselProps {
	images: PromotionalImage[];
}

export function PromotionalCarousel({ images }: PromotionalCarouselProps) {
	const { t } = useTranslation();
	if (images.length === 0) return null;
	return (
		<section aria-label={t("store.menu.promotions")}>
			<ScrollArea className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1">
				{images.map(image => (
					<PromotionalSlide image={image} key={image.id} />
				))}
			</ScrollArea>
		</section>
	);
}
