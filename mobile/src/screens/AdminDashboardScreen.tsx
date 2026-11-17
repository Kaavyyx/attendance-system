import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { theme } from '../theme';

export const AdminDashboardScreen: React.FC = () => {
  const { user, signOut, token } = useAuth();
  const [message, setMessage] = useState('Loading dashboard…');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/api/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessage(response.data.message || 'Admin dashboard is available.');
      } catch (error: any) {
        const messageText = error?.response?.data?.error || 'Unable to load admin dashboard.';
        setMessage(messageText);
        Alert.alert('Admin access issue', messageText);
      }
    };

    if (token) {
      fetchDashboard();
    }
  }, [token]);

  return (
    <AppScreen>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Admin dashboard</Text>
        <Text style={styles.title}>{user?.full_name || 'Administrator'}</Text>
        <Text style={styles.subtitle}>Protected by the backend RBAC policy.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status</Text>
        <Text style={styles.message}>{message}</Text>
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
  message: {
    color: theme.colors.muted,
  },
});
