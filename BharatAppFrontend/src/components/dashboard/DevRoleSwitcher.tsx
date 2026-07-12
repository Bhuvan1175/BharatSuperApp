import React, {useState} from 'react';
import {View, Modal, Pressable, ScrollView} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ALL_ROLES, getRoleConfig} from '@/rbac';
import {useAuthStore} from '@/store/authStore';
import {useTheme} from '@context/ThemeContext';
import {AppText, Icon} from '@components/common';

/**
 * DevRoleSwitcher — a __DEV__-only floating tool to preview any role's dashboard
 * without a backend. It calls the auth store's setRole(); RoleRouter then swaps
 * the dashboard instantly. RoleRouter renders this only when __DEV__ is true, so
 * it never ships in a release build.
 */
const DevRoleSwitcher: React.FC = () => {
  const {theme} = useTheme();
  const insets = useSafeAreaInsets();
  const role = useAuthStore(s => s.role);
  const setRole = useAuthStore(s => s.setRole);
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Preview role"
        style={{
          position: 'absolute',
          right: theme.spacing.lg,
          bottom: insets.bottom + 76,
          width: 48,
          height: 48,
          borderRadius: 24,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.secondary,
          ...theme.shadows.md,
        }}>
        <Icon name="users" size={22} color={theme.colors.textInverse} />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}>
        <Pressable
          onPress={() => setOpen(false)}
          style={{
            flex: 1,
            backgroundColor: theme.colors.overlay,
            justifyContent: 'flex-end',
          }}>
          <Pressable
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.xl,
              borderTopRightRadius: theme.radius.xl,
              padding: theme.spacing.lg,
              paddingBottom: insets.bottom + theme.spacing.lg,
            }}>
            <AppText variant="h3">Preview role (dev)</AppText>
            <AppText
              variant="caption"
              muted
              style={{marginTop: 4, marginBottom: theme.spacing.md}}>
              Switch the mock role. Replaced by the backend JWT in production.
            </AppText>
            <ScrollView style={{maxHeight: 380}}>
              {ALL_ROLES.map(r => {
                const cfg = getRoleConfig(r);
                const active = r === role;
                return (
                  <Pressable
                    key={r}
                    onPress={() => {
                      setRole(r);
                      setOpen(false);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                      paddingVertical: theme.spacing.md,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.border,
                    }}>
                    <Icon
                      name={active ? 'check-circle' : 'circle'}
                      size={20}
                      color={active ? theme.colors.primary : theme.colors.textMuted}
                    />
                    <View style={{flex: 1}}>
                      <AppText variant="title" numberOfLines={1}>
                        {cfg.label}
                      </AppText>
                      <AppText variant="caption" muted numberOfLines={1}>
                        {r}
                      </AppText>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default DevRoleSwitcher;
