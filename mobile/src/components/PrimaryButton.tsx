import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ title, onPress, loading = false, disabled = false }) => (
  <TouchableOpacity
    style={[styles.button, (disabled || loading) && styles.disabled]}
    onPress={onPress}
    disabled={disabled || loading}
    activeOpacity={0.9}
  >
    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.title}>{title}</Text>}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.sm,
  },
  disabled: {
    opacity: 0.7,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
