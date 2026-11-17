import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { StyledInput } from '../components/StyledInput';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { signUp, branches, loadBranches } = useAuth();
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [branchId, setBranchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    loadBranches().catch(() => undefined);
  }, [loadBranches]);

  const handleRegister = async () => {
    if (!fullName.trim() || !employeeId.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword || !branchId) {
      Alert.alert('Incomplete form', 'Please complete every field before registering.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Password confirmation does not match.');
      return;
    }

    try {
      setLoading(true);
      await signUp({
        full_name: fullName,
        employee_id: employeeId,
        email,
        phone,
        password,
        branch_id: Number(branchId),
      });
      Alert.alert('Registration successful', 'Your account is ready to use.');
      navigation.goBack();
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Registration could not be completed.';
      Alert.alert('Registration failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>Create account</Text>
        <Text style={styles.title}>Join the attendance program</Text>
        <Text style={styles.subtitle}>Employees register for secure workplace attendance access.</Text>
      </View>

      <StyledInput label="Full name" value={fullName} onChangeText={setFullName} placeholder="Alex Morgan" />
      <StyledInput label="Employee ID" value={employeeId} onChangeText={setEmployeeId} placeholder="EMP-101" />
      <StyledInput label="Email" value={email} onChangeText={setEmail} placeholder="alex@example.com" keyboardType="email-address" autoCapitalize="none" />
      <StyledInput label="Phone" value={phone} onChangeText={setPhone} placeholder="555-0100" keyboardType="phone-pad" />
      <StyledInput label="Password" value={password} onChangeText={setPassword} placeholder="Minimum 8 characters" secureTextEntry={!showPassword} />
      <StyledInput label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat password" secureTextEntry={!showPassword} />

      <View style={styles.container}>
        <Text style={styles.label}>Branch</Text>
        <View style={styles.pickerBox}>
          {branches.length === 0 ? (
            <Text style={styles.helper}>Loading branches…</Text>
          ) : (
            branches.map((branch) => (
              <TouchableOpacity
                key={branch.id}
                style={[styles.option, branchId === String(branch.id) && styles.optionSelected]}
                onPress={() => setBranchId(String(branch.id))}
              >
                <Text style={styles.optionText}>{branch.branch_name} ({branch.branch_code})</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <TouchableOpacity onPress={() => setShowPassword((value) => !value)} style={styles.toggle}>
        <Text style={styles.toggleText}>{showPassword ? 'Hide passwords' : 'Show passwords'}</Text>
      </TouchableOpacity>

      <PrimaryButton title="Create account" onPress={handleRegister} loading={loading} />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Text style={styles.link}>Sign in</Text>
      </TouchableOpacity>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  hero: {
    marginBottom: theme.spacing.md,
  },
  eyebrow: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 6,
  },
  subtitle: {
    marginTop: theme.spacing.xs,
    color: theme.colors.muted,
    fontSize: 15,
  },
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    paddingVertical: 4,
  },
  helper: {
    color: theme.colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  optionSelected: {
    backgroundColor: '#E8F2FB',
  },
  optionText: {
    color: theme.colors.text,
    fontWeight: '600',
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
