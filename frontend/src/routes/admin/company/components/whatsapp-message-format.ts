export type WhatsAppMessageSegment =
	| { content: string; type: "text" }
	| { children: WhatsAppMessageSegment[]; type: "bold" | "italic" | "strikethrough" | "monospace" };

export type WhatsAppMessageBlock =
	| { segments: WhatsAppMessageSegment[]; type: "paragraph" | "quote" }
	| { items: WhatsAppMessageSegment[][]; type: "ordered-list" | "unordered-list" };

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

const ORDERED_LIST_ITEM = /^\d+[.)]\s+(.+)$/;
const QUOTE = /^>\s?(.*)$/;
const UNORDERED_LIST_ITEM = /^[-*]\s+(.+)$/;

/** Parses WhatsApp message lines into paragraphs, lists, and quotes. */
export function parseWhatsAppMessageBlocks(message: string): WhatsAppMessageBlock[] {
	const blocks: WhatsAppMessageBlock[] = [];
	const paragraphLines: string[] = [];

	function flushParagraph() {
		if (paragraphLines.length === 0) return;
		blocks.push({ segments: parseWhatsAppMessage(paragraphLines.join("\n")), type: "paragraph" });
		paragraphLines.length = 0;
	}

	for (const line of message.split("\n")) {
		const unorderedMatch = line.match(UNORDERED_LIST_ITEM);
		const orderedMatch = line.match(ORDERED_LIST_ITEM);
		const quoteMatch = line.match(QUOTE);

		if (unorderedMatch) {
			flushParagraph();
			const lastBlock = blocks.at(-1);
			if (lastBlock?.type === "unordered-list") {
				lastBlock.items.push(parseWhatsAppMessage(unorderedMatch[1]));
			} else {
				blocks.push({ items: [parseWhatsAppMessage(unorderedMatch[1])], type: "unordered-list" });
			}
			continue;
		}

		if (orderedMatch) {
			flushParagraph();
			const lastBlock = blocks.at(-1);
			if (lastBlock?.type === "ordered-list") {
				lastBlock.items.push(parseWhatsAppMessage(orderedMatch[1]));
			} else {
				blocks.push({ items: [parseWhatsAppMessage(orderedMatch[1])], type: "ordered-list" });
			}
			continue;
		}

		if (quoteMatch) {
			flushParagraph();
			blocks.push({ segments: parseWhatsAppMessage(quoteMatch[1]), type: "quote" });
			continue;
		}

		flushParagraph();
		if (line) paragraphLines.push(line);
	}

	flushParagraph();
	return blocks;
}
