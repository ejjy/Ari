import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native';
import Icon from '../../components/ui/Icon';
import { Colors } from '../../constants/colors';

export default function TaxEstimatorScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Go back">
          <Icon name="arrow-left" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Tax Estimator</Text>
          <Text style={styles.headerSub}>Old vs New regime calculator</Text>
        </View>
      </View>
      <View style={styles.center}>
        <Icon name="briefcase" size={48} color={Colors.textMuted} />
        <Text style={styles.comingSoon}>Coming Soon</Text>
        <Text style={styles.desc}>This module is under development.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 16, gap: 12, borderBottomWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.card,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  comingSoon: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  desc: { fontSize: 14, color: Colors.textSecondary },
});
