import React from 'react';
import {View, Pressable} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '@context/ThemeContext';
import {
  Screen,
  Header,
  Card,
  AppText,
  Icon,
  Avatar,
  Button,
  EmptyState,
} from '@components/common';
import {useAdminUsers} from '../../hooks/useAdmin';
import {AdminUser} from '../../api/admin.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'AdminDepartmentUsers'>;

const StatusBadge: React.FC<{active: boolean}> = ({active}) => {
  const {theme} = useTheme();
  const bg = active ? theme.colors.accentSoft : theme.colors.dangerSoft;
  const fg = active ? theme.colors.accent : theme.colors.danger;
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
        backgroundColor: bg,
      }}>
      <AppText variant="caption" color={fg}>
        {active ? 'Active' : 'Inactive'}
      </AppText>
    </View>
  );
};

const DepartmentUsersScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const {params} = useRoute<Rt>();
  const {data: users, isLoading} = useAdminUsers({department: params.department});

  const renderUser = (u: AdminUser) => (
    <Pressable key={u.id} onPress={() => navigation.navigate('AdminEditUser', {user: u})}>
      <Card style={{marginBottom: theme.spacing.md, flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md}}>
        <Avatar name={u.name || u.email || 'User'} uri={undefined} size={44} />
        <View style={{flex: 1}}>
          <AppText variant="title" numberOfLines={1}>
            {u.name || u.email || 'Unnamed'}
          </AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {u.role?.name ?? '—'}
          </AppText>
        </View>
        <StatusBadge active={u.isActive} />
        <Icon name="chevron-right" size={18} color={theme.colors.textMuted} />
      </Card>
    </Pressable>
  );

  return (
    <Screen scroll padded>
      <Header
        title={params.label ?? params.department}
        onBack={() => navigation.goBack()}
      />

      <Button
        label="Add user"
        icon="user-plus"
        style={{marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}
        onPress={() => navigation.navigate('AdminAddUser', {department: params.department})}
      />

      {isLoading ? (
        <AppText variant="body" muted center style={{marginTop: theme.spacing.xl}}>
          Loading…
        </AppText>
      ) : !users?.length ? (
        <EmptyState
          icon="users"
          title="No users yet"
          subtitle="Add the first officer for this department."
        />
      ) : (
        users.map(renderUser)
      )}
    </Screen>
  );
};

export default DepartmentUsersScreen;
