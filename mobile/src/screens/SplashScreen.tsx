import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { theme } from '../theme';

export const SplashScreen: React.FC = () => (
  <AppScreen withScroll={false}>
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logoText}>GeoFace</Text>
      </View>
      <Text style={styles.title}>Employee Attendance</Text>
      <Text style={styles.subtitle}>Preparing your secure workspace…</Text>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
    </View>
  </AppScreen>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoBox: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
  },
  logoText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    marginTop: theme.spacing.sm,
    color: theme.colors.muted,
    fontSize: 15,
  },
  spinner: {
    marginTop: theme.spacing.lg,
  },
});
