import React from "react";
import { StyleSheet } from "react-native";
import { TextInput } from "react-native-paper";
import { theme } from "../theme/theme";

type InputProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  error?: string;
  disabled?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
};

export const Input = ({
  label,
  value,
  onChangeText,
  secureTextEntry = false,
  error,
  disabled = false,
  autoCapitalize = "none",
  keyboardType = "default",
}: InputProps) => {
  return (
    <TextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      error={!!error}
      disabled={disabled}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      style={styles.input}
      mode="outlined"
    />
  );
};

const styles = StyleSheet.create({
  input: {
    marginVertical: theme.spacing.sm,
  },
});
