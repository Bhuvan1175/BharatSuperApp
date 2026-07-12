import React from 'react';
import {View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '@context/ThemeContext';
import {AppText, Button, EmptyState} from '@components/common';
import {usePermissions} from '@hooks/usePermissions';
import {navigationRef} from './navigationRef';

interface RoleGuardProps {
  children: React.ReactNode;
  /** Allow only these role names. */
  roles?: string[];
  /** Require this exact permission (e.g. 'fuel:manage'). */
  permission?: string;
  /** Require access to this module by key (e.g. 'fuel'). */
  moduleKey?: string;
  /** With `moduleKey`, require MANAGE instead of view. */
  requireManage?: boolean;
  /** Custom denied UI (defaults to an Access-restricted screen). */
  fallback?: React.ReactNode;
}

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
 * RoleGuard — declarative, backend-driven role protection. Constraints compose
 * with AND. Uses the permissions the backend put on the auth store, so new
 * roles/modules are covered automatically.
 */
const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  roles,
  permission,
  moduleKey,
  requireManage,
  fallback,
}) => {
  const {role, can} = usePermissions();

  const allowed =
    (!roles || roles.includes(role)) &&
    (!permission || can(permission)) &&
    (!moduleKey ||
      can(`${moduleKey}:${requireManage ? 'manage' : 'view'}`));

  if (!allowed) {
    return <>{fallback ?? <DefaultDenied />}</>;
  }
  return <>{children}</>;
};

export default RoleGuard;
