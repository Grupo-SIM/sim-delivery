import type { ReactNode } from "react";
import {
	parseWhatsAppMessageBlocks,
	type WhatsAppMessageBlock,
	type WhatsAppMessageSegment,
} from "./whatsapp-message-format";

interface WhatsAppMessagePreviewProps {
	message: string;
}

function renderSegments(segments: WhatsAppMessageSegment[]): ReactNode[] {
	return segments.map((segment, index) => {
		const key = `${segment.type}-${index}`;
		if (segment.type === "text") return segment.content;

		const children = renderSegments(segment.children);
		if (segment.type === "bold") return <strong key={key}>{children}</strong>;
		if (segment.type === "italic") return <em key={key}>{children}</em>;
		if (segment.type === "strikethrough") return <s key={key}>{children}</s>;
		return (
			<code className="rounded-sm bg-black/10 px-1 font-mono text-[0.8125em] dark:bg-white/10" key={key}>
				{children}
			</code>
		);
	});
}

export function WhatsAppMessagePreview({ message }: WhatsAppMessagePreviewProps) {
	return (
		<div className="space-y-2 break-words">
			{parseWhatsAppMessageBlocks(message).map((block, index) => renderBlock(block, index))}
		</div>
	);
}

function renderBlock(block: WhatsAppMessageBlock, index: number): ReactNode {
	const key = `${block.type}-${index}`;
	if (block.type === "paragraph") {
		return (
			<p className="whitespace-pre-wrap" key={key}>
				{renderSegments(block.segments)}
			</p>
		);
	}
	if (block.type === "quote") {
		return (
			<blockquote className="border-current/30 border-l-2 pl-2" key={key}>
				{renderSegments(block.segments)}
			</blockquote>
		);
	}

	const List = block.type === "ordered-list" ? "ol" : "ul";
	return (
		<List className="list-outside space-y-1 pl-5" key={key}>
			{block.items.map(item => (
				<li key={`${key}-${JSON.stringify(item)}`}>{renderSegments(item)}</li>
			))}
		</List>
	);
}
