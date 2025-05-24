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

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  nextDate: Date;
}

interface RecurringTransactionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSave: (transaction: Omit<RecurringTransaction, "id">) => void;
  transaction?: RecurringTransaction;
}

const RecurringTransactionModal = ({
  visible,
  onDismiss,
  onSave,
  transaction,
}: RecurringTransactionModalProps) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [type, setType] = useState<RecurringTransaction["type"]>("expense");
  const [frequency, setFrequency] =
    useState<RecurringTransaction["frequency"]>("monthly");
  const [nextDate, setNextDate] = useState("");

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setCategory(transaction.category);
      setType(transaction.type);
      setFrequency(transaction.frequency);
      setNextDate(transaction.nextDate.toISOString().split("T")[0]);
    } else {
      setDescription("");
      setAmount("");
      setCategory("");
      setType("expense");
      setFrequency("monthly");
      setNextDate("");
    }
  }, [transaction]);

  const handleSave = () => {
    if (!description || !amount || !category || !nextDate) return;

    onSave({
      description,
      amount: parseFloat(amount),
      category,
      type,
      frequency,
      nextDate: new Date(nextDate),
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
            label="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
          />

          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
          />

          <TextInput
            label="Category"
            value={category}
            onChangeText={setCategory}
            style={styles.input}
          />

          <TextInput
            label="Next Date"
            value={nextDate}
            onChangeText={setNextDate}
            placeholder="YYYY-MM-DD"
            style={styles.input}
          />

          <SegmentedButtons
            value={type}
            onValueChange={(value) =>
              setType(value as RecurringTransaction["type"])
            }
            buttons={[
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" },
            ]}
            style={styles.segmentedButtons}
          />

          <SegmentedButtons
            value={frequency}
            onValueChange={(value) =>
              setFrequency(value as RecurringTransaction["frequency"])
            }
            buttons={[
              { value: "daily", label: "Daily" },
              { value: "weekly", label: "Weekly" },
              { value: "monthly", label: "Monthly" },
              { value: "yearly", label: "Yearly" },
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
              disabled={!description || !amount || !category || !nextDate}
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

export default RecurringTransactionModal;
