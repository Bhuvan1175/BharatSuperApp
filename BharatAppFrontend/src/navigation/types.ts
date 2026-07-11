import {NavigatorScreenParams} from '@react-navigation/native';

/** Bottom-tab routes (5 tabs per the IA). */
export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: {query?: string} | undefined;
  TravelTab: undefined;
  GovernmentTab: undefined;
  ProfileTab: undefined;
};

/** Root stack — auth flow + tabs + pushed module screens. */
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Otp: {email: string};
  Biometric: undefined;
  Permissions: undefined;
  Main: NavigatorScreenParams<MainTabParamList> | undefined;
  AIChat: {initialQuery?: string} | undefined;
  Health: {medicine?: string} | undefined;
  PrescriptionScanner: undefined;
  Emergency: undefined;
  Utilities: undefined;
  AreaScore: {areaId?: string; query?: string} | undefined;
  RoadTrip: undefined;
  Eligibility: undefined;
  SchemeResults: {category?: string} | undefined;
  Settings: undefined;
  Saved: undefined;
  EditProfile: undefined;
  UserSearch: undefined;
};

/** Deep-link targets emitted by AI actions / quick actions. */
export type DeepLinkTarget =
  | keyof RootStackParamList
  | keyof MainTabParamList;
