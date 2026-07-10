import React, {useState} from 'react';
import {View, Alert} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {Screen, Header, Input, Button, Avatar} from '../../components/common';
import {useAuthStore} from '../../store/authStore';
import {useUpdateProfile} from '../../hooks/useProfile';
import {
  useUploadProfileImage,
  useDeleteProfileImage,
} from '../../hooks/useProfileImage';
import {getApiErrorMessage} from '../../api/errors';
import {UpdateProfilePayload} from '../../api/users.api';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const EditProfileScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const user = useAuthStore(s => s.user);
  const updateProfile = useUpdateProfile();
  const uploadImage = useUploadProfileImage();
  const deleteImage = useDeleteProfileImage();

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  // Local preview shown immediately after picking, before the upload finishes.
  const [localUri, setLocalUri] = useState<string | undefined>();

  const previewUri = localUri ?? user?.profileImage ?? undefined;
  const hasPhoto = !!previewUri;

  const onPickImage = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    });

    if (result.didCancel) return;
    if (result.errorCode) {
      Alert.alert('Error', result.errorMessage ?? 'Could not open the gallery.');
      return;
    }

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setLocalUri(asset.uri); // instant preview

    const formData = new FormData();
    formData.append('image', {
      uri: asset.uri,
      name: asset.fileName ?? `profile_${Date.now()}.jpg`,
      type: asset.type ?? 'image/jpeg',
    } as unknown as Blob);

    uploadImage.mutate(formData, {
      onSuccess: () => Alert.alert('Success', 'Profile photo updated.'),
      onError: e => {
        setLocalUri(undefined); // roll back preview
        Alert.alert('Upload failed', getApiErrorMessage(e));
      },
    });
  };

  const onRemovePhoto = () => {
    Alert.alert('Remove photo', 'Remove your profile photo?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          deleteImage.mutate(undefined, {
            onSuccess: () => {
              setLocalUri(undefined);
              Alert.alert('Removed', 'Profile photo removed.');
            },
            onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
          }),
      },
    ]);
  };

  const onSave = () => {
    const payload: UpdateProfilePayload = {
      name: name.trim(),
      bio: bio.trim(),
    };
    if (username.trim()) payload.username = username.trim().toLowerCase();
    if (email.trim()) payload.email = email.trim();

    updateProfile.mutate(payload, {
      onSuccess: () => {
        Alert.alert('Saved', 'Your profile has been updated.');
        navigation.goBack();
      },
      onError: e => {
        Alert.alert('Update failed', getApiErrorMessage(e));
      },
    });
  };

  return (
    <Screen scroll padded>
      <Header title={t.profile.editProfile} onBack={() => navigation.goBack()} />
      <View style={{alignItems: 'center', marginVertical: theme.spacing.xl}}>
        <Avatar name={name || 'User'} uri={previewUri} size={96} />
        <Button
          label={hasPhoto ? 'Change photo' : 'Add photo'}
          icon="camera"
          variant="ghost"
          size="sm"
          fullWidth={false}
          loading={uploadImage.isPending}
          disabled={uploadImage.isPending || deleteImage.isPending}
          style={{marginTop: theme.spacing.sm}}
          onPress={onPickImage}
        />
        {hasPhoto && (
          <Button
            label="Remove photo"
            icon="trash-2"
            variant="ghost"
            size="sm"
            fullWidth={false}
            loading={deleteImage.isPending}
            disabled={uploadImage.isPending || deleteImage.isPending}
            onPress={onRemovePhoto}
          />
        )}
      </View>

      <Input
        label="Name"
        icon="user"
        value={name}
        onChangeText={setName}
        placeholder="Your full name"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Username"
        icon="at-sign"
        value={username}
        onChangeText={setUsername}
        placeholder="lowercase, numbers, _ or ."
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Email"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Bio"
        icon="edit-3"
        value={bio}
        onChangeText={setBio}
        placeholder="Tell people about yourself (max 150 chars)"
        multiline
        maxLength={150}
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Phone"
        icon="phone"
        value={`+91 ${user?.phoneNumber ?? ''}`}
        editable={false}
        containerStyle={{marginBottom: theme.spacing.lg}}
      />

      <Button
        label={t.common.save}
        icon="check"
        onPress={onSave}
        loading={updateProfile.isPending}
        disabled={updateProfile.isPending}
        style={{marginTop: theme.spacing.md}}
      />
    </Screen>
  );
};

export default EditProfileScreen;
