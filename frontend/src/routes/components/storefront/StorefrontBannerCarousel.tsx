import { type TouchEvent, useEffect, useRef, useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { cn } from "@/lib/utils";

const AUTO_ADVANCE_MS = 4_000;
const SWIPE_THRESHOLD_PX = 48;

interface StorefrontBanner {
	href?: string | null;
	alt: string;
	src: string;
}

interface StorefrontBannerCarouselProps {
	className?: string;
	images: StorefrontBanner[];
	label: string;
}

export function StorefrontBannerCarousel({ className, images, label }: StorefrontBannerCarouselProps) {
	const [activeIndex, setActiveIndex] = useState(0);
	const touchStart = useRef<{ x: number; y: number } | null>(null);
	const currentIndex = Math.min(activeIndex, Math.max(images.length - 1, 0));

	useEffect(() => {
		if (images.length < 2) return;

		const timeout = window.setTimeout(() => {
			setActiveIndex((currentIndex + 1) % images.length);
		}, AUTO_ADVANCE_MS);

		return () => window.clearTimeout(timeout);
	}, [currentIndex, images.length]);

	if (images.length === 0) return null;

	function selectPrevious() {
		setActiveIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
	}

	function selectNext() {
		setActiveIndex((currentIndex + 1) % images.length);
	}

	function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
		const touch = event.touches[0];
		if (!touch) return;

		touchStart.current = { x: touch.clientX, y: touch.clientY };
	}

	function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
		const start = touchStart.current;
		const touch = event.changedTouches[0];
		touchStart.current = null;
		if (!start || !touch) return;

		const deltaX = touch.clientX - start.x;
		const deltaY = touch.clientY - start.y;
		if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) <= Math.abs(deltaY)) return;

		if (deltaX > 0) {
			selectPrevious();
			return;
		}

		selectNext();
	}

	return (
		<section
			aria-label={label}
			aria-roledescription="carrossel"
			className={cn(
				"storefront-banner group border-border/70 border-b bg-muted/50 sm:px-5 sm:py-4",
				className,
			)}
		>
			<div
				className="relative mx-auto aspect-[11/4] w-full max-w-5xl touch-pan-y overflow-hidden shadow-sm sm:rounded-xl sm:border sm:border-border/70 sm:shadow-md"
				onTouchEnd={handleTouchEnd}
				onTouchStart={handleTouchStart}
			>
				<div
					aria-live="off"
					className="flex h-full transition-transform duration-500 ease-out motion-reduce:transition-none"
					style={{ transform: `translateX(-${currentIndex * 100}%)` }}
				>
					{images.map((image, index) => {
						const content = <img alt={image.alt} className="h-full w-full object-cover" src={image.src} />;
						return (
							<div aria-hidden={index !== currentIndex} className="h-full w-full shrink-0" key={`${image.src}-${index}`}>
								{image.href ? <a className="block h-full w-full cursor-pointer" href={image.href} rel="noopener noreferrer" tabIndex={index === currentIndex ? 0 : -1} target="_blank">{content}</a> : content}
							</div>
						);
					})}
				</div>

				{images.length > 1 && (
					<>
						<button
							aria-label="Banner anterior"
							className="absolute top-1/2 left-3 hidden sm:grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/60 bg-black/35 text-white shadow-md backdrop-blur-sm transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
							onClick={selectPrevious}
							type="button"
						>
							<LuChevronLeft aria-hidden className="size-5" />
						</button>
						<button
							aria-label="Próximo banner"
							className="absolute top-1/2 right-3 hidden sm:grid size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/60 bg-black/35 text-white shadow-md backdrop-blur-sm transition hover:bg-black/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
							onClick={selectNext}
							type="button"
						>
							<LuChevronRight aria-hidden className="size-5" />
						</button>
						<div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
							{images.map((image, index) => (
								<button
									aria-label={`Exibir banner ${index + 1}`}
									aria-pressed={index === currentIndex}
									className={cn(
										"h-2.5 cursor-pointer rounded-full border border-white/70 shadow-sm transition-all",
										index === currentIndex ? "w-6 bg-white" : "w-2.5 bg-black/35 hover:bg-white/70",
									)}
									key={`${image.src}-control-${index}`}
									onClick={() => setActiveIndex(index)}
									type="button"
								/>
							))}
						</div>
					</>
				)}
			</div>
		</section>
	);
}
