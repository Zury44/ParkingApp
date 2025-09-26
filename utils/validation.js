// utils/validation.js

/**
 * Valida formato de email
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Evalúa la fortaleza de la contraseña y retorna feedback
 * @param {string} password
 * @param {function} t - función de traducción
 * @returns {object} { score, feedback, isValid }
 */
export const getPasswordStrength = (password, t) => {
  let score = 0;
  let feedback = [];
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  // Evaluar cada requisito
  Object.entries(requirements).forEach(([key, passed]) => {
    if (passed) {
      score += 1;
    } else {
      feedback.push(t(`password.requirements.${key}`));
    }
  });

  const isValid = score === 4;
  const message = isValid
    ? t("password.secure")
    : t("password.missing", { items: feedback.join(", ") });

  return {
    score,
    feedback,
    isValid,
    message,
    requirements,
  };
};

/**
 * Valida los datos del formulario de login
 * @param {object} formData - { email, password }
 * @param {function} t - función de traducción
 * @returns {object} { isValid, errors }
 */
export const validateLoginForm = (formData, t) => {
  const errors = {};
  let isValid = true;

  // Validar email
  if (!formData.email?.trim()) {
    errors.email = t("validation.emailRequired");
    isValid = false;
  } else if (!validateEmail(formData.email)) {
    errors.email = t("validation.emailInvalid");
    isValid = false;
  }

  // Validar contraseña
  if (!formData.password?.trim()) {
    errors.password = t("validation.passwordRequired");
    isValid = false;
  }

  return { isValid, errors };
};

/**
 * Valida los datos del formulario de registro
 * @param {object} formData - { email, password, confirmPassword?, fullName? }
 * @param {function} t - función de traducción
 * @returns {object} { isValid, errors, passwordStrength }
 */
export const validateRegisterForm = (formData, t) => {
  const errors = {};
  let isValid = true;

  // Validar email
  if (!formData.email?.trim()) {
    errors.email = t("validation.emailRequired");
    isValid = false;
  } else if (!validateEmail(formData.email)) {
    errors.email = t("validation.emailInvalid");
    isValid = false;
  }

  // Validar contraseña
  const passwordStrength = getPasswordStrength(formData.password || "", t);
  if (!formData.password?.trim()) {
    errors.password = t("validation.passwordRequired");
    isValid = false;
  } else if (!passwordStrength.isValid) {
    errors.password = passwordStrength.message;
    isValid = false;
  }

  // Validar confirmación de contraseña (si está presente)
  if (formData.confirmPassword !== undefined) {
    if (!formData.confirmPassword?.trim()) {
      errors.confirmPassword = t("validation.confirmPasswordRequired");
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = t("validation.passwordsDontMatch");
      isValid = false;
    }
  }

  // Validar nombre completo (si está presente)
  if (formData.fullName !== undefined) {
    if (!formData.fullName?.trim()) {
      errors.fullName = t("validation.fullNameRequired");
      isValid = false;
    } else if (formData.fullName.trim().length < 2) {
      errors.fullName = t("validation.fullNameMinLength");
      isValid = false;
    }
  }

  return { isValid, errors, passwordStrength };
};

/**
 * Maneja errores de la API y retorna mensaje traducido
 * @param {Error} error
 * @param {function} t - función de traducción
 * @param {string} defaultKey - clave por defecto si no se encuentra el error
 * @returns {string}
 */
export const getErrorMessage = (
  error,
  t,
  defaultKey = "errors.unknownError"
) => {
  // Errores HTTP específicos
  if (error.response?.status === 401) {
    return t("errors.loginFailed");
  } else if (error.response?.status === 404) {
    return t("errors.accountNotFound");
  } else if (error.response?.status === 400) {
    return t("errors.invalidData");
  } else if (error.response?.status >= 500) {
    return t("errors.serverError");
  }

  // Errores de conexión
  if (
    error.message?.includes("Network Error") ||
    error.code === "NETWORK_ERROR"
  ) {
    return t("errors.networkError");
  } else if (error.message?.includes("timeout")) {
    return t("errors.connectionTimeout");
  }

  // Si hay un mensaje específico del servidor, usarlo
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  // Mensaje por defecto
  return t(defaultKey);
};
