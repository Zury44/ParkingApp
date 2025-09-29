import Constants from "expo-constants";

// ========================================
// IMPORTAR JSON DESDE CARPETA /data
// ========================================

// Importar configuraciones estructurales desde /data
let sedePrincipalConfig = null;
let medicinaConfig = null;
let sedePrincipalStates = null;
let medicinaStates = null;

try {
  sedePrincipalConfig = require("../data/sede_principal_p1.json");
} catch (e) {
  console.warn("No se encontró sede_principal_p1.json en /data");
}

try {
  medicinaConfig = require("../data/parqueadero_medicina_p1.json");
} catch (e) {
  console.warn("No se encontró parqueadero_medicina_p1.json en /data");
}

try {
  sedePrincipalStates = require("../data/sede_principal_p1_states.json");
} catch (e) {
  console.warn("No se encontró sede_principal_p1_states.json en /data");
}

try {
  medicinaStates = require("../data/parqueadero_medicina_p1_states.json");
} catch (e) {
  console.warn("No se encontró parqueadero_medicina_p1_states.json en /data");
}

// Mapear configuraciones locales
const LOCAL_PARKING_CONFIGS = {};
const LOCAL_PARKING_STATES = {};

if (sedePrincipalConfig) {
  LOCAL_PARKING_CONFIGS["sede_principal_p1"] = sedePrincipalConfig;
  LOCAL_PARKING_CONFIGS["sede_central_p1"] = sedePrincipalConfig;
}

if (medicinaConfig) {
  LOCAL_PARKING_CONFIGS["parqueadero_medicina_p1"] = medicinaConfig;
  LOCAL_PARKING_CONFIGS["medicina_p1"] = medicinaConfig;
}

if (sedePrincipalStates) {
  LOCAL_PARKING_STATES["sede_principal_p1"] = sedePrincipalStates;
  LOCAL_PARKING_STATES["sede_central_p1"] = sedePrincipalStates;
}

if (medicinaStates) {
  LOCAL_PARKING_STATES["parqueadero_medicina_p1"] = medicinaStates;
  LOCAL_PARKING_STATES["medicina_p1"] = medicinaStates;
}

// ========================================
// CONFIGURACIÓN ORIGINAL
// ========================================

// Configuración de endpoints por parqueadero
const PARKING_ENDPOINTS = {
  sede_principal_p1: Constants.expoConfig.extra.EXPO_PUBLIC_PARKING_CENTRAL,
  sede_central_p1: Constants.expoConfig.extra.EXPO_PUBLIC_PARKING_CENTRAL,
  parqueadero_medicina_p1:
    Constants.expoConfig.extra.EXPO_PUBLIC_PARKING_MEDICINA,
  medicina_p1: Constants.expoConfig.extra.EXPO_PUBLIC_PARKING_MEDICINA,
};

// Configuración de endpoints para estados dinámicos
const STATE_ENDPOINTS = {
  sede_principal_p1: Constants.expoConfig.extra.EXPO_PUBLIC_ESTADOS_CENTRAL,
  sede_central_p1: Constants.expoConfig.extra.EXPO_PUBLIC_ESTADOS_CENTRAL,
  //parqueadero_medicina_p1: Constants.expoConfig.extra.EXPO_PUBLIC_ESTADOS_MEDICINA,
  //medicina_p1: Constants.expoConfig.extra.EXPO_PUBLIC_ESTADOS_MEDICINA,
};

// Mapeo de IDs principales (evitar duplicados)
const PRIMARY_PARKING_IDS = {
  sede_principal_p1: "sede_principal_p1",
  sede_central_p1: "sede_principal_p1",
  parqueadero_medicina_p1: "parqueadero_medicina_p1",
  medicina_p1: "parqueadero_medicina_p1",
};

// Cache para configuraciones estructurales
let PARKING_CONFIGS = {};

// Cache para estados dinámicos
let PARKING_STATES = {};

// ========================================
// FUNCIONES DE FALLBACK LOCAL
// ========================================

/**
 * Obtiene configuración local desde /data
 */
const getLocalParkingConfig = (parkingId) => {
  const config = LOCAL_PARKING_CONFIGS[parkingId];
  if (config) {
    console.log(`📂 Usando configuración local desde /data para ${parkingId}`);
    return {
      ...JSON.parse(JSON.stringify(config)), // Deep clone
      _source: "local_data",
      _loadedAt: new Date().toISOString(),
      _isLocal: true,
    };
  }

  console.warn(`⚠️ No se encontró configuración local para ${parkingId}`);
  return null;
};

/**
 * Obtiene estados locales desde /data
 */
const getLocalParkingStates = (parkingId) => {
  const states = LOCAL_PARKING_STATES[parkingId];
  if (states) {
    console.log(`📂 Usando estados locales desde /data para ${parkingId}`);
    return {
      ...JSON.parse(JSON.stringify(states)), // Deep clone
      _source: "local_data",
      _loadedAt: new Date().toISOString(),
      _isLocal: true,
    };
  }

  console.warn(`⚠️ No se encontraron estados locales para ${parkingId}`);
  return null;
};

/**
 * Procesa estados desde datos locales
 */
const processLocalStates = (parkingId) => {
  const localStates = getLocalParkingStates(parkingId);

  if (!localStates) {
    console.warn(`⚠️ No hay estados locales disponibles para ${parkingId}`);
    return null;
  }

  let estados = {};

  if (localStates.secciones && Array.isArray(localStates.secciones)) {
    localStates.secciones.forEach((seccion) => {
      if (seccion.subsecciones && Array.isArray(seccion.subsecciones)) {
        seccion.subsecciones.forEach((subseccion) => {
          if (
            subseccion.puntos_parqueo &&
            Array.isArray(subseccion.puntos_parqueo)
          ) {
            subseccion.puntos_parqueo.forEach((punto) => {
              const espacioId = `seccion_${seccion.id}_sub_${subseccion.id}_punto_${punto.id}`;
              const estadoOriginal = punto.estado;
              const estadoMapeado = mapearEstadoEndpoint(estadoOriginal);

              estados[espacioId] = {
                estado: estadoMapeado,
                estadoOriginal: estadoOriginal,
                lastUpdated: new Date().toISOString(),
                seccionId: seccion.id,
                subseccionId: subseccion.id,
                puntoId: punto.id,
              };
            });
          }
        });
      }
    });
  }

  const stateData = {
    estados,
    colores: localStates.estado_color || {},
    _endpoint: "local_data",
    _loadedAt: new Date().toISOString(),
    _parkingId: parkingId,
    _rawData: localStates,
    _isLocal: true,
  };

  // Guardar en cache
  PARKING_STATES[parkingId] = stateData;

  console.log(
    `✅ Estados locales procesados para ${parkingId}: ${
      Object.keys(estados).length
    } espacios`
  );
  return stateData;
};

// ========================================
// FUNCIONES PRINCIPALES MODIFICADAS
// ========================================

/**
 * MAPEO DE ESTADOS - Convierte estados del endpoint a estados de la app
 */
const mapearEstadoEndpoint = (estadoEndpoint) => {
  const mapeoEstados = {
    desocupado: "disponible",
    ocupado: "ocupado",
    reservado: "reservado",
  };
  return mapeoEstados[estadoEndpoint] || "disponible";
};

const mapearEstadoAppAEndpoint = (estadoApp) => {
  const mapeo = {
    disponible: "desocupado",
    ocupado: "ocupado",
    reservado: "reservado",
  };
  return mapeo[estadoApp] || "desocupado";
};

/**
 * Obtiene el ID principal de un parqueadero (evita duplicados)
 */
const getPrimaryParkingId = (parkingId) => {
  return PRIMARY_PARKING_IDS[parkingId] || parkingId;
};

/**
 * Obtiene el endpoint de configuración para un parqueadero
 */
const getParkingEndpoint = (parkingId) => {
  return PARKING_ENDPOINTS[parkingId] || PARKING_ENDPOINTS["sede_principal_p1"];
};

/**
 * Obtiene el endpoint de estados para un parqueadero
 */
const getStateEndpoint = (parkingId) => {
  return STATE_ENDPOINTS[parkingId] || null;
};

/**
 * ACTUALIZADO: Carga estados con fallback local
 */
const loadParkingStates = async (parkingId, forceRefresh = false) => {
  try {
    const stateEndpoint = getStateEndpoint(parkingId);

    if (!stateEndpoint) {
      console.warn(
        `⚠️ No hay endpoint de estados configurado para ${parkingId}, usando datos locales`
      );
      return processLocalStates(parkingId);
    }

    // Si ya está en cache y no se fuerza refresh, usar cache
    if (!forceRefresh && PARKING_STATES[parkingId]) {
      console.log(`📋 Usando estados de cache para ${parkingId}`);
      return PARKING_STATES[parkingId];
    }

    console.log(
      `🔄 Intentando cargar estados desde ${stateEndpoint} para ${parkingId}...`
    );

    try {
      const response = await fetch(stateEndpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 2000,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📦 Datos del endpoint de estados:`, data);

      // Procesar datos del endpoint
      let estados = {};

      if (data.secciones && Array.isArray(data.secciones)) {
        console.log(
          `🏗️ Procesando ${data.secciones.length} secciones del endpoint...`
        );

        data.secciones.forEach((seccion, seccionIndex) => {
          if (seccion.subsecciones && Array.isArray(seccion.subsecciones)) {
            seccion.subsecciones.forEach((subseccion, subseccionIndex) => {
              if (
                subseccion.puntos_parqueo &&
                Array.isArray(subseccion.puntos_parqueo)
              ) {
                subseccion.puntos_parqueo.forEach((punto) => {
                  const espacioId = `seccion_${seccion.id}_sub_${subseccion.id}_punto_${punto.id}`;
                  const estadoOriginal = punto.estado;
                  const estadoMapeado = mapearEstadoEndpoint(estadoOriginal);

                  estados[espacioId] = {
                    estado: estadoMapeado,
                    estadoOriginal: estadoOriginal,
                    lastUpdated: new Date().toISOString(),
                    seccionId: seccion.id,
                    subseccionId: subseccion.id,
                    puntoId: punto.id,
                  };

                  console.log(
                    `🚗 Punto procesado: S${seccion.id}SS${subseccion.id}P${punto.id} - ${estadoOriginal} → ${estadoMapeado}`
                  );
                });
              }
            });
          }
        });
      }

      // Procesar colores si están disponibles
      let colores = {};
      if (data.estado_color && typeof data.estado_color === "object") {
        Object.keys(data.estado_color).forEach((estadoOriginal) => {
          const estadoMapeado = mapearEstadoEndpoint(estadoOriginal);
          colores[estadoMapeado] = data.estado_color[estadoOriginal];
        });
        console.log(`🎨 Colores procesados:`, colores);
      }

      // Crear objeto de estado completo
      const stateData = {
        estados,
        colores,
        _endpoint: stateEndpoint,
        _loadedAt: new Date().toISOString(),
        _parkingId: parkingId,
        _rawData: data,
        _isLocal: false,
      };

      // Guardar en cache
      PARKING_STATES[parkingId] = stateData;

      console.log(
        `✅ Estados cargados desde endpoint para ${parkingId}: ${
          Object.keys(estados).length
        } espacios`
      );
      return stateData;
    } catch (fetchError) {
      console.warn(`⚠️ Error cargando desde endpoint: ${fetchError.message}`);
      console.log(`📂 Fallback: usando estados locales para ${parkingId}`);
      return processLocalStates(parkingId);
    }
  } catch (error) {
    console.error(
      `❌ Error general cargando estados para ${parkingId}:`,
      error.message
    );

    // Usar cache como último recurso
    if (PARKING_STATES[parkingId]) {
      console.log(
        `📋 Usando estados de cache como último recurso para ${parkingId}`
      );
      return PARKING_STATES[parkingId];
    }

    // Si no hay cache, usar estados locales
    return processLocalStates(parkingId);
  }
};

/**
 * Carga solo la configuración estructural con fallback local
 */
const loadStructuralConfig = async (parkingId, forceRefresh = false) => {
  try {
    const endpoint = getParkingEndpoint(parkingId);

    // Verificar si hay configuración local disponible antes de intentar endpoint
    const hasLocalConfig = !!LOCAL_PARKING_CONFIGS[parkingId];

    if (!hasLocalConfig) {
      console.warn(
        `⚠️ No hay configuración local para ${parkingId} - este parqueadero se omitirá si el endpoint falla`
      );
    }

    console.log(
      `🏗️ Intentando cargar estructura desde ${endpoint} para ${parkingId}...`
    );

    try {
      // Usar Promise.race para timeout más agresivo
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Timeout - Endpoint no responde")),
          1000
        );
      });

      const fetchPromise = fetch(endpoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`📊 Datos estructurales recibidos del endpoint:`, data);

      // Procesar respuesta según el formato
      let config = null;

      if (Array.isArray(data)) {
        config = data.find((parking) => parking.id === parkingId) || data[0];
      } else if (data && typeof data === "object") {
        config = data;
      }

      if (!config) {
        throw new Error(
          `No se encontraron datos estructurales en el endpoint para ${parkingId}`
        );
      }

      // Normalizar estructura de datos
      config = normalizeDataStructure(config);

      // Asegurar propiedades básicas
      if (!config.id) config.id = parkingId;
      if (!validateMinimalConfig(config)) {
        throw new Error(
          `Configuración estructural inválida del endpoint para ${parkingId}`
        );
      }

      // Agregar metadata
      config._endpoint = endpoint;
      config._loadedAt = new Date().toISOString();
      config._isLocal = false;

      console.log(
        `✅ Configuración estructural cargada desde endpoint para ${parkingId}`
      );
      return config;
    } catch (fetchError) {
      console.warn(`⚠️ Error cargando desde endpoint: ${fetchError.message}`);

      if (hasLocalConfig) {
        console.log(
          `📂 Fallback: usando configuración local para ${parkingId}`
        );

        // Usar configuración local como fallback
        const localConfig = getLocalParkingConfig(parkingId);

        if (!localConfig) {
          throw new Error(
            `No hay configuración local disponible para ${parkingId}`
          );
        }

        // Normalizar estructura de datos local
        const normalizedConfig = normalizeDataStructure(localConfig);

        // Asegurar propiedades básicas
        if (!normalizedConfig.id) normalizedConfig.id = parkingId;
        if (!validateMinimalConfig(normalizedConfig)) {
          throw new Error(`Configuración local inválida para ${parkingId}`);
        }

        // Agregar metadata
        normalizedConfig._endpoint = "local_data";
        normalizedConfig._loadedAt = new Date().toISOString();
        normalizedConfig._isLocal = true;

        console.log(
          `✅ Configuración estructural cargada desde /data para ${parkingId}`
        );
        return normalizedConfig;
      } else {
        console.warn(
          `❌ No hay fallback local para ${parkingId} - parqueadero omitido`
        );
        throw new Error(
          `Sin endpoint ni configuración local para ${parkingId}`
        );
      }
    }
  } catch (error) {
    console.error(
      `❌ Error general cargando estructura para ${parkingId}:`,
      error.message
    );
    return null;
  }
};

/**
 * Normaliza la estructura de datos - convierte secciones a zonas
 */
const normalizeDataStructure = (data) => {
  if (!data) return data;

  // Si ya tiene zonas, no hacer nada
  if (data.zonas && Array.isArray(data.zonas)) {
    return data;
  }

  // Si tiene secciones, convertir a zonas
  if (data.secciones && Array.isArray(data.secciones)) {
    console.log(
      "🔄 Convirtiendo estructura de secciones a zonas para compatibilidad"
    );

    const zonas = [];

    data.secciones.forEach((seccion) => {
      if (seccion.subsecciones && Array.isArray(seccion.subsecciones)) {
        seccion.subsecciones.forEach((subseccion) => {
          // Crear una zona por cada subsección
          const zona = {
            id: `seccion_${seccion.id}_sub_${subseccion.id}`,
            nombre: `${seccion.nombre || `Sección ${seccion.id}`} - ${
              subseccion.nombre || `Subsección ${subseccion.id}`
            }`,
            descripcion: subseccion.descripcion || seccion.descripcion,
            posicion: subseccion.posicion || {
              x: (seccion.id - 1) * 300 + (subseccion.id - 1) * 150 + 50,
              y: (seccion.id - 1) * 200 + (subseccion.id - 1) * 120 + 50,
            },
            dimensiones: subseccion.dimensiones || {
              width:
                Math.min(4, subseccion.puntos_parqueo?.length || 1) * 50 + 20,
              height:
                Math.ceil((subseccion.puntos_parqueo?.length || 1) / 4) * 45 +
                20,
            },
            estilo: subseccion.estilo || {
              fill: "rgba(255, 193, 7, 0.1)",
              stroke: "#FFC107",
              strokeWidth: 3,
            },
            // Metadatos adicionales
            _seccionId: seccion.id,
            _seccionNombre: seccion.nombre || `Sección ${seccion.id}`,
            _seccionAcronimo: seccion.acronimo || `S${seccion.id}`,
            _subseccionId: subseccion.id,
            espacios: [],
          };

          // Convertir puntos_parqueo a espacios
          if (
            subseccion.puntos_parqueo &&
            Array.isArray(subseccion.puntos_parqueo)
          ) {
            zona.espacios = subseccion.puntos_parqueo.map((punto, index) => {
              const espaciosPorFila = Math.min(
                4,
                subseccion.puntos_parqueo.length
              );
              const fila = Math.floor(index / espaciosPorFila);
              const columna = index % espaciosPorFila;

              return {
                id: `seccion_${seccion.id}_sub_${subseccion.id}_punto_${punto.id}`,
                posicion: punto.posicion || {
                  x: columna * 50 + 10,
                  y: fila * 45 + 10,
                },
                dimensiones: punto.dimensiones || {
                  width: 45,
                  height: 35,
                },
                estado: "disponible", // Estado por defecto - se actualiza después con loadParkingStates
                tipo: punto.tipo || "regular",
                descripcion: punto.descripcion,
                poligono: punto.poligono,
                estilo: punto.estilo || {
                  stroke: "#ffffff",
                  strokeWidth: 2,
                  rx: 3,
                },
                // Metadatos del punto original
                _puntoId: punto.id,
                _seccionId: seccion.id,
                _subseccionId: subseccion.id,
              };
            });
          }

          zonas.push(zona);
        });
      }
    });

    // Reemplazar secciones con zonas convertidas
    const convertedData = {
      ...data,
      zonas,
      // Mantener secciones originales para referencia
      _secciones_originales: data.secciones,
    };

    // Eliminar secciones ya que ahora tenemos zonas
    delete convertedData.secciones;

    console.log(
      `✅ Convertidas ${data.secciones.length} secciones en ${zonas.length} zonas`
    );
    return convertedData;
  }

  return data;
};

/**
 * ACTUALIZADO: Combina configuración estructural con estados dinámicos
 */
const mergeConfigWithStates = (config, stateData) => {
  if (!config || !stateData) {
    console.log(
      "📋 No se pueden combinar config y states - uno de ellos es null"
    );
    return config;
  }

  const { estados } = stateData;
  const mergedConfig = { ...config };

  console.log(
    `🔗 Combinando configuración con ${Object.keys(estados).length} estados...`
  );

  // Actualizar estados en las zonas
  if (mergedConfig.zonas) {
    let espaciosActualizados = 0;

    mergedConfig.zonas.forEach((zona) => {
      if (zona.espacios) {
        zona.espacios.forEach((espacio) => {
          // Buscar estado por ID exacto
          const estadoInfo = estados[espacio.id];

          if (estadoInfo) {
            espacio.estado = estadoInfo.estado;
            espacio.lastUpdated = estadoInfo.lastUpdated;
            espacio._estadoOriginal = estadoInfo.estadoOriginal;
            espaciosActualizados++;

            console.log(
              `✅ Estado actualizado: ${espacio.id} → ${estadoInfo.estado}`
            );
          } else {
            console.log(`⚠️ No se encontró estado para: ${espacio.id}`);
          }
        });
      }
    });

    console.log(
      `🔗 ${espaciosActualizados} espacios actualizados con estados del ${
        stateData._isLocal ? "archivo local" : "endpoint"
      }`
    );
  }

  // Agregar metadata de estados
  mergedConfig._estados = {
    endpoint: stateData._endpoint,
    loadedAt: stateData._loadedAt,
    totalStates: Object.keys(estados).length,
    colores: stateData.colores || {},
    isLocal: stateData._isLocal || false,
  };

  return mergedConfig;
};

/**
 * Carga la configuración completa de un parqueadero (estructura + estados)
 */
export const loadParkingConfig = async (parkingId, forceRefresh = false) => {
  try {
    console.log(`🚗 Cargando configuración completa para ${parkingId}`);

    // Cargar configuración estructural y estados en paralelo
    const [structuralConfig, stateData] = await Promise.all([
      loadStructuralConfig(parkingId, forceRefresh),
      loadParkingStates(parkingId, forceRefresh),
    ]);

    if (!structuralConfig) {
      console.error(
        `❌ No se pudo cargar configuración estructural para ${parkingId}`
      );
      return null;
    }

    // Combinar configuración con estados (si existen)
    const completeConfig = mergeConfigWithStates(structuralConfig, stateData);

    // Guardar configuración completa en cache
    PARKING_CONFIGS[parkingId] = completeConfig;

    console.log(`✅ Configuración completa cargada para ${parkingId}:`, {
      zonas: completeConfig.zonas?.length || 0,
      espacios: getTotalSpaces(completeConfig),
      estados: stateData ? Object.keys(stateData.estados).length : 0,
      estructura: completeConfig._secciones_originales ? "secciones" : "zonas",
      tieneEstados: !!stateData,
      esLocal: completeConfig._isLocal || (stateData && stateData._isLocal),
    });

    return completeConfig;
  } catch (error) {
    console.error(
      `❌ Error cargando configuración completa para ${parkingId}:`,
      error.message
    );

    // Intentar usar cache como fallback
    if (PARKING_CONFIGS[parkingId]) {
      console.log(`📋 Usando configuración de cache para ${parkingId}`);
      return PARKING_CONFIGS[parkingId];
    }

    return null;
  }
};

/**
 * ACTUALIZADO: Actualiza el estado de un espacio específico
 */
export const updateSpaceStatus = async (parkingId, spaceId, newStatus) => {
  try {
    console.log(
      `🔄 Actualizando estado de ${spaceId} a ${newStatus} en ${parkingId}`
    );

    // Extraer información del spaceId
    const match = spaceId.match(/seccion_(\d+)_sub_(\d+)_punto_(\d+)/);
    if (!match) {
      console.warn(`⚠️ Formato de spaceId no reconocido: ${spaceId}`);
    }

    const stateEndpoint = getStateEndpoint(parkingId);
    const estadoEndpoint = mapearEstadoAppAEndpoint(newStatus);

    // Solo intentar actualizar en API si hay endpoint de estados y no es local
    if (stateEndpoint && match && !PARKING_STATES[parkingId]?._isLocal) {
      const [, seccionId, subseccionId, puntoId] = match;

      try {
        // Intentar actualizar en el endpoint
        const updateUrl = `${stateEndpoint.replace(
          "/estados/",
          "/update/"
        )}/${seccionId}/${subseccionId}/${puntoId}`;
        console.log(`📡 Enviando actualización a: ${updateUrl}`);

        const response = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            estado: estadoEndpoint,
            timestamp: new Date().toISOString(),
          }),
          timeout: 1000,
        });

        if (response.ok) {
          console.log(`✅ Estado actualizado en API`);
        } else {
          console.warn(`⚠️ Error en API: ${response.status}`);
        }
      } catch (apiError) {
        console.warn(`⚠️ Error conectando con API: ${apiError.message}`);
      }
    } else if (PARKING_STATES[parkingId]?._isLocal) {
      console.log(
        `📂 Usando datos locales - no se puede actualizar en servidor`
      );
    }

    // Actualizar cache de estados local
    if (PARKING_STATES[parkingId]) {
      PARKING_STATES[parkingId].estados[spaceId] = {
        estado: newStatus,
        estadoOriginal: estadoEndpoint,
        lastUpdated: new Date().toISOString(),
      };
    }

    // Actualizar configuración completa en cache
    const config = PARKING_CONFIGS[parkingId];
    if (config?.zonas) {
      for (const zona of config.zonas) {
        if (zona.espacios) {
          const espacio = zona.espacios.find((e) => e.id === spaceId);
          if (espacio) {
            espacio.estado = newStatus;
            espacio.lastUpdated = new Date().toISOString();
            console.log(
              `✅ Estado actualizado en configuración cache: ${spaceId}`
            );
            break;
          }
        }
      }
    }

    return true;
  } catch (error) {
    console.error("❌ Error actualizando estado del espacio:", error.message);
    return false;
  }
};

/**
 * Obtiene el total de espacios en un parqueadero
 */
const getTotalSpaces = (config) => {
  let total = 0;
  if (config?.zonas && Array.isArray(config.zonas)) {
    config.zonas.forEach((zona) => {
      if (zona.espacios && Array.isArray(zona.espacios)) {
        total += zona.espacios.length;
      }
    });
  }
  return total;
};

/**
 * Obtiene estadísticas de un parqueadero
 */
export const getParkingStats = (config) => {
  const stats = {
    total: 0,
    disponibles: 0,
    ocupados: 0,
    reservados: 0,
    mantenimiento: 0,
    otros: 0,
  };

  if (!config?.zonas || !Array.isArray(config.zonas)) {
    return stats;
  }

  config.zonas.forEach((zona) => {
    if (zona.espacios && Array.isArray(zona.espacios)) {
      zona.espacios.forEach((espacio) => {
        stats.total++;

        switch (espacio.estado) {
          case "disponible":
            stats.disponibles++;
            break;
          case "ocupado":
            stats.ocupados++;
            break;
          case "reservado":
            stats.reservados++;
            break;
          case "mantenimiento":
            stats.mantenimiento++;
            break;
          default:
            stats.otros++;
        }
      });
    }
  });

  return stats;
};

/**
 * Lista todos los parqueaderos disponibles con estadísticas
 */
export const getAvailableParkings = async (forceRefresh = false) => {
  try {
    const parkings = await loadAllParkings(forceRefresh);

    return parkings.map((config) => {
      const stats = getParkingStats(config);

      return {
        id: config.id,
        nombre: config.nombre || config.id,
        descripcion: config.descripcion || "Parqueadero disponible",
        totalEspacios: stats.total,
        disponibles: stats.disponibles,
        ocupados: stats.ocupados,
        reservados: stats.reservados,
        mantenimiento: stats.mantenimiento,
        icono: getIconForParking(config.id),
        endpoint: config._endpoint || "No especificado",
        estadosEndpoint: config._estados?.endpoint || "No configurado",
        lastUpdated: config._loadedAt || new Date().toISOString(),
        estructura: config._secciones_originales ? "secciones" : "zonas",
        isLocal: config._isLocal || false,
        estadosLocales: config._estados?.isLocal || false,
      };
    });
  } catch (error) {
    console.error("❌ Error obteniendo parqueaderos:", error);
    return [];
  }
};

/**
 * Obtiene el icono apropiado para un parqueadero
 */
const getIconForParking = (parkingId) => {
  if (!parkingId) return "car-outline";

  const id = parkingId.toLowerCase();

  if (id.includes("medicina") || id.includes("medical")) {
    return "medical-outline";
  }
  if (id.includes("principal") || id.includes("central")) {
    return "business-outline";
  }
  if (id.includes("norte")) {
    return "location-outline";
  }
  if (id.includes("sur")) {
    return "map-outline";
  }
  if (id.includes("centro")) {
    return "storefront-outline";
  }

  return "car-outline";
};

/**
 * Test de conectividad para todos los endpoints
 */
export const testAllEndpoints = async () => {
  const structuralEndpoints = [...new Set(Object.values(PARKING_ENDPOINTS))];
  const stateEndpoints = [...new Set(Object.values(STATE_ENDPOINTS))];
  const allEndpoints = [...structuralEndpoints, ...stateEndpoints];

  const results = {};

  console.log(
    "🔍 Probando conectividad de endpoints estructurales y de estados..."
  );

  for (const endpoint of allEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        timeout: 1000,
      });

      results[endpoint] = {
        online: response.ok,
        status: response.status,
        statusText: response.statusText,
        type: structuralEndpoints.includes(endpoint) ? "structural" : "states",
        timestamp: new Date().toISOString(),
      };

      console.log(
        `📡 ${endpoint}: ${response.ok ? "ONLINE" : "OFFLINE"} (${
          response.status
        }) [${results[endpoint].type}]`
      );
    } catch (error) {
      results[endpoint] = {
        online: false,
        error: error.message,
        type: structuralEndpoints.includes(endpoint) ? "structural" : "states",
        timestamp: new Date().toISOString(),
      };

      console.log(
        `📡 ${endpoint}: OFFLINE (${error.message}) [${results[endpoint].type}]`
      );
    }
  }

  return results;
};

/**
 * Función de DEBUG específica para el endpoint de estados con fallback local
 */
export const debugStateEndpoint = async (parkingId) => {
  const endpoint = getStateEndpoint(parkingId);

  if (!endpoint) {
    console.log(
      `📂 No hay endpoint de estados para ${parkingId}, mostrando datos locales...`
    );
    const localStates = getLocalParkingStates(parkingId);

    if (localStates) {
      console.group(`🐛 DEBUG: Estados locales de ${parkingId}`);
      console.log("📂 Fuente: Configuración local desde /data");
      console.log("📦 Datos locales:", localStates);

      if (localStates.secciones) {
        localStates.secciones.forEach((seccion) => {
          console.group(`Sección ${seccion.id}`);
          seccion.subsecciones?.forEach((sub) => {
            console.log(
              `Subsección ${sub.id}: ${sub.puntos_parqueo?.length || 0} puntos`
            );
            sub.puntos_parqueo?.slice(0, 3).forEach((punto) => {
              console.log(`  Punto ${punto.id}: ${punto.estado}`);
            });
          });
          console.groupEnd();
        });
      }

      console.groupEnd();
    } else {
      console.error(`❌ No hay datos locales disponibles para ${parkingId}`);
    }
    return;
  }

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    console.group(`🐛 DEBUG: Estados de ${parkingId}`);
    console.log("📡 Endpoint:", endpoint);
    console.log("📦 Datos raw:", data);

    if (data.secciones) {
      data.secciones.forEach((seccion) => {
        console.group(`Sección ${seccion.id}`);
        seccion.subsecciones?.forEach((sub) => {
          console.log(
            `Subsección ${sub.id}: ${sub.puntos_parqueo?.length || 0} puntos`
          );
          sub.puntos_parqueo?.slice(0, 3).forEach((punto) => {
            console.log(`  Punto ${punto.id}: ${punto.estado}`);
          });
        });
        console.groupEnd();
      });
    }

    console.groupEnd();
  } catch (error) {
    console.error(
      "Error en debug del endpoint, probando datos locales:",
      error
    );

    const localStates = getLocalParkingStates(parkingId);
    if (localStates) {
      console.group(`🐛 DEBUG FALLBACK: Estados locales de ${parkingId}`);
      console.log("📂 Usando datos locales como fallback");
      console.log("📦 Datos locales:", localStates);
      console.groupEnd();
    }
  }
};

/**
 * Función para verificar qué archivos están disponibles en /data
 */
export const getLocalDataStatus = () => {
  const status = {
    configs: {
      sede_principal_p1: !!LOCAL_PARKING_CONFIGS["sede_principal_p1"],
      parqueadero_medicina_p1:
        !!LOCAL_PARKING_CONFIGS["parqueadero_medicina_p1"],
    },
    states: {
      sede_principal_p1: !!LOCAL_PARKING_STATES["sede_principal_p1"],
      parqueadero_medicina_p1:
        !!LOCAL_PARKING_STATES["parqueadero_medicina_p1"],
    },
    total: {
      configs: Object.keys(LOCAL_PARKING_CONFIGS).length,
      states: Object.keys(LOCAL_PARKING_STATES).length,
    },
  };

  console.group("📂 Estado de archivos locales en /data");
  console.log("Configuraciones disponibles:", status.configs);
  console.log("Estados disponibles:", status.states);
  console.log("Total archivos cargados:", status.total);
  console.groupEnd();

  return status;
};

/**
 * Función para verificar si un parqueadero está usando datos locales
 */
export const isParkingUsingLocalData = (parkingId) => {
  const config = PARKING_CONFIGS[parkingId];
  const states = PARKING_STATES[parkingId];

  return {
    config: config?._isLocal || false,
    states: states?._isLocal || false,
    both: (config?._isLocal || false) && (states?._isLocal || false),
    sources: {
      config: config?._endpoint || "no cargado",
      states: states?._endpoint || "no cargado",
    },
  };
};

/**
 * Función para obtener información detallada de fuentes de datos
 */
export const getDataSources = () => {
  const sources = {};

  // Revisar configuraciones cargadas
  Object.keys(PARKING_CONFIGS).forEach((parkingId) => {
    const config = PARKING_CONFIGS[parkingId];
    const states = PARKING_STATES[parkingId];

    sources[parkingId] = {
      config: {
        source: config?._isLocal ? "local_data" : "endpoint",
        endpoint: config?._endpoint || "N/A",
        loadedAt: config?._loadedAt || "N/A",
        available: !!config,
      },
      states: {
        source: states?._isLocal ? "local_data" : "endpoint",
        endpoint: states?._endpoint || "N/A",
        loadedAt: states?._loadedAt || "N/A",
        available: !!states,
      },
    };
  });

  return sources;
};

/**
 * Limpia todos los caches
 */
export const clearCache = () => {
  PARKING_CONFIGS = {};
  PARKING_STATES = {};
  console.log("🗑️ Todos los caches limpiados (configuraciones y estados)");
};

/**
 * Debug completo del sistema de fallback
 */
export const debugLocalFallbackSystem = () => {
  console.group("🐛 DEBUG: Sistema de Fallback Local");

  // Estado de archivos locales
  const localStatus = getLocalDataStatus();

  // Fuentes de datos actuales
  const dataSources = getDataSources();
  console.log("📊 Fuentes de datos actuales:", dataSources);

  // Endpoints configurados
  console.log("🌐 Endpoints estructurales:", PARKING_ENDPOINTS);
  console.log("📡 Endpoints de estados:", STATE_ENDPOINTS);

  // Mapeo de IDs
  console.log("🗂️ Mapeo de IDs principales:", PRIMARY_PARKING_IDS);

  console.groupEnd();

  return {
    localStatus,
    dataSources,
    endpoints: {
      structural: PARKING_ENDPOINTS,
      states: STATE_ENDPOINTS,
    },
    idMapping: PRIMARY_PARKING_IDS,
  };
};

// Exportar configuraciones para debugging
export {
  getLocalParkingConfig,
  getLocalParkingStates,
  LOCAL_PARKING_CONFIGS,
  LOCAL_PARKING_STATES,
  PARKING_CONFIGS,
  PARKING_ENDPOINTS,
  PARKING_STATES,
  PRIMARY_PARKING_IDS,
  STATE_ENDPOINTS,
};

/**
 * Carga todos los parqueaderos con sus estados - SIN DUPLICADOS
 */
export const loadAllParkings = async (forceRefresh = false) => {
  try {
    console.log("🌐 Cargando todos los parqueaderos con estados...");

    const uniquePrimaryIds = [...new Set(Object.values(PRIMARY_PARKING_IDS))];
    console.log(`📋 IDs principales únicos: ${uniquePrimaryIds.join(", ")}`);

    // ✅ AGREGAR ESTO - Filtrar antes de intentar cargar
    const availableParkingIds = uniquePrimaryIds.filter((parkingId) => {
      const hasLocalConfig = !!LOCAL_PARKING_CONFIGS[parkingId];
      const hasEndpoint = !!PARKING_ENDPOINTS[parkingId];

      if (!hasLocalConfig && !hasEndpoint) {
        console.warn(
          `⚠️ Omitiendo ${parkingId}: sin configuración local ni endpoint`
        );
        return false;
      }

      return true;
    });

    console.log(
      `📋 Parqueaderos disponibles: ${availableParkingIds.join(", ")}`
    );

    const allParkings = [];

    // ✅ Usar la lista filtrada
    for (const primaryId of availableParkingIds) {
      try {
        console.log(`🔄 Cargando parqueadero principal: ${primaryId}`);
        const config = await loadParkingConfig(primaryId, forceRefresh);
        if (config) {
          allParkings.push(config);
        }
      } catch (error) {
        console.warn(`⚠️ Error cargando ${primaryId}:`, error.message);
      }
    }

    console.log(`✅ ${allParkings.length} parqueaderos cargados`);
    return allParkings;
  } catch (error) {
    console.error("❌ Error cargando parqueaderos:", error.message);
    return Object.values(PARKING_CONFIGS);
  }
};

/**
 * Validación mínima
 */
const validateMinimalConfig = (config) => {
  if (!config || typeof config !== "object") {
    console.error("Config debe ser un objeto");
    return false;
  }

  if (!config.id && !config.nombre) {
    console.error("Config debe tener al menos id o nombre");
    return false;
  }

  if (!config.nombre && config.id) {
    config.nombre = config.id;
  }

  if (!config.id && config.nombre) {
    config.id = config.nombre.toLowerCase().replace(/\s+/g, "_");
  }

  return true;
};
