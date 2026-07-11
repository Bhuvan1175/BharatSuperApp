/** Shapes returned by the NestJS backend. */

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
