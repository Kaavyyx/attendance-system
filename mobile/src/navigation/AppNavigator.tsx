import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { EmployeeDashboardScreen } from '../screens/EmployeeDashboardScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AttendanceHistoryScreen } from '../screens/AttendanceHistoryScreen';
import { MonthlySummaryScreen } from '../screens/MonthlySummaryScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { MarkAttendanceScreen } from '../screens/MarkAttendanceScreen';
import { FaceEnrollmentScreen } from '../screens/FaceEnrollmentScreen';
import { FaceVerificationScreen } from '../screens/FaceVerificationScreen';
import { theme } from '../theme';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const EmployeeTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.colors.primary }}>
    <Tab.Screen name="EmployeeDashboard" component={EmployeeDashboardScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const EmployeeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="EmployeeDashboardHome" component={EmployeeDashboardScreen} />
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="MarkAttendance" component={MarkAttendanceScreen} />
    <Stack.Screen name="AttendanceHistory" component={AttendanceHistoryScreen} />
    <Stack.Screen name="MonthlySummary" component={MonthlySummaryScreen} />
    <Stack.Screen name="FaceEnrollment" component={FaceEnrollmentScreen} />
    <Stack.Screen name="FaceVerification" component={FaceVerificationScreen} />
  </Stack.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: theme.colors.primary }}>
    <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      ) : user?.role === 'ADMIN' ? (
        <AdminTabs />
      ) : (
        <EmployeeStack />
      )}
    </NavigationContainer>
  );
};
