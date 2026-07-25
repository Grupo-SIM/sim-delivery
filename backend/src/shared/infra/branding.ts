export interface EmailBranding {
	companyName: string;
	logoUrl: string | null;
	primaryColor: string;
	primaryForegroundColor: string;
}

export const emailBranding: EmailBranding = {
	companyName: "Zero Grau",
	logoUrl: null,
	primaryColor: "#dc3a00",
	primaryForegroundColor: "#ffffff",
};
