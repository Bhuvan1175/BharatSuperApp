import React, {useState} from 'react';
import {View, Switch, Alert} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, Input, Button, Card, AppText} from '@components/common';
import OptionPicker from '../../components/admin/OptionPicker';
import {getApiErrorMessage} from '../../api/errors';
import {useAuthStore} from '../../store/authStore';
import {
  useAdminDepartments,
  useAdminRoles,
  useUpdateUser,
} from '../../hooks/useAdmin';
import {UpdateUserBody} from '../../api/admin.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'AdminEditUser'>;

const EditUserScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const {params} = useRoute<Rt>();
  const user = params.user;
  const currentUser = useAuthStore(s => s.user);
  const isSelf = currentUser?.id === user.id;

  const {data: departments} = useAdminDepartments();
  const {data: roles} = useAdminRoles();
  const updateUser = useUpdateUser();

  const [name, setName] = useState(user.name ?? '');
  const [phone, setPhone] = useState(user.phoneNumber ?? '');
  const [department, setDepartment] = useState<string | undefined>(user.department?.name);
  const [role, setRole] = useState<string | undefined>(user.role?.name);
  const [isActive, setIsActive] = useState(user.isActive);

  const onSave = () => {
    const body: UpdateUserBody = {
      name: name.trim() || undefined,
      phoneNumber: phone.trim() || undefined,
    };
    if (department && department !== user.department?.name) body.department = department;
    if (role && role !== user.role?.name) body.role = role;
    if (isActive !== user.isActive) body.isActive = isActive;

    updateUser.mutate(
      {id: user.id, body},
      {
        onSuccess: () => {
          Alert.alert('Saved', 'User updated.');
          navigation.goBack();
        },
        onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
      },
    );
  };

  return (
    <Screen scroll padded>
      <Header title="Edit user" onBack={() => navigation.goBack()} />

      <AppText variant="caption" muted style={{marginTop: theme.spacing.sm}}>
        {user.email} · email cannot be changed
      </AppText>

      <Input
        label="Name"
        icon="user"
        value={name}
        onChangeText={setName}
        placeholder="Full name"
        containerStyle={{marginTop: theme.spacing.lg, marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Mobile"
        icon="phone"
        value={phone}
        onChangeText={txt => setPhone(txt.replace(/[^0-9]/g, ''))}
        placeholder="10-digit mobile"
        keyboardType="phone-pad"
        maxLength={10}
        containerStyle={{marginBottom: theme.spacing.lg}}
      />

      <OptionPicker
        label="Department"
        value={department}
        onChange={v => {
          if (isSelf) {
            Alert.alert('Not allowed', 'You cannot change your own department.');
            return;
          }
          setDepartment(v);
          const d = departments?.find(x => x.name === v);
          if (d?.defaultRole?.name) setRole(d.defaultRole.name);
        }}
        options={(departments ?? []).map(d => ({label: d.label ?? d.name, value: d.name}))}
      />

      <OptionPicker
        label="Role"
        value={role}
        onChange={v => {
          if (isSelf) {
            Alert.alert('Not allowed', 'You cannot change your own role.');
            return;
          }
          setRole(v);
        }}
        options={(roles ?? []).map(r => ({label: r.name, value: r.name}))}
      />
      {role === 'SUPER_ADMIN' && (
        <AppText variant="caption" color={theme.colors.danger} style={{marginBottom: theme.spacing.md}}>
          ⚠ This grants full Super Admin access.
        </AppText>
      )}

      {/* Active toggle */}
      <Card style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
        <View style={{flex: 1}}>
          <AppText variant="title">Active</AppText>
          <AppText variant="caption" muted>
            {isSelf ? 'You cannot deactivate yourself' : 'Deactivating blocks login immediately'}
          </AppText>
        </View>
        <Switch
          value={isActive}
          disabled={isSelf}
          onValueChange={setIsActive}
          trackColor={{true: theme.colors.primary, false: theme.colors.border}}
          thumbColor="#fff"
        />
      </Card>

      <Button
        label="Save changes"
        icon="check"
        onPress={onSave}
        loading={updateUser.isPending}
        disabled={updateUser.isPending}
        style={{marginTop: theme.spacing.xl}}
      />
    </Screen>
  );
};

export default EditUserScreen;
