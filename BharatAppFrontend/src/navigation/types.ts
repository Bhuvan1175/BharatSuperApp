import {NavigatorScreenParams} from '@react-navigation/native';
import {AdminUser, AdminDepartment} from '../api/admin.api';

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
  // Citizen: full live alerts feed (Home → Local Alerts → View all).
  LocalAlerts: undefined;
  // Shared account hub for managers / admin (edit profile · settings · logout).
  Account: undefined;
  // ---- Super Admin panel ----
  AdminDepartmentUsers: {department: string; label?: string};
  AdminAddUser: {department: string};
  AdminEditUser: {user: AdminUser};
  AdminDepartments: undefined;
  AdminAddDepartment: undefined;
  AdminEditDepartment: {department: AdminDepartment};
  AdminRoles: undefined;
  AdminAddRole: undefined;
  // ---- Department manager module blocks ----
  DeptAddListing: {listingId?: string} | undefined;
  DeptManageEntries: undefined;
  DeptReports: undefined;
  DeptLocalities: undefined;
  // ---- Medicine Store Dashboard (bespoke — real inventory + requests) ----
  MedicineInventory: undefined;
  AddMedicine: {medicineId?: string} | undefined;
  MedicineRequests: undefined;
  StoreLocation: undefined;
  MedicineReminders: {medicine?: string} | undefined;
};

/** Deep-link targets emitted by AI actions / quick actions. */
export type DeepLinkTarget =
  | keyof RootStackParamList
  | keyof MainTabParamList;
