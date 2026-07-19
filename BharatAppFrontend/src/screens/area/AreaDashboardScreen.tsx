import React from 'react';
import {View, ScrollView, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@navigation/types';
import {MODULES} from '@/rbac';
import {useAuthStore} from '@/store/authStore';
import {useTheme} from '@context/ThemeContext';
import {AppText, Card, Icon, SectionHeader, Badge} from '@components/common';
import RoleGuard from '@navigation/RoleGuard';
import {
  StatisticsCard,
  QuickActionCard,
  AccountButton,
  LoadingState,
} from '@components/dashboard';
import {
  useAreaAdminJobs,
  useAreaDataSources,
  useAreas,
  useRecalculateArea,
  useRefreshArea,
  useSyncAreaMaster,
} from '@hooks/useAreaIntelligence';
import {getApiErrorMessage} from '../../api/errors';
import {formatJobType} from '../../utils/helpers';
import {JobStatus} from '../../api/areaIntelligence.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const JOB_STATUS_LABEL: Record<JobStatus, string> = {
  RUNNING: 'Running',
  SUCCESS: 'Success',
  FAILED: 'Failed',
  PARTIAL: 'Partial',
};

/**
 * Area Intelligence Dashboard — the real, bespoke home for AREA_MANAGER.
 * Unlike other departments (generic bulletin-style DepartmentDashboard), Area
 * Intelligence has a first-class domain: external data providers + a
 * background job pipeline, so it gets its own dashboard wired to that data
 * (same reasoning as MedicineDashboardScreen).
 */
const AreaDashboardScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const department = useAuthStore(s => s.department);
  const meta = MODULES.area;
  const title = department?.label ?? department?.name ?? meta.label;

  const {data: dataSources, isLoading: sourcesLoading} = useAreaDataSources();
  const {data: recentJobs, isLoading: jobsLoading} = useAreaAdminJobs({
    limit: 5,
  });
  // Cheap "does any area data exist yet?" signal — there's no dedicated count
  // endpoint, so this reads the first page of the same list citizens search.
  const {data: browseAreas, isLoading: areasLoading} = useAreas({limit: 100});

  const syncAreaMaster = useSyncAreaMaster();
  const refreshArea = useRefreshArea();
  const recalculateArea = useRecalculateArea();

  const areasSyncedCount = browseAreas?.items.length ?? 0;
  const activeSourcesCount = (dataSources ?? []).filter(s => s.isActive).length;
  const failedJobsCount = (recentJobs ?? []).filter(
    j => j.status === 'FAILED',
  ).length;

  const statTiles = [
    {
      key: 'areas',
      label: 'Areas Synced',
      value: areasSyncedCount,
      icon: 'map-pin',
    },
    {
      key: 'sources',
      label: 'Data Sources',
      value: dataSources?.length,
      icon: 'database',
    },
    {
      key: 'active',
      label: 'Active Sources',
      value: activeSourcesCount,
      icon: 'check-circle',
    },
    {
      key: 'jobs',
      label: 'Recent Jobs',
      value: recentJobs?.length,
      icon: 'activity',
    },
    {
      key: 'failed',
      label: 'Failed Jobs',
      value: failedJobsCount,
      icon: 'alert-triangle',
    },
  ];

  const runWithConfirm = (title2: string, message: string, run: () => void) =>
    Alert.alert(title2, message, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Confirm', onPress: run},
    ]);

  const actions = [
    {
      key: 'localities',
      label: 'Manage Localities',
      icon: 'map',
      onPress: () => navigation.navigate('DeptLocalities'),
    },
    {
      key: 'sync',
      label: 'Sync Areas',
      icon: 'refresh-cw',
      onPress: () =>
        runWithConfirm(
          'Sync Area Master?',
          'Reconciles new localities into the Area Intelligence registry.',
          () =>
            syncAreaMaster.mutate(undefined, {
              onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
            }),
        ),
    },
    {
      key: 'refresh',
      label: 'Refresh All',
      icon: 'map-pin',
      onPress: () =>
        runWithConfirm(
          'Refresh nearby & traffic data?',
          'Enqueues a nearby-places and traffic refresh job for every area.',
          () =>
            refreshArea.mutate(undefined, {
              onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
            }),
        ),
    },
    {
      key: 'recalculate',
      label: 'Recalculate Scores',
      icon: 'bar-chart-2',
      onPress: () =>
        runWithConfirm(
          'Recalculate all scores?',
          'Enqueues a score recalculation job for every area.',
          () =>
            recalculateArea.mutate(undefined, {
              onError: e => Alert.alert('Failed', getApiErrorMessage(e)),
            }),
        ),
    },
    {
      key: 'jobs',
      label: 'Job History',
      icon: 'list',
      onPress: () => navigation.navigate('AreaAdminJobs'),
    },
    {
      key: 'dataSources',
      label: 'Data Sources',
      icon: 'database',
      onPress: () => navigation.navigate('AreaDataSources'),
    },
  ];

  return (
    <RoleGuard moduleKey="area" requireManage>
      <SafeAreaView
        edges={['top']}
        style={{flex: 1, backgroundColor: theme.colors.background}}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: theme.spacing.giant,
          }}>
          {/* ---- Header: identity + account ---- */}
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
                backgroundColor: meta.color + '22',
              }}>
              <Icon name={meta.icon} size={24} color={meta.color} />
            </View>
            <View style={{flex: 1}}>
              <AppText variant="h2" numberOfLines={1}>
                {title}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                Area Intelligence Dashboard
              </AppText>
            </View>
            <AccountButton />
          </View>

          {/* ---- Overview stats ---- */}
          <View style={{marginTop: theme.spacing.xl}}>
            <SectionHeader title="Overview" />
            {sourcesLoading || jobsLoading || areasLoading ? (
              <LoadingState fullscreen={false} />
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.spacing.md,
                }}>
                {statTiles.map(s => (
                  <StatisticsCard
                    key={s.key}
                    label={s.label}
                    value={s.value ?? '—'}
                    icon={s.icon}
                    iconColor={meta.color}
                    style={{width: '47%'}}
                  />
                ))}
              </View>
            )}
            {!areasLoading && areasSyncedCount === 0 && (
              <Card
                style={{
                  marginTop: theme.spacing.md,
                  flexDirection: 'row',
                  gap: theme.spacing.sm,
                }}>
                <Icon name="info" size={16} color={theme.colors.warning} />
                <AppText variant="caption" muted style={{flex: 1}}>
                  No areas yet — citizens will see empty search results until
                  you add localities under a city (Manage Localities below) and
                  then run Sync Areas.
                </AppText>
              </Card>
            )}
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
                  color={meta.color}
                  onPress={a.onPress}
                  style={{width: '31%', marginBottom: theme.spacing.md}}
                />
              ))}
            </View>
          </View>

          {/* ---- Recent jobs preview ---- */}
          <View style={{marginTop: theme.spacing.sm}}>
            <SectionHeader
              title="Recent Jobs"
              actionLabel={recentJobs?.length ? 'See all' : undefined}
              onAction={
                recentJobs?.length
                  ? () => navigation.navigate('AreaAdminJobs')
                  : undefined
              }
            />
            {!recentJobs?.length ? (
              <Card>
                <AppText variant="body" muted center>
                  No background jobs have run yet.
                </AppText>
              </Card>
            ) : (
              recentJobs.map(job => (
                <Card
                  key={job.id}
                  style={{
                    marginBottom: theme.spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                  }}>
                  <View style={{flex: 1}}>
                    <AppText variant="title" numberOfLines={1}>
                      {formatJobType(job.jobType)}
                    </AppText>
                    <AppText variant="caption" muted numberOfLines={1}>
                      {new Date(job.startedAt).toLocaleString()}
                    </AppText>
                  </View>
                  <Badge
                    label={JOB_STATUS_LABEL[job.status]}
                    color={
                      job.status === 'FAILED'
                        ? theme.colors.danger
                        : job.status === 'SUCCESS'
                        ? theme.colors.accent
                        : theme.colors.warning
                    }
                  />
                </Card>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </RoleGuard>
  );
};

export default AreaDashboardScreen;
