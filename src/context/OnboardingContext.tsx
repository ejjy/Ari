import React, { createContext, useContext, useState } from "react";

type UserType = "individual" | "family" | "msme";

interface OnboardingData {
  userType: UserType;
  name: string;
  email: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  financialGoals: string[];
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const initialData: OnboardingData = {
  userType: "individual",
  name: "",
  email: "",
  monthlyIncome: 0,
  monthlyExpenses: 0,
  financialGoals: [],
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<OnboardingData>(initialData);

  const updateData = (newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const resetData = () => {
    setData(initialData);
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
