import React from 'react';
import {View, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getRoleConfig, MODULES, ModuleKey} from '@/rbac';
import {useRole} from '@hooks/useRole';
import {useTheme} from '@context/ThemeContext';
import {AppText, Card, Icon, SectionHeader, EmptyState} from '@components/common';
import RoleGuard from '@navigation/RoleGuard';
import StatisticsCard from './StatisticsCard';
import QuickActionCard from './QuickActionCard';

interface Props {
  /** The module this dashboard manages. */
  module: ModuleKey;
}

/**
 * DepartmentDashboard — one reusable, config-driven template shared by ALL six
 * department manager dashboards. Each department screen is a 3-line wrapper
 * that passes its `module`; there is no per-department layout duplication.
 *
 * Now composed from the Step 7 reusable components (StatisticsCard,
 * QuickActionCard) — the inline card markup is gone. Wrapped in a RoleGuard
 * that requires MANAGE rights on the module. Placeholder only — no APIs; when
 * the backend module endpoints land, only this one file needs data wiring.
 */

/** Placeholder KPIs every department shows. */
const STATS: {key: string; label: string}[] = [
  {key: 'total', label: 'Total Listings'},
  {key: 'active', label: 'Active'},
  {key: 'pending', label: 'Pending'},
];

/** Placeholder management actions (inert until backend module APIs exist). */
const MANAGE_ACTIONS: {key: string; label: string; icon: string}[] = [
  {key: 'add', label: 'Add Listing', icon: 'plus-circle'},
  {key: 'manage', label: 'Manage Entries', icon: 'edit-3'},
  {key: 'reports', label: 'Reports', icon: 'bar-chart-2'},
  {key: 'settings', label: 'Module Settings', icon: 'sliders'},
];

const DepartmentDashboard: React.FC<Props> = ({module}) => {
  const {theme} = useTheme();
  const role = useRole();
  const cfg = getRoleConfig(role);
  const mod = MODULES[module];

  return (
    <RoleGuard module={module} requireManage>
      <SafeAreaView
        edges={['top']}
        style={{flex: 1, backgroundColor: theme.colors.background}}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.giant,
          }}>
          {/* ---- Header: module identity + role ---- */}
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
                backgroundColor: mod.color + '22',
              }}>
              <Icon name={mod.icon} size={24} color={mod.color} />
            </View>
            <View style={{flex: 1}}>
              <AppText variant="h2" numberOfLines={1}>
                {mod.label}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {cfg.label}
              </AppText>
            </View>
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
                  color={mod.color}
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
