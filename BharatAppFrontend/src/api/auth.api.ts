import {apiClient} from './client';
import {
  MessageResponse,
  RefreshResponse,
  SendOtpResponse,
  VerifyOtpResponse,
} from './types';

/** Auth endpoints (POST /api/auth/*). */
export const authApi = {
  sendOtp: async (phoneNumber: string): Promise<SendOtpResponse> => {
    const {data} = await apiClient.post<SendOtpResponse>('/auth/send-otp', {
      phoneNumber,
    });
    return data;
  },

  verifyOtp: async (
    phoneNumber: string,
    otp: string,
  ): Promise<VerifyOtpResponse> => {
    const {data} = await apiClient.post<VerifyOtpResponse>('/auth/verify-otp', {
      phoneNumber,
      otp,
    });
    return data;
  },

  logout: async (): Promise<MessageResponse> => {
    const {data} = await apiClient.post<MessageResponse>('/auth/logout');
    return data;
  },

  refresh: async (refreshToken: string): Promise<RefreshResponse> => {
    const {data} = await apiClient.post<RefreshResponse>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },
};
