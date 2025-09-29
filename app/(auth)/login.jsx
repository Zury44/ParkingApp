// app/(auth)/login.jsx
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useLanguage } from "../../context/LanguageContext";
import { useSession } from "../../context/SessionContext";

const {
  EXPO_PUBLIC_API_URL: API_URL,
  EXPO_PUBLIC_API_URL_LOGIN: API_URL_LOGIN,
  eas,
} = Constants.expoConfig.extra;

const LAST_EMAIL_KEY = "@last_login_email";
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { setUsername, guardarSesionCompleta } = useSession();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [rememberEmail, setRememberEmail] = useState(true);

  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(LAST_EMAIL_KEY);
      if (savedEmail) setCorreo(savedEmail);
    } catch (error) {
      console.log("Error cargando email:", error);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const handleInputChange = (field) => (value) => {
    field === "email" ? setCorreo(value) : setContrasena(value);
    setErrors((prev) => ({ ...prev, [field]: null, general: null }));
  };

  const validateForm = () => {
    if (!correo.trim()) {
      setErrors({ email: t("validation.emailRequired") });
      return false;
    }
    if (!contrasena.trim()) {
      setErrors({ password: t("validation.passwordRequired") });
      return false;
    }
    if (!validateEmail(correo)) {
      setErrors({ email: t("validation.emailInvalid") });
      return false;
    }
    return true;
  };

  const handleEmailStorage = async () => {
    try {
      if (rememberEmail) {
        await AsyncStorage.setItem(LAST_EMAIL_KEY, correo.trim());
      } else {
        await AsyncStorage.removeItem(LAST_EMAIL_KEY);
      }
    } catch (error) {
      console.log("Error con email storage:", error);
    }
  };

  const handleUserStateRedirect = (usuarioEstado) => {
    if (usuarioEstado === 2) {
      router.replace("/registro-persona");
      return true;
    }
    if (usuarioEstado === 3) {
      router.replace("/registro-empresa");
      return true;
    }
    return false;
  };

  const saveSession = async (data) => {
    const { token, empresaId, rolId, rolesByCompany } = data;

    await setUsername(correo.trim());

    const empresaActual =
      rolesByCompany.find(
        (e) => e.empresaId === empresaId && e.rolId === rolId
      ) || rolesByCompany[0];

    if (!empresaActual) {
      console.warn("No se encontró empresa, usando primera disponible");
    }

    await guardarSesionCompleta({
      token,
      empresaId: empresaActual.empresaId,
      rolId: empresaActual.rolId,
      empresaNombre: empresaActual.empresaNombre,
      rolNombre: empresaActual.rolNombre,
      rolesByCompany,
    });
  };

  const configurarNotificacionesPush = async (userEmail) => {
    if (!Device.isDevice) return;

    try {
      const Notifications = await import("expo-notifications");

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      let { status } = await Notifications.getPermissionsAsync();

      if (status !== "granted") {
        ({ status } = await Notifications.requestPermissionsAsync());
      }

      if (status === "granted") {
        const pushToken = (
          await Notifications.getExpoPushTokenAsync({
            projectId: eas?.projectId || "local/FrontendMovil",
          })
        ).data;

        await fetch(`${API_URL}/notifications/token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userEmail, token: pushToken }),
        });

        Notifications.addNotificationReceivedListener((notification) => {
          console.log("Notificación recibida:", notification);
        });
      }
    } catch (error) {
      console.error("Error configurando notificaciones:", error);
    }
  };

  const getErrorMessage = (err) => {
    const statusErrors = {
      401: "loginFailed",
      404: "accountNotFound",
      400: "invalidData",
    };

    if (err.response?.status && statusErrors[err.response.status]) {
      return t(`errors.${statusErrors[err.response.status]}`);
    }

    if (
      err.message?.includes("Network Error") ||
      err.code === "NETWORK_ERROR"
    ) {
      return t("errors.networkError");
    }

    if (err.message?.includes("timeout")) {
      return t("errors.connectionTimeout");
    }

    return t("errors.unknownError");
  };

  const handleLogin = async () => {
    if (isLoading || !validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}${API_URL_LOGIN}`, {
        username: correo.trim(),
        password: contrasena,
      });

      const { token, empresaId, rolId, rolesByCompany, usuarioEstado } =
        response.data;

      if (!token) {
        setErrors({ general: "Error: No se recibió token del servidor" });
        return;
      }

      await handleEmailStorage();

      if (handleUserStateRedirect(usuarioEstado)) return;

      if (!rolesByCompany?.length) {
        setErrors({ general: t("errors.noAssociatedCompanies") });
        return;
      }

      await saveSession(response.data);
      await configurarNotificacionesPush(correo.trim());

      router.replace("/parking-selector");
    } catch (err) {
      console.error("Error en login:", err);
      setErrors({ general: getErrorMessage(err) });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingEmail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.logoContainer, { marginTop: insets.top }]}>
          <Ionicons name="car-outline" size={64} color={colors.secondary} />
        </View>
        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.logoContainer, { marginTop: insets.top }]}>
        <Text style={styles.appTitle}>ParkingApp</Text>
      </View>

      <Text style={styles.title}>{t("auth.loginTitle")}</Text>

      {errors.general && (
        <Text style={styles.generalError}>{errors.general}</Text>
      )}

      <CustomInput
        label={t("auth.email")}
        placeholder={t("auth.enterEmail")}
        value={correo}
        onChangeText={handleInputChange("email")}
        icon="mail-outline"
        keyboardType="email-address"
        editable={!isLoading}
        error={errors.email}
      />

      <CustomInput
        label={t("auth.password")}
        placeholder={t("auth.enterPassword")}
        value={contrasena}
        onChangeText={handleInputChange("password")}
        icon="lock-closed-outline"
        secureTextEntry
        showPasswordToggle
        editable={!isLoading}
        error={errors.password}
      />

      <View style={styles.optionsRow}>
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setRememberEmail(!rememberEmail)}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Ionicons
            name={rememberEmail ? "checkbox" : "square-outline"}
            size={20}
            color={rememberEmail ? colors.secondary : colors.textSec}
          />
          <Text style={styles.rememberText}>{t("auth.rememberMe")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/forgotPassword")}
          disabled={isLoading}
        >
          <Text style={styles.forgotPasswordText}>
            {t("auth.forgotPassword")}
          </Text>
        </TouchableOpacity>
      </View>

      <CustomButton
        text={isLoading ? t("auth.loggingIn") : t("auth.login")}
        onPress={handleLogin}
        variant="primary"
        icon={!isLoading ? "arrow-forward" : null}
        disabled={isLoading}
        fullWidth
        style={{ marginTop: 20 }}
      />

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>{t("auth.orContinueWith")}</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{t("auth.dontHaveAccount")} </Text>
        <TouchableOpacity
          onPress={() => router.push("/register")}
          disabled={isLoading}
        >
          <Text style={styles.registerLink}>{t("auth.signUp")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: colors.white,
  },
  logoContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
    marginBottom: 20,
  },
  appTitle: {
    ...typography.bold.big,
    fontSize: 28,
    color: colors.tertiary,
  },
  title: {
    ...typography.bold.big,
    fontSize: 26,
    marginTop: 8,
    marginBottom: 16,
    color: colors.tertiary,
  },
  loadingText: {
    textAlign: "center",
    color: colors.textSec,
    marginTop: 20,
    ...typography.regular.regular,
  },
  generalError: {
    color: colors.red,
    marginBottom: 16,
    textAlign: "center",
    ...typography.regular.regular,
    backgroundColor: colors.errorLight || "#ffebee",
    padding: 12,
    borderRadius: 8,
  },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rememberText: {
    marginLeft: 6,
    fontSize: 13,
    color: colors.textSec,
    ...typography.regular.medium,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: colors.secondary,
    ...typography.semibold.regular,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: 10,
    color: colors.textSec,
    ...typography.regular.medium,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
  },
  footerText: {
    color: colors.textSec,
    ...typography.regular.medium,
  },
  registerLink: {
    color: colors.secondary,
    ...typography.semibold.regular,
  },
});
