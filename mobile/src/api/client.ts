import axios from 'axios';
import Constants from 'expo-constants';

const rawBaseUrl = Constants.expoConfig?.extra?.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:5000';

const api = axios.create({
  baseURL: rawBaseUrl.replace(/\/$/, ''),
  timeout: 10000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export default api;
