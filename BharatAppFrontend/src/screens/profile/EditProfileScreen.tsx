import React, {useState} from 'react';
import {View, Alert} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useAuth} from '../../context/AuthContext';
import {useTranslation} from '../../hooks/useTranslation';
import {Screen, Header, Input, Button, Avatar} from '../../components/common';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

const EditProfileScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {user} = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [location, setLocation] = useState(user?.location ?? '');

  return (
    <Screen scroll padded>
      <Header title={t.profile.editProfile} onBack={() => navigation.goBack()} />
      <View style={{alignItems: 'center', marginVertical: theme.spacing.xl}}>
        <Avatar name={name || 'User'} size={96} />
        <Button label="Change photo" icon="camera" variant="ghost" size="sm" fullWidth={false} style={{marginTop: theme.spacing.sm}} onPress={() => {}} />
      </View>

      <Input label="Name" icon="user" value={name} onChangeText={setName} containerStyle={{marginBottom: theme.spacing.lg}} />
      <Input label="Location" icon="map-pin" value={location} onChangeText={setLocation} containerStyle={{marginBottom: theme.spacing.lg}} />
      <Input label="Phone" icon="phone" value={`+91 ${user?.phone ?? ''}`} editable={false} containerStyle={{marginBottom: theme.spacing.lg}} />

      <Button
        label={t.common.save}
        icon="check"
        onPress={() => {
          Alert.alert('Saved', 'Your profile has been updated (demo).');
          navigation.goBack();
        }}
        style={{marginTop: theme.spacing.md}}
      />
    </Screen>
  );
};

export default EditProfileScreen;
