import type { Modifier, Modifiers } from "@dnd-kit/core";

const restrictToVerticalListBounds: Modifier = ({ containerNodeRect, draggingNodeRect, transform }) => {
	const verticalTransform = { ...transform, x: 0 };
	if (!containerNodeRect || !draggingNodeRect) return verticalTransform;

	const minY = containerNodeRect.top - draggingNodeRect.top;
	const maxY = containerNodeRect.bottom - draggingNodeRect.bottom;

	return {
		...verticalTransform,
		y: Math.min(maxY, Math.max(minY, transform.y)),
	};
};

export const verticalListModifiers: Modifiers = [restrictToVerticalListBounds];
