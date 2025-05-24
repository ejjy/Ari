import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Modal, Portal, TextInput, Button } from "react-native-paper";
import { theme } from "../theme/theme";
import { db } from "../config/firebase";
import { doc, updateDoc, arrayRemove, arrayUnion } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  spent: number;
}

interface EditBudgetCategoryModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
  category: BudgetCategory | null;
}

const EditBudgetCategoryModal = ({
  visible,
  onDismiss,
  onSuccess,
  category,
}: EditBudgetCategoryModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setLimit(category.limit.toString());
    }
  }, [category]);

  const handleSubmit = async () => {
    if (!user || !category || !name || !limit) return;

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      const updatedCategory = {
        ...category,
        name,
        limit: parseFloat(limit),
      };

      await updateDoc(userRef, {
        budgetCategories: arrayRemove(category),
      });
      await updateDoc(userRef, {
        budgetCategories: arrayUnion(updatedCategory),
      });

      onSuccess();
      onDismiss();
    } catch (error) {
      console.error("Error updating budget category:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !category) return;

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        budgetCategories: arrayRemove(category),
      });

      onSuccess();
      onDismiss();
    } catch (error) {
      console.error("Error deleting budget category:", error);
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
          <TextInput
            label="Category Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
          />

          <TextInput
            label="Monthly Limit"
            value={limit}
            onChangeText={setLimit}
            keyboardType="decimal-pad"
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
              disabled={!name || !limit}
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

export default EditBudgetCategoryModal;
