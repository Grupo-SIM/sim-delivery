import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR.json";

export const supportedLngs = ["pt-BR"] as const;
export type SupportedLanguage = (typeof supportedLngs)[number];

if (!i18n.isInitialized) {
	i18n
		.use(LanguageDetector)
		.use(initReactI18next)
		.init({
			defaultNS: "common",
			detection: {
				caches: ["localStorage"],
				lookupLocalStorage: "lang",
				order: ["localStorage", "navigator", "htmlTag"],
			},
			fallbackLng: "pt-BR",
			interpolation: { escapeValue: false },
			load: "currentOnly",
			resources: {
				"pt-BR": ptBR,
			},
			supportedLngs: [...supportedLngs],
		});
}

export default i18n;
