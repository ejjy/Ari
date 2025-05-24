import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import {
  Modal,
  Portal,
  TextInput,
  Button,
  SegmentedButtons,
} from "react-native-paper";
import { theme } from "../theme/theme";

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: "savings" | "debt" | "investment" | "other";
}

interface FinancialGoalModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (goal: Omit<FinancialGoal, "id">) => void;
  goal?: FinancialGoal;
}

const FinancialGoalModal = ({
  visible,
  onDismiss,
  onSave,
  goal,
}: FinancialGoalModalProps) => {
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");
  const [category, setCategory] =
    useState<FinancialGoal["category"]>("savings");

  useEffect(() => {
    if (goal) {
      setTitle(goal.title);
      setTargetAmount(goal.targetAmount.toString());
      setCurrentAmount(goal.currentAmount.toString());
      setDeadline(goal.deadline.toISOString().split("T")[0]);
      setCategory(goal.category);
    } else {
      setTitle("");
      setTargetAmount("");
      setCurrentAmount("");
      setDeadline("");
      setCategory("savings");
    }
  }, [goal]);

  const handleSave = () => {
    if (!title || !targetAmount || !currentAmount || !deadline) return;

    onSave({
      title,
      targetAmount: parseFloat(targetAmount),
      currentAmount: parseFloat(currentAmount),
      deadline: new Date(deadline),
      category,
    });

    onDismiss();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <View style={styles.content}>
          <TextInput
            label="Goal Title"
            value={title}
            onChangeText={setTitle}
            style={styles.input}
          />

          <TextInput
            label="Target Amount"
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Current Amount"
            value={currentAmount}
            onChangeText={setCurrentAmount}
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Deadline"
            value={deadline}
            onChangeText={setDeadline}
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />

          <SegmentedButtons
            value={category}
            onValueChange={(value) =>
              setCategory(value as FinancialGoal["category"])
            }
            buttons={[
              { value: "savings", label: "Savings" },
              { value: "debt", label: "Debt" },
              { value: "investment", label: "Investment" },
              { value: "other", label: "Other" },
            ]}
            style={styles.segmentedButtons}
          />

          <View style={styles.buttonContainer}>
            <Button mode="outlined" onPress={onDismiss} style={styles.button}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.button}
              disabled={!title || !targetAmount || !currentAmount || !deadline}
            >
              Save
            </Button>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
  },
  content: {
    padding: theme.spacing.md,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.md,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: theme.spacing.md,
  },
  button: {
    marginLeft: theme.spacing.sm,
  },
});

export default FinancialGoalModal;
