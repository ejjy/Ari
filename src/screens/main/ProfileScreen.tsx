import React, { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { Text, Card, List, Switch, Button, Avatar } from "react-native-paper";
import { Header } from "../../components/Header";
import { theme } from "../../theme/theme";
import { useAuth } from "../../hooks/useAuth";
import { db } from "../../config/firebase";
import { doc, getDoc } from "firebase/firestore";

interface UserProfile {
  name: string;
  email: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  financialGoals: string[];
  notifications: {
    transactions: boolean;
    budget: boolean;
    goals: boolean;
  };
}

const ProfileScreen = () => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleNotificationToggle = (
    key: keyof UserProfile["notifications"],
  ) => {
    if (!profile) return;

    setProfile({
      ...profile,
      notifications: {
        ...profile.notifications,
        [key]: !profile.notifications[key],
      },
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Profile" />

      <ScrollView style={styles.content}>
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text
              size={80}
              label={
                profile?.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "U"
              }
              style={styles.avatar}
            />

            <Text style={styles.name}>{profile?.name || "User"}</Text>
            <Text style={styles.email}>{profile?.email || user?.email}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Financial Overview</Text>
            <List.Item
              title="Monthly Income"
              description={`$${profile?.monthlyIncome.toLocaleString() || "0"}`}
              left={(props) => <List.Icon {...props} icon="cash" />}
            />

            <List.Item
              title="Monthly Expenses"
              description={`$${profile?.monthlyExpenses.toLocaleString() || "0"}`}
              left={(props) => <List.Icon {...props} icon="cash-minus" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Financial Goals</Text>
            {profile?.financialGoals.map((goal, index) => (
              <List.Item
                key={index}
                title={goal}
                left={(props) => <List.Icon {...props} icon="flag" />}
              />
            ))}
          </Card.Content>
        </Card>

        <Card style={styles.sectionCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <List.Item
              title="Transaction Alerts"
              right={() => (
                <Switch
                  value={profile?.notifications.transactions}
                  onValueChange={() => handleNotificationToggle("transactions")}
                />
              )}
            />

            <List.Item
              title="Budget Alerts"
              right={() => (
                <Switch
                  value={profile?.notifications.budget}
                  onValueChange={() => handleNotificationToggle("budget")}
                />
              )}
            />

            <List.Item
              title="Goal Updates"
              right={() => (
                <Switch
                  value={profile?.notifications.goals}
                  onValueChange={() => handleNotificationToggle("goals")}
                />
              )}
            />
          </Card.Content>
        </Card>

        <Button mode="outlined" onPress={() => {}} style={styles.editButton}>
          Edit Profile
        </Button>

        <Button
          mode="outlined"
          onPress={signOut}
          style={styles.signOutButton}
          textColor={theme.colors.error}
        >
          Sign Out
        </Button>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  profileCard: {
    marginBottom: theme.spacing.md,
  },
  profileContent: {
    alignItems: "center",
    padding: theme.spacing.md,
  },
  avatar: {
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
  },
  email: {
    fontSize: 16,
    color: theme.colors.text,
  },
  sectionCard: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: theme.spacing.md,
  },
  editButton: {
    marginBottom: theme.spacing.sm,
  },
  signOutButton: {
    marginBottom: theme.spacing.md,
    borderColor: theme.colors.error,
  },
});

export default ProfileScreen;
