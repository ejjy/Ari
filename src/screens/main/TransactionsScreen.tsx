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
  IconButton,
  Searchbar,
  Chip,
  ActivityIndicator,
} from "react-native-paper";
import { theme } from "../../theme/theme";
import { Header } from "../../components/Header";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../config/firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit,
  startAfter,
  setDoc,
} from "firebase/firestore";
import AddTransactionModal from "../../components/AddTransactionModal";
import EditTransactionModal from "../../components/EditTransactionModal";
import RecurringTransactions from "../../components/RecurringTransactions";
import RecurringTransactionModal from "../../components/RecurringTransactionModal";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  date: Date;
}

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: "income" | "expense";
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  nextDate: Date;
}

const TRANSACTIONS_PER_PAGE = 20;

const TransactionsScreen = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<
    RecurringTransaction[]
  >([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "income" | "expense"
  >("all");
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [recurringModalVisible, setRecurringModalVisible] = useState(false);
  const [selectedRecurringTransaction, setSelectedRecurringTransaction] =
    useState<RecurringTransaction | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchData = async (isRefreshing = false) => {
    if (!user) return;

    try {
      setLoading(true);
      const userRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      if (userData) {
        setTransactions(userData.transactions || []);
        setRecurringTransactions(userData.recurringTransactions || []);
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

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalVisible(true);
  };

  const handleAddRecurringTransaction = () => {
    setSelectedRecurringTransaction(null);
    setRecurringModalVisible(true);
  };

  const handleEditRecurringTransaction = (
    transaction: RecurringTransaction,
  ) => {
    setSelectedRecurringTransaction(transaction);
    setRecurringModalVisible(true);
  };

  const handleDeleteRecurringTransaction = async (id: string) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const updatedTransactions = recurringTransactions.filter(
        (t) => t.id !== id,
      );

      await setDoc(
        userRef,
        {
          recurringTransactions: updatedTransactions,
        },
        { merge: true },
      );

      setRecurringTransactions(updatedTransactions);
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
    }
  };

  const handleSaveRecurringTransaction = async (
    transactionData: Omit<RecurringTransaction, "id">,
  ) => {
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const updatedTransactions = selectedRecurringTransaction
        ? recurringTransactions.map((t) =>
            t.id === selectedRecurringTransaction.id
              ? { ...transactionData, id: t.id }
              : t,
          )
        : [
            ...recurringTransactions,
            { ...transactionData, id: Date.now().toString() },
          ];

      await setDoc(
        userRef,
        {
          recurringTransactions: updatedTransactions,
        },
        { merge: true },
      );

      setRecurringTransactions(updatedTransactions);
    } catch (error) {
      console.error("Error saving recurring transaction:", error);
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      selectedFilter === "all" || transaction.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isIncome = item.type === "income";
    const amountColor = isIncome ? theme.colors.success : theme.colors.error;
    const amountPrefix = isIncome ? "+" : "-";

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => handleEditTransaction(item)}
      >
        <View style={styles.transactionHeader}>
          <View>
            <Text style={styles.transactionDescription}>
              {item.description}
            </Text>
            <Text style={styles.transactionCategory}>{item.category}</Text>
          </View>
          <Text style={[styles.transactionAmount, { color: amountColor }]}>
            {amountPrefix}${Math.abs(item.amount).toFixed(2)}
          </Text>
        </View>
        <Text style={styles.transactionDate}>
          {item.date.toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Transactions"
        rightComponent={
          <IconButton icon="plus" onPress={() => setAddModalVisible(true)} />
        }
      />

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search transactions"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.filterContainer}>
        <Chip
          selected={selectedFilter === "all"}
          onPress={() => setSelectedFilter("all")}
          style={styles.filterChip}
        >
          All
        </Chip>
        <Chip
          selected={selectedFilter === "income"}
          onPress={() => setSelectedFilter("income")}
          style={styles.filterChip}
        >
          Income
        </Chip>
        <Chip
          selected={selectedFilter === "expense"}
          onPress={() => setSelectedFilter("expense")}
          style={styles.filterChip}
        >
          Expenses
        </Chip>
      </View>

      <RecurringTransactions
        transactions={recurringTransactions}
        onAdd={handleAddRecurringTransaction}
        onEdit={handleEditRecurringTransaction}
        onDelete={handleDeleteRecurringTransaction}
      />

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
        ListFooterComponent={renderFooter}
      />

      <AddTransactionModal
        visible={addModalVisible}
        onDismiss={() => setAddModalVisible(false)}
        onSuccess={fetchData}
      />

      <EditTransactionModal
        visible={editModalVisible}
        onDismiss={() => {
          setEditModalVisible(false);
          setSelectedTransaction(null);
        }}
        onSuccess={fetchData}
        transaction={selectedTransaction}
      />

      <RecurringTransactionModal
        visible={recurringModalVisible}
        onDismiss={() => {
          setRecurringModalVisible(false);
          setSelectedRecurringTransaction(null);
        }}
        onSave={handleSaveRecurringTransaction}
        transaction={selectedRecurringTransaction || undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchContainer: {
    padding: theme.spacing.md,
  },
  searchBar: {
    elevation: 0,
  },
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  filterChip: {
    marginRight: theme.spacing.sm,
  },
  list: {
    padding: theme.spacing.md,
  },
  transactionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: theme.spacing.xs,
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
  transactionDate: {
    fontSize: 12,
    color: theme.colors.text,
  },
  footer: {
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
});

export default TransactionsScreen;
