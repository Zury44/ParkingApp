// locales/index.js
import * as Localization from "expo-localization";
import { I18n } from "i18n-js";
import en from "./en.json";
import es from "./es.json";

// Configurar i18n
const i18n = new I18n({
  en,
  es,
});

// Detectar idioma de forma segura
const getDeviceLanguage = () => {
  try {
    const locale =
      Localization.locale ||
      Localization.getLocales()?.[0]?.languageCode ||
      "es";
    const language = locale.split("-")[0];
    return ["en", "es"].includes(language) ? language : "es";
  } catch (error) {
    console.warn("Error detecting device language:", error);
    return "es";
  }
};

// Configurar idioma por defecto
i18n.defaultLocale = "es";
i18n.locale = getDeviceLanguage();
i18n.enableFallback = true;

export default i18n;
