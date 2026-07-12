import React, {useState} from 'react';
import {Alert} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, Input, Button, AppText} from '@components/common';
import OptionPicker from '../../components/admin/OptionPicker';
import {getApiErrorMessage} from '../../api/errors';
import {
  useAdminDepartments,
  useAdminRoles,
  useCreateDepartmentUser,
} from '../../hooks/useAdmin';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'AdminAddUser'>;

const AddUserScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const {params} = useRoute<Rt>();
  const {data: departments} = useAdminDepartments();
  const {data: roles} = useAdminRoles();
  const createUser = useCreateDepartmentUser();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState(params.department);
  const [roleOverride, setRoleOverride] = useState<string | undefined>();

  const selectedDept = departments?.find(d => d.name === department);
  const defaultRole = selectedDept?.defaultRole?.name;
  const effectiveRole = roleOverride ?? defaultRole;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const onSubmit = () => {
    if (!emailValid) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    createUser.mutate(
      {
        email: email.trim().toLowerCase(),
        department,
        role: effectiveRole,
        name: name.trim() || undefined,
        phoneNumber: phone.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert('Added', 'Department user created. They log in with the same Email OTP.');
          navigation.goBack();
        },
        onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
      },
    );
  };

  return (
    <Screen scroll padded>
      <Header title="Add department user" onBack={() => navigation.goBack()} />

      <Input
        label="Email (login identity)"
        icon="mail"
        value={email}
        onChangeText={setEmail}
        placeholder="officer@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        containerStyle={{marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Name (optional)"
        icon="user"
        value={name}
        onChangeText={setName}
        placeholder="Full name"
        containerStyle={{marginBottom: theme.spacing.lg}}
      />
      <Input
        label="Mobile (optional)"
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
          setDepartment(v);
          setRoleOverride(undefined);
        }}
        options={(departments ?? []).map(d => ({label: d.label ?? d.name, value: d.name}))}
      />

      <OptionPicker
        label="Role (defaults to the department's role)"
        value={effectiveRole}
        onChange={setRoleOverride}
        options={(roles ?? []).map(r => ({label: r.name, value: r.name}))}
      />
      {effectiveRole === 'SUPER_ADMIN' && (
        <AppText variant="caption" color={theme.colors.danger} style={{marginBottom: theme.spacing.md}}>
          ⚠ This grants full Super Admin access.
        </AppText>
      )}

      <Button
        label="Create user"
        icon="check"
        onPress={onSubmit}
        loading={createUser.isPending}
        disabled={createUser.isPending || !emailValid || !department}
        style={{marginTop: theme.spacing.md}}
      />
    </Screen>
  );
};

export default AddUserScreen;
