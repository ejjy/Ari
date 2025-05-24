import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/navigation";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { theme } from "../../theme/theme";
import { auth } from "../../config/firebase";
import { sendPasswordResetEmail } from "firebase/auth";

type Props = NativeStackScreenProps<AuthStackParamList, "ForgotPassword">;

const ForgotPasswordScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err) {
      setError("Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you a link to reset your
        password
      </Text>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        error={error}
        disabled={success}
      />

      {success ? (
        <Text style={styles.successText}>
          Password reset email sent! Please check your inbox.
        </Text>
      ) : (
        <Button onPress={handleResetPassword} loading={loading}>
          Send Reset Link
        </Button>
      )}

      <Button mode="text" onPress={() => navigation.navigate("Login")}>
        Back to Login
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: theme.spacing.xl,
    textAlign: "center",
  },
  successText: {
    color: theme.colors.success,
    textAlign: "center",
    marginVertical: theme.spacing.md,
  },
});

export default ForgotPasswordScreen;
