// app/parking/[id].jsx
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ParkingLegend } from "../../components/parking/ParkingLegend";
import { ParkingMap } from "../../components/parking/ParkingMap";
import { getParkingStats, loadParkingConfig } from "../../config/parkingData";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";
import { useLanguage } from "../../context/LanguageContext";

export default function ParkingMapScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams();

  const [parkingInfo, setParkingInfo] = useState(null);
  const [parkingStats, setParkingStats] = useState({
    total: 0,
    disponibles: 0,
    ocupados: 0,
    reservados: 0,
    mantenimiento: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadParkingInfo();
    startStatsRefresh();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress
    );
    return () => backHandler.remove();
  }, []);

  const startStatsRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      updateStats();
    }, 11000);
  };

  const updateStats = async () => {
    try {
      const config = await loadParkingConfig(id, true);
      if (config) {
        const stats = getParkingStats(config);
        setParkingStats(stats);
      }
    } catch (error) {
      // Error silencioso
    }
  };

  const loadParkingInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      const config = await loadParkingConfig(id);

      if (!config) {
        throw new Error(`Parqueadero "${id}" no encontrado`);
      }

      const info = {
        id: config.id,
        nombre: config.nombre || `Parqueadero ${config.id}`,
        descripcion: config.descripcion || "Parqueadero disponible",
      };
      setParkingInfo(info);

      const stats = getParkingStats(config);
      setParkingStats(stats);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    router.back();
    return true;
  };

  const handleBackToSelector = () => {
    Alert.alert(
      "Volver a Parqueaderos",
      "¿Deseas volver a la lista de parqueaderos?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Volver", onPress: () => router.back() },
      ]
    );
  };

  const handleRefresh = () => {
    Alert.alert(
      "Actualizar Datos",
      "¿Recargar la información del parqueadero?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Actualizar",
          onPress: async () => {
            try {
              await loadParkingInfo();
            } catch (error) {
              Alert.alert("Error", "No se pudo actualizar la información");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>Error al cargar parqueadero</Text>
        <Text style={styles.errorText}>{error}</Text>

        <View style={styles.errorActions}>
          <TouchableOpacity
            style={[styles.button, styles.retryButton]}
            onPress={loadParkingInfo}
          >
            <Ionicons name="refresh" size={16} color={colors.white} />
            <Text style={styles.buttonText}>Reintentar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.backButton]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!parkingInfo) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Ionicons name="car-outline" size={48} color={colors.textSec} />
        <Text style={styles.errorTitle}>Parqueadero no encontrado</Text>
        <Text style={styles.errorText}>
          No se pudo encontrar el parqueadero con ID: {id}
        </Text>
        <TouchableOpacity
          style={[styles.button, styles.backButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con información del parqueadero */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={handleBackToSelector}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{parkingInfo.nombre}</Text>
          <Text style={styles.headerSubtitle}>{parkingInfo.descripcion}</Text>
        </View>

        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={16} color={colors.textSec} />
        </TouchableOpacity>
      </View>

      {/* Estadísticas rápidas */}
      <View style={styles.quickStats}>
        <View style={styles.statCard}>
          <View
            style={[
              styles.statIndicator,
              { backgroundColor: colors.disponible },
            ]}
          />
          <Text style={styles.statNumber}>{parkingStats.disponibles}</Text>
          <Text style={styles.statLabel}>Disponibles</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[styles.statIndicator, { backgroundColor: colors.ocupado }]}
          />
          <Text style={styles.statNumber}>{parkingStats.ocupados}</Text>
          <Text style={styles.statLabel}>Ocupados</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[
              styles.statIndicator,
              { backgroundColor: colors.reservado },
            ]}
          />
          <Text style={styles.statNumber}>{parkingStats.reservados}</Text>
          <Text style={styles.statLabel}>Reservados</Text>
        </View>

        <View style={styles.statCard}>
          <View
            style={[styles.statIndicator, { backgroundColor: colors.gray }]}
          />
          <Text style={styles.statNumber}>{parkingStats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Leyenda de colores */}
      <ParkingLegend />

      {/* Mapa del parqueadero */}
      <View style={styles.mapContainer}>
        <ParkingMap parkingId={id} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.base,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.base,
    padding: 20,
  },
  errorTitle: {
    marginTop: 16,
    ...typography.semibold.medium,
    color: colors.text,
    textAlign: "center",
  },
  errorText: {
    marginTop: 8,
    marginBottom: 24,
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
    lineHeight: 20,
  },
  errorActions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  retryButton: {
    backgroundColor: colors.primary,
  },
  backButton: {
    backgroundColor: colors.gray,
  },
  buttonText: {
    color: colors.white,
    ...typography.semibold.medium,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.lightGray,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...typography.semibold.regular,
    color: colors.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  refreshButton: {
    padding: 8,
  },
  quickStats: {
    flexDirection: "row",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  statIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  statNumber: {
    ...typography.bold.medium,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.regular.small,
    fontSize: 10,
    color: colors.textSec,
    textAlign: "center",
  },
  mapContainer: {
    flex: 1,
  },
});
