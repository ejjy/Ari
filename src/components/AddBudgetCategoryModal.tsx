import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Modal, Portal, TextInput, Button } from "react-native-paper";
import { theme } from "../theme/theme";
import { db } from "../config/firebase";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

interface AddBudgetCategoryModalProps {
  visible: boolean;
  onDismiss: () => void;
  onSuccess: () => void;
}

const AddBudgetCategoryModal = ({
  visible,
  onDismiss,
  onSuccess,
}: AddBudgetCategoryModalProps) => {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || !name || !limit) return;

    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        budgetCategories: arrayUnion({
          id: Date.now().toString(),
          name,
          limit: parseFloat(limit),
          spent: 0,
        }),
      });

      setName("");
      setLimit("");
      onSuccess();
      onDismiss();
    } catch (error) {
      console.error("Error adding budget category:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal data-oid="x4bh9tu">
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
        data-oid="zp9s9_p"
      >
        <View style={styles.content} data-oid="kw6o5y9">
          <TextInput
            label="Category Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            data-oid="ym7p-yt"
          />

          <TextInput
            label="Monthly Limit"
            value={limit}
            onChangeText={setLimit}
            keyboardType="decimal-pad"
            style={styles.input}
            data-oid="ytpt57j"
          />

          <View style={styles.buttonContainer} data-oid="m_1rxy_">
            <Button
              mode="outlined"
              onPress={onDismiss}
              style={styles.button}
              data-oid="z-vzwjz"
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={!name || !limit}
              style={styles.button}
              data-oid="_z5plqm"
            >
              Add Category
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
});

export default AddBudgetCategoryModal;
