import Constants from "expo-constants";
// Configuración de endpoints por parqueadero
const PARKING_ENDPOINTS = {
  sede_principal_p1: Constants.expoConfig.extra.EXPO_PUBLIC_PARKING_CENTRAL,
  sede_central_p1: Constants.expoConfig.extra.EXPO_PUBLIC_PARKING_CENTRAL,
  // Parqueadero Medicina - Configuración estructural
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
  sede_principal_p1: "sede_principal_p1", // Este es el principal
  sede_central_p1: "sede_principal_p1", // Mapea al principal
  parqueadero_medicina_p1: "parqueadero_medicina_p1", // Este es el principal
  medicina_p1: "parqueadero_medicina_p1", // Mapea al principal
};
// Cache para configuraciones estructurales
let PARKING_CONFIGS = {};

// Cache para estados dinámicos
let PARKING_STATES = {};

/**
 * MAPEO DE ESTADOS - Convierte estados del endpoint a estados de la app
 */
const mapearEstadoEndpoint = (estadoEndpoint) => {
  const mapeoEstados = {
    desocupado: "disponible", // desocupado → disponible
    ocupado: "ocupado", // ocupado → ocupado (igual)
    reservado: "reservado", // reservado → reservado (igual)
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
 * ACTUALIZADO: Carga estados desde el formato real del endpoint
 */
const loadParkingStates = async (parkingId, forceRefresh = false) => {
  try {
    const stateEndpoint = getStateEndpoint(parkingId);

    if (!stateEndpoint) {
      console.warn(
        `⚠️ No hay endpoint de estados configurado para ${parkingId}`
      );
      return null;
    }

    // Si ya está en cache y no se fuerza refresh, usar cache
    if (!forceRefresh && PARKING_STATES[parkingId]) {
      console.log(`📋 Usando estados de cache para ${parkingId}`);
      return PARKING_STATES[parkingId];
    }

    console.log(
      `🔄 Cargando estados desde ${stateEndpoint} para ${parkingId}...`
    );

    const response = await fetch(stateEndpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📦 Datos del endpoint de estados:`, data);

    // PROCESAMIENTO ESPECÍFICO PARA TU FORMATO DE ENDPOINT
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
                // Generar el mismo ID que usa la configuración estructural
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
      _rawData: data, // Guardar datos originales para debug
    };

    // Guardar en cache
    PARKING_STATES[parkingId] = stateData;

    console.log(
      `✅ Estados cargados para ${parkingId}: ${
        Object.keys(estados).length
      } espacios`
    );
    return stateData;
  } catch (error) {
    console.error(
      `❌ Error cargando estados para ${parkingId}:`,
      error.message
    );

    // Usar cache como fallback
    if (PARKING_STATES[parkingId]) {
      console.log(`📋 Usando estados de cache como fallback para ${parkingId}`);
      return PARKING_STATES[parkingId];
    }

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
                id: `seccion_${seccion.id}_sub_${subseccion.id}_punto_${punto.id}`, // Debe coincidir con loadParkingStates
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
      `🔗 ${espaciosActualizados} espacios actualizados con estados del endpoint`
    );
  }

  // Agregar metadata de estados
  mergedConfig._estados = {
    endpoint: stateData._endpoint,
    loadedAt: stateData._loadedAt,
    totalStates: Object.keys(estados).length,
    colores: stateData.colores || {},
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
 * Carga solo la configuración estructural (zonas, espacios, coordenadas)
 */
const loadStructuralConfig = async (parkingId, forceRefresh = false) => {
  try {
    const endpoint = getParkingEndpoint(parkingId);
    console.log(
      `🏗️ Cargando estructura desde ${endpoint} para ${parkingId}...`
    );

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 8000,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📊 Datos estructurales recibidos:`, data);

    // Procesar respuesta según el formato
    let config = null;

    if (Array.isArray(data)) {
      config = data.find((parking) => parking.id === parkingId) || data[0];
    } else if (data && typeof data === "object") {
      config = data;
    }

    if (!config) {
      console.warn(
        `❌ No se encontraron datos estructurales para ${parkingId}`
      );
      return null;
    }

    // Normalizar estructura de datos
    config = normalizeDataStructure(config);

    // Asegurar propiedades básicas
    if (!config.id) config.id = parkingId;
    if (!validateMinimalConfig(config)) {
      console.error(`❌ Configuración estructural inválida para ${parkingId}`);
      return null;
    }

    // Agregar metadata
    config._endpoint = endpoint;
    config._loadedAt = new Date().toISOString();

    return config;
  } catch (error) {
    console.error(
      `❌ Error cargando estructura para ${parkingId}:`,
      error.message
    );
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
    // Formato esperado: seccion_1_sub_2_punto_3
    const match = spaceId.match(/seccion_(\d+)_sub_(\d+)_punto_(\d+)/);
    if (!match) {
      console.warn(`⚠️ Formato de spaceId no reconocido: ${spaceId}`);
    }

    const stateEndpoint = getStateEndpoint(parkingId);
    const estadoEndpoint = mapearEstadoAppAEndpoint(newStatus);

    // Solo intentar actualizar en API si hay endpoint de estados
    if (stateEndpoint && match) {
      const [, seccionId, subseccionId, puntoId] = match;

      try {
        // Intentar actualizar en el endpoint (ajusta la URL según tu API)
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
          timeout: 3000,
        });

        if (response.ok) {
          console.log(`✅ Estado actualizado en API`);
        } else {
          console.warn(`⚠️ Error en API: ${response.status}`);
        }
      } catch (apiError) {
        console.warn(`⚠️ Error conectando con API: ${apiError.message}`);
      }
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
 * Carga todos los parqueaderos con sus estados - SIN DUPLICADOS
 */
export const loadAllParkings = async (forceRefresh = false) => {
  try {
    console.log("🌐 Cargando todos los parqueaderos con estados...");

    // Obtener solo los IDs principales para evitar duplicados
    const uniquePrimaryIds = [...new Set(Object.values(PRIMARY_PARKING_IDS))];

    console.log(`📋 IDs principales únicos: ${uniquePrimaryIds.join(", ")}`);

    const allParkings = [];

    // Cargar cada parqueadero principal individualmente
    for (const primaryId of uniquePrimaryIds) {
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

    console.log(
      `✅ ${allParkings.length} parqueaderos únicos cargados con estados`
    );
    return allParkings;
  } catch (error) {
    console.error("❌ Error cargando todos los parqueaderos:", error.message);
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
        timeout: 5000,
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
 * Función de DEBUG específica para el endpoint de estados
 */
export const debugStateEndpoint = async (parkingId) => {
  const endpoint = getStateEndpoint(parkingId);
  if (!endpoint) {
    console.error(`No hay endpoint de estados para ${parkingId}`);
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
    console.error("Error en debug:", error);
  }
};

/**
 * Limpia todos los caches
 */
export const clearCache = () => {
  PARKING_CONFIGS = {};
  PARKING_STATES = {};
  console.log("🗑️ Todos los caches limpiados (configuraciones y estados)");
};

// Exportar configuraciones para debugging
export {
  PARKING_CONFIGS,
  PARKING_ENDPOINTS,
  PARKING_STATES,
  PRIMARY_PARKING_IDS,
  STATE_ENDPOINTS,
};
