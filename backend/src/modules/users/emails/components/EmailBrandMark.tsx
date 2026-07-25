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
					<td>
						{emailBranding.logoUrl ? (
							<Img
								alt={emailBranding.companyName}
								height="32"
								src={emailBranding.logoUrl}
								style={{ borderRadius: "4px", display: "block", objectFit: "contain" }}
								width="32"
							/>
						) : (
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
								{initials(emailBranding.companyName)}
							</div>
						)}
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
							{emailBranding.companyName}
						</span>
					</td>
				</tr>
			</table>
		</Section>
	);
}
