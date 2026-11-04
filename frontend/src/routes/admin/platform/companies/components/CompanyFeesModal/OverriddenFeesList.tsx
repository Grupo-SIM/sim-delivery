import { LuLink } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { OverrideValueInput } from "@/routes/admin/platform/fees/components/OverrideValueInput";
import { OVERRIDDEN_SCOPES, type OverrideDraft, type OverriddenScope } from "./overridden-fee-lines";

interface OverriddenFeesListProps {
	draft: OverrideDraft;
	onRelease: () => void;
	releasing: boolean;
	onChange: (scope: OverriddenScope, value: Partial<OverrideDraft[OverriddenScope]>) => void;
}

/** Editable total of the additive fees while SimIntPay overrides it: no names, no associations. Saved with the modal. */
export function OverriddenFeesList({ draft, onChange, onRelease, releasing }: OverriddenFeesListProps) {
	const { t } = useTranslation();
	return <div className="space-y-3">
		<p className="text-muted-foreground text-sm">{t("admin.companies.fees.extras.overridden")}</p>
		{OVERRIDDEN_SCOPES.map(scope => {
			const label = t(`admin.companies.fees.extras.scope.${scope}`);
			return <div className="space-y-2 rounded-md border border-border/60 p-3 text-sm" key={scope}>
				<span className="font-medium">{label}</span>
				<div className="grid grid-cols-2 gap-3">
					<OverrideValueInput kind="percentage" label={`${t("admin.companies.fees.columns.rate")} - ${label}`} name={`additive-${scope}-percentage`} onCommit={percentage => onChange(scope, { percentage })} value={draft[scope].percentage} />
					<OverrideValueInput kind="fixed" label={`${t("admin.companies.fees.columns.fixed")} - ${label}`} name={`additive-${scope}-fixed`} onCommit={fixed => onChange(scope, { fixed })} value={draft[scope].fixed} />
				</div>
			</div>;
		})}
		<div className="space-y-1">
			<Button disabled={releasing} onClick={onRelease} size="sm" type="button" variant="outline"><LuLink />{t("admin.companies.fees.extras.release")}</Button>
			<p className="text-muted-foreground text-xs">{t("admin.companies.fees.extras.releaseHint")}</p>
		</div>
	</div>;
}
