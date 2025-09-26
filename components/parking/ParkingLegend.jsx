// components/parking/ParkingLegend.jsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../config/theme";
import { typography } from "../../config/typography";

export const ParkingLegend = () => {
  const legendItems = [
    { color: colors.success, label: "Disponible" },
    { color: colors.error, label: "Ocupado" },
    { color: colors.accent, label: "Reservado" },
    { color: colors.gray, label: "Mantenimiento" },
  ];

  return (
    <View style={styles.leyenda}>
      {legendItems.map((item, index) => (
        <View key={index} style={styles.leyendaItem}>
          <View
            style={[styles.colorIndicador, { backgroundColor: item.color }]}
          />
          <Text style={styles.leyendaTexto}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  leyenda: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: colors.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leyendaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  colorIndicador: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  leyendaTexto: {
    ...typography.regular.small,
    color: colors.text,
    fontSize: 11,
  },
});
