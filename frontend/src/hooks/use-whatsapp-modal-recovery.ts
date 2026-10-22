import { useEffect, useEffectEvent, useRef } from "react";

interface WhatsAppModalRecoveryOptions {
	busy: boolean;
	loading: boolean;
	modalKey: string | null;
	onRecover: () => void;
	sessionName: string | null | undefined;
	status: string | null;
}

/** Attempt recovery once per opening, after fresh status has settled. */
export function useWhatsAppModalRecovery({ busy, loading, modalKey, onRecover, sessionName, status }: WhatsAppModalRecoveryOptions) {
	const opening = useRef<{ key: string | null; attempted: boolean }>({ key: null, attempted: false });
	const recover = useEffectEvent(onRecover);

	useEffect(() => {
		if (opening.current.key !== modalKey) opening.current = { key: modalKey, attempted: false };
		if (!modalKey || opening.current.attempted || busy || loading || status !== "FAILED") return;
		if (!sessionName) return;
		opening.current.attempted = true;
		recover();
	}, [busy, loading, modalKey, sessionName, status]);
}
