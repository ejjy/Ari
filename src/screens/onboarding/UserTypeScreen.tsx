import React from "react";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { Text, Card } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../types/navigation";
import { Button } from "../../components/Button";
import { theme } from "../../theme/theme";
import { useOnboarding } from "../../context/OnboardingContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

type Props = NativeStackScreenProps<OnboardingStackParamList, "UserType">;

const UserTypeScreen = ({ navigation }: Props) => {
  const { data, updateData } = useOnboarding();

  const userTypes = [
    {
      id: "individual",
      title: "Individual",
      description: "Personal finance management for single users",
      icon: "account",
    },
    {
      id: "family",
      title: "Family",
      description: "Manage shared finances and family budgets",
      icon: "account-group",
    },
    {
      id: "msme",
      title: "MSME",
      description: "Business finance management for small enterprises",
      icon: "store",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Profile</Text>
      <Text style={styles.subtitle}>
        Select the type of account that best suits your needs
      </Text>

      <View style={styles.cardsContainer}>
        {userTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            onPress={() => updateData({ userType: type.id as any })}
          >
            <Card
              style={[
                styles.card,
                data.userType === type.id && styles.selectedCard,
              ]}
            >
              <Card.Content style={styles.cardContent}>
                <Icon
                  name={type.icon}
                  size={32}
                  color={
                    data.userType === type.id
                      ? theme.colors.primary
                      : theme.colors.text
                  }
                />

                <Text
                  style={[
                    styles.cardTitle,
                    data.userType === type.id && styles.selectedText,
                  ]}
                >
                  {type.title}
                </Text>
                <Text
                  style={[
                    styles.cardDescription,
                    data.userType === type.id && styles.selectedText,
                  ]}
                >
                  {type.description}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        onPress={() => navigation.navigate("PersonalInfo")}
        style={styles.button}
      >
        Continue
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
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
  cardsContainer: {
    flex: 1,
    gap: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCard: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "10",
  },
  cardContent: {
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
    textAlign: "center",
    color: theme.colors.text,
  },
  selectedText: {
    color: theme.colors.primary,
  },
  button: {
    marginBottom: theme.spacing.lg,
  },
});

export default UserTypeScreen;
