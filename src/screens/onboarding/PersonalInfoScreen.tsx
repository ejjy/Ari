import React, { useState } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../types/navigation";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { theme } from "../../theme/theme";
import { useOnboarding } from "../../context/OnboardingContext";

type Props = NativeStackScreenProps<OnboardingStackParamList, "PersonalInfo">;

const PersonalInfoScreen = ({ navigation }: Props) => {
  const { data, updateData } = useOnboarding();
  const [name, setName] = useState(data.name);
  const [email, setEmail] = useState(data.email);
  const [error, setError] = useState("");

  const handleContinue = () => {
    if (!name || !email) {
      setError("Please fill in all fields");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    updateData({ name, email });
    navigation.navigate("FinancialInfo");
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Personal Information</Text>
        <Text style={styles.subtitle}>
          Tell us a bit about yourself to personalize your experience
        </Text>

        <Input
          label="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          error={error}
        />

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          error={error}
        />

        <Button onPress={handleContinue} style={styles.button}>
          Continue
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
  button: {
    marginTop: theme.spacing.xl,
  },
  backButton: {
    marginTop: theme.spacing.sm,
  },
});

export default PersonalInfoScreen;
