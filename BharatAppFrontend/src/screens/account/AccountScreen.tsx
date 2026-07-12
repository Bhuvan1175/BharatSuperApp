import React from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {usePermissions} from '../../hooks/usePermissions';
import {useAuthStore} from '../../store/authStore';
import {
  Screen,
  Header,
  Avatar,
  Card,
  AppText,
  Icon,
  ListRow,
  Divider,
  Button,
} from '../../components/common';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * AccountScreen — the shared account hub for ANY role (citizen, manager, admin).
 * Reuses the existing EditProfile and Settings screens (dark mode, language,
 * preferences live there) and adds Logout + a role/department badge.
 */
const AccountScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const user = useAuthStore(s => s.user);
  const logout = useAuthStore(s => s.logout);
  const {role, department} = usePermissions();

  return (
    <Screen scroll padded>
      <Header title="Account" onBack={() => navigation.goBack()} />

      {/* Identity card */}
      <Card style={{alignItems: 'center', marginTop: theme.spacing.md}}>
        <Avatar
          name={user?.name || user?.email || 'User'}
          uri={user?.profileImage || undefined}
          size={80}
        />
        <AppText variant="h3" style={{marginTop: theme.spacing.md}}>
          {user?.name || 'Add your name'}
        </AppText>
        {!!user?.email && (
          <AppText variant="caption" muted style={{marginTop: 2}}>
            {user.email}
          </AppText>
        )}

        {/* Role / department badge */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            marginTop: theme.spacing.md,
            paddingVertical: 6,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.colors.primarySoft,
          }}>
          <Icon name="shield" size={13} color={theme.colors.primary} />
          <AppText variant="caption" color={theme.colors.primary}>
            {role}
            {department ? ` · ${department.name}` : ''}
          </AppText>
        </View>

        <Button
          label="Edit Profile"
          icon="edit-2"
          variant="outline"
          size="sm"
          fullWidth={false}
          style={{marginTop: theme.spacing.lg}}
          onPress={() => navigation.navigate('EditProfile')}
        />
      </Card>

      {/* Options — reuse existing screens */}
      <Card
        padded={false}
        style={{
          paddingHorizontal: theme.spacing.lg,
          marginTop: theme.spacing.lg,
        }}>
        <ListRow
          icon="edit-2"
          title="Edit profile"
          subtitle="Name, username, bio, photo"
          showChevron
          onPress={() => navigation.navigate('EditProfile')}
        />
        <Divider spacing={0} />
        <ListRow
          icon="settings"
          title="Settings"
          subtitle="Dark mode, language, notifications"
          showChevron
          onPress={() => navigation.navigate('Settings')}
        />
      </Card>

      <Button
        label="Logout"
        icon="log-out"
        variant="ghost"
        style={{marginTop: theme.spacing.xl}}
        onPress={logout}
      />
      <AppText variant="caption" muted center style={{marginTop: theme.spacing.md}}>
        Bharat Super App · v1.0.0
      </AppText>
    </Screen>
  );
};

export default AccountScreen;
