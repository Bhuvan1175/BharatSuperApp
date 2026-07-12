import React, {useEffect} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {RootStackParamList} from './types';
import {navigationRef} from './navigationRef';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';
import {useAuthStore} from '../store/authStore';

// RoleRouter replaces the direct BottomTabNavigator mount: it inspects the
// signed-in user's role and renders the correct home surface. For a citizen it
// renders the very same BottomTabNavigator as before — so nothing regresses.
import RoleRouter from './RoleRouter';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import OtpScreen from '../screens/auth/OtpScreen';
import BiometricScreen from '../screens/auth/BiometricScreen';
import PermissionsScreen from '../screens/auth/PermissionsScreen';

import AIChatScreen from '../screens/chat/AIChatScreen';
import AreaScoreScreen from '../screens/explore/AreaScoreScreen';
import RoadTripScreen from '../screens/travel/RoadTripScreen';
import EligibilityScreen from '../screens/government/EligibilityScreen';
import SchemeResultsScreen from '../screens/government/SchemeResultsScreen';
import HealthScreen from '../screens/health/HealthScreen';
import PrescriptionScannerScreen from '../screens/health/PrescriptionScannerScreen';
import EmergencyScreen from '../screens/emergency/EmergencyScreen';
import UtilitiesScreen from '../screens/utilities/UtilitiesScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import SavedScreen from '../screens/profile/SavedScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import UserSearchScreen from '../screens/search/UserSearchScreen';
import AccountScreen from '../screens/account/AccountScreen';
import {
  DepartmentUsersScreen,
  AddUserScreen,
  EditUserScreen,
  DepartmentsScreen,
  AddDepartmentScreen,
  EditDepartmentScreen,
  RolesScreen,
  AddRoleScreen,
} from '../screens/admin';
import {
  AddListingScreen,
  ManageEntriesScreen,
  ReportsScreen,
  ManageLocalitiesScreen,
} from '../screens/department';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const {theme, isDark} = useTheme();
  const {initializing, onboarded} = useAuth();

  // Real auth now comes from the Zustand store.
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isBootstrapping = useAuthStore(s => s.isBootstrapping);
  const bootstrap = useAuthStore(s => s.bootstrap);

  // On app start: try to restore a session from stored tokens (auto-login).
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      primary: theme.colors.primary,
    },
  };

  // Splash while we check onboarding + restore the session.
  if (initializing || isBootstrapping) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background}}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        screenOptions={{headerShown: false, animation: 'slide_from_right', contentStyle: {backgroundColor: theme.colors.background}}}>
        {!isAuthenticated ? (
          // ---- Unauthenticated flow ----
          <Stack.Group>
            {!onboarded && <Stack.Screen name="Onboarding" component={OnboardingScreen} />}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
          </Stack.Group>
        ) : (
          // ---- Authenticated app ----
          // `Main` is now the RoleRouter, which mounts the dashboard that
          // matches the user's role. Every other screen below stays exactly as
          // it was and remains reachable from the citizen flow.
          <Stack.Group>
            <Stack.Screen name="Main" component={RoleRouter} />
            <Stack.Screen name="Permissions" component={PermissionsScreen} />
            <Stack.Screen name="Biometric" component={BiometricScreen} />
            <Stack.Screen name="AIChat" component={AIChatScreen} options={{animation: 'slide_from_bottom'}} />
            <Stack.Screen name="Health" component={HealthScreen} />
            <Stack.Screen name="PrescriptionScanner" component={PrescriptionScannerScreen} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} />
            <Stack.Screen name="Utilities" component={UtilitiesScreen} />
            <Stack.Screen name="AreaScore" component={AreaScoreScreen} />
            <Stack.Screen name="RoadTrip" component={RoadTripScreen} />
            <Stack.Screen name="Eligibility" component={EligibilityScreen} />
            <Stack.Screen name="SchemeResults" component={SchemeResultsScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Saved" component={SavedScreen} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} />
            <Stack.Screen name="UserSearch" component={UserSearchScreen} />
            <Stack.Screen name="Account" component={AccountScreen} />
            <Stack.Screen name="AdminDepartmentUsers" component={DepartmentUsersScreen} />
            <Stack.Screen name="AdminAddUser" component={AddUserScreen} />
            <Stack.Screen name="AdminEditUser" component={EditUserScreen} />
            <Stack.Screen name="AdminDepartments" component={DepartmentsScreen} />
            <Stack.Screen name="AdminAddDepartment" component={AddDepartmentScreen} />
            <Stack.Screen name="AdminEditDepartment" component={EditDepartmentScreen} />
            <Stack.Screen name="AdminRoles" component={RolesScreen} />
            <Stack.Screen name="AdminAddRole" component={AddRoleScreen} />
            <Stack.Screen name="DeptAddListing" component={AddListingScreen} />
            <Stack.Screen name="DeptManageEntries" component={ManageEntriesScreen} />
            <Stack.Screen name="DeptReports" component={ReportsScreen} />
            <Stack.Screen name="DeptLocalities" component={ManageLocalitiesScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
