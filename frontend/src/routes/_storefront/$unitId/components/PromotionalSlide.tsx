import type { PromotionalImage } from "./types";

interface PromotionalSlideProps {
	image: PromotionalImage;
}

export function PromotionalSlide({ image }: PromotionalSlideProps) {
	const content = (
		<img
			alt={image.title}
			className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
			src={image.imageUrl}
		/>
	);

	return (
		<article className="group aspect-square w-full shrink-0 snap-center overflow-hidden rounded-xl border border-border bg-muted shadow-sm sm:w-[47%] lg:w-[31%]">
			{image.linkUrl ? (
				<a aria-label={image.title} className="block h-full w-full" href={image.linkUrl}>
					{content}
				</a>
			) : (
				content
			)}
		</article>
	);
}
