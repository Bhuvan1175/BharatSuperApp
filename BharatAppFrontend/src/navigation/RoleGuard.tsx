import React from 'react';
import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  canManageModule,
  canViewModule,
  hasPermission,
  ModuleKey,
  Permission,
  Role,
} from '@/rbac';
import {useRole} from '@hooks/useRole';
import {useTheme} from '@context/ThemeContext';
import {AppText, Button, EmptyState} from '@components/common';
import {navigationRef} from './navigationRef';

interface RoleGuardProps {
  children: React.ReactNode;
  /** Allow only these roles. */
  roles?: Role[];
  /** Require this exact permission (e.g. 'fuel:manage'). */
  permission?: Permission;
  /** Require access to this module — view by default. */
  module?: ModuleKey;
  /** With `module`, require MANAGE instead of view. */
  requireManage?: boolean;
  /** Custom denied UI (defaults to an Access-restricted screen). */
  fallback?: React.ReactNode;
}

/** Shown when the current role fails the guard. */
const DefaultDenied: React.FC = () => {
  const {theme} = useTheme();
  const canBack = navigationRef.isReady() && navigationRef.canGoBack();
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: theme.colors.background}}>
      <View style={{flex: 1, justifyContent: 'center', padding: theme.spacing.xl}}>
        <EmptyState
          icon="lock"
          title="Access restricted"
          subtitle="Your role doesn't have permission to view this screen."
        />
        {canBack && (
          <Button
            label="Go back"
            onPress={() => navigationRef.goBack()}
            style={{marginTop: theme.spacing.lg}}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

/**
 * RoleGuard — declarative, frontend role protection for any subtree.
 *
 * The guard PASSES only if every constraint you pass is satisfied for the
 * current role (from useRole). Constraints compose with AND:
 *
 *   <RoleGuard roles={['SUPER_ADMIN']}>            … only super admin
 *   <RoleGuard module="fuel" requireManage>        … only who can manage fuel
 *   <RoleGuard permission="scheme:view">           … a specific permission
 *
 * It reads capabilities from the RBAC layer, never a hardcoded role name, so
 * new roles are covered automatically. Because it uses useRole(), it needs no
 * changes when the role source becomes the Zustand store / backend JWT.
 *
 * NOTE: RoleRouter already ensures a role only mounts its OWN dashboard; this
 * guard is defense-in-depth and the mechanism for protecting future per-module
 * "manage" screens.
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles,
  permission,
  module,
  requireManage,
  fallback,
}) => {
  const role = useRole();

  const allowed =
    (!roles || roles.includes(role)) &&
    (!permission || hasPermission(role, permission)) &&
    (!module ||
      (requireManage
        ? canManageModule(role, module)
        : canViewModule(role, module)));

  if (!allowed) {
    return <>{fallback ?? <DefaultDenied />}</>;
  }
  return <>{children}</>;
};

export default RoleGuard;
