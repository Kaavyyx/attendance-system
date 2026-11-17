import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { StyledInput } from '../components/StyledInput';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export const LoginScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { signIn } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter your email or employee ID and password.');
      return;
    }

    try {
      setLoading(true);
      await signIn(identifier, password);
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Unable to sign in right now.';
      Alert.alert('Sign in failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>GeoFace Attendance</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Secure sign-in for your attendance workspace.</Text>
      </View>

      <StyledInput
        label="Email or Employee ID"
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="e.g. employee@example.com or EMP-001"
        autoCapitalize="none"
        keyboardType="email-address"
        returnKeyType="next"
      />

      <StyledInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Enter your password"
        secureTextEntry={!showPassword}
        returnKeyType="done"
      />

      <TouchableOpacity onPress={() => setShowPassword((value) => !value)} style={styles.toggle}>
        <Text style={styles.toggleText}>{showPassword ? 'Hide password' : 'Show password'}</Text>
      </TouchableOpacity>

      <PrimaryButton title="Sign in" onPress={handleLogin} loading={loading} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Need an account?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Create one</Text>
        </TouchableOpacity>
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  hero: {
    marginBottom: theme.spacing.lg,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 6,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    color: theme.colors.muted,
    fontSize: 15,
  },
  toggle: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.sm,
  },
  toggleText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    color: theme.colors.muted,
  },
  link: {
    marginLeft: 6,
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
