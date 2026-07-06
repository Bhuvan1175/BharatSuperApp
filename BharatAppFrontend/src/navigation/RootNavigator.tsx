import React from 'react';
import {View, ActivityIndicator} from 'react-native';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import {RootStackParamList} from './types';
import {navigationRef} from './navigationRef';
import {useTheme} from '../context/ThemeContext';
import {useAuth} from '../context/AuthContext';

import BottomTabNavigator from './BottomTabNavigator';
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

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const {theme, isDark} = useTheme();
  const {initializing, onboarded, session} = useAuth();

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

  if (initializing) {
    return (
      <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background}}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const initialRouteName: keyof RootStackParamList = !onboarded
    ? 'Onboarding'
    : !session
    ? 'Login'
    : 'Main';

  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      <Stack.Navigator
        initialRouteName={initialRouteName}
        screenOptions={{headerShown: false, animation: 'slide_from_right', contentStyle: {backgroundColor: theme.colors.background}}}>
        {/* Auth flow */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="Biometric" component={BiometricScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />

        {/* Main tabs */}
        <Stack.Screen name="Main" component={BottomTabNavigator} />

        {/* Pushed module screens (deep-link targets) */}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
