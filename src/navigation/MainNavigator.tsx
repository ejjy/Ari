import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import TomoScreen from '../screens/TomoScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
// Accountant screens
import AccountantScreen from '../screens/AccountantScreen';
import SmartLedgerScreen from '../screens/accountant/SmartLedgerScreen';
import BudgetPlannerScreen from '../screens/accountant/BudgetPlannerScreen';
import SavingsGoalsScreen from '../screens/accountant/SavingsGoalsScreen';
import TaxEstimatorScreen from '../screens/accountant/TaxEstimatorScreen';
import PnlReportScreen from '../screens/accountant/PnlReportScreen';
import TodoNotesScreen from '../screens/TodoNotesScreen';
import DailyHeatmapScreen from '../screens/DailyHeatmapScreen';
import PaywallScreen from '../screens/PaywallScreen';
import GroupsListScreen from '../screens/GroupsListScreen';
import GroupDetailScreen from '../screens/GroupDetailScreen';
import AddSharedExpenseScreen from '../screens/AddSharedExpenseScreen';
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { color, font } from '../theme/tokens';
import type { MainStackParamList, TabParamList } from './navigationTypes';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

// FAB button rendered in the center tab slot.
function TabFAB() {
  const navigation = useNavigation<StackNavigationProp<MainStackParamList>>();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('AddTransaction', { type: 'expense' })}
      style={fab.wrap}
      activeOpacity={0.85}
      accessibilityLabel="Add transaction"
      accessibilityRole="button"
    >
      <View style={fab.circle}>
        <Text style={fab.plus}>+</Text>
      </View>
    </TouchableOpacity>
  );
}
const fab = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: color.clay,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  plus: { color: color.card, fontSize: 28, lineHeight: 32, fontFamily: font.body },
});

type RealTab = { name: Exclude<keyof TabParamList, 'Add'>; icon: IconName; label: string; component: React.ComponentType<any> };
const TABS: RealTab[] = [
  { name: 'Dashboard',    icon: 'home',    label: 'Home',   component: DashboardScreen },
  { name: 'Transactions', icon: 'trending-up', label: 'Trends', component: TransactionsScreen },
  { name: 'Tomo',         icon: 'bot',     label: 'Tomo',   component: TomoScreen },
  { name: 'Settings',     icon: 'settings', label: 'More', component: SettingsScreen },
];

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: color.forest,
        tabBarInactiveTintColor: color.inkFaint,
        tabBarLabelStyle: {
          fontFamily: font.bodyMed,
          fontSize: 10,
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: color.card,
          borderTopColor: color.line,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
      }}
    >
      {/* Left two real tabs */}
      {TABS.slice(0, 2).map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarAccessibilityLabel: `${tab.label} tab`,
            tabBarIcon: ({ focused }) => (
              <Icon
                name={tab.icon}
                size={22}
                color={focused ? color.forest : color.inkFaint}
              />
            ),
          }}
        />
      ))}

      {/* Center FAB slot */}
      <Tab.Screen
        name="Add"
        component={() => null}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: () => <TabFAB />,
        }}
      />

      {/* Right two real tabs */}
      {TABS.slice(2).map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarAccessibilityLabel: `${tab.label} tab`,
            tabBarIcon: ({ focused }) => (
              <Icon
                name={tab.icon}
                size={22}
                color={focused ? color.forest : color.inkFaint}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          presentation: 'modal',
          cardStyle: { backgroundColor: 'transparent' },
        }}
      />
      {/* Accountant screens */}
      <Stack.Screen name="Accountant" component={AccountantScreen} />
      <Stack.Screen name="SmartLedger" component={SmartLedgerScreen} />
      <Stack.Screen name="BudgetPlanner" component={BudgetPlannerScreen} />
      <Stack.Screen name="SavingsGoals" component={SavingsGoalsScreen} />
      <Stack.Screen name="TaxEstimator" component={TaxEstimatorScreen} />
      <Stack.Screen name="PnlReport" component={PnlReportScreen} />
      <Stack.Screen name="TodoNotes" component={TodoNotesScreen} />
      <Stack.Screen name="DailyHeatmap" component={DailyHeatmapScreen} />
      <Stack.Screen
        name="Paywall"
        component={PaywallScreen}
        options={{ presentation: 'modal', cardStyle: { backgroundColor: 'transparent' } }}
      />
      <Stack.Screen name="Groups" component={GroupsListScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen
        name="AddSharedExpense"
        component={AddSharedExpenseScreen}
        options={{ presentation: 'modal', cardStyle: { backgroundColor: 'transparent' } }}
      />
    </Stack.Navigator>
  );
}
