// config/parkingConfigs.js

// Importa tu JSON existente (cuando lo agregues al proyecto)
// import sedePrincipalData from '../assets/parking/sede-principal.json';

// Por ahora uso una configuración simplificada basada en tu JSON
const sedePrincipalConfig = {
  id: "sede_principal_p1",
  nombre: "Parqueadero Principal - Sede Central",
  descripcion: "Parqueadero principal de la sede central",
  configuracion: {
    dimensiones: { width: 600, height: 300 },
    colores: { fondo: "#f8f9fa", limite: "#000000", zona: "#FFC107" },
  },
  limites: [
    {
      id: "borde_superior",
      tipo: "linea",
      coordenadas: { x1: 20, y1: 20, x2: 580, y2: 20 },
      estilo: { stroke: "#000000", strokeWidth: 4, strokeDasharray: "10,5" },
    },
    {
      id: "borde_inferior",
      tipo: "linea",
      coordenadas: { x1: 20, y1: 295, x2: 580, y2: 280 },
      estilo: { stroke: "#000000", strokeWidth: 4, strokeDasharray: "10,5" },
    },
    {
      id: "separador_h1",
      tipo: "linea",
      coordenadas: { x1: 20, y1: 130, x2: 250, y2: 130 },
      estilo: { stroke: "#000000", strokeWidth: 4, strokeDasharray: "10,5" },
    },
    // ... agrega los demás límites de tu JSON
  ],
  zonas: [
    {
      id: "zona_a",
      nombre: "Zona A",
      descripcion: "Primera zona de parqueo",
      posicion: { x: 30, y: 30 },
      dimensiones: { width: 210, height: 95 },
      estilo: {
        fill: "rgba(255, 193, 7, 0.1)",
        stroke: "#FFC107",
        strokeWidth: 3,
      },
      espacios: [
        {
          id: "A01",
          posicion: { x: 0, y: 0 },
          dimensiones: { width: 45, height: 35 },
          estado: "disponible",
          tipo: "regular",
          estilo: { stroke: "#ffffff", strokeWidth: 2, rx: 3 },
        },
        {
          id: "A02",
          posicion: { x: 50, y: 0 },
          dimensiones: { width: 45, height: 35 },
          estado: "ocupado",
          tipo: "regular",
          estilo: { stroke: "#ffffff", strokeWidth: 2, rx: 3 },
        },
        {
          id: "A03",
          posicion: { x: 100, y: 0 },
          dimensiones: { width: 45, height: 35 },
          estado: "disponible",
          tipo: "regular",
          estilo: { stroke: "#ffffff", strokeWidth: 2, rx: 3 },
        },
        {
          id: "A04",
          posicion: { x: 150, y: 0 },
          dimensiones: { width: 45, height: 35 },
          estado: "reservado",
          tipo: "discapacitados",
          estilo: { stroke: "#ffffff", strokeWidth: 2, rx: 3 },
        },
        // ... agrega los demás espacios
      ],
    },
    // ... agrega las demás zonas
  ],
};

// Registry de todas las configuraciones
export const PARKING_CONFIGS = {
  sede_principal_p1: sedePrincipalConfig,

  // Puedes agregar más configuraciones aquí
  sede_norte_p1: {
    id: "sede_norte_p1",
    nombre: "Parqueadero Norte",
    descripcion: "Sucursal Norte",
    // ... configuración similar
  },

  sede_sur_p1: {
    id: "sede_sur_p1",
    nombre: "Parqueadero Sur",
    descripcion: "Sucursal Sur",
    // ... configuración similar
  },
};

/**
 * Carga la configuración de un parqueadero específico
 */
export const loadParkingConfig = (parkingId) => {
  try {
    const config = PARKING_CONFIGS[parkingId];

    if (!config) {
      console.warn(`Parqueadero con ID ${parkingId} no encontrado`);
      return null;
    }

    console.log(`Configuración cargada para ${parkingId}`);
    return config;
  } catch (error) {
    console.error(`Error cargando configuración de ${parkingId}:`, error);
    return null;
  }
};

/**
 * Obtiene estadísticas de un parqueadero
 */
export const getParkingStats = (config) => {
  let stats = {
    total: 0,
    disponibles: 0,
    ocupados: 0,
    reservados: 0,
    mantenimiento: 0,
  };

  if (!config?.zonas) return stats;

  config.zonas.forEach((zona) => {
    if (zona.espacios?.length) {
      zona.espacios.forEach((espacio) => {
        stats.total++;
        stats[espacio.estado] = (stats[espacio.estado] || 0) + 1;
      });
    }
  });

  return stats;
};

/**
 * Lista todos los parqueaderos disponibles con estadísticas
 */
export const getAvailableParkings = () => {
  return Object.keys(PARKING_CONFIGS).map((parkingId) => {
    const config = PARKING_CONFIGS[parkingId];
    const stats = getParkingStats(config);

    return {
      id: config.id,
      nombre: config.nombre,
      descripcion: config.descripcion,
      totalEspacios: stats.total,
      disponibles: stats.disponibles || 0,
      ocupados: stats.ocupados || 0,
      reservados: stats.reservados || 0,
      mantenimiento: stats.mantenimiento || 0,
    };
  });
};
