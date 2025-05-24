import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, RefreshControl } from "react-native";
import { Text, Card, ActivityIndicator, IconButton } from "react-native-paper";
import { theme } from "../../theme/theme";
import { Header } from "../../components/Header";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import SpendingInsights from "../../components/SpendingInsights";
import FinancialGoals from "../../components/FinancialGoals";
import FinancialGoalModal from "../../components/FinancialGoalModal";
import AIInsights from "../../components/AIInsights";
import {
  generateFinancialInsights,
  generateFinancialAdvice,
  calculateFinancialHealthScore,
  analyzeEmotionalImpact,
  generateWeeklySummary,
} from "../../services/aiService";
import FinancialHabits from "../../components/FinancialHabits";
import HabitModal from "../../components/HabitModal";
import { Transaction, BudgetCategory, FinancialGoal, Habit } from "../../types/finance";

const HomeScreen = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(
    [],
  );
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [emotionalAnalysis, setEmotionalAnalysis] = useState<{
    tone: "positive" | "neutral" | "concerned";
    sentiment: number;
    message: string;
  } | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitModalVisible, setHabitModalVisible] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);

  const fetchData = async (isRefreshing = false) => {
    if (!user) return;

    try {
      setLoading(true);
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (userData) {
        setTransactions(userData.transactions || []);
        setBudgetCategories(userData.budgetCategories || []);
        setGoals(userData.goals || []);
        setHabits(userData.habits || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleAddGoal = () => {
    setSelectedGoal(null);
    setGoalModalVisible(true);
  };

  const handleEditGoal = (goal: FinancialGoal) => {
    setSelectedGoal(goal);
    setGoalModalVisible(true);
  };

  const handleSaveGoal = async (goalData: Omit<FinancialGoal, "id">) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const updatedGoals = selectedGoal
        ? goals.map((g) =>
            g.id === selectedGoal.id ? { ...goalData, id: g.id } : g,
          )
        : [...goals, { ...goalData, id: Date.now().toString() }];

      await setDoc(
        userRef,
        {
          goals: updatedGoals,
        },
        { merge: true },
      );

      setGoals(updatedGoals);
    } catch (error) {
      console.error("Error saving goal:", error);
    }
  };

  const handleGetInsights = async () => {
    if (!user) return;

    try {
      setAiLoading(true);
      setAiError(null);
      setInsights(null);
      setAdvice(null);

      const context = {
        transactions,
        budgetCategories,
        goals,
        monthlyIncome: calculateMonthlyIncome(),
        monthlyExpenses: calculateMonthlyExpenses(),
      };

      const [insightsResult, healthScoreResult, emotionalResult] =
        await Promise.all([
          generateFinancialInsights(context),
          calculateFinancialHealthScore(context),
          analyzeEmotionalImpact(context),
        ]);

      setInsights(insightsResult);
      setHealthScore(healthScoreResult.score);
      setEmotionalAnalysis(emotionalResult);
    } catch (error) {
      console.error("Error getting insights:", error);
      setAiError("An error occurred while getting insights");
    } finally {
      setAiLoading(false);
    }
  };

  const handleGetAdvice = async () => {
    if (!user) return;

    try {
      setAiLoading(true);
      setAiError(null);
      setInsights(null);
      setAdvice(null);

      const context = {
        transactions,
        budgetCategories,
        goals,
        monthlyIncome: calculateMonthlyIncome(),
        monthlyExpenses: calculateMonthlyExpenses(),
      };

      const [adviceResult, weeklySummaryResult] = await Promise.all([
        generateFinancialAdvice(context),
        generateWeeklySummary(context),
      ]);

      setAdvice(adviceResult);
      setWeeklySummary(weeklySummaryResult);
    } catch (error) {
      console.error("Error getting advice:", error);
      setAiError("An error occurred while getting advice");
    } finally {
      setAiLoading(false);
    }
  };

  const calculateMonthlyIncome = () => {
    return transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateMonthlyExpenses = () => {
    return transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleAddHabit = () => {
    setSelectedHabit(null);
    setHabitModalVisible(true);
  };

  const handleSaveHabit = async (habitData: {
    name: string;
    description: string;
    target: number;
  }) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const newHabit: Habit = {
        id: selectedHabit?.id || Date.now().toString(),
        name: habitData.name,
        description: habitData.description,
        streak: selectedHabit?.streak || 0,
        target: habitData.target,
        completed: false,
        lastCompleted: new Date(),
      };

      const updatedHabits = selectedHabit
        ? habits.map((h) => (h.id === selectedHabit.id ? newHabit : h))
        : [...habits, newHabit];

      await setDoc(
        userRef,
        {
          habits: updatedHabits,
        },
        { merge: true },
      );

      setHabits(updatedHabits);
    } catch (error) {
      console.error("Error saving habit:", error);
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const updatedHabits = habits.map((habit) => {
        if (habit.id === habitId) {
          const today = new Date();
          const lastCompleted = new Date(habit.lastCompleted);
          const isConsecutive = today.getDate() - lastCompleted.getDate() === 1;

          return {
            ...habit,
            completed: !habit.completed,
            streak: isConsecutive ? habit.streak + 1 : 1,
            lastCompleted: today,
          };
        }
        return habit;
      });

      await setDoc(
        userRef,
        {
          habits: updatedHabits,
        },
        { merge: true },
      );

      setHabits(updatedHabits);
    } catch (error) {
      console.error("Error completing habit:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Financial Dashboard" />

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Financial Overview Section */}
        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text style={styles.overviewTitle}>Financial Overview</Text>
            <View style={styles.overviewGrid}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Monthly Income</Text>
                <Text style={styles.overviewValue}>
                  ${calculateMonthlyIncome().toFixed(2)}
                </Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Monthly Expenses</Text>
                <Text style={styles.overviewValue}>
                  ${calculateMonthlyExpenses().toFixed(2)}
                </Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>Net Savings</Text>
                <Text
                  style={[
                    styles.overviewValue,
                    {
                      color:
                        calculateMonthlyIncome() - calculateMonthlyExpenses() >=
                        0
                          ? theme.colors.success
                          : theme.colors.error,
                    },
                  ]}
                >
                  $
                  {(
                    calculateMonthlyIncome() - calculateMonthlyExpenses()
                  ).toFixed(2)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* AI Insights Section */}
        <Card style={styles.insightsCard}>
          <Card.Content>
            <View style={styles.insightsHeader}>
              <Text style={styles.insightsTitle}>AI Insights</Text>
              {healthScore !== null && (
                <View style={styles.healthScoreContainer}>
                  <Text style={styles.healthScoreLabel}>Health Score</Text>
                  <Text
                    style={[
                      styles.healthScore,
                      {
                        color:
                          healthScore >= 80
                            ? theme.colors.success
                            : healthScore >= 60
                              ? theme.colors.warning
                              : theme.colors.error,
                      },
                    ]}
                  >
                    {healthScore}%
                  </Text>
                </View>
              )}
            </View>

            {aiLoading ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : aiError ? (
              <Text style={styles.errorText}>{aiError}</Text>
            ) : (
              <>
                {insights && <Text style={styles.insightText}>{insights}</Text>}
                {advice && <Text style={styles.adviceText}>{advice}</Text>}
                {emotionalAnalysis && (
                  <View style={styles.emotionalContainer}>
                    <Text style={styles.emotionalText}>
                      {emotionalAnalysis.message}
                    </Text>
                  </View>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        {/* Spending Insights */}
        <SpendingInsights
          transactions={transactions}
          budgetCategories={budgetCategories}
        />

        {/* Financial Goals */}
        <Card style={styles.goalsCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Financial Goals</Text>
              <IconButton
                icon="plus"
                size={20}
                onPress={handleAddGoal}
                style={styles.addButton}
              />
            </View>
            <FinancialGoals
              goals={goals}
              onEditGoal={handleEditGoal}
              onAddGoal={handleAddGoal}
            />
          </Card.Content>
        </Card>

        {/* Financial Habits */}
        <Card style={styles.habitsCard}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Financial Habits</Text>
              <IconButton
                icon="plus"
                size={20}
                onPress={handleAddHabit}
                style={styles.addButton}
              />
            </View>
            <FinancialHabits
              habits={habits}
              onCompleteHabit={handleCompleteHabit}
              onAddHabit={handleAddHabit}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Modals */}
      <FinancialGoalModal
        visible={goalModalVisible}
        onDismiss={() => setGoalModalVisible(false)}
        onSave={handleSaveGoal}
        goal={selectedGoal || undefined}
      />

      <HabitModal
        visible={habitModalVisible}
        onDismiss={() => setHabitModalVisible(false)}
        onSave={handleSaveHabit}
        habit={selectedHabit || undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  overviewCard: {
    margin: theme.spacing.md,
    elevation: 2,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: theme.spacing.md,
  },
  overviewGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewItem: {
    flex: 1,
    alignItems: "center",
  },
  overviewLabel: {
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: "bold",
  },
  insightsCard: {
    margin: theme.spacing.md,
    marginTop: 0,
    elevation: 2,
  },
  insightsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  insightsTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  healthScoreContainer: {
    alignItems: "center",
  },
  healthScoreLabel: {
    fontSize: 12,
    color: theme.colors.text,
  },
  healthScore: {
    fontSize: 18,
    fontWeight: "bold",
  },
  insightText: {
    fontSize: 14,
    marginBottom: theme.spacing.sm,
  },
  adviceText: {
    fontSize: 14,
    fontStyle: "italic",
    marginBottom: theme.spacing.sm,
  },
  emotionalContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.sm,
    borderRadius: theme.spacing.xs,
  },
  emotionalText: {
    fontSize: 14,
  },
  goalsCard: {
    margin: theme.spacing.md,
    marginTop: 0,
    elevation: 2,
  },
  habitsCard: {
    margin: theme.spacing.md,
    marginTop: 0,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addButton: {
    margin: 0,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: "center",
  },
});

export default HomeScreen;
