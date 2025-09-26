// components/LanguageSheet.jsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../config/theme";
import { typography } from "../config/typography";

export default function LanguageSheet({
  visible,
  onClose,
  languages,
  currentLanguage,
  onSelect,
  t,
}) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop que cierra el modal */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Sheet principal */}
        <View style={styles.sheet}>
          <View style={styles.dragIndicator} />

          <Text style={styles.title}>{t("welcome.selectLanguage")}</Text>

          <View style={styles.languagesContainer}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageOption,
                  currentLanguage === lang.code && styles.languageOptionActive,
                ]}
                onPress={() => onSelect(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageText,
                    currentLanguage === lang.code && styles.languageTextActive,
                  ]}
                >
                  {lang.name}
                </Text>
                {currentLanguage === lang.code && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={colors.secondary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeText}>{t("common.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 34,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  dragIndicator: {
    width: 40,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    ...typography.semibold.large,
    textAlign: "center",
    marginBottom: 20,
    color: colors.text,
  },
  languagesContainer: {
    maxHeight: 300,
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: colors.base,
    borderWidth: 2,
    borderColor: "transparent",
  },
  languageOptionActive: {
    backgroundColor: "transparent",
    borderColor: colors.secondary,
  },
  flag: {
    fontSize: 22,
    marginRight: 14,
  },
  languageText: {
    flex: 1,
    ...typography.medium.medium,
    color: colors.text,
  },
  languageTextActive: {
    ...typography.semibold.medium,
    color: colors.secondary,
  },
  closeBtn: {
    marginTop: 20,
    paddingVertical: 16,
    backgroundColor: colors.secondary,
    borderRadius: 14,
    alignItems: "center",
  },
  closeText: {
    ...typography.semibold.medium,
    color: colors.white,
  },
});
