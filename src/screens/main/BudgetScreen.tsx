import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import {
  Text,
  ProgressBar,
  IconButton,
  ActivityIndicator,
} from "react-native-paper";
import { theme } from "../../theme/theme";
import { Header } from "../../components/Header";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import AddBudgetCategoryModal from "../../components/AddBudgetCategoryModal";
import EditBudgetCategoryModal from "../../components/EditBudgetCategoryModal";

interface BudgetCategory {
  id: string;
  name: string;
  limit: number;
  spent: number;
}

const BudgetScreen = () => {
  const { user } = useAuth();
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(
    [],
  );
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<BudgetCategory | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBudgetData = async (isRefreshing = false) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (userData?.budgetCategories) {
        setBudgetCategories(userData.budgetCategories);
      } else {
        setBudgetCategories([]);
      }
    } catch (error) {
      console.error("Error fetching budget data:", error);
      setError("Failed to load budget data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchBudgetData(true);
  };

  useEffect(() => {
    fetchBudgetData(true);
  }, [user]);

  const handleEditCategory = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setEditModalVisible(true);
  };

  const renderBudgetCategory = ({ item }: { item: BudgetCategory }) => {
    const progress = item.spent / item.limit;
    const remaining = item.limit - item.spent;
    const isOverBudget = progress > 1;

    return (
      <TouchableOpacity
        style={styles.categoryCard}
        onPress={() => handleEditCategory(item)}
      >
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text
            style={[
              styles.categoryLimit,
              isOverBudget && { color: theme.colors.error },
            ]}
          >
            ${item.spent.toFixed(2)} / ${item.limit.toFixed(2)}
          </Text>
        </View>

        <ProgressBar
          progress={progress}
          color={isOverBudget ? theme.colors.error : theme.colors.primary}
          style={styles.progressBar}
        />

        <Text
          style={[
            styles.remainingText,
            isOverBudget && { color: theme.colors.error },
          ]}
        >
          ${remaining.toFixed(2)} remaining
        </Text>
      </TouchableOpacity>
    );
  };

  const totalBudget = budgetCategories.reduce(
    (sum, category) => sum + category.limit,
    0,
  );
  const totalSpent = budgetCategories.reduce(
    (sum, category) => sum + category.spent,
    0,
  );
  const totalRemaining = totalBudget - totalSpent;
  const isOverBudget = totalSpent > totalBudget;

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <IconButton
            icon="refresh"
            onPress={() => fetchBudgetData(true)}
            style={styles.retryButton}
          />
        </View>
      );
    }

    return (
      <>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Budget</Text>
            <Text style={styles.summaryValue}>${totalBudget.toFixed(2)}</Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text
              style={[
                styles.summaryValue,
                isOverBudget && { color: theme.colors.error },
              ]}
            >
              ${totalSpent.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text
              style={[
                styles.summaryValue,
                {
                  color: isOverBudget
                    ? theme.colors.error
                    : theme.colors.primary,
                },
              ]}
            >
              ${totalRemaining.toFixed(2)}
            </Text>
          </View>
        </View>

        <FlatList
          data={budgetCategories}
          renderItem={renderBudgetCategory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No budget categories yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first budget category
              </Text>
            </View>
          }
        />
      </>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Budget"
        rightComponent={
          <IconButton icon="plus" onPress={() => setAddModalVisible(true)} />
        }
      />

      {renderContent()}

      <AddBudgetCategoryModal
        visible={addModalVisible}
        onDismiss={() => setAddModalVisible(false)}
        onSuccess={fetchBudgetData}
      />

      <EditBudgetCategoryModal
        visible={editModalVisible}
        onDismiss={() => {
          setEditModalVisible(false);
          setSelectedCategory(null);
        }}
        onSuccess={fetchBudgetData}
        category={selectedCategory}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    padding: theme.spacing.md,
  },
  categoryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  categoryLimit: {
    fontSize: 14,
    color: theme.colors.text,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginBottom: theme.spacing.sm,
  },
  remainingText: {
    fontSize: 12,
    color: theme.colors.text,
  },
  summaryContainer: {
    flexDirection: "row",
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 12,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: "center",
    marginBottom: theme.spacing.md,
  },
  retryButton: {
    marginTop: theme.spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: "center",
  },
});

export default BudgetScreen;
