import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { theme } from '../theme';

interface AttendanceRecord {
  id: number;
  attendance_date: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string | null;
}

export const AttendanceHistoryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { token, signOut } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/attendance/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecords(response.data.records || []);
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Unable to load attendance history right now.';
        setError(message);
        Alert.alert('Unable to load history', message);
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
        <Text style={styles.eyebrow}>Attendance history</Text>
        <Text style={styles.title}>Your records</Text>
        <Text style={styles.subtitle}>Fetched from the authenticated backend endpoint.</Text>
      </View>

      {loading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.stateText}>Loading your attendance history…</Text>
        </View>
      ) : error ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>Could not load history</Text>
          <Text style={styles.stateText}>{error}</Text>
          <PrimaryButton title="Back" onPress={() => navigation.goBack()} />
          <PrimaryButton title="Sign out" onPress={() => signOut()} />
        </View>
      ) : records.length === 0 ? (
        <View style={styles.stateCard}>
          <Text style={styles.stateTitle}>No attendance records yet.</Text>
          <Text style={styles.stateText}>Attendance history will appear here once your records are available.</Text>
        </View>
      ) : (
        records.map((record) => (
          <View key={record.id} style={styles.card}>
            <Text style={styles.cardTitle}>{record.attendance_date || 'Unknown date'}</Text>
            <Text style={styles.row}>Status: {record.status || '—'}</Text>
            <Text style={styles.row}>Check-in: {record.check_in_time ? new Date(record.check_in_time).toLocaleTimeString() : '—'}</Text>
            <Text style={styles.row}>Check-out: {record.check_out_time ? new Date(record.check_out_time).toLocaleTimeString() : '—'}</Text>
          </View>
        ))
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
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  row: { color: theme.colors.muted, marginBottom: 4 },
  stateCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  stateTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.xs },
  stateText: { color: theme.colors.muted, textAlign: 'center', marginBottom: theme.spacing.sm },
});
