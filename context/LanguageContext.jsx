// context/LanguageContext.jsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import React, { createContext, useContext, useEffect, useState } from "react";
import i18n from "../locales";

const LANGUAGE_KEY = "selected_language";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState("es");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedLanguage();
  }, []);

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

  const loadSavedLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      let targetLanguage = "es"; // default fallback

      if (savedLanguage && ["en", "es"].includes(savedLanguage)) {
        targetLanguage = savedLanguage;
      } else {
        // Detectar idioma del dispositivo de forma segura
        targetLanguage = getDeviceLanguage();
      }

      setCurrentLanguage(targetLanguage);
      i18n.locale = targetLanguage;
    } catch (error) {
      console.error("Error loading language:", error);
      setCurrentLanguage("es");
      i18n.locale = "es";
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (language) => {
    if (!["en", "es"].includes(language)) {
      console.warn("Invalid language:", language);
      return;
    }

    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
      setCurrentLanguage(language);
      i18n.locale = language;
    } catch (error) {
      console.error("Error saving language:", error);
    }
  };

  const t = (key, options = {}) => {
    try {
      return i18n.t(key, options);
    } catch (error) {
      console.warn("Translation error for key:", key, error);
      return key; // Fallback to key if translation fails
    }
  };

  const contextValue = {
    currentLanguage,
    changeLanguage,
    t,
    isLoading,
    availableLanguages: [
      { code: "es", name: "Español", flag: "🇪🇸" },
      { code: "en", name: "English", flag: "🇺🇸" },
    ],
  };

  if (isLoading) {
    return null; // o un componente de loading
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
