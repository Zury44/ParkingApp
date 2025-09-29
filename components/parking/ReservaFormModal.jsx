// components/parking/ReservaFormModal.jsx
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";

export const ReservaFormModal = ({
  visible,
  espacioId,
  onClose,
  onConfirm,
}) => {
  const [placa, setPlaca] = useState("");

  const handleConfirm = () => {
    if (!placa.trim()) {
      Alert.alert("Error", "Por favor ingrese la placa del vehículo");
      return;
    }

    // Validación básica de placa (puedes ajustar según tu formato)
    const placaLimpia = placa.trim().toUpperCase();
    if (placaLimpia.length < 3) {
      Alert.alert("Error", "La placa debe tener al menos 3 caracteres");
      return;
    }

    onConfirm(espacioId, placaLimpia);
    setPlaca("");
    onClose();
  };

  const handleClose = () => {
    setPlaca("");
    onClose();
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Ionicons name="lock-closed" size={32} color={colors.red} />
            <Text style={styles.modalTitle}>Reservar </Text>
          </View>

          <Text style={styles.subtitle}>
            Espacio: <Text style={styles.espacioId}>{espacioId}</Text>
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons name="car" size={20} color={colors.textSec} />
            <TextInput
              style={styles.input}
              placeholder="Ej: ABC123"
              placeholderTextColor={colors.textSec}
              value={placa}
              onChangeText={setPlaca}
              autoCapitalize="characters"
              maxLength={10}
              autoFocus={true}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={18} color={colors.text} />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark" size={18} color={colors.white} />
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: colors.white,
    padding: 24,
    borderRadius: 16,
    width: "85%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    ...typography.bold.big,
    color: colors.text,
    marginTop: 8,
  },
  subtitle: {
    ...typography.regular.medium,
    color: colors.textSec,
    textAlign: "center",
    marginBottom: 20,
  },
  espacioId: {
    ...typography.bold.medium,
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.lightGray,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.red,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    ...typography.regular.medium,
    color: colors.text,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  cancelButton: {
    backgroundColor: colors.lightGray,
    borderWidth: 1,
    borderColor: colors.gray,
  },
  confirmButton: {
    backgroundColor: colors.red,
  },
  cancelButtonText: {
    ...typography.semibold.medium,
    color: colors.text,
  },
  confirmButtonText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
});
