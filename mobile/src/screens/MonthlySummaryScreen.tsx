import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { theme } from '../theme';

interface MonthlySummary {
  month: string;
  total_attendance_days: number;
  present_days: number;
  late_days?: number;
  absent_days?: number;
}

export const MonthlySummaryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { token, signOut } = useAuth();
  const [summary, setSummary] = useState<MonthlySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/attendance/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(response.data.summary || null);
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Unable to load monthly summary right now.';
        setError(message);
        Alert.alert('Unable to load summary', message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      load();
    }
  }, [token]);

  return (
    <AppScreen>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Monthly summary</Text>
        <Text style={styles.title}>Current month</Text>
        <Text style={styles.subtitle}>Calculated from your real attendance rows.</Text>
      </View>

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.stateText}>Loading your monthly summary…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Could not load summary</Text>
          <Text style={styles.stateText}>{error}</Text>
          <PrimaryButton title="Back" onPress={() => navigation.goBack()} />
          <PrimaryButton title="Sign out" onPress={() => signOut()} />
        </View>
      ) : !summary ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>No attendance data for this month.</Text>
          <Text style={styles.stateText}>Your monthly attendance summary will show up here once records exist.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{summary.month}</Text>
          <Text style={styles.row}>Total attendance days: {summary.total_attendance_days}</Text>
          <Text style={styles.row}>Present days: {summary.present_days}</Text>
          {typeof summary.late_days === 'number' ? <Text style={styles.row}>Late days: {summary.late_days}</Text> : null}
          {typeof summary.absent_days === 'number' ? <Text style={styles.row}>Absent days: {summary.absent_days}</Text> : null}
        </View>
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  eyebrow: { color: '#fff', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 6 },
  subtitle: { color: '#dce8f6', marginTop: theme.spacing.xs },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 8 },
  row: { color: theme.colors.muted, marginBottom: 6 },
  stateCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  stateTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.xs },
  stateText: { color: theme.colors.muted, textAlign: 'center', marginBottom: theme.spacing.sm },
});
