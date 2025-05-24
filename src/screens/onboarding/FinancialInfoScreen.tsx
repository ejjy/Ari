import React, { useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Text, Chip } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../types/navigation";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { theme } from "../../theme/theme";
import { useOnboarding } from "../../context/OnboardingContext";
import { auth, db } from "../../config/firebase";
import { doc, updateDoc } from "firebase/firestore";

type Props = NativeStackScreenProps<OnboardingStackParamList, "FinancialInfo">;

const FinancialInfoScreen = ({ navigation }: Props) => {
  const { data, updateData } = useOnboarding();
  const [monthlyIncome, setMonthlyIncome] = useState(
    data.monthlyIncome.toString(),
  );
  const [monthlyExpenses, setMonthlyExpenses] = useState(
    data.monthlyExpenses.toString(),
  );
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    data.financialGoals,
  );
  const [error, setError] = useState("");

  const financialGoals = [
    "Save for retirement",
    "Buy a house",
    "Pay off debt",
    "Start a business",
    "Emergency fund",
    "Education fund",
    "Travel fund",
    "Investment portfolio",
  ];

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal],
    );
  };

  const handleComplete = async () => {
    if (!monthlyIncome || !monthlyExpenses) {
      setError("Please fill in all fields");
      return;
    }

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No user found");

      const userData = {
        ...data,
        monthlyIncome: parseFloat(monthlyIncome),
        monthlyExpenses: parseFloat(monthlyExpenses),
        financialGoals: selectedGoals,
        onboardingCompleted: true,
      };

      // Update user document in Firestore
      await updateDoc(doc(db, "users", user.uid), userData);

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: "Main" }],
      });
    } catch (err) {
      setError("Failed to save information");
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Financial Information</Text>
        <Text style={styles.subtitle}>
          Help us understand your financial situation to provide better insights
        </Text>

        <Input
          label="Monthly Income"
          value={monthlyIncome}
          onChangeText={setMonthlyIncome}
          keyboardType="numeric"
          error={error}
        />

        <Input
          label="Monthly Expenses"
          value={monthlyExpenses}
          onChangeText={setMonthlyExpenses}
          keyboardType="numeric"
          error={error}
        />

        <Text style={styles.sectionTitle}>Financial Goals</Text>
        <Text style={styles.sectionSubtitle}>
          Select your primary financial goals (select all that apply)
        </Text>

        <View style={styles.goalsContainer}>
          {financialGoals.map((goal) => (
            <Chip
              key={goal}
              selected={selectedGoals.includes(goal)}
              onPress={() => toggleGoal(goal)}
              style={styles.goalChip}
              selectedColor={theme.colors.primary}
            >
              {goal}
            </Chip>
          ))}
        </View>

        <Button onPress={handleComplete} style={styles.button}>
          Complete Setup
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Back
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  goalsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  goalChip: {
    marginBottom: theme.spacing.sm,
  },
  button: {
    marginTop: theme.spacing.xl,
  },
  backButton: {
    marginTop: theme.spacing.sm,
  },
});

export default FinancialInfoScreen;
