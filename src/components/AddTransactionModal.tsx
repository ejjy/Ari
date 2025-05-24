import React, { useState } from "react";
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
import { collection, addDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

interface AddTransactionModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

const AddTransactionModal = ({
  visible,
  onDismiss,
  onSuccess,
}: AddTransactionModalProps) => {
  const { user } = useAuth();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !amount || !description || !category) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "transactions"), {
        userId: user.uid,
        type,
        amount: parseFloat(amount),
        description,
        category,
        date: new Date(),
      });

      setAmount("");
      setDescription("");
      setCategory("");
      onSuccess();
      onDismiss();
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal data-oid="z0bne__">
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
        data-oid="64wvtvr"
      >
        <View style={styles.content} data-oid="flajsyq">
          <SegmentedButtons
            value={type}
            onValueChange={(value) => setType(value as "income" | "expense")}
            buttons={[
              { value: "expense", label: "Expense" },
              { value: "income", label: "Income" },
            ]}
            style={styles.segmentedButtons}
            data-oid="5h:dyjd"
          />

          <TextInput
            label="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={styles.input}
            data-oid="6m0yja6"
          />

          <TextInput
            label="Description"
            value={description}
            onChangeText={setDescription}
            style={styles.input}
            data-oid="0mzczij"
          />

          <TextInput
            label="Category"
            value={category}
            onChangeText={setCategory}
            style={styles.input}
            data-oid="r94p3au"
          />

          <View style={styles.buttonContainer} data-oid="jha3qc1">
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.button}
              data-oid="nyev.qn"
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={!amount || !description || !category}
              style={styles.button}
              data-oid="u2v80zy"
            >
              Add Transaction
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
});

export default AddTransactionModal;
