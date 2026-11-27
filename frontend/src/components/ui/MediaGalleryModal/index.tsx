import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuSearch } from "react-icons/lu";
import { useDebouncedInput } from "@/hooks/use-debounced-input";
import { type GetMediaGalleryQueryResponse, getMediaGallery } from "@/lib/api";
import { Input } from "../input";
import { Modal } from "../Modal";
import { ScrollArea } from "../ScrollArea";
import { MediaGalleryItem } from "./MediaGalleryItem";
import { MediaGallerySkeleton } from "./MediaGallerySkeleton";

const PAGE_SIZE = 24;

interface MediaGalleryModalProps {
	onClose: () => void;
	onSelect: (url: string) => void;
}

/** Company image gallery, newest first, searchable by the name of whatever uses each image. */
export function MediaGalleryModal({ onClose, onSelect }: MediaGalleryModalProps) {
	const { t } = useTranslation();
	const [search, setSearch] = useState("");
	const [localSearch, setLocalSearch] = useDebouncedInput("", setSearch);
	const listRef = useRef<HTMLDivElement>(null);
	const sentinelRef = useRef<HTMLDivElement>(null);
	const { data, fetchNextPage, hasNextPage, isError, isFetchingNextPage, isPending } = useInfiniteQuery<
		GetMediaGalleryQueryResponse,
		Error,
		InfiniteData<GetMediaGalleryQueryResponse, string | undefined>,
		readonly unknown[],
		string | undefined
	>({
		getNextPageParam: lastPage => lastPage.nextCursor ?? undefined,
		initialPageParam: undefined as string | undefined,
		queryFn: async ({ pageParam, signal }) =>
			(await getMediaGallery(
				{ cursor: pageParam, limit: PAGE_SIZE, search: search || undefined },
				{ signal },
			)) as GetMediaGalleryQueryResponse,
		queryKey: ["media-gallery", search],
	});
	const items = data?.pages.flatMap(page => page.items) ?? [];

	useEffect(() => {
		const sentinel = sentinelRef.current;
		if (!sentinel || !hasNextPage || isFetchingNextPage) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) void fetchNextPage();
			},
			{ root: listRef.current, rootMargin: "200px" },
		);
		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [fetchNextPage, hasNextPage, isFetchingNextPage, items.length]);

	return (
		<Modal isOpen layer="submodal" maxWidth="900px" onClose={onClose} title={t("media.gallery.title")} urlKey="media-gallery">
			<div className="grid gap-4">
				<div className="relative">
					<LuSearch aria-hidden className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						aria-label={t("media.gallery.searchLabel")}
						autoComplete="off"
						className="pl-9"
						name="media-gallery-search"
						onChange={event => setLocalSearch(event.currentTarget.value)}
						placeholder={t("media.gallery.searchPlaceholder")}
						value={localSearch}
					/>
				</div>
				<ScrollArea className="max-h-[60dvh] overflow-y-auto" ref={listRef}>
					{isError ? (
						<p className="py-10 text-center text-muted-foreground text-sm">{t("media.gallery.error")}</p>
					) : !isPending && items.length === 0 ? (
						<p className="py-10 text-center text-muted-foreground text-sm">
							{t(search ? "media.gallery.emptySearch" : "media.gallery.empty")}
						</p>
					) : (
						<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
							{isPending ? (
								<MediaGallerySkeleton />
							) : (
								items.map(item => <MediaGalleryItem item={item} key={item.id} onSelect={onSelect} />)
							)}
							{isFetchingNextPage && <MediaGallerySkeleton count={4} />}
						</div>
					)}
					<div aria-hidden className="h-px" ref={sentinelRef} />
				</ScrollArea>
			</div>
		</Modal>
	);
}
