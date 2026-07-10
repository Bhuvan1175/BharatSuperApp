import {apiClient} from './client';
import {
  ApiUser,
  CompleteProfileResponse,
  MessageResponse,
  SearchUserResult,
} from './types';

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  username?: string;
  bio?: string;
}

/** Users endpoints (/api/users/*). */
export const usersApi = {
  getProfile: async (): Promise<ApiUser> => {
    const {data} = await apiClient.get<ApiUser>('/users/profile');
    return data;
  },

  updateProfile: async (payload: UpdateProfilePayload): Promise<ApiUser> => {
    const {data} = await apiClient.patch<ApiUser>('/users/profile', payload);
    return data;
  },

  getCompleteProfile: async (): Promise<CompleteProfileResponse> => {
    const {data} = await apiClient.get<CompleteProfileResponse>(
      '/users/complete-profile',
    );
    return data;
  },

  searchUsers: async (query: string): Promise<SearchUserResult[]> => {
    const {data} = await apiClient.get<SearchUserResult[]>('/users/search', {
      params: {query},
    });
    return data;
  },

  uploadProfileImage: async (
    formData: FormData,
  ): Promise<{message: string; user: ApiUser}> => {
    const {data} = await apiClient.post('/users/profile-image', formData, {
      headers: {'Content-Type': 'multipart/form-data'},
    });
    return data;
  },

  deleteProfileImage: async (): Promise<MessageResponse> => {
    const {data} = await apiClient.delete<MessageResponse>(
      '/users/profile-image',
    );
    return data;
  },
};
