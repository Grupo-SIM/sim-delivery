import "i18next";
import type ptBR from "./locales/pt-BR.json";

declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: "common";
		resources: typeof ptBR;
	}
}
