
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Platform, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { PrimaryButton } from '../components/PrimaryButton';
import { AppScreen } from '../components/AppScreen';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type RootStackParamList = {
  FaceVerification: { challenge: string };
};

export const FaceVerificationScreen: React.FC = () => {
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'FaceVerification'>>();
  const { challenge } = route.params;

  const [permission, requestPermission] = useCameraPermissions();
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied' | 'unavailable'>('idle');
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const cameraRef = useRef<CameraView>(null);

  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    const checkPermission = async () => {
      if (isWeb) {
        setPermissionStatus('unavailable');
        return;
      }
      if (permission?.granted) {
        setPermissionStatus('granted');
      } else if (permission?.canAskAgain) {
        const result = await requestPermission();
        if (result.granted) {
          setPermissionStatus('granted');
        } else {
          setPermissionStatus('denied');
        }
      } else {
        setPermissionStatus('denied');
      }
    };
    checkPermission();
  }, [permission, requestPermission, isWeb]);

  const captureAndVerify = async () => {
    if (!cameraRef.current) return;
    try {
      setLoading(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
        base64: false,
        skipProcessing: false,
      });

      const formData = new FormData();
      formData.append('image', {
        uri: photo?.uri,
        name: 'face.jpg',
        type: 'image/jpeg',
      } as any);
      formData.append('challenge', challenge);

      const response = await api.post('/api/face/verify', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.checked_in) {
        Alert.alert('Success', response.data.message, [
          { text: 'OK', onPress: () => navigation.navigate('EmployeeDashboardHome' as never) },
        ]);
      } else if (response.data.matched === false) {
        Alert.alert('Face Not Recognized', response.data.message, [
          { text: 'Try Again' },
        ]);
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error: any) {
      const message = error?.response?.data?.error || 'Verification failed';
      if (message.includes('expired') || message.includes('Invalid')) {
        Alert.alert('Challenge Expired', 'Please try marking attendance again.', [
          { text: 'OK', onPress: () => navigation.navigate('MarkAttendance' as never) },
        ]);
      } else {
        Alert.alert('Error', message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isWeb) {
    return (
      <AppScreen>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>Face Verification</Text>
          <Text style={styles.infoText}>Face verification is available on a mobile device.</Text>
          <PrimaryButton title="Back" onPress={() => navigation.goBack()} />
        </View>
      </AppScreen>
    );
  }

  if (permissionStatus === 'denied') {
    return (
      <AppScreen>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>Camera Permission Required</Text>
          <Text style={styles.infoText}>
            Please enable camera access in your device settings to use face verification.
          </Text>
          <PrimaryButton title="Request Permission" onPress={requestPermission} />
          <PrimaryButton title="Back" onPress={() => navigation.goBack()} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <Text style={styles.title}>Face Verification</Text>
          <Text style={styles.subtitle}>Position your face in the frame</Text>
        </View>
        {permissionStatus === 'granted' && (
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            >
              <View style={styles.cameraInner} />
            </CameraView>
          </View>
        )}
        <View style={styles.buttonContainer}>
          <PrimaryButton
            title={loading ? 'Verifying...' : 'Verify Face'}
            onPress={captureAndVerify}
            loading={loading}
          />
          <PrimaryButton
            title="Cancel"
            onPress={() => navigation.goBack()}
          />
        </View>
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: '#dce8f6',
    marginTop: 4,
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: 24,
  },
  text: {
    color: theme.colors.text,
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  camera: {
    flex: 1,
  },
  cameraInner: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
  },
  buttonContainer: {
    gap: 12,
  },
});
