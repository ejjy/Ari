import React from "react";
import { View, StyleSheet } from "react-native";
import {
  Text,
  Card,
  ActivityIndicator,
  Button,
  ProgressBar,
} from "react-native-paper";
import { theme } from "../theme/theme";

interface AIInsightsProps {
  loading: boolean;
  error: string | null;
  insights: string | null;
  advice: string | null;
  healthScore: number | null;
  emotionalAnalysis?: {
    tone: "positive" | "neutral" | "concerned";
    sentiment: number;
    message: string;
  } | null;
  weeklySummary?: string | null;
  onGetInsights: () => void;
  onGetAdvice: () => void;
}

const AIInsights = ({
  loading,
  error,
  insights,
  advice,
  healthScore,
  emotionalAnalysis,
  weeklySummary,
  onGetInsights,
  onGetAdvice,
}: AIInsightsProps) => {
  const getToneColor = (tone: string) => {
    switch (tone) {
      case "positive":
        return theme.colors.success;
      case "concerned":
        return theme.colors.error;
      default:
        return theme.colors.text;
    }
  };

  return (
    <Card style={styles.container} data-oid="h9y0eai">
      <Card.Content data-oid="f-exwwt">
        <Text style={styles.title} data-oid="yt285hh">
          AI Insights
        </Text>
        {loading ? (
          <ActivityIndicator color={theme.colors.primary} data-oid="e3uvm01" />
        ) : (
          <>
            {healthScore !== null && (
              <View style={styles.section} data-oid="2.8y6-p">
                <Text style={styles.sectionTitle} data-oid="4my4fhf">
                  Financial Health Score
                </Text>
                <ProgressBar
                  progress={healthScore / 100}
                  color={theme.colors.primary}
                  style={styles.progressBar}
                  data-oid="tb42bey"
                />

                <Text style={styles.scoreText} data-oid="z7antyv">
                  {healthScore}/100
                </Text>
              </View>
            )}

            {emotionalAnalysis && (
              <View style={styles.section} data-oid="h4hm1.3">
                <Text style={styles.sectionTitle} data-oid="c08tti0">
                  Emotional Analysis
                </Text>
                <Text
                  style={[
                    styles.emotionalMessage,
                    { color: getToneColor(emotionalAnalysis.tone) },
                  ]}
                  data-oid="v2hgl.w"
                >
                  {emotionalAnalysis.message}
                </Text>
              </View>
            )}

            {insights && (
              <View style={styles.section} data-oid="jtxcrs5">
                <Text style={styles.sectionTitle} data-oid="g1c1u:8">
                  Financial Analysis
                </Text>
                <Text style={styles.text} data-oid="uit5ln6">
                  {insights}
                </Text>
              </View>
            )}

            {advice && (
              <View style={styles.section} data-oid="dqvy3ba">
                <Text style={styles.sectionTitle} data-oid="v4v.3q6">
                  Personalized Advice
                </Text>
                <Text style={styles.text} data-oid=":kczm5j">
                  {advice}
                </Text>
              </View>
            )}

            {weeklySummary && (
              <View style={styles.section} data-oid="lcmoyn4">
                <Text style={styles.sectionTitle} data-oid="4rro97.">
                  Weekly Summary
                </Text>
                <Text style={styles.text} data-oid="k3jdvm.">
                  {weeklySummary}
                </Text>
              </View>
            )}

            <View style={styles.buttons} data-oid="1lkx6h3">
              <Button
                mode="contained"
                onPress={onGetInsights}
                style={styles.button}
                data-oid="jxzibf2"
              >
                Get Insights
              </Button>
              <Button
                mode="contained"
                onPress={onGetAdvice}
                style={styles.button}
                data-oid="-18v9be"
              >
                Get Advice
              </Button>
            </View>
          </>
        )}
        {error && (
          <Text style={styles.errorText} data-oid="yfbrsnl">
            Error: {error}
          </Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: theme.spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: theme.spacing.md,
  },
  section: {
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: theme.spacing.xs,
  },
  text: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: theme.spacing.md,
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: theme.spacing.xs,
  },
  scoreText: {
    fontSize: 14,
    color: theme.colors.primary,
    textAlign: "center",
    marginTop: theme.spacing.xs,
  },
  emotionalMessage: {
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 20,
  },
});

export default AIInsights;
