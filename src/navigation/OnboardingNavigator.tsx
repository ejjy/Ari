import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../types/navigation";
import WelcomeScreen from "../screens/onboarding/WelcomeScreen";
import UserTypeScreen from "../screens/onboarding/UserTypeScreen";
import PersonalInfoScreen from "../screens/onboarding/PersonalInfoScreen";
import FinancialInfoScreen from "../screens/onboarding/FinancialInfoScreen";

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

const OnboardingNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />

      <Stack.Screen name="UserType" component={UserTypeScreen} />

      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />

      <Stack.Screen name="FinancialInfo" component={FinancialInfoScreen} />
    </Stack.Navigator>
  );
};

export default OnboardingNavigator;
