export type WhatsAppMessageSegment =
	| { content: string; type: "text" }
	| { children: WhatsAppMessageSegment[]; type: "bold" | "italic" | "strikethrough" | "monospace" };

const MARKERS = [
	{ marker: "```", type: "monospace" },
	{ marker: "*", type: "bold" },
	{ marker: "_", type: "italic" },
	{ marker: "~", type: "strikethrough" },
] as const;

/** Parses formatting markers supported by WhatsApp messages. */
export function parseWhatsAppMessage(message: string): WhatsAppMessageSegment[] {
	const segments: WhatsAppMessageSegment[] = [];
	let cursor = 0;
	let textStart = 0;

	while (cursor < message.length) {
		const format = MARKERS.find(({ marker }) => message.startsWith(marker, cursor));
		if (!format) {
			cursor += 1;
			continue;
		}

		const contentStart = cursor + format.marker.length;
		const closingIndex = message.indexOf(format.marker, contentStart);
		if (closingIndex === -1 || closingIndex === contentStart) {
			cursor = contentStart;
			continue;
		}

		if (textStart < cursor) segments.push({ content: message.slice(textStart, cursor), type: "text" });
		const content = message.slice(contentStart, closingIndex);
		segments.push({
			children: format.type === "monospace" ? [{ content, type: "text" }] : parseWhatsAppMessage(content),
			type: format.type,
		});
		cursor = closingIndex + format.marker.length;
		textStart = cursor;
	}

	if (textStart < message.length) segments.push({ content: message.slice(textStart), type: "text" });
	return segments;
}
