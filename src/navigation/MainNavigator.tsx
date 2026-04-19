import React from 'react';
import { View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import AddTransactionScreen from '../screens/AddTransactionScreen';
import BudgetScreen from '../screens/BudgetScreen';
import TomoScreen from '../screens/TomoScreen';
import SettingsScreen from '../screens/SettingsScreen';
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
import Icon from '../components/ui/Icon';
import type { IconName } from '../components/ui/Icon';
import { Colors } from '../constants/colors';
import type { MainStackParamList, TabParamList } from './navigationTypes';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<MainStackParamList>();

const TAB_CONFIG: { name: keyof TabParamList; icon: IconName; label: string; component: React.ComponentType<any> }[] = [
  { name: 'Dashboard', icon: 'home', label: 'Home', component: DashboardScreen },
  { name: 'Transactions', icon: 'list', label: 'Expenses', component: TransactionsScreen },
  { name: 'Budget', icon: 'target', label: 'Budget', component: BudgetScreen },
  { name: 'Tomo', icon: 'bot', label: 'Tomo', component: TomoScreen },
  { name: 'Settings', icon: 'settings', label: 'Settings', component: SettingsScreen },
];

function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tab.Screen
          key={tab.name}
          name={tab.name}
          component={tab.component}
          options={{
            tabBarLabel: tab.label,
            tabBarAccessibilityLabel: `${tab.label} tab`,
            tabBarIcon: ({ focused }) => (
              <View accessible accessibilityRole="tab">
                <Icon
                  name={tab.icon}
                  size={22}
                  color={focused ? Colors.primary : Colors.textMuted}
                />
              </View>
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
    </Stack.Navigator>
  );
}
