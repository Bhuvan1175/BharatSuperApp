import React from 'react';
import {View, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {MODULES, ModuleKey} from '@/rbac';
import {useAuthStore} from '@/store/authStore';
import {useTheme} from '@context/ThemeContext';
import {AppText, Card, Icon, SectionHeader, EmptyState} from '@components/common';
import RoleGuard from '@navigation/RoleGuard';
import StatisticsCard from './StatisticsCard';
import QuickActionCard from './QuickActionCard';
import AccountButton from './AccountButton';

/**
 * DepartmentDashboard — ONE generic dashboard for every department manager.
 * It reads the department straight from the auth store (backend-provided), so
 * it renders correctly for any department — including ones the app didn't know
 * about at compile time. For known modules it uses the MODULES catalogue for
 * icon/colour; for unknown ones it falls back to sensible defaults.
 *
 * Placeholder only (no data APIs yet). The `module` prop is accepted but unused
 * (kept so the old per-department wrapper screens still compile).
 */

const STATS: {key: string; label: string}[] = [
  {key: 'total', label: 'Total Listings'},
  {key: 'active', label: 'Active'},
  {key: 'pending', label: 'Pending'},
];

const MANAGE_ACTIONS: {key: string; label: string; icon: string}[] = [
  {key: 'add', label: 'Add Listing', icon: 'plus-circle'},
  {key: 'manage', label: 'Manage Entries', icon: 'edit-3'},
  {key: 'reports', label: 'Reports', icon: 'bar-chart-2'},
  {key: 'settings', label: 'Module Settings', icon: 'sliders'},
];

const DepartmentDashboard: React.FC<{module?: string}> = () => {
  const {theme} = useTheme();
  const department = useAuthStore(s => s.department);
  const role = useAuthStore(s => s.role);

  const moduleKey = department?.moduleKey;
  const meta = moduleKey ? MODULES[moduleKey as ModuleKey] : undefined;
  const color = meta?.color ?? theme.colors.primary;
  const icon = meta?.icon ?? 'grid';
  const title = department?.label ?? department?.name ?? 'Department';

  return (
    <RoleGuard moduleKey={moduleKey} requireManage>
      <SafeAreaView
        edges={['top']}
        style={{flex: 1, backgroundColor: theme.colors.background}}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.giant,
          }}>
          {/* ---- Header: department identity + account ---- */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.md,
            }}>
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: theme.radius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: color + '22',
              }}>
              <Icon name={icon} size={24} color={color} />
            </View>
            <View style={{flex: 1}}>
              <AppText variant="h2" numberOfLines={1}>
                {title}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {role}
              </AppText>
            </View>
            <AccountButton />
          </View>

          {/* ---- Manager badge ---- */}
          <View
            style={{
              flexDirection: 'row',
              alignSelf: 'flex-start',
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
              Manage access
            </AppText>
          </View>

          {/* ---- Overview stats ---- */}
          <View style={{marginTop: theme.spacing.xl}}>
            <SectionHeader title="Overview" />
            <View style={{flexDirection: 'row', gap: theme.spacing.md}}>
              {STATS.map(s => (
                <StatisticsCard
                  key={s.key}
                  label={s.label}
                  value="—"
                  style={{flex: 1}}
                />
              ))}
            </View>
          </View>

          {/* ---- Management actions ---- */}
          <View style={{marginTop: theme.spacing.xl}}>
            <SectionHeader title="Manage" />
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}>
              {MANAGE_ACTIONS.map(a => (
                <QuickActionCard
                  key={a.key}
                  label={a.label}
                  icon={a.icon}
                  color={color}
                  hint="Coming soon"
                  style={{width: '48%', marginBottom: theme.spacing.md}}
                />
              ))}
            </View>
          </View>

          {/* ---- Recent activity ---- */}
          <View style={{marginTop: theme.spacing.sm}}>
            <SectionHeader title="Recent Activity" />
            <Card>
              <EmptyState
                icon="inbox"
                title="No activity yet"
                subtitle="Data appears here once the backend module APIs are connected."
              />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </RoleGuard>
  );
};

export default DepartmentDashboard;
