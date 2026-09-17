import type { ReactNode } from "react";
import { parseWhatsAppMessage, type WhatsAppMessageSegment } from "./whatsapp-message-format";

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
	return <>{renderSegments(parseWhatsAppMessage(message))}</>;
}
