import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Orientation = "horizontal" | "vertical";

interface ScrollbarProps {
	container: HTMLElement | null;
	/** Extra classes for the track — use to override the default insets. */
	className?: string;
	orientation?: Orientation;
}

const MIN_THUMB = 32;

export function Scrollbar({ className, container, orientation = "vertical" }: ScrollbarProps) {
	const isVertical = orientation === "vertical";
	const trackRef = useRef<HTMLDivElement>(null);
	const dragOffsetRef = useRef(0);
	const [metrics, setMetrics] = useState({ thumbSize: 0, thumbOffset: 0 });

	useEffect(() => {
		if (!container) return;
		const scrollContainer = container;

		function sync() {
			const clientSize = isVertical ? scrollContainer.clientHeight : scrollContainer.clientWidth;
			const scrollSize = isVertical ? scrollContainer.scrollHeight : scrollContainer.scrollWidth;
			const scrollOffset = isVertical ? scrollContainer.scrollTop : scrollContainer.scrollLeft;
			const track = trackRef.current;
			const trackSize = (isVertical ? track?.clientHeight : track?.clientWidth) ?? 0;
			if (scrollSize <= clientSize || trackSize === 0) {
				setMetrics({ thumbOffset: 0, thumbSize: 0 });
				return;
			}

			const thumbSize = Math.min(Math.max((clientSize / scrollSize) * trackSize, MIN_THUMB), trackSize);
			const thumbOffset = (scrollOffset / (scrollSize - clientSize)) * (trackSize - thumbSize);
			setMetrics({ thumbOffset, thumbSize });
		}

		sync();
		scrollContainer.addEventListener("scroll", sync, { passive: true });
		const observer = new ResizeObserver(sync);
		observer.observe(scrollContainer);
		if (scrollContainer.firstElementChild) observer.observe(scrollContainer.firstElementChild);
		return () => {
			scrollContainer.removeEventListener("scroll", sync);
			observer.disconnect();
		};
	}, [container, isVertical]);

	function scrollTo(clientPosition: number) {
		if (!container || !trackRef.current || metrics.thumbSize === 0) return;

		const track = trackRef.current;
		const rect = track.getBoundingClientRect();
		const trackStart = isVertical ? rect.top : rect.left;
		const trackSize = isVertical ? track.clientHeight : track.clientWidth;
		const thumbOffset = Math.max(
			0,
			Math.min(clientPosition - trackStart - dragOffsetRef.current, trackSize - metrics.thumbSize),
		);
		const ratio = thumbOffset / (trackSize - metrics.thumbSize);
		if (isVertical) {
			container.scrollTop = ratio * (container.scrollHeight - container.clientHeight);
		} else {
			container.scrollLeft = ratio * (container.scrollWidth - container.clientWidth);
		}
	}

	function positionOf(event: PointerEvent<HTMLDivElement>) {
		return isVertical ? event.clientY : event.clientX;
	}

	function onTrackPointerDown(event: PointerEvent<HTMLDivElement>) {
		if (event.target !== event.currentTarget) return;
		dragOffsetRef.current = metrics.thumbSize / 2;
		scrollTo(positionOf(event));
	}

	function onThumbPointerDown(event: PointerEvent<HTMLDivElement>) {
		const rect = event.currentTarget.getBoundingClientRect();
		dragOffsetRef.current = positionOf(event) - (isVertical ? rect.top : rect.left);
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function onThumbPointerMove(event: PointerEvent<HTMLDivElement>) {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) scrollTo(positionOf(event));
	}

	// The track must stay mounted even when idle — its measured size is what the thumb is derived from.
	const isActive = metrics.thumbSize > 0;
	const size = Math.max(metrics.thumbSize, MIN_THUMB);
	const style: CSSProperties = isVertical
		? { height: size, transform: `translateY(${metrics.thumbOffset}px)` }
		: { transform: `translateX(${metrics.thumbOffset}px)`, width: size };
	return (
		<div
			aria-hidden="true"
			className={cn(
				"absolute z-10 rounded-full",
				isActive ? "bg-muted/70" : "pointer-events-none bg-transparent",
				isVertical
					? "top-4 right-3 bottom-4 w-1.5 sm:top-7 sm:right-4 sm:bottom-7"
					: "right-4 bottom-3 left-4 h-1.5 sm:right-7 sm:bottom-4 sm:left-7",
				className,
			)}
			onPointerDown={onTrackPointerDown}
			ref={trackRef}
		>
			{isActive && (
				<div
					className={cn(
						"cursor-grab rounded-full bg-muted-foreground/60 transition-colors hover:bg-muted-foreground active:cursor-grabbing",
						isVertical ? "w-full" : "h-full",
					)}
					onPointerDown={onThumbPointerDown}
					onPointerMove={onThumbPointerMove}
					style={style}
				/>
			)}
		</div>
	);
}
