/** Decorative separator shared by the storefront welcome and sign-in panels. */
export function BrandWave() {
	return (
		<svg aria-hidden="true" className="brand-wave" preserveAspectRatio="none" viewBox="0 0 390 32">
			<path d="M0 19 C100 -2 163 39 280 15 S355 10 390 10 V32 H0Z" fill="var(--accent)" />
			<path d="M0 23 C100 2 163 43 280 19 S355 14 390 14 V32 H0Z" fill="var(--primary)" />
			<path d="M0 26 C100 5 163 46 280 22 S355 17 390 17 V32 H0Z" fill="var(--secondary)" />
			<path d="M0 30 C100 9 163 50 280 26 S355 21 390 21 V32 H0Z" fill="var(--background)" />
		</svg>
	);
}
