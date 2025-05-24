import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, IconButton, Chip } from "react-native-paper";
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

interface RecurringTransactionsProps {
  transactions: RecurringTransaction[];
  onAdd: () => void;
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (id: string) => void;
}

const RecurringTransactions = ({
  transactions,
  onAdd,
  onEdit,
  onDelete,
}: RecurringTransactionsProps) => {
  const getFrequencyColor = (frequency: RecurringTransaction["frequency"]) => {
    switch (frequency) {
      case "daily":
        return theme.colors.primary;
      case "weekly":
        return theme.colors.secondary;
      case "monthly":
        return theme.colors.success;
      case "yearly":
        return theme.colors.warning;
      default:
        return theme.colors.text;
    }
  };

  const formatNextDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `In ${diffDays} days`;
    return date.toLocaleDateString();
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>Recurring Transactions</Text>
          <IconButton icon="plus" size={20} onPress={onAdd} />
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recurring transactions</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first recurring transaction
            </Text>
          </View>
        ) : (
          transactions.map((transaction) => {
            const isIncome = transaction.type === "income";
            const amountColor = isIncome
              ? theme.colors.success
              : theme.colors.error;
            const amountPrefix = isIncome ? "+" : "-";

            return (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionCard}
                onPress={() => onEdit(transaction)}
              >
                <View style={styles.transactionHeader}>
                  <View>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <Text style={styles.transactionCategory}>
                      {transaction.category}
                    </Text>
                  </View>
                  <Text
                    style={[styles.transactionAmount, { color: amountColor }]}
                  >
                    {amountPrefix}${Math.abs(transaction.amount).toFixed(2)}
                  </Text>
                </View>

                <View style={styles.transactionFooter}>
                  <Chip
                    mode="outlined"
                    textStyle={{
                      color: getFrequencyColor(transaction.frequency),
                    }}
                    style={[
                      styles.frequencyChip,
                      { borderColor: getFrequencyColor(transaction.frequency) },
                    ]}
                  >
                    {transaction.frequency.charAt(0).toUpperCase() +
                      transaction.frequency.slice(1)}
                  </Chip>
                  <Text style={styles.nextDate}>
                    Next: {formatNextDate(transaction.nextDate)}
                  </Text>
                </View>

                <IconButton
                  icon="delete"
                  size={20}
                  iconColor={theme.colors.error}
                  style={styles.deleteButton}
                  onPress={() => onDelete(transaction.id)}
                />
              </TouchableOpacity>
            );
          })
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyContainer: {
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: "center",
  },
  transactionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.sm,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: "bold",
  },
  transactionCategory: {
    fontSize: 14,
    color: theme.colors.text,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: "bold",
  },
  transactionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  frequencyChip: {
    height: 24,
  },
  nextDate: {
    fontSize: 12,
    color: theme.colors.text,
  },
  deleteButton: {
    position: "absolute",
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    margin: 0,
  },
});

export default RecurringTransactions;
