import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Modal, Portal, TextInput, Button, Text } from "react-native-paper";
import { theme } from "../theme/theme";

interface HabitModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (habit: {
    name: string;
    description: string;
    target: number;
  }) => void;
  habit?: {
    id: string;
    name: string;
    description: string;
    target: number;
  };
}

const HabitModal = ({ visible, onDismiss, onSave, habit }: HabitModalProps) => {
  const [name, setName] = useState(habit?.name || "");
  const [description, setDescription] = useState(habit?.description || "");
  const [target, setTarget] = useState(habit?.target?.toString() || "30");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!name.trim()) {
      setError("Please enter a habit name");
      return;
    }
    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }
    const targetNumber = parseInt(target);
    if (isNaN(targetNumber) || targetNumber <= 0) {
      setError("Please enter a valid target number");
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      target: targetNumber,
    });
    handleDismiss();
  };

  const handleDismiss = () => {
    setName("");
    setDescription("");
    setTarget("30");
    setError(null);
    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>
          {habit ? "Edit Habit" : "Add New Habit"}
        </Text>

        <TextInput
          label="Habit Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
        />

        <TextInput
          label="Target (days)"
          value={target}
          onChangeText={setTarget}
          style={styles.input}
          mode="outlined"
          keyboardType="numeric"
        />

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.buttons}>
          <Button mode="outlined" onPress={handleDismiss} style={styles.button}>
            Cancel
          </Button>
          <Button mode="contained" onPress={handleSave} style={styles.button}>
            Save
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    margin: theme.spacing.lg,
    borderRadius: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: theme.spacing.md,
    textAlign: "center",
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.md,
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
});

export default HabitModal;
