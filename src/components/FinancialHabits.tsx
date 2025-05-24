import React from "react";
import { View, StyleSheet, Animated } from "react-native";
import {
  Text,
  Card,
  ProgressBar,
  IconButton,
  useTheme,
  Surface,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { theme } from "../theme/theme";

interface Habit {
  id: string;
  name: string;
  description: string;
  streak: number;
  target: number;
  completed: boolean;
  lastCompleted: Date;
}

interface FinancialHabitsProps {
  habits: Habit[];
  onCompleteHabit: (habitId: string) => void;
  onAddHabit: () => void;
}

const FinancialHabits = ({
  habits,
  onCompleteHabit,
  onAddHabit,
}: FinancialHabitsProps) => {
  const paperTheme = useTheme();

  const getStreakColor = (streak: number) => {
    if (streak >= 7) return paperTheme.colors.primary;
    if (streak >= 3) return paperTheme.colors.tertiary;
    return paperTheme.colors.onSurface;
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 7) return "fire";
    if (streak >= 3) return "star";
    return "star-outline";
  };

  const getCompletionStatus = (habit: Habit) => {
    const today = new Date();
    const lastCompleted = new Date(habit.lastCompleted);
    const isToday = today.toDateString() === lastCompleted.toDateString();

    if (isToday && habit.completed) {
      return { text: "Completed today", color: paperTheme.colors.primary };
    }
    if (isToday && !habit.completed) {
      return { text: "Pending", color: paperTheme.colors.error };
    }
    return { text: "Not started", color: paperTheme.colors.onSurface };
  };

  const getProgressColor = (habit: Habit) => {
    const progress = habit.streak / habit.target;
    if (progress >= 0.8) return paperTheme.colors.primary;
    if (progress >= 0.5) return paperTheme.colors.tertiary;
    return paperTheme.colors.error;
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={24}
              color={paperTheme.colors.primary}
              style={styles.titleIcon}
            />

            <Text style={styles.title}>Financial Habits</Text>
          </View>
          <IconButton
            icon="plus"
            size={20}
            onPress={onAddHabit}
            style={styles.addButton}
          />
        </View>

        {habits.map((habit) => {
          const status = getCompletionStatus(habit);
          return (
            <Surface key={habit.id} style={styles.habitItem} elevation={1}>
              <View style={styles.habitHeader}>
                <View style={styles.habitTitleContainer}>
                  <MaterialCommunityIcons
                    name={getStreakIcon(habit.streak)}
                    size={20}
                    color={getStreakColor(habit.streak)}
                    style={styles.streakIcon}
                  />

                  <Text style={styles.habitName}>{habit.name}</Text>
                </View>
                <View style={styles.streakContainer}>
                  <Text
                    style={[
                      styles.streakText,
                      { color: getStreakColor(habit.streak) },
                    ]}
                  >
                    {habit.streak} days
                  </Text>
                </View>
              </View>

              <Text style={styles.habitDescription}>{habit.description}</Text>

              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={habit.streak / habit.target}
                  color={getProgressColor(habit)}
                  style={styles.progressBar}
                />

                <Text style={styles.progressText}>
                  {habit.streak}/{habit.target} days
                </Text>
              </View>

              <View style={styles.statusContainer}>
                <Text style={[styles.statusText, { color: status.color }]}>
                  {status.text}
                </Text>
                <IconButton
                  icon={habit.completed ? "check-circle" : "circle-outline"}
                  size={24}
                  onPress={() => onCompleteHabit(habit.id)}
                  iconColor={
                    habit.completed
                      ? paperTheme.colors.primary
                      : paperTheme.colors.onSurface
                  }
                  style={styles.completeButton}
                />
              </View>
            </Surface>
          );
        })}

        {habits.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="calendar-plus"
              size={48}
              color={paperTheme.colors.onSurface}
              style={styles.emptyIcon}
            />

            <Text style={styles.emptyText}>
              No habits yet. Add your first financial habit!
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: theme.spacing.md,
    marginTop: 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleIcon: {
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  addButton: {
    margin: 0,
  },
  habitItem: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  habitHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  habitTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  streakIcon: {
    marginRight: theme.spacing.xs,
  },
  habitName: {
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  streakContainer: {
    backgroundColor: theme.colors.surfaceVariant,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.spacing.xs,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  habitDescription: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  completeButton: {
    margin: 0,
  },
  emptyContainer: {
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    textAlign: "center",
    color: theme.colors.text,
    fontStyle: "italic",
  },
});

export default FinancialHabits;
