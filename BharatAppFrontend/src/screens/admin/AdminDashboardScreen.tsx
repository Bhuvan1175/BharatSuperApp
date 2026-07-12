import React from 'react';
import {View, ScrollView} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ALL_MODULES, MODULES} from '@/rbac';
import {useTheme} from '@context/ThemeContext';
import {AppText, Card, SectionHeader, EmptyState} from '@components/common';
import {StatisticsCard, ModuleCard} from '@components/dashboard';
import RoleGuard from '@navigation/RoleGuard';

/**
 * AdminDashboardScreen — the SUPER_ADMIN home.
 *
 * A cross-department overview built entirely from the RBAC MODULES registry, so
 * a new module appears here automatically with zero edits. Composed from the
 * Step 7 reusable components (StatisticsCard, ModuleCard) and wrapped in a
 * RoleGuard restricted to SUPER_ADMIN. Placeholder only — no APIs.
 */

const AdminDashboardScreen: React.FC = () => {
  const {theme} = useTheme();

  const overview = [
    {key: 'departments', label: 'Departments', value: String(ALL_MODULES.length)},
    {key: 'modules', label: 'Modules', value: String(ALL_MODULES.length)},
    {key: 'managers', label: 'Managers', value: '—'},
  ];

  return (
    <RoleGuard roles={['SUPER_ADMIN']}>
      <SafeAreaView
        edges={['top']}
        style={{flex: 1, backgroundColor: theme.colors.background}}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.giant,
          }}>
          <AppText variant="h1">Super Admin</AppText>
          <AppText variant="body" muted style={{marginTop: theme.spacing.xs}}>
            Oversight of all departments & modules
          </AppText>

          {/* ---- Overview stats ---- */}
          <View style={{marginTop: theme.spacing.xl}}>
            <SectionHeader title="Overview" />
            <View style={{flexDirection: 'row', gap: theme.spacing.md}}>
              {overview.map(o => (
                <StatisticsCard
                  key={o.key}
                  label={o.label}
                  value={o.value}
                  style={{flex: 1}}
                />
              ))}
            </View>
          </View>

          {/* ---- Department grid (from MODULES registry) ---- */}
          <View style={{marginTop: theme.spacing.xl}}>
            <SectionHeader title="Departments" />
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
              }}>
              {ALL_MODULES.map(key => (
                <ModuleCard
                  key={key}
                  module={MODULES[key]}
                  style={{width: '48%', marginBottom: theme.spacing.md}}
                />
              ))}
            </View>
          </View>

          {/* ---- System activity ---- */}
          <View style={{marginTop: theme.spacing.sm}}>
            <SectionHeader title="System Activity" />
            <Card>
              <EmptyState
                icon="activity"
                title="Nothing to show yet"
                subtitle="Department metrics appear here once backend RBAC and module APIs are connected."
              />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </RoleGuard>
  );
};

export default AdminDashboardScreen;
