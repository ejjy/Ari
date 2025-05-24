import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { theme } from "./src/theme/theme";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { OnboardingProvider } from "./src/context/OnboardingContext";

export default function App() {
  return (
    <PaperProvider theme={theme} data-oid="o1xia:m">
      <OnboardingProvider data-oid="8xv4znu">
        <RootNavigator data-oid="5mjlnn4" />
      </OnboardingProvider>
    </PaperProvider>
  );
}
