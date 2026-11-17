import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export const EmployeeDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { user, signOut } = useAuth();
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <AppScreen>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Employee dashboard</Text>
        <Text style={styles.title}>Good day, {user?.full_name || 'there'}.</Text>
        <Text style={styles.subtitle}>{today}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile snapshot</Text>
        <Text style={styles.meta}>Employee ID: {user?.employee_id || '—'}</Text>
        <Text style={styles.meta}>Branch: {user?.branch?.branch_name || '—'}</Text>
        <Text style={styles.meta}>Role: {user?.role || '—'}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Attendance</Text>
        <Text style={styles.status}>Use GPS geofence verification to check in from your assigned branch.</Text>
        <Text style={styles.note}>This uses your current device location and the assigned branch stored in the backend.</Text>
      </View>

      <View style={styles.actions}>
        <PrimaryButton title="Mark Attendance" onPress={() => navigation.navigate('MarkAttendance')} />
        <PrimaryButton title="Face Enrollment" onPress={() => navigation.navigate('FaceEnrollment')} />
        <PrimaryButton title="Attendance History" onPress={() => navigation.navigate('AttendanceHistory')} />
        <PrimaryButton title="Monthly Summary" onPress={() => navigation.navigate('MonthlySummary')} />
        <PrimaryButton title="Profile" onPress={() => navigation.navigate('Profile')} />
      </View>

      <PrimaryButton title="Sign out" onPress={() => signOut()} />
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
  eyebrow: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 6,
  },
  subtitle: {
    color: '#dce8f6',
    marginTop: theme.spacing.xs,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  meta: {
    color: theme.colors.muted,
    marginBottom: 4,
  },
  status: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  note: {
    marginTop: theme.spacing.xs,
    color: theme.colors.muted,
  },
  actions: {
    gap: 8,
  },
});
