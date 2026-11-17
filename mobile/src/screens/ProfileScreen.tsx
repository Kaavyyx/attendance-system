import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { theme } from '../theme';

interface ProfileData {
  id: number;
  full_name: string;
  employee_id: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  branch: { branch_name?: string } | null;
}

export const ProfileScreen: React.FC = () => {
  const { token, signOut } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(response.data.user || null);
      } catch (err: any) {
        const message = err?.response?.data?.error || 'Unable to load your profile right now.';
        setError(message);
        Alert.alert('Profile unavailable', message);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadProfile();
    }
  }, [token]);

  return (
    <AppScreen>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Profile</Text>
        <Text style={styles.title}>{profile?.full_name || 'My profile'}</Text>
        <Text style={styles.subtitle}>Safe profile view backed by the authenticated backend route.</Text>
      </View>

      {loading ? (
        <View style={styles.card}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.loadingText}>Loading your profile…</Text>
        </View>
      ) : error ? (
        <View style={styles.card}>
          <Text style={styles.label}>Unable to load profile</Text>
          <Text style={styles.value}>{error}</Text>
          <PrimaryButton title="Sign out" onPress={() => signOut()} />
        </View>
      ) : profile ? (
        <View style={styles.card}>
          <Text style={styles.row}><Text style={styles.label}>Employee ID:</Text> {profile.employee_id || '—'}</Text>
          <Text style={styles.row}><Text style={styles.label}>Email:</Text> {profile.email || '—'}</Text>
          <Text style={styles.row}><Text style={styles.label}>Phone:</Text> {profile.phone || '—'}</Text>
          <Text style={styles.row}><Text style={styles.label}>Role:</Text> {profile.role || '—'}</Text>
          <Text style={styles.row}><Text style={styles.label}>Branch:</Text> {profile.branch?.branch_name || '—'}</Text>
          <Text style={styles.row}><Text style={styles.label}>Status:</Text> {profile.is_active ? 'Active' : 'Inactive'}</Text>
        </View>
      ) : null}

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
  row: {
    color: theme.colors.text,
    marginBottom: 8,
  },
  label: {
    fontWeight: '700',
  },
  loadingText: {
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  value: {
    color: theme.colors.muted,
    marginTop: 4,
  },
});
