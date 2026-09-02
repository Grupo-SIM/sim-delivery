import { Img, Section } from "@react-email/components";
import { emailBranding } from "@/shared/infra/branding";
import { emailColors } from "./theme";

function initials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map(word => word[0]?.toUpperCase())
		.join("");
}

/** App badge + wordmark, matching the frontend BrandMark on the email header surface. */
export function EmailBrandMark() {
	return (
		<Section>
			<table cellPadding="0" cellSpacing="0" style={{ borderCollapse: "collapse" }}>
				<tr>
					<td style={{ backgroundColor: emailColors.surface, borderRadius: "12px", padding: "4px" }}>
						{emailBranding.logoUrl ? (
							<Img
								alt={emailBranding.companyName}
								height="36"
								src={emailBranding.logoUrl}
								style={{ borderRadius: "8px", display: "block", objectFit: "contain" }}
								width="36"
							/>
						) : (
							<div
								style={{
									alignItems: "center",
									backgroundColor: emailColors.surfaceMuted,
									borderRadius: "8px",
									color: emailColors.primary,
									display: "inline-flex",
									fontSize: "13px",
									fontWeight: "800",
									height: "36px",
									justifyContent: "center",
									lineHeight: "36px",
									textAlign: "center",
									width: "36px",
								}}
							>
								{initials(emailBranding.companyName)}
							</div>
						)}
					</td>
					<td style={{ paddingLeft: "12px" }}>
						<span
							style={{
								color: emailColors.primaryForeground,
								fontSize: "20px",
								fontWeight: "800",
								letterSpacing: "0.02em",
							}}
						>
							{emailBranding.companyName}
						</span>
					</td>
				</tr>
			</table>
		</Section>
	);
}
