import React from 'react';
import {View, ScrollView, Pressable} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {MODULES, ModuleKey} from '@/rbac';
import {useAuthStore} from '@/store/authStore';
import {useTheme} from '@context/ThemeContext';
import {AppText, Card, Icon, SectionHeader, EmptyState} from '@components/common';
import RoleGuard from '@navigation/RoleGuard';
import StatisticsCard from './StatisticsCard';
import QuickActionCard from './QuickActionCard';
import AccountButton from './AccountButton';
import {useListingStats, useListings} from '../../hooks/useListings';

/**
 * DepartmentDashboard — ONE generic dashboard for every department manager.
 * It reads the department from the auth store (backend-provided) and now drives
 * the four management blocks + live overview stats + recent activity from the
 * generic Listing APIs. Works for ANY department/module, including ones created
 * at runtime by the super admin.
 */

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DepartmentDashboard: React.FC<{module?: string}> = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const department = useAuthStore(s => s.department);
  const role = useAuthStore(s => s.role);

  const moduleKey = department?.moduleKey;
  const meta = moduleKey ? MODULES[moduleKey as ModuleKey] : undefined;
  const color = meta?.color ?? theme.colors.primary;
  const icon = meta?.icon ?? 'grid';
  const title = department?.label ?? department?.name ?? 'Department';

  const {data: stats} = useListingStats(moduleKey);
  const {data: recent} = useListings(moduleKey ? {moduleKey} : undefined);

  const statTiles = [
    {key: 'total', label: 'Total Entries', value: stats?.total},
    {key: 'active', label: 'Active', value: stats?.active},
    {key: 'archived', label: 'Archived', value: stats?.archived},
  ];

  const actions: {
    key: string;
    label: string;
    icon: string;
    onPress: () => void;
  }[] = [
    {
      key: 'add',
      label: 'Add Entry',
      icon: 'plus-circle',
      onPress: () => navigation.navigate('DeptAddListing'),
    },
    {
      key: 'manage',
      label: 'Manage Entries',
      icon: 'edit-3',
      onPress: () => navigation.navigate('DeptManageEntries'),
    },
    {
      key: 'reports',
      label: 'Reports',
      icon: 'bar-chart-2',
      onPress: () => navigation.navigate('DeptReports'),
    },
    {
      key: 'settings',
      label: 'Areas & Settings',
      icon: 'map-pin',
      onPress: () => navigation.navigate('DeptLocalities'),
    },
  ];

  const recentTop = (recent ?? []).slice(0, 5);

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
              {statTiles.map(s => (
                <StatisticsCard
                  key={s.key}
                  label={s.label}
                  value={s.value ?? '—'}
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
              {actions.map(a => (
                <QuickActionCard
                  key={a.key}
                  label={a.label}
                  icon={a.icon}
                  color={color}
                  onPress={a.onPress}
                  style={{width: '48%', marginBottom: theme.spacing.md}}
                />
              ))}
            </View>
          </View>

          {/* ---- Recent activity ---- */}
          <View style={{marginTop: theme.spacing.sm}}>
            <SectionHeader
              title="Recent Activity"
              actionLabel={recentTop.length ? 'See all' : undefined}
              onAction={
                recentTop.length
                  ? () => navigation.navigate('DeptManageEntries')
                  : undefined
              }
            />
            {!recentTop.length ? (
              <Card>
                <EmptyState
                  icon="inbox"
                  title="No activity yet"
                  subtitle="Add your first entry from the Add Entry block above."
                />
              </Card>
            ) : (
              recentTop.map(item => (
                <Pressable
                  key={item.id}
                  onPress={() =>
                    navigation.navigate('DeptAddListing', {listingId: item.id})
                  }>
                  <Card
                    style={{
                      marginBottom: theme.spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                    }}>
                    <View style={{flex: 1}}>
                      <AppText variant="title" numberOfLines={1}>
                        {item.title}
                      </AppText>
                      <AppText variant="caption" muted numberOfLines={1}>
                        {item.locality?.name ?? item.city?.name ?? 'All areas'} ·{' '}
                        {item.status}
                      </AppText>
                    </View>
                    <Icon
                      name="chevron-right"
                      size={18}
                      color={theme.colors.textMuted}
                    />
                  </Card>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </RoleGuard>
  );
};

export default DepartmentDashboard;
