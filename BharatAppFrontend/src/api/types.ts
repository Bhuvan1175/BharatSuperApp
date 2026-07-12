/** Shapes returned by the NestJS backend. */

/** The user's role as returned by the backend (a relation object). */
export interface ApiRole {
  name: string;
  label?: string | null;
  permissions?: string[];
}

/** The user's department as returned by the backend (a relation object). */
export interface ApiDepartment {
  name: string;
  label?: string | null;
  moduleKey?: string;
}

export interface ApiUser {
  id: string;
  phoneNumber: string | null;
  email: string | null;
  name: string | null;
  username: string | null;
  bio: string | null;
  profileImage: string | null;
  profileImagePublicId?: string | null;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  /**
   * RBAC role from the backend (login + GET /users/profile). It's a relation
   * OBJECT — the auth store reads `role?.name`. null for a citizen who hasn't
   * been assigned one yet.
   */
  role?: ApiRole | null;
  /** Department a manager belongs to (null for citizens / super-admin). */
  department?: ApiDepartment | null;
  /** Whether the account is active. */
  isActive?: boolean;
}

export interface SendOtpResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: ApiUser;
}

export interface RefreshResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface CompleteProfileResponse {
  profileCompleted: boolean;
  completionPercentage: number;
  missingFields: string[];
}

export interface SearchUserResult {
  id: string;
  name: string | null;
  username: string | null;
  profileImage: string | null;
}
