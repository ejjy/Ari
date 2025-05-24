import React, { useEffect, useState } from "react";
import { StyleSheet, View, Image } from "react-native";
import { Text } from "react-native-paper";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { OnboardingStackParamList } from "../../types/navigation";
import { Button } from "../../components/Button";
import { theme } from "../../theme/theme";
import { Asset } from 'expo-asset';

type Props = NativeStackScreenProps<OnboardingStackParamList, "Welcome">;

const WelcomeScreen = ({ navigation }: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    async function loadImage() {
      try {
        await Asset.loadAsync(require('../../../assets/icon.png'));
        setImageLoaded(true);
      } catch (error) {
        console.error('Error loading image:', error);
      }
    }
    loadImage();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {imageLoaded && (
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logo}
            resizeMode="contain"
            onError={(error) => console.log('Image loading error:', error.nativeEvent.error)}
          />
        )}

        <Text style={styles.title}>Welcome to Ari</Text>
        <Text style={styles.subtitle}>
          Your AI-powered financial companion that helps you manage your money
          smarter
        </Text>

        <View style={styles.features}>
          <Text style={styles.featureText}>• Track expenses effortlessly</Text>
          <Text style={styles.featureText}>• Get personalized insights</Text>
          <Text style={styles.featureText}>• Plan your budget effectively</Text>
          <Text style={styles.featureText}>• Achieve your financial goals</Text>
        </View>
      </View>

      <Button
        onPress={() => navigation.navigate("UserType")}
        style={styles.button}
      >
        Get Started
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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.spacing.xl,
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
    paddingHorizontal: theme.spacing.lg,
  },
  features: {
    width: "100%",
    paddingHorizontal: theme.spacing.lg,
  },
  featureText: {
    fontSize: 16,
    marginBottom: theme.spacing.sm,
    color: theme.colors.text,
  },
  button: {
    marginBottom: theme.spacing.lg,
  },
});

export default WelcomeScreen;
