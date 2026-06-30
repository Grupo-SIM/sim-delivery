import { Section } from "@react-email/components";
import { emailColors } from "./theme";

/** App badge + wordmark, matching the frontend BrandMark on the email header surface. */
export function EmailBrandMark() {
	return (
		<Section>
			<table cellPadding="0" cellSpacing="0" style={{ borderCollapse: "collapse" }}>
				<tr>
					<td>
						<div
							style={{
								alignItems: "center",
								backgroundColor: emailColors.primary,
								borderRadius: "4px",
								color: emailColors.primaryForeground,
								display: "inline-flex",
								fontSize: "14px",
								fontWeight: "800",
								height: "32px",
								justifyContent: "center",
								lineHeight: "32px",
								textAlign: "center",
								width: "32px",
							}}
						>
							TA
						</div>
					</td>
					<td style={{ paddingLeft: "8px" }}>
						<span
							style={{
								color: emailColors.primaryForeground,
								fontSize: "16px",
								fontWeight: "800",
								letterSpacing: "-0.02em",
							}}
						>
							Template App
						</span>
					</td>
				</tr>
			</table>
		</Section>
	);
}
