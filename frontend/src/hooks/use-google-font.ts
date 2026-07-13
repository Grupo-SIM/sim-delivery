import { useEffect } from "react";
import { loadGoogleFont } from "@/lib/google-fonts";

/** Loads a Google Fonts family stylesheet on demand, e.g. for a live font preview. */
export function useGoogleFont(family: string | null | undefined) {
	useEffect(() => {
		loadGoogleFont(family);
	}, [family]);
}
