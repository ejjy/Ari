import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import {
  Modal,
  Portal,
  TextInput,
  Button,
  SegmentedButtons,
} from "react-native-paper";
import { theme } from "../theme/theme";
import { db } from "../config/firebase";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  type: "income" | "expense";
}

interface EditTransactionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  transaction: Transaction | null;
}

const EditTransactionModal = ({
  visible,
  onDismiss,
  onSuccess,
  transaction,
}: EditTransactionModalProps) => {
  const { user } = useAuth();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(transaction.amount.toString());
      setDescription(transaction.description);
      setCategory(transaction.category);
    }
  }, [transaction]);

  const handleSubmit = async () => {
    if (!user || !transaction || !amount || !description || !category) return;

    setLoading(true);
    try {
      const transactionRef = doc(db, "transactions", transaction.id);
      await updateDoc(transactionRef, {
        type,
        amount: parseFloat(amount),
        description,
        category,
      });

      onSuccess();
      onDismiss();
    } catch (error) {
      console.error("Error updating transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !transaction) return;

    setLoading(true);
    try {
      const transactionRef = doc(db, "transactions", transaction.id);
      await deleteDoc(transactionRef);

      onSuccess();
      onDismiss();
    } catch (error) {
      console.error("Error deleting transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <View style={styles.content}>
          <SegmentedButtons
            value={type}
            onValueChange={(value) => setType(value as "income" | "expense")}
            buttons={[
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" },
            ]}
            style={styles.segmentedButtons}
          />

          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={styles.input}
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
          />

          <TextInput
            label="Category"
            value={category}
            onChangeText={setCategory}
            style={styles.input}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="outlined"
              onPress={handleDelete}
              loading={loading}
              textColor={theme.colors.error}
              style={styles.deleteButton}
            >
              Delete
            </Button>
            <Button mode="outlined" onPress={onDismiss} style={styles.button}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={!amount || !description || !category}
              style={styles.button}
            >
              Save Changes
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
  segmentedButtons: {
    marginBottom: theme.spacing.md,
  },
  input: {
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
  deleteButton: {
    marginRight: "auto",
  },
});

export default EditTransactionModal;
