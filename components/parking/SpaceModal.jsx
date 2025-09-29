// components/parking/SpaceModal.jsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";

export const SpaceModal = ({
  visible,
  espacioSeleccionado,
  onClose,
  onChangeStatus,
}) => {
  const getColorEstado = (estado) => {
    switch (estado) {
      case "disponible":
        return colors.disponible;
      case "ocupado":
        return colors.ocupado;
      case "reservado":
        return colors.reservado;
      case "mantenimiento":
        return colors.gray;
      default:
        return colors.lightGray;
    }
  };

  const cambiarEstadoEspacio = (nuevoEstado) => {
    Alert.alert(
      "Cambio de Estado",
      `¿Cambiar espacio ${espacioSeleccionado.id} a ${nuevoEstado}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          onPress: () => {
            onChangeStatus(espacioSeleccionado.id, nuevoEstado);
            onClose();
          },
        },
      ]
    );
  };

  const statusButtons = [
    {
      estado: "disponible",
      label: "Liberar",
      icon: "checkmark-circle",
      color: colors.disponible,
    },
    {
      estado: "ocupado",
      label: "Ocupar",
      icon: "car",
      color: colors.ocupado,
    },
    {
      estado: "reservado",
      label: "Reservar",
      icon: "lock-closed",
      color: colors.reservado,
    },
    {
      estado: "mantenimiento",
      label: "Mantenimiento",
      icon: "construct",
      color: colors.mantenimiento,
    },
  ];

  if (!espacioSeleccionado) return null;

  // Extraer información adicional de la nueva estructura
  const tieneSeccionInfo =
    espacioSeleccionado._seccionId || espacioSeleccionado.seccionInfo;
  const seccionInfo = espacioSeleccionado.seccionInfo || {};

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Espacio de Parqueo</Text>

          <ScrollView
            style={styles.infoContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color={colors.primary} />
              <Text style={styles.modalInfo}>ID: {espacioSeleccionado.id}</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons name="business" size={16} color={colors.primary} />
              <Text style={styles.modalInfo}>
                Espacio: {espacioSeleccionado.zona || "N/A"}
              </Text>
            </View>

            {/* Nueva información de sección */}
            {tieneSeccionInfo && (
              <>
                <View style={styles.infoRow}>
                  <Ionicons name="layers" size={16} color={colors.primary} />
                  <Text style={styles.modalInfo}>
                    Sección:{" "}
                    {seccionInfo.seccionNombre ||
                      espacioSeleccionado._seccionNombre ||
                      "N/A"}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="grid" size={16} color={colors.primary} />
                  <Text style={styles.modalInfo}>
                    Subsección: {espacioSeleccionado._subseccionId || "N/A"}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="car-outline" size={16} color={colors.textSec} />
              <Text style={styles.modalInfo}>
                Tipo: {espacioSeleccionado.tipo || "regular"}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="analytics"
                size={16}
                color={getColorEstado(espacioSeleccionado.estado)}
              />
              <Text
                style={[
                  styles.modalInfo,
                  { color: getColorEstado(espacioSeleccionado.estado) },
                ]}
              >
                Estado: {espacioSeleccionado.estado.toUpperCase()}
              </Text>
            </View>
          </ScrollView>

          <View style={styles.modalButtons}>
            {statusButtons
              .filter((button) => button.estado !== espacioSeleccionado.estado)
              .map((button) => (
                <TouchableOpacity
                  key={button.estado}
                  style={[styles.button, { backgroundColor: button.color }]}
                  onPress={() => cambiarEstadoEspacio(button.estado)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={button.icon}
                    size={16}
                    color={colors.white}
                    style={styles.buttonIcon}
                  />
                  <Text style={styles.buttonText}>{button.label}</Text>
                </TouchableOpacity>
              ))}
          </View>

          <TouchableOpacity
            style={[styles.button, styles.closeButton]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons
              name="close"
              size={16}
              color={colors.white}
              style={styles.buttonIcon}
            />
            <Text style={styles.buttonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    ...typography.bold.big,
    marginBottom: 20,
    color: colors.text,
  },
  infoContainer: {
    width: "100%",
    marginBottom: 20,
    maxHeight: 200,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalInfo: {
    ...typography.regular.medium,
    marginLeft: 8,
    color: colors.text,
    flex: 1,
  },
  descriptionContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.base,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  descriptionText: {
    ...typography.regular.small,
    marginLeft: 8,
    color: colors.text,
    flex: 1,
    lineHeight: 18,
  },
  technicalInfo: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  technicalText: {
    ...typography.regular.small,
    marginLeft: 6,
    color: colors.textSec,
    fontSize: 11,
  },
  actionsTitle: {
    ...typography.semibold.medium,
    color: colors.text,
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  modalButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 16,
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    margin: 4,
    minWidth: "45%",
    justifyContent: "center",
  },
  closeButton: {
    backgroundColor: colors.red,
    width: "100%",
    marginTop: 8,
  },
  buttonIcon: {
    marginRight: 6,
  },
  buttonText: {
    color: colors.white,
    ...typography.semibold.medium,
    fontSize: 13,
  },
});
