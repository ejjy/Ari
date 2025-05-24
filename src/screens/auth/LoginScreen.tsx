import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../types/navigation";
import { Input } from "../../components/Input";
import { Button } from "../../components/Button";
import { theme } from "../../theme/theme";
import { auth } from "../../config/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back!</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        error={error}
      />

      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={error}
      />

      <Button onPress={handleLogin} loading={loading}>
        Sign In
      </Button>

      <Button mode="text" onPress={() => navigation.navigate("ForgotPassword")}>
        Forgot Password?
      </Button>

      <Button mode="text" onPress={() => navigation.navigate("Register")}>
        Don't have an account? Sign Up
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
});

export default LoginScreen;
