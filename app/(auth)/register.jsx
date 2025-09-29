// app/(auth)/register.jsx
import axios from "axios";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import CustomButton from "../../components/CustomButton";
import CustomInput from "../../components/CustomInput";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useLanguage } from "../../context/LanguageContext";
import {
  getErrorMessage,
  getPasswordStrength,
  validateRegisterForm,
} from "../../utils/validation";

const { API_URL } = Constants.expoConfig.extra;

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);

  const handleInputChange = (field, value) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }

    // Actualizar evaluación de contraseña en tiempo real
    if (field === "password") {
      const strength = getPasswordStrength(value, t);
      setPasswordStrength(strength);
    }
  };

  const handleRegister = async () => {
    if (loading) return;

    setLoading(true);
    setErrors({});

    // Validar formulario
    const validation = validateRegisterForm(formData, t);

    if (!validation.isValid) {
      setErrors(validation.errors);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username: formData.email.trim(),
        password: formData.password,
      });

      const data = response.data;

      if (data.success) {
        // Mostrar alerta de éxito
        Alert.alert(
          t("success.registrationComplete"),
          t("success.confirmationEmailSent"),
          [
            {
              text: t("success.understood"),
              onPress: () => router.push("/login"),
            },
          ]
        );
      } else {
        setErrors({
          general: data.message || t("errors.registerFailed"),
        });
      }
    } catch (err) {
      console.error("ERROR:", err.response?.data || err.message);
      const errorMessage = getErrorMessage(err, t, "errors.registerFailed");
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
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
      <Text style={styles.title}>{t("auth.registerTitle")}</Text>

      {/* Error general */}
      {errors.general && (
        <Text style={styles.generalError}>{errors.general}</Text>
      )}

      <CustomInput
        label={t("auth.email")}
        placeholder={t("auth.enterEmail")}
        value={formData.email}
        onChangeText={(value) => handleInputChange("email", value)}
        icon="mail-outline"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
        error={errors.email}
      />

      <CustomInput
        label={t("auth.password")}
        placeholder={t("auth.enterPassword")}
        value={formData.password}
        onChangeText={(value) => handleInputChange("password", value)}
        icon="lock-closed-outline"
        secureTextEntry={true}
        showPasswordToggle={true}
        editable={!loading}
        error={errors.password}
      />

      {/* Evaluación visual de contraseña */}
      {formData.password !== "" && passwordStrength && (
        <View style={styles.passwordStrengthContainer}>
          <Text
            style={[
              styles.passwordStrength,
              {
                color: passwordStrength.isValid
                  ? colors.success
                  : colors.secondary,
              },
            ]}
          >
            {passwordStrength.message}
          </Text>
          {/* Barra de progreso visual */}
          <View style={styles.strengthBar}>
            {[1, 2, 3, 4].map((level) => (
              <View
                key={level}
                style={[
                  styles.strengthSegment,
                  {
                    backgroundColor:
                      level <= passwordStrength.score
                        ? passwordStrength.score >= 3
                          ? colors.success
                          : colors.warning
                        : colors.lightGray,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      )}

      {/* Botón de registro */}
      <CustomButton
        text={loading ? t("auth.registering") : t("auth.register")}
        onPress={handleRegister}
        variant="primary"
        icon={!loading ? "arrow-forward" : null}
        disabled={loading}
        fullWidth
        style={styles.registerButton}
      />

      {/* Link al login */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>{t("auth.alreadyHaveAccount")} </Text>
        <TouchableOpacity
          onPress={() => router.replace("/login")}
          disabled={loading}
        >
          <Text style={styles.linkText}>{t("auth.signIn")}</Text>
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
    marginTop: 25,
    marginBottom: 20,
  },
  title: {
    ...typography.bold.large,
    fontSize: 26,
    marginTop: 10,
    marginBottom: 20,
    color: colors.text,
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
  passwordStrengthContainer: {
    marginTop: -8,
    marginBottom: 12,
  },
  passwordStrength: {
    marginBottom: 8,
    ...typography.medium.small,
  },
  strengthBar: {
    flexDirection: "row",
    gap: 4,
    height: 4,
  },
  strengthSegment: {
    flex: 1,
    borderRadius: 2,
  },
  registerButton: {
    marginTop: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  footerText: {
    color: colors.textSec,
    ...typography.regular.medium,
  },
  linkText: {
    color: colors.secondary,
    ...typography.semibold.regular,
  },
});
