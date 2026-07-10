import {useMutation, useQueryClient} from '@tanstack/react-query';
import {usersApi} from '../api/users.api';
import {useAuthStore} from '../store/authStore';
import {PROFILE_QUERY_KEY} from './useProfile';
import {COMPLETE_PROFILE_QUERY_KEY} from './useCompleteProfile';

/** POST /users/profile-image — uploads a new profile photo. */
export function useUploadProfileImage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore(s => s.setUser);
  return useMutation({
    mutationFn: (formData: FormData) => usersApi.uploadProfileImage(formData),
    onSuccess: res => {
      // Backend returns { message, user } with the new profileImage url.
      setUser(res.user);
      queryClient.setQueryData(PROFILE_QUERY_KEY, res.user);
      queryClient.invalidateQueries({queryKey: COMPLETE_PROFILE_QUERY_KEY});
    },
  });
}

/** DELETE /users/profile-image — removes the current profile photo. */
export function useDeleteProfileImage() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore(s => s.setUser);
  return useMutation({
    mutationFn: () => usersApi.deleteProfileImage(),
    onSuccess: () => {
      const current = useAuthStore.getState().user;
      if (current) {
        setUser({...current, profileImage: null, profileImagePublicId: null});
      }
      queryClient.invalidateQueries({queryKey: PROFILE_QUERY_KEY});
      queryClient.invalidateQueries({queryKey: COMPLETE_PROFILE_QUERY_KEY});
    },
  });
}
