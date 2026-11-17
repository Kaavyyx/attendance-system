
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AppScreen } from '../components/AppScreen';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import { theme } from '../theme';

export const FaceEnrollmentScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { token } = useAuth();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [permissionStatus, setPermissionStatus] = useState<'idle' | 'granted' | 'denied' | 'unavailable'>('idle');
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [facing, setFacing] = useState<'front' | 'back'>('front');

  // Check if web to show unavailable message
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

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false
      });
      setCapturedUri(photo?.uri || null);
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const retakePicture = () => {
    setCapturedUri(null);
    setSuccess(false);
  };

  const enrollFace = async () => {
    if (!capturedUri || !token) return;
    setLoading(true);
    try {
      const formData = new FormData();
      const uriParts = capturedUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      formData.append('image', {
        uri: capturedUri,
        name: `face-enroll.${fileType}`,
        type: `image/${fileType}`
      } as any);

      const response = await api.post('/api/face/enroll', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setSuccess(true);
      Alert.alert('Success', response.data.message);
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Failed to enroll face. Please try again.';
      Alert.alert('Enrollment Failed', message);
    } finally {
      setLoading(false);
    }
  };

  if (isWeb) {
    return (
      <AppScreen>
        <View style={styles.centerContainer}>
          <Text style={styles.title}>Face Enrollment</Text>
          <Text style={styles.infoText}>Face enrollment is available on a mobile device.</Text>
          <PrimaryButton title="Back to Dashboard" onPress={() => navigation.goBack()} />
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
            Please enable camera access in your device settings to use face enrollment.
          </Text>
          <PrimaryButton title="Request Permission" onPress={requestPermission} />
          <PrimaryButton title="Back to Dashboard" onPress={() => navigation.goBack()} />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Face Enrollment</Text>
        <Text style={styles.subtitle}>
          Position your face in the frame and capture a clear photo.
        </Text>
      </View>

      {permissionStatus === 'granted' && !capturedUri && (
        <View style={styles.cameraContainer}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          >
            <View style={styles.cameraButtons}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
              >
                <Text style={styles.flipText}>Flip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
        </View>
      )}

      {capturedUri && !success && (
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedUri }} style={styles.preview} />
          <View style={styles.previewButtons}>
            <PrimaryButton title="Retake" onPress={retakePicture} />
            <PrimaryButton
              title="Enroll Face"
              onPress={enrollFace}
              loading={loading}
            />
          </View>
        </View>
      )}

      {success && (
        <View style={styles.centerContainer}>
          <Text style={styles.successTitle}>Enrollment Successful!</Text>
          <PrimaryButton title="Back to Dashboard" onPress={() => navigation.goBack()} />
        </View>
      )}

      {!capturedUri && permissionStatus === 'granted' && !success && (
        <PrimaryButton title="Back to Dashboard" onPress={() => navigation.goBack()} />
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16
  },
  headerCard: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800'
  },
  subtitle: {
    color: '#dce8f6',
    marginTop: theme.spacing.xs
  },
  infoText: {
    fontSize: 16,
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: 24
  },
  cameraContainer: {
    height: 400,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    marginBottom: theme.spacing.md
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  cameraButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  flipButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 25
  },
  flipText: {
    color: '#fff',
    fontWeight: '700'
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 5,
    borderColor: '#fff',
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  captureInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff'
  },
  previewContainer: {
    marginBottom: theme.spacing.md
  },
  preview: {
    height: 400,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md
  },
  previewButtons: {
    flexDirection: 'row',
    gap: 12
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.success,
    marginBottom: 24
  }
});
