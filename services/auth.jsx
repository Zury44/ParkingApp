// services/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
const TOKEN_KEY = "token";
const REFRESH_KEY = "refresh_token";
const USERNAME_KEY = "username";
const EMPRESA_KEY = "empresaSeleccionada";
const ROLES_KEY = "rolesByCompany";
// ---------------------
// TOKENS
// ---------------------
export async function saveTokens(token, refreshToken = null) {
  const entries = [[TOKEN_KEY, token]];
  if (refreshToken) entries.push([REFRESH_KEY, refreshToken]);
  await AsyncStorage.multiSet(entries);
}
export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function getRefreshToken() {
  return AsyncStorage.getItem(REFRESH_KEY);
}
export async function clearTokens() {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_KEY]);
}
// ---------------------
// USERNAME
// ---------------------
export async function saveUsername(username) {
  await AsyncStorage.setItem(USERNAME_KEY, username);
}
export async function getUsername() {
  return AsyncStorage.getItem(USERNAME_KEY);
}
// ---------------------
// EMPRESAS Y ROLES
// ---------------------
export async function saveEmpresaSeleccionada(contexto) {
  await AsyncStorage.setItem(EMPRESA_KEY, JSON.stringify(contexto));
}
export async function getEmpresaSeleccionada() {
  const raw = await AsyncStorage.getItem(EMPRESA_KEY);
  return raw ? JSON.parse(raw) : null;
}
export async function saveRolesByCompany(roles) {
  await AsyncStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}
export async function getRolesByCompany() {
  const raw = await AsyncStorage.getItem(ROLES_KEY);
  return raw ? JSON.parse(raw) : [];
}
export async function clearSessionData() {
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    REFRESH_KEY,
    USERNAME_KEY,
    EMPRESA_KEY,
    ROLES_KEY,
  ]);
}
