import React, {useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, Input, Button, AppText} from '@components/common';
import {getApiErrorMessage} from '../../api/errors';
import {useCreateRole} from '../../hooks/useAdmin';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AddRoleScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const createRole = useCreateRole();

  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [permissions, setPermissions] = useState('');

  const nameValid = /^[A-Z][A-Z0-9_]*$/.test(name);

  const onSubmit = () => {
    if (!nameValid) {
      Alert.alert('Check name', 'Role name must be UPPER_SNAKE_CASE.');
      return;
    }
    const perms = permissions
      .split(',')
      .map(p => p.trim())
      .filter(Boolean);

    createRole.mutate(
      {name, label: label.trim() || undefined, permissions: perms},
      {
        onSuccess: () => {
          Alert.alert('Created', `Role "${name}" created.`);
          navigation.goBack();
        },
        onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
      },
    );
  };

  return (
    <Screen scroll padded>
      <Header title="Add role" onBack={() => navigation.goBack()} />

      <Input
        label="Name (UPPER_SNAKE_CASE)"
        icon="hash"
        value={name}
        onChangeText={txt => setName(txt.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
        placeholder="TRANSPORT_MANAGER"
        autoCapitalize="characters"
        autoCorrect={false}
        containerStyle={{marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Label"
        icon="tag"
        value={label}
        onChangeText={setLabel}
        placeholder="Transport Department"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Permissions (comma-separated)"
        icon="key"
        value={permissions}
        onChangeText={setPermissions}
        placeholder="transport:view, transport:manage"
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={{marginBottom: theme.spacing.md}}
      />
      <AppText variant="caption" muted style={{marginBottom: theme.spacing.lg}}>
        Format: "module:action" (e.g. transport:manage). Use "*" for full
        access.
      </AppText>

      <Button
        label="Create role"
        icon="check"
        onPress={onSubmit}
        loading={createRole.isPending}
        disabled={createRole.isPending || !nameValid}
      />
    </Screen>
  );
};

export default AddRoleScreen;
