import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, View } from 'react-native';
import * as Location from 'expo-location';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

interface AttendanceResult {
  checked_in: boolean;
  inside_geofence: boolean;
  current_distance_meters: number;
  allowed_radius_meters: number;
  branch_name: string;
  message: string;
}

export const MarkAttendanceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { token, user } = useAuth();
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied' | 'unavailable'>('idle');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AttendanceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ensureLocationPermission = async () => {
      if (Platform.OS === 'web') {
        setPermissionStatus('unavailable');
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionStatus('granted');
      } else {
        setPermissionStatus('denied');
      }
    };

    ensureLocationPermission();
  }, []);

  const verifyLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      if (Platform.OS === 'web') {
        setPermissionStatus('unavailable');
        setError('Location services are not available in the current browser environment.');
        return;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionStatus('denied');
        setError('Location permission is required to verify your attendance geofence.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const response = await api.post('/api/attendance/mark', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setResult(response.data);
      if (response.data.challenge) {
        navigation.navigate('FaceVerification' as never, { challenge: response.data.challenge });
      } else if (response.data.checked_in) {
        Alert.alert('Attendance checked in', response.data.message);
      }
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Unable to verify attendance right now.';
      setError(message);
      Alert.alert('Attendance unavailable', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <View style={styles.headerCard}>
        <Text style={styles.eyebrow}>Mark attendance</Text>
        <Text style={styles.title}>GPS geofence check-in</Text>
        <Text style={styles.subtitle}>Verify your current location against your assigned branch.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Assigned branch</Text>
        <Text style={styles.value}>{user?.branch?.branch_name || '—'}</Text>
        <Text style={styles.label}>Location permission</Text>
        <Text style={styles.value}>{permissionStatus === 'granted' ? 'Enabled' : permissionStatus === 'denied' ? 'Denied' : permissionStatus === 'unavailable' ? 'Unavailable on this device' : 'Checking…'}</Text>
      </View>

      {loading ? (
        <View style={styles.card}>
          <ActivityIndicator color={theme.colors.primary} size="large" />
          <Text style={styles.loadingText}>Verifying your location…</Text>
        </View>
      ) : error ? (
        <View style={styles.card}>
          <Text style={styles.errorTitle}>Could not verify attendance</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : result ? (
        <View style={styles.card}>
          <Text style={styles.resultTitle}>{result.checked_in ? 'Checked in' : 'Geofence status'}</Text>
          <Text style={styles.value}>{result.message}</Text>
          <Text style={styles.value}>Branch: {result.branch_name}</Text>
          <Text style={styles.value}>Distance: {result.current_distance_meters} m</Text>
          <Text style={styles.value}>Allowed radius: {result.allowed_radius_meters} m</Text>
          <Text style={styles.value}>Inside geofence: {result.inside_geofence ? 'Yes' : 'No'}</Text>
        </View>
      ) : null}

      <PrimaryButton title="Verify Location" onPress={verifyLocation} loading={loading} />
      <PrimaryButton title="Back to dashboard" onPress={() => navigation.goBack()} />
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
  label: {
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  value: {
    color: theme.colors.muted,
    marginBottom: 6,
  },
  loadingText: {
    color: theme.colors.muted,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  errorText: {
    color: theme.colors.muted,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 6,
  },
});
