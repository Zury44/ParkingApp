// context/SessionContext.jsx
import axios from "axios";
import Constants from "expo-constants";
import { createContext, useContext, useEffect, useState } from "react";
import {
  clearSessionData,
  getEmpresaSeleccionada,
  getRolesByCompany,
  getToken,
  getUsername,
  saveEmpresaSeleccionada,
  saveRolesByCompany,
  saveTokens,
  saveUsername,
} from "../services/auth";

// Casting seguro de `extra`
const API_URL = Constants.expoConfig?.extra?.API_URL ?? "";

// -------------------------
// Contexto de sesión
// -------------------------
const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState(null);
  const [rolesByCompany, setRolesByCompany] = useState([]);
  const [token, setTokenState] = useState(null);
  const [username, setUsernameState] = useState(null);

  // -------------------------
  //   GUARDAR SESIÓN COMPLETA
  // -------------------------
  const guardarSesionCompleta = async ({
    token,
    empresaId,
    rolId,
    empresaNombre,
    rolNombre,
    rolesByCompany,
    refreshToken = null,
  }) => {
    if (!token || !empresaId || !rolId) {
      throw new Error("Token, empresaId y rolId son requeridos");
    }

    // Guardar tokens
    await saveTokens(token, refreshToken);
    setTokenState(token);

    // Guardar username
    if (username) {
      await saveUsername(username);
    }

    // Guardar empresa seleccionada
    const contexto = {
      empresaId,
      rolId,
      empresaNombre: empresaNombre || "Sin nombre",
      rolNombre: rolNombre || "Sin rol",
    };
    await saveEmpresaSeleccionada(contexto);
    setEmpresaSeleccionada(contexto);

    // Guardar roles
    const rolesValidos = rolesByCompany || [];
    await saveRolesByCompany(rolesValidos);
    setRolesByCompany(rolesValidos);
  };

  // -------------------------
  //   CAMBIAR CONTEXTO
  // -------------------------
  const cambiarContexto = async (
    empresaId,
    rolId,
    rememberAsDefault = true
  ) => {
    try {
      const response = await axios.post(
        `${API_URL}/auth/switch-context`,
        { empresaId, rolId, rememberAsDefault },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { token: newToken, refreshToken } = response.data;

      const empresaInfo = rolesByCompany.find(
        (item) => item.empresaId === empresaId && item.rolId === rolId
      );

      await guardarSesionCompleta({
        token: newToken,
        refreshToken,
        empresaId,
        rolId,
        empresaNombre: empresaInfo?.empresaNombre,
        rolNombre: empresaInfo?.rolNombre,
        rolesByCompany,
      });

      return true;
    } catch (error) {
      console.error("Error cambiando contexto:", error);
      if (error.response?.status === 403) {
        throw new Error("No tienes acceso a ese rol/empresa.");
      }
      throw new Error("Error al cambiar contexto. Intenta nuevamente.");
    }
  };

  // -------------------------
  //   CARGAR SESIÓN INICIAL
  // -------------------------
  useEffect(() => {
    const cargarSesion = async () => {
      try {
        const savedToken = await getToken();
        const savedUsername = await getUsername();
        const savedEmpresa = await getEmpresaSeleccionada();
        const savedRoles = await getRolesByCompany();

        if (savedToken) setTokenState(savedToken);
        if (savedUsername) setUsernameState(savedUsername);
        if (savedEmpresa) setEmpresaSeleccionada(savedEmpresa);
        if (savedRoles) setRolesByCompany(savedRoles);
      } catch (error) {
        console.error("Error cargando la sesión:", error);
      }
    };
    cargarSesion();
  }, []);

  // -------------------------
  //   CERRAR SESIÓN
  // -------------------------
  const cerrarSesion = async () => {
    await clearSessionData();
    setTokenState(null);
    setUsernameState(null);
    setEmpresaSeleccionada(null);
    setRolesByCompany([]);
  };

  // -------------------------
  //   HELPERS
  // -------------------------
  const tieneMultiplesOpciones = () => rolesByCompany.length > 1;

  const decodificarToken = (tokenParam = null) => {
    const tokenADecodificar = tokenParam || token;
    if (!tokenADecodificar) return null;
    try {
      const payload = tokenADecodificar.split(".")[1];
      return JSON.parse(atob(payload));
    } catch (error) {
      console.error("Error decodificando token:", error);
      return null;
    }
  };

  const tokenEsValido = () => {
    const claims = decodificarToken();
    if (!claims) return false;
    const ahora = Math.floor(Date.now() / 1000);
    return claims.exp > ahora;
  };

  const contextValue = {
    empresaSeleccionada,
    setEmpresaSeleccionada,
    rolesByCompany,
    setRolesByCompany,
    token,
    username,
    setUsername: setUsernameState,

    guardarSesionCompleta,
    cambiarContexto,
    cerrarSesion,

    tieneMultiplesOpciones,
    decodificarToken,
    tokenEsValido,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession debe ser usado dentro de un SessionProvider");
  }
  return context;
};
