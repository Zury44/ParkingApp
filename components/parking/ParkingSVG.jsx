// components/parking/ParkingSVG.jsx
import React from "react";
import Svg, { G, Line, Polygon, Rect, Text as SvgText } from "react-native-svg";

export const ParkingSVG = ({ config, onSpacePress, getColorEstado }) => {
  if (!config) {
    return null;
  }

  const { configuracion, limites = [], zonas = [] } = config;

  // Dimensiones por defecto si no están definidas
  const width = configuracion?.dimensiones?.width || 600;
  const height = configuracion?.dimensiones?.height || 400;
  const bgColor = configuracion?.colores?.fondo || "#f8f9fa";

  // Función para convertir array de coordenadas a string de puntos
  const arrayToPoints = (coordenadas) => {
    if (!coordenadas || coordenadas.length < 4) return "";

    const points = [];
    for (let i = 0; i < coordenadas.length; i += 2) {
      if (i + 1 < coordenadas.length) {
        points.push(`${coordenadas[i]},${coordenadas[i + 1]}`);
      }
    }
    return points.join(" ");
  };

  // Función para calcular el centro de un polígono para el texto
  const getPolygonCenter = (coordenadas, zonaPos = { x: 0, y: 0 }) => {
    if (!coordenadas || coordenadas.length < 4) return { x: 0, y: 0 };

    let sumX = 0;
    let sumY = 0;
    let pointCount = 0;

    for (let i = 0; i < coordenadas.length; i += 2) {
      if (i + 1 < coordenadas.length) {
        sumX += coordenadas[i];
        sumY += coordenadas[i + 1];
        pointCount++;
      }
    }

    return {
      x: sumX / pointCount + zonaPos.x,
      y: sumY / pointCount + zonaPos.y + 4,
    };
  };

  // Función para generar ID abreviado del espacio para visualización
  const getDisplayId = (espacio) => {
    if (espacio.id.length <= 5) {
      return espacio.id;
    }

    if (espacio.id.match(/^[A-Z]{2,3}\d+P\d+$/)) {
      return espacio.id;
    }

    return espacio._puntoId
      ? `P${espacio._puntoId}`
      : espacio.id.substring(0, 4);
  };

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Fondo */}
      <Rect x="0" y="0" width={width} height={height} fill={bgColor} />

      {/* Límites */}
      {limites.map((limite) => (
        <Line
          key={limite.id}
          x1={limite.coordenadas.x1}
          y1={limite.coordenadas.y1}
          x2={limite.coordenadas.x2}
          y2={limite.coordenadas.y2}
          stroke={limite.estilo?.stroke || "#000000"}
          strokeWidth={limite.estilo?.strokeWidth || 2}
          strokeDasharray={limite.estilo?.strokeDasharray}
        />
      ))}

      {/* Zonas y espacios */}
      {zonas.map((zona, zonaIndex) => (
        <G key={zona.id || zonaIndex}>
          {/* Marco de zona - solo si tiene dimensiones válidas */}
          {zona.posicion && zona.dimensiones && (
            <>
              <Rect
                x={zona.posicion.x - 5}
                y={zona.posicion.y - 5}
                width={zona.dimensiones.width + 10}
                height={zona.dimensiones.height + 10}
                fill={zona.estilo?.fill || "rgba(255, 193, 7, 0.1)"}
                stroke={zona.estilo?.stroke || "#FFC107"}
                strokeWidth={zona.estilo?.strokeWidth || 3}
              />

              {/* Label de zona */}
              <SvgText
                x={zona.posicion.x + zona.dimensiones.width / 2}
                y={zona.posicion.y - 12}
                fontSize="12"
                fontWeight="bold"
                fill={zona.estilo?.stroke || "#FFC107"}
                textAnchor="middle"
              >
                {zona._seccionAcronimo ||
                  zona.nombre?.substring(0, 8) ||
                  `Z${zonaIndex + 1}`}
              </SvgText>
            </>
          )}

          {/* Espacios */}
          {zona.espacios?.map((espacio, espacioIndex) => {
            if (!espacio) return null;

            const tienePoligono =
              espacio.poligono && espacio.poligono.length >= 4;
            const tienePosition = espacio.posicion && espacio.dimensiones;
            const zonaPos = zona.posicion || { x: 0, y: 0 };

            // Calcular posición y centro para el texto
            let center;
            let espacioElement;

            if (tienePoligono) {
              const pointsString = arrayToPoints(espacio.poligono);
              center = getPolygonCenter(espacio.poligono, zonaPos);

              espacioElement = (
                <Polygon
                  points={pointsString}
                  fill={getColorEstado(espacio.estado)}
                  stroke={espacio.estilo?.stroke || "#ffffff"}
                  strokeWidth={espacio.estilo?.strokeWidth || 2}
                  onPress={() => onSpacePress(espacio, zona)}
                  transform={`translate(${zonaPos.x}, ${zonaPos.y})`}
                />
              );
            } else if (tienePosition) {
              center = {
                x:
                  zonaPos.x +
                  espacio.posicion.x +
                  espacio.dimensiones.width / 2,
                y:
                  zonaPos.y +
                  espacio.posicion.y +
                  espacio.dimensiones.height / 2 +
                  4,
              };

              espacioElement = (
                <Rect
                  x={zonaPos.x + espacio.posicion.x}
                  y={zonaPos.y + espacio.posicion.y}
                  width={espacio.dimensiones.width}
                  height={espacio.dimensiones.height}
                  fill={getColorEstado(espacio.estado)}
                  stroke={espacio.estilo?.stroke || "#ffffff"}
                  strokeWidth={espacio.estilo?.strokeWidth || 2}
                  rx={espacio.estilo?.rx || 3}
                  onPress={() => onSpacePress(espacio, zona)}
                />
              );
            } else {
              // Fallback: posición automática basada en índice
              const fallbackX = (espacioIndex % 4) * 50 + 10;
              const fallbackY = Math.floor(espacioIndex / 4) * 40 + 10;

              center = {
                x: zonaPos.x + fallbackX + 22,
                y: zonaPos.y + fallbackY + 22,
              };

              espacioElement = (
                <Rect
                  x={zonaPos.x + fallbackX}
                  y={zonaPos.y + fallbackY}
                  width={45}
                  height={35}
                  fill={getColorEstado(espacio.estado)}
                  stroke="#ffffff"
                  strokeWidth={2}
                  rx={3}
                  onPress={() => onSpacePress(espacio, zona)}
                />
              );
            }

            const displayId = getDisplayId(espacio);

            return (
              <G key={espacio.id || `${zona.id}-esp-${espacioIndex}`}>
                {espacioElement}

                {/* Texto del ID del espacio */}
                <SvgText
                  x={center.x}
                  y={center.y}
                  fontSize="10"
                  fontWeight="bold"
                  fill="#ffffff"
                  textAnchor="middle"
                  onPress={() => onSpacePress(espacio, zona)}
                >
                  {displayId}
                </SvgText>

                {/* Indicador de tipo especial si aplica */}
                {espacio.tipo === "discapacitados" && (
                  <SvgText
                    x={center.x}
                    y={center.y + 12}
                    fontSize="8"
                    fill="#ffffff"
                    textAnchor="middle"
                  >
                    ♿
                  </SvgText>
                )}
              </G>
            );
          })}
        </G>
      ))}
    </Svg>
  );
};
