import React from "react";
import { StyleSheet } from "react-native";
import { Button as PaperButton } from "react-native-paper";
import { theme } from "../theme/theme";

type ButtonProps = {
  mode?: "text" | "outlined" | "contained";
  onPress: () => void;
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: object;
};

export const Button = ({
  mode = "contained",
  onPress,
  children,
  loading = false,
  disabled = false,
  style,
}: ButtonProps) => {
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      style={[styles.button, style]}
      labelStyle={styles.label}
      data-oid="8tpo0_1"
    >
      {children}
    </PaperButton>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
});
