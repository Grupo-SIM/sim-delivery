import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";

interface ScrollbarProps {
	container: HTMLElement | null;
}

export function Scrollbar({ container }: ScrollbarProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const dragOffsetRef = useRef(0);
	const [metrics, setMetrics] = useState({ thumbHeight: 0, thumbTop: 0 });

	useEffect(() => {
		if (!container) return;
		const scrollContainer = container;

		function sync() {
			const { clientHeight, scrollHeight, scrollTop } = scrollContainer;
			const trackHeight = trackRef.current?.clientHeight ?? Math.max(clientHeight - 32, 0);
			if (scrollHeight <= clientHeight || trackHeight === 0) {
				setMetrics({ thumbHeight: 0, thumbTop: 0 });
				return;
			}

			const thumbHeight = Math.min(Math.max((clientHeight / scrollHeight) * trackHeight, 32), trackHeight);
			const thumbTop = (scrollTop / (scrollHeight - clientHeight)) * (trackHeight - thumbHeight);
			setMetrics({ thumbHeight, thumbTop });
		}

		sync();
		scrollContainer.addEventListener("scroll", sync, { passive: true });
		const observer = new ResizeObserver(sync);
		observer.observe(scrollContainer);
		return () => {
			scrollContainer.removeEventListener("scroll", sync);
			observer.disconnect();
		};
	}, [container]);

	function scrollTo(clientY: number) {
		if (!container || !trackRef.current || metrics.thumbHeight === 0) return;

		const track = trackRef.current;
		const { top } = track.getBoundingClientRect();
		const thumbTop = Math.max(
			0,
			Math.min(clientY - top - dragOffsetRef.current, track.clientHeight - metrics.thumbHeight),
		);
		container.scrollTop =
			(thumbTop / (track.clientHeight - metrics.thumbHeight)) *
			(container.scrollHeight - container.clientHeight);
	}

	function onTrackPointerDown(event: PointerEvent<HTMLDivElement>) {
		if (event.target !== event.currentTarget) return;
		dragOffsetRef.current = metrics.thumbHeight / 2;
		scrollTo(event.clientY);
	}

	function onThumbPointerDown(event: PointerEvent<HTMLDivElement>) {
		dragOffsetRef.current = event.clientY - event.currentTarget.getBoundingClientRect().top;
		event.currentTarget.setPointerCapture(event.pointerId);
	}

	function onThumbPointerMove(event: PointerEvent<HTMLDivElement>) {
		if (event.currentTarget.hasPointerCapture(event.pointerId)) scrollTo(event.clientY);
	}

	if (metrics.thumbHeight === 0) return null;

	const style: CSSProperties = {
		height: Math.max(metrics.thumbHeight, 32),
		transform: `translateY(${metrics.thumbTop}px)`,
	};
	return (
		<div
			aria-hidden="true"
			className="absolute top-4 right-3 bottom-4 z-10 w-1.5 rounded-full bg-muted/70 sm:top-7 sm:right-4 sm:bottom-7"
			onPointerDown={onTrackPointerDown}
			ref={trackRef}
		>
			<div
				className="w-full cursor-grab rounded-full bg-muted-foreground/60 transition-colors hover:bg-muted-foreground active:cursor-grabbing"
				onPointerDown={onThumbPointerDown}
				onPointerMove={onThumbPointerMove}
				style={style}
			/>
		</div>
	);
}
