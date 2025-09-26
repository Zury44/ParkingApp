// app/parking-selector.jsx - Versión con select
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAvailableParkings } from "../config/parkingData";
import { colors } from "../config/theme";
import { typography } from "../config/typography";
import { useLanguage } from "../context/LanguageContext";
import { useSession } from "../context/SessionContext";

export default function ParkingSelectorScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { sessionData, cerrarSesion } = useSession();

  const [parqueaderos, setParqueaderos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedParking, setSelectedParking] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  useEffect(() => {
    loadParkings();
  }, []);

  const loadParkings = async () => {
    try {
      setLoading(true);

      // Usar la nueva función async
      const parkings = await getAvailableParkings();

      const userParkings = parkings.filter(() => true);
      setParqueaderos(userParkings);

      if (userParkings.length > 0 && !selectedParking) {
        setSelectedParking(userParkings[0]);
      }
    } catch (error) {
      console.error("Error loading parkings:", error);
      Alert.alert("Error", "No se pudieron cargar los parqueaderos");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParkings();
    setRefreshing(false);
  };

  const handleSelectParking = (parking) => {
    setSelectedParking(parking);
    setDropdownVisible(false);
  };

  const handleAccessParking = () => {
    if (!selectedParking) {
      Alert.alert("Error", "Por favor selecciona un parqueadero");
      return;
    }

    Alert.alert(
      "Acceder al Parqueadero",
      `¿Deseas ingresar a ${selectedParking.nombre}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Acceder",
          onPress: () => {
            router.push(`/parking/${selectedParking.id}`);
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert("Cerrar Sesión", "¿Estás seguro de que deseas cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar Sesión",
        onPress: async () => {
          try {
            await cerrarSesion();
            router.replace("/login");
          } catch (error) {
            console.error("Error cerrando sesión:", error);
          }
        },
      },
    ]);
  };

  const renderDropdownItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.dropdownItem,
        selectedParking?.id === item.id && styles.dropdownItemSelected,
      ]}
      onPress={() => handleSelectParking(item)}
    >
      <View style={styles.dropdownItemContent}>
        <Ionicons
          name={item.icono || "car-outline"}
          size={24}
          color={
            selectedParking?.id === item.id ? colors.white : colors.primary
          }
        />
        <View style={styles.dropdownItemText}>
          <Text
            style={[
              styles.dropdownItemTitle,
              selectedParking?.id === item.id &&
                styles.dropdownItemTitleSelected,
            ]}
          >
            {item.nombre}
          </Text>
          <Text
            style={[
              styles.dropdownItemDescription,
              selectedParking?.id === item.id &&
                styles.dropdownItemDescriptionSelected,
            ]}
          >
            {item.descripcion}
          </Text>
        </View>
        <View style={styles.dropdownItemStats}>
          <Text
            style={[
              styles.dropdownItemStat,
              selectedParking?.id === item.id &&
                styles.dropdownItemStatSelected,
            ]}
          >
            {item.totalEspacios} espacios
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Ionicons name="car-outline" size={48} color={colors.primary} />
          <Text style={styles.loadingText}>Cargando parqueaderos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Seleccionar Parqueadero</Text>
            <Text style={styles.headerSubtitle}></Text>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>

        {/* Selector dropdown */}
        <View style={styles.selectorContainer}>
          <Text style={styles.selectorLabel}>Parqueadero:</Text>

          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setDropdownVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.dropdownContent}>
              {selectedParking ? (
                <View style={styles.selectedItem}>
                  <Ionicons
                    name={selectedParking.icono || "car-outline"}
                    size={20}
                    color={colors.primary}
                  />
                  <View style={styles.selectedItemText}>
                    <Text style={styles.selectedItemTitle}>
                      {selectedParking.nombre}
                    </Text>
                    <Text style={styles.selectedItemDescription}>
                      {selectedParking.descripcion}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.dropdownPlaceholder}>
                  Selecciona un parqueadero
                </Text>
              )}

              <Ionicons name="chevron-down" size={20} color={colors.textSec} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Información del parqueadero seleccionado */}
        {selectedParking && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Información del Parqueadero</Text>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIndicator,
                    { backgroundColor: colors.disponible },
                  ]}
                />
                <Text style={styles.statNumber}>
                  {selectedParking.disponibles}
                </Text>
                <Text style={styles.statLabel}>Disponibles</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIndicator,
                    { backgroundColor: colors.ocupado },
                  ]}
                />
                <Text style={styles.statNumber}>
                  {selectedParking.ocupados}
                </Text>
                <Text style={styles.statLabel}>Ocupados</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIndicator,
                    { backgroundColor: colors.reservado },
                  ]}
                />
                <Text style={styles.statNumber}>
                  {selectedParking.reservados}
                </Text>
                <Text style={styles.statLabel}>Reservados</Text>
              </View>

              <View style={styles.statCard}>
                <View
                  style={[
                    styles.statIndicator,
                    { backgroundColor: colors.gray },
                  ]}
                />
                <Text style={styles.statNumber}>
                  {selectedParking.totalEspacios}
                </Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>
        )}

        {/* Botón de acceso */}
        <TouchableOpacity
          style={[
            styles.accessButton,
            !selectedParking && styles.accessButtonDisabled,
          ]}
          onPress={handleAccessParking}
          disabled={!selectedParking}
          activeOpacity={0.8}
        >
          <Ionicons
            name="enter-outline"
            size={20}
            color={colors.white}
            style={styles.accessButtonIcon}
          />
          <Text style={styles.accessButtonText}>Ingresar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal del dropdown */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownHeaderTitle}>
                Seleccionar Parqueadero
              </Text>
              <TouchableOpacity
                onPress={() => setDropdownVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.textSec} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={parqueaderos}
              renderItem={renderDropdownItem}
              keyExtractor={(item) => item.id}
              style={styles.dropdownList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.base,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.base,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSec,
    ...typography.regular.medium,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    ...typography.bold.big,
    fontSize: 20,
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...typography.regular.medium,
    color: colors.textSec,
  },
  logoutButton: {
    paddingBottom: 19,
    borderRadius: 6,
  },
  selectorContainer: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorLabel: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 12,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.lightGray,
  },
  dropdownContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedItemText: {
    marginLeft: 12,
    flex: 1,
  },
  selectedItemTitle: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 2,
  },
  selectedItemDescription: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  dropdownPlaceholder: {
    ...typography.regular.medium,
    color: colors.textSec,
    flex: 1,
  },
  infoContainer: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoTitle: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 4,
  },
  statIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 6,
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
  accessButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.red,
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
  },
  accessButtonDisabled: {
    backgroundColor: colors.gray,
  },
  accessButtonIcon: {
    marginRight: 8,
  },
  accessButtonText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: colors.white,
    borderRadius: 12,
    width: "100%",
    maxHeight: "70%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownHeaderTitle: {
    ...typography.semibold.medium,
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  dropdownList: {
    maxHeight: 300,
  },
  dropdownItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary,
  },
  dropdownItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  dropdownItemText: {
    marginLeft: 12,
    flex: 1,
  },
  dropdownItemTitle: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 2,
  },
  dropdownItemTitleSelected: {
    color: colors.white,
  },
  dropdownItemDescription: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  dropdownItemDescriptionSelected: {
    color: colors.white,
  },
  dropdownItemStats: {
    alignItems: "flex-end",
  },
  dropdownItemStat: {
    ...typography.regular.small,
    color: colors.textSec,
  },
  dropdownItemStatSelected: {
    color: colors.white,
  },
});
