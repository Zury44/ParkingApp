// components/parking/ParkingMap.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { loadParkingConfig, updateSpaceStatus } from "../../config/parkingData";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { ParkingColors } from "../../constants/ParkingColors";
import { ParkingSVG } from "./ParkingSVG";
import { SpaceModal } from "./SpaceModal";

export const ParkingMap = ({ parkingId }) => {
  const [parkingConfig, setParkingConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [espacioSeleccionado, setEspacioSeleccionado] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadParkingData(false);
    startAutoRefresh();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [parkingId]);

  const startAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      loadParkingData(true, true);
    }, 11000);
  };

  const loadParkingData = async (
    forceRefresh = false,
    isAutoRefresh = false
  ) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const config = await loadParkingConfig(parkingId, forceRefresh);

      if (!config) {
        if (!isAutoRefresh) {
          Alert.alert(
            "Error",
            "No se pudo cargar la configuración del parqueadero"
          );
        }
        return;
      }

      setParkingConfig(config);
    } catch (error) {
      if (!isAutoRefresh) {
        Alert.alert("Error", "Error al cargar la configuración");
      }
    } finally {
      if (!isAutoRefresh) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  const getColorEstado = (estado) => {
    return ParkingColors[estado] || ParkingColors.default;
  };

  const handleEspacioPress = (espacio, zona) => {
    const espacioCompleto = {
      ...espacio,
      zona: zona.nombre,
      seccionInfo: {
        seccionId: zona._seccionId,
        seccionNombre: zona._seccionNombre,
        seccionAcronimo: zona._seccionAcronimo,
        subseccionId: zona._subseccionId,
      },
    };

    setEspacioSeleccionado(espacioCompleto);
    setModalVisible(true);
  };

  const handleChangeStatus = async (
    espacioId,
    nuevoEstado,
    datosAdicionales
  ) => {
    try {
      const success = await updateSpaceStatus(
        parkingId,
        espacioId,
        nuevoEstado
      );

      if (success) {
        if (parkingConfig?.zonas) {
          const configActualizado = { ...parkingConfig };

          configActualizado.zonas.forEach((zona) => {
            if (zona.espacios) {
              const espacioIndex = zona.espacios.findIndex(
                (e) =>
                  e.id === espacioId ||
                  e._puntoId === espacioId ||
                  e.id.includes(espacioId)
              );

              if (espacioIndex !== -1) {
                zona.espacios[espacioIndex] = {
                  ...zona.espacios[espacioIndex],
                  estado: nuevoEstado,
                  lastUpdated: new Date().toISOString(),
                  // Agregar la placa si viene en datosAdicionales
                  ...(datosAdicionales?.placa && {
                    placa: datosAdicionales.placa,
                  }),
                  // Si el estado cambia a algo diferente de reservado, limpiar la placa
                  ...(nuevoEstado !== "reservado" && { placa: null }),
                };
              }
            }
          });

          setParkingConfig(configActualizado);
        }

        const mensajeExtra = datosAdicionales?.placa
          ? ` - Placa: ${datosAdicionales.placa}`
          : "";

        Alert.alert(
          "Estado actualizado",
          `Espacio ${espacioId} cambiado a ${nuevoEstado}${mensajeExtra}`
        );
      } else {
        Alert.alert("❌ Error", "No se pudo actualizar el estado del espacio");
      }
    } catch (error) {
      Alert.alert("Error", "Error al cambiar el estado del espacio");
    }
  };

  const handleQuickAction = (espacio, zona) => {
    handleEspacioPress(espacio, zona);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!parkingConfig) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Error: No se pudo cargar el parqueadero
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View
          style={[
            styles.mapContainer,
            isRefreshing && styles.mapContainerRefreshing,
          ]}
        >
          <ParkingSVG
            config={parkingConfig}
            onSpacePress={handleQuickAction}
            getColorEstado={getColorEstado}
          />
        </View>
      </ScrollView>

      <SpaceModal
        visible={modalVisible}
        espacioSeleccionado={espacioSeleccionado}
        onClose={() => {
          setModalVisible(false);
          setEspacioSeleccionado(null);
        }}
        onChangeStatus={handleChangeStatus}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    ...typography.regular.medium,
    color: colors.red,
    textAlign: "center",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 10,
  },
  mapContainer: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapContainerRefreshing: {
    opacity: 0.8,
  },
});
