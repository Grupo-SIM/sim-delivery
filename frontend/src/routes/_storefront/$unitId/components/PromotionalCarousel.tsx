import { useTranslation } from "react-i18next";
import type { GetPublicUnits200 } from "@/lib/api";

type PromotionalImage = GetPublicUnits200[number]["promotionalImages"][number];

interface PromotionalCarouselProps {
	images: PromotionalImage[];
}

function Slide({ image }: { image: PromotionalImage }) {
	const content = (
		<img
			alt={image.title}
			className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
			src={image.imageUrl}
		/>
	);
	return (
		<article className="group aspect-[16/7] min-w-full snap-center overflow-hidden rounded-xl border border-border bg-muted shadow-sm sm:min-w-[72%] lg:min-w-[58%]">
			{image.linkUrl ? (
				<a aria-label={image.title} href={image.linkUrl}>
					{content}
				</a>
			) : (
				content
			)}
		</article>
	);
}

export function PromotionalCarousel({ images }: PromotionalCarouselProps) {
	const { t } = useTranslation();
	if (images.length === 0) return null;
	return (
		<section
			aria-label={t("store.menu.promotions")}
			className="scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1"
		>
			{images.map(image => (
				<Slide image={image} key={image.id} />
			))}
		</section>
	);
}
