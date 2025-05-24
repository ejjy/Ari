import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Card, ProgressBar, IconButton } from "react-native-paper";
import { theme } from "../theme/theme";

interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: "savings" | "debt" | "investment" | "other";
}

interface FinancialGoalsProps {
  goals: FinancialGoal[];
  onAddGoal: () => void;
  onEditGoal: (goal: FinancialGoal) => void;
}

const FinancialGoals = ({
  goals,
  onAddGoal,
  onEditGoal,
}: FinancialGoalsProps) => {
  const getCategoryIcon = (category: FinancialGoal["category"]) => {
    switch (category) {
      case "savings":
        return "piggy-bank";
      case "debt":
        return "credit-card";
      case "investment":
        return "chart-line";
      default:
        return "star";
    }
  };

  const getCategoryColor = (category: FinancialGoal["category"]) => {
    switch (category) {
      case "savings":
        return theme.colors.success;
      case "debt":
        return theme.colors.error;
      case "investment":
        return theme.colors.primary;
      default:
        return theme.colors.secondary;
    }
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>Financial Goals</Text>
          <IconButton icon="plus" size={20} onPress={onAddGoal} />
        </View>

        {goals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No goals set yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first financial goal
            </Text>
          </View>
        ) : (
          goals.map((goal) => {
            const progress = goal.currentAmount / goal.targetAmount;
            const remaining = goal.targetAmount - goal.currentAmount;
            const daysRemaining = Math.ceil(
              (goal.deadline.getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24),
            );

            return (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalCard}
                onPress={() => onEditGoal(goal)}
              >
                <View style={styles.goalHeader}>
                  <View style={styles.goalTitleContainer}>
                    <IconButton
                      icon={getCategoryIcon(goal.category)}
                      size={20}
                      iconColor={getCategoryColor(goal.category)}
                      style={styles.categoryIcon}
                    />

                    <Text style={styles.goalTitle}>{goal.title}</Text>
                  </View>
                  <Text style={styles.goalAmount}>
                    ${goal.currentAmount.toFixed(2)} / $
                    {goal.targetAmount.toFixed(2)}
                  </Text>
                </View>

                <ProgressBar
                  progress={progress}
                  color={getCategoryColor(goal.category)}
                  style={styles.progressBar}
                />

                <View style={styles.goalFooter}>
                  <Text style={styles.remainingText}>
                    ${remaining.toFixed(2)} remaining
                  </Text>
                  <Text style={styles.deadlineText}>
                    {daysRemaining} days left
                  </Text>
                </View>
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
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  goalTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    margin: 0,
    marginRight: theme.spacing.xs,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  goalAmount: {
    fontSize: 14,
    color: theme.colors.text,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  goalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  remainingText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  deadlineText: {
    fontSize: 12,
    color: theme.colors.text,
  },
});

export default FinancialGoals;
