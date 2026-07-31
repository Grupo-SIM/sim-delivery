export function stars(rating: number): string {
	return "⭐".repeat(rating) + "☆".repeat(5 - rating);
}
