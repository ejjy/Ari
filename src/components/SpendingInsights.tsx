import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Card, ProgressBar, useTheme } from "react-native-paper";
import { theme } from "../theme/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  date: Date;
}

interface SpendingInsightsProps {
  transactions: Transaction[];
  budgetCategories: Array<{
    id: string;
    name: string;
    limit: number;
    spent: number;
  }>;
}

const SpendingInsights = ({
  transactions,
  budgetCategories,
}: SpendingInsightsProps) => {
  const paperTheme = useTheme();

  const insights = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter transactions for the last 30 days
    const recentTransactions = transactions.filter(
      (t) => t.date >= thirtyDaysAgo && t.type === "expense",
    );

    // Calculate total spending
    const totalSpent = recentTransactions.reduce((sum, t) => sum + t.amount, 0);

    // Calculate spending by category
    const spendingByCategory = recentTransactions.reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get top spending categories
    const topCategories = Object.entries(spendingByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Calculate daily average
    const dailyAverage = totalSpent / 30;

    // Calculate budget utilization
    const totalBudget = budgetCategories.reduce(
      (sum, cat) => sum + cat.limit,
      0,
    );
    const totalBudgetSpent = budgetCategories.reduce(
      (sum, cat) => sum + cat.spent,
      0,
    );
    const budgetUtilization =
      totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0;

    return {
      totalSpent,
      dailyAverage,
      topCategories,
      budgetUtilization,
    };
  }, [transactions, budgetCategories]);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Food: "food",
      Transportation: "car",
      Housing: "home",
      Entertainment: "movie",
      Shopping: "shopping",
      Utilities: "lightning-bolt",
      Healthcare: "medical-bag",
      Education: "school",
      Travel: "airplane",
      Other: "dots-horizontal",
    };
    return icons[category] || "dots-horizontal";
  };

  const getStatusColor = (utilization: number) => {
    if (utilization > 90) return paperTheme.colors.error;
    if (utilization > 75) return paperTheme.colors.tertiary;
    return paperTheme.colors.primary;
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <Text style={styles.title}>Spending Insights</Text>

        <View style={styles.insightRow}>
          <View style={styles.insightItem}>
            <MaterialCommunityIcons
              name="cash-multiple"
              size={24}
              color={paperTheme.colors.primary}
            />

            <Text style={styles.insightLabel}>30-Day Total</Text>
            <Text style={styles.insightValue}>
              ${insights.totalSpent.toFixed(2)}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <MaterialCommunityIcons
              name="calendar-today"
              size={24}
              color={paperTheme.colors.primary}
            />

            <Text style={styles.insightLabel}>Daily Average</Text>
            <Text style={styles.insightValue}>
              ${insights.dailyAverage.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Spending Categories</Text>
          {insights.topCategories.map(([category, amount]) => (
            <View key={category} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <MaterialCommunityIcons
                  name={getCategoryIcon(category) as any}
                  size={20}
                  color={paperTheme.colors.primary}
                  style={styles.categoryIcon}
                />

                <Text style={styles.categoryName}>{category}</Text>
              </View>
              <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Utilization</Text>
          <ProgressBar
            progress={insights.budgetUtilization / 100}
            color={getStatusColor(insights.budgetUtilization)}
            style={styles.progressBar}
          />

          <View style={styles.utilizationContainer}>
            <Text style={styles.utilizationText}>
              {insights.budgetUtilization.toFixed(1)}% of monthly budget used
            </Text>
            <MaterialCommunityIcons
              name={
                insights.budgetUtilization > 90
                  ? "alert-circle"
                  : insights.budgetUtilization > 75
                    ? "information"
                    : "check-circle"
              }
              size={20}
              color={getStatusColor(insights.budgetUtilization)}
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: theme.spacing.md,
    marginTop: 0,
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: theme.spacing.md,
  },
  insightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.md,
  },
  insightItem: {
    flex: 1,
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.spacing.sm,
    marginHorizontal: theme.spacing.xs,
  },
  insightLabel: {
    fontSize: 12,
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
  },
  insightValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: theme.spacing.xs,
  },
  section: {
    marginTop: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: theme.spacing.sm,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.spacing.xs,
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    marginRight: theme.spacing.sm,
  },
  categoryName: {
    fontSize: 14,
    color: theme.colors.text,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: theme.spacing.xs,
  },
  utilizationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  utilizationText: {
    fontSize: 12,
    color: theme.colors.text,
  },
});

export default SpendingInsights;
