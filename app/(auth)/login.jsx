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
const projectId = eas?.projectId;

// Clave para AsyncStorage
const LAST_EMAIL_KEY = "@last_login_email";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [errors, setErrors] = useState({}); // Cambio: objeto en vez de string
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEmail, setIsLoadingEmail] = useState(true);
  const [rememberEmail, setRememberEmail] = useState(true);

  const { setUsername, guardarSesionCompleta } = useSession();

  // Cargar email guardado al iniciar la pantalla
  useEffect(() => {
    loadSavedEmail();
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(LAST_EMAIL_KEY);
      if (savedEmail) {
        setCorreo(savedEmail);
        setRememberEmail(true);
      } else {
        setRememberEmail(true);
      }
    } catch (error) {
      console.log("Error cargando email guardado:", error);
    } finally {
      setIsLoadingEmail(false);
    }
  };

  const saveEmail = async (email) => {
    try {
      await AsyncStorage.setItem(LAST_EMAIL_KEY, email);
    } catch (error) {
      console.log("Error guardando email:", error);
    }
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Funciones para limpiar errores individuales cuando usuario escribe
  const handleEmailChange = (value) => {
    setCorreo(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: null }));
    }
    // También limpiar error general si existe
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  const handlePasswordChange = (value) => {
    setContrasena(value);
    if (errors.password) {
      setErrors((prev) => ({ ...prev, password: null }));
    }
    // También limpiar error general si existe
    if (errors.general) {
      setErrors((prev) => ({ ...prev, general: null }));
    }
  };

  const handleLogin = async () => {
    if (isLoading) return;

    setErrors({}); // Cambio: limpiar objeto
    setIsLoading(true);

    // Validaciones que asignan a campos específicos
    if (!correo.trim()) {
      setErrors({ email: t("validation.emailRequired") });
      setIsLoading(false);
      return;
    }

    if (!contrasena.trim()) {
      setErrors({ password: t("validation.passwordRequired") });
      setIsLoading(false);
      return;
    }

    if (!validateEmail(correo)) {
      setErrors({ email: t("validation.emailInvalid") });
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}${API_URL_LOGIN}`, {
        username: correo.trim(),
        password: contrasena,
      });

      const { token, empresaId, rolId, rolesByCompany, usuarioEstado } =
        response.data;

      if (!token) {
        setErrors({ general: "Error: No se recibió token del servidor" });
        setIsLoading(false);
        return;
      }

      // Guardar email solo si el usuario quiere recordarlo
      if (rememberEmail) {
        await saveEmail(correo.trim());
      } else {
        await AsyncStorage.removeItem(LAST_EMAIL_KEY);
      }

      // Validaciones de estado del usuario
      if (usuarioEstado === 2) {
        router.replace("/registro-persona");
        setIsLoading(false);
        return;
      } else if (usuarioEstado === 3) {
        router.replace("/registro-empresa");
        setIsLoading(false);
        return;
      }

      if (!rolesByCompany || rolesByCompany.length === 0) {
        setErrors({ general: t("errors.noAssociatedCompanies") });
        setIsLoading(false);
        return;
      }

      await setUsername(correo.trim());

      const empresaActual = rolesByCompany.find(
        (empresa) => empresa.empresaId === empresaId && empresa.rolId === rolId
      );

      if (!empresaActual) {
        console.warn(
          "No se encontró empresa actual, usando primera disponible"
        );
        const primeraEmpresa = rolesByCompany[0];
        await guardarSesionCompleta({
          token,
          empresaId: primeraEmpresa.empresaId,
          rolId: primeraEmpresa.rolId,
          empresaNombre: primeraEmpresa.empresaNombre,
          rolNombre: primeraEmpresa.rolNombre,
          rolesByCompany,
        });
      } else {
        await guardarSesionCompleta({
          token,
          empresaId,
          rolId,
          empresaNombre: empresaActual.empresaNombre,
          rolNombre: empresaActual.rolNombre,
          rolesByCompany,
        });
      }

      await configurarNotificacionesPush(correo.trim());

      router.replace("/parking-selector");
    } catch (err) {
      console.error("Error en login:", err);
      console.error("Detalles del error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      // Manejo de errores - todos van como error general
      let errorMessage;
      if (err.response?.status === 401) {
        errorMessage = t("errors.loginFailed");
      } else if (err.response?.status === 404) {
        errorMessage = t("errors.accountNotFound");
      } else if (err.response?.status === 400) {
        errorMessage = t("errors.invalidData");
      } else if (
        err.message?.includes("Network Error") ||
        err.code === "NETWORK_ERROR"
      ) {
        errorMessage = t("errors.networkError");
      } else if (err.message?.includes("timeout")) {
        errorMessage = t("errors.connectionTimeout");
      } else {
        errorMessage = t("errors.unknownError");
      }

      setErrors({ general: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // Notificaciones Push con importación dinámica
  const configurarNotificacionesPush = async (userEmail) => {
    try {
      if (!Device.isDevice) {
        console.log(
          "No es un dispositivo físico, saltando notificaciones push"
        );
        return;
      }

      const Notifications = await import("expo-notifications");

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (finalStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus === "granted") {
        const pushToken = (
          await Notifications.getExpoPushTokenAsync({
            projectId: projectId || "local/FrontendMovil",
          })
        ).data;

        console.log("Token de notificaciones obtenido:", pushToken);

        const notificationEndpoint = `${API_URL}/notifications/token`;

        await fetch(notificationEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userEmail,
            token: pushToken,
          }),
        });

        const subscription = Notifications.addNotificationReceivedListener(
          (notification) => {
            console.log("Notificación recibida:", notification);
          }
        );
      } else {
        console.log("Permisos de notificaciones denegados");
      }
    } catch (error) {
      console.error("Error configurando notificaciones push:", error);
    }
  };

  // Mostrar loading mientras carga el email
  if (isLoadingEmail) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.logoContainer, { marginTop: insets.top + 0 }]}>
          <View style={[styles.logoContainer, { marginTop: insets.top + 0 }]}>
            <Ionicons name="car-outline" size={64} color={colors.secondary} />
          </View>
        </View>

        <Text style={styles.loadingText}>{t("common.loading")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.logoContainer, { marginTop: insets.top + 0 }]}>
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

      <Text style={styles.title}>{t("auth.loginTitle")}</Text>

      {/* Error general para errores de servidor */}
      {errors.general && (
        <Text style={styles.generalError}>{errors.general}</Text>
      )}

      <CustomInput
        label={t("auth.email")}
        placeholder={t("auth.enterEmail")}
        value={correo}
        onChangeText={handleEmailChange} // Cambio: función que limpia errores
        icon="mail-outline"
        keyboardType="email-address"
        editable={!isLoading}
        error={errors.email} // Cambio: error específico del campo (se pone rojo)
      />

      <CustomInput
        label={t("auth.password")}
        placeholder={t("auth.enterPassword")}
        value={contrasena}
        onChangeText={handlePasswordChange} // Cambio: función que limpia errores
        icon="lock-closed-outline"
        secureTextEntry={true}
        showPasswordToggle={true}
        editable={!isLoading}
        error={errors.password} // Cambio: error específico del campo (se pone rojo)
      />

      {/* Fila con checkbox "Recordarme" y link "Olvidaste contraseña" */}
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
    paddingTop: 0,
    backgroundColor: colors.white,
  },
  logoContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 20,
    marginBottom: 20,
  },
  title: {
    ...typography.bold.big,
    fontSize: 26,
    marginTop: 8,
    marginBottom: 16,
    color: colors.tertiary,
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
  loadingText: {
    textAlign: "center",
    color: colors.textSec,
    marginTop: 20,
    ...typography.regular.regular,
  },
  // Error general para errores de servidor
  generalError: {
    color: colors.red,
    marginBottom: 16,
    textAlign: "center",
    ...typography.regular.regular,
    backgroundColor: colors.errorLight || "#ffebee",
    padding: 12,
    borderRadius: 8,
  },
  // Estilos para la fila con checkbox y forgot password
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
    textAlign: "right",
    ...typography.semibold.regular,
  },
});
