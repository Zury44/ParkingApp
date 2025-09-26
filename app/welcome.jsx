// app/welcome.jsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../components/CustomButton";
import LanguageSheet from "../components/LanguageSheet";
import { colors } from "../config/theme";
import { typography } from "../config/typography";
import { useLanguage } from "../context/LanguageContext";
import { useSession } from "../context/SessionContext";

export default function WelcomeScreen() {
  const router = useRouter();
  const { token, tokenEsValido } = useSession();
  const {
    t,
    currentLanguage,
    changeLanguage,
    availableLanguages,
    isLoading: languageLoading,
  } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      if (languageLoading) return;

      try {
        const isAuthenticated = token && tokenEsValido();

        if (isAuthenticated) {
          router.replace("/parking-selector");
          return;
        }
      } catch (error) {
        console.error("Error verificando autenticación:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token !== null && !languageLoading) {
      checkAuthAndRedirect();
    } else if (!languageLoading) {
      setIsLoading(false);
    }
  }, [token, tokenEsValido, router, languageLoading]);

  const handleLanguageChange = async (language) => {
    await changeLanguage(language);
    setShowLanguageModal(false);
  };

  if (isLoading || languageLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Image
            source={require("../assets/images/logo.png")}
            style={styles.loadingLogo}
            resizeMode="contain"
          />
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Contenido principal */}
        <View style={styles.topContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoContainer}>
              <Text
                style={{
                  ...typography.bold.big,
                  fontSize: 28,
                  color: colors.tertiary,
                }}
              >
                ParkingApp
              </Text>
            </View>
          </View>

          {/* Imagen ilustración */}
          <Image
            source={require("../assets/images/uscologo.png")}
            style={styles.image}
            resizeMode="contain"
          />

          {/* Texto bienvenida */}
          <Text style={styles.welcomeText}>
            {t("welcome.title", { appName: "ParkingApp" })}
          </Text>

          <Text style={styles.subtitle}>{t("welcome.subtitle")}</Text>

          {/* Selector de idioma */}
          <TouchableOpacity
            style={styles.languageSelector}
            onPress={() => setShowLanguageModal(true)}
          >
            <Ionicons name="language-outline" size={16} color={colors.gray} />
            <Text style={styles.languageText}>{t("welcome.language")}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.gray} />
          </TouchableOpacity>
        </View>

        {/* Contenedor de botones */}
        <View style={styles.buttonContainer}>
          <CustomButton
            text={t("welcome.register")}
            route="/register"
            variant="secondary"
            //icon="arrow-forward"
          />

          <CustomButton
            text={t("welcome.signIn")}
            route="/login"
            variant="primary"
            //icon="arrow-forward"
          />
        </View>
      </ScrollView>

      {/* Modal de selección de idioma */}
      <LanguageSheet
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
        languages={availableLanguages}
        currentLanguage={currentLanguage}
        onSelect={handleLanguageChange}
        t={t}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    ...typography.medium.medium,
    marginTop: 20,
    color: colors.textSec,
  },
  topContent: {
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
    paddingTop: 10,
  },
  logo: {
    width: 130,
    height: 150,
  },
  image: {
    width: 130,
    height: 130,
    marginTop: 40,
    marginBottom: 12,
  },
  welcomeText: {
    ...typography.bold.big,
    fontSize: 25,
    textAlign: "center",
    marginBottom: 10,
    marginTop: 40,
    color: colors.tertiary,
  },
  subtitle: {
    ...typography.regular.large,
    color: colors.textSec,
    textAlign: "center",
    paddingHorizontal: 24,
    marginBottom: 30,
    lineHeight: 22,
  },
  languageSelector: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    gap: 16,
    marginTop: 10,
  },
  languageText: {
    ...typography.regular.large,
    color: colors.textSec,
  },
  buttonContainer: {
    width: "100%",
    gap: 20,
    marginTop: 10,
    marginBottom: 85,
    alignItems: "center",
  },
});
