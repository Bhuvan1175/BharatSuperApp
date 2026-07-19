import React, {useState} from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@navigation/types';
import {useTheme} from '@context/ThemeContext';
import {
  Screen,
  Header,
  Card,
  AppText,
  Badge,
  Chip,
  EmptyState,
} from '@components/common';
import {LoadingState, ErrorState} from '@components/dashboard';
import {getApiErrorMessage} from '../../api/errors';
import {formatJobType} from '../../utils/helpers';
import {useAreaAdminJobs} from '@hooks/useAreaIntelligence';
import {BackgroundJobLogItem, JobStatus} from '../../api/areaIntelligence.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_LABEL: Record<JobStatus, string> = {
  RUNNING: 'Running',
  SUCCESS: 'Success',
  FAILED: 'Failed',
  PARTIAL: 'Partial',
};

const FILTER_TABS: {label: string; value: JobStatus | 'ALL'}[] = [
  {label: 'All', value: 'ALL'},
  {label: 'Running', value: 'RUNNING'},
  {label: 'Success', value: 'SUCCESS'},
  {label: 'Failed', value: 'FAILED'},
  {label: 'Partial', value: 'PARTIAL'},
];

const statusColor = (
  status: JobStatus,
  theme: ReturnType<typeof useTheme>['theme'],
) => {
  switch (status) {
    case 'RUNNING':
      return theme.colors.secondary;
    case 'SUCCESS':
      return theme.colors.accent;
    case 'FAILED':
      return theme.colors.danger;
    case 'PARTIAL':
      return theme.colors.warning;
  }
};

/** AREA_MANAGER: audit trail of every background job (sync/refresh/recalculate/etc). */
const AreaAdminJobsScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<JobStatus | 'ALL'>('ALL');

  const {
    data: jobs,
    isLoading,
    isError,
    error,
    refetch,
  } = useAreaAdminJobs(
    filter === 'ALL' ? {limit: 50} : {status: filter, limit: 50},
  );

  const renderItem = (job: BackgroundJobLogItem) => (
    <Card key={job.id} style={{marginBottom: theme.spacing.md}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: theme.spacing.md,
        }}>
        <View style={{flex: 1}}>
          <AppText variant="title" numberOfLines={1}>
            {formatJobType(job.jobType)}
          </AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {job.areaId ? `Area: ${job.areaId}` : 'All areas'}
          </AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {new Date(job.startedAt).toLocaleString()}
            {job.finishedAt
              ? ` – ${new Date(job.finishedAt).toLocaleTimeString()}`
              : ''}
          </AppText>
          {job.recordsProcessed != null && (
            <AppText variant="caption" muted numberOfLines={1}>
              {job.recordsProcessed} record(s) processed
            </AppText>
          )}
          {!!job.errorMessage && (
            <AppText
              variant="caption"
              color={theme.colors.danger}
              style={{marginTop: theme.spacing.xs}}>
              {job.errorMessage}
            </AppText>
          )}
        </View>
        <Badge
          label={STATUS_LABEL[job.status]}
          color={statusColor(job.status, theme)}
        />
      </View>
    </Card>
  );

  return (
    <Screen scroll padded>
      <Header title="Job History" onBack={() => navigation.goBack()} />

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.lg,
        }}>
        {FILTER_TABS.map(tab => (
          <Chip
            key={tab.value}
            label={tab.label}
            selected={tab.value === filter}
            onPress={() => setFilter(tab.value)}
          />
        ))}
      </View>

      {isLoading ? (
        <LoadingState fullscreen={false} />
      ) : isError ? (
        <ErrorState
          fullscreen={false}
          message={getApiErrorMessage(error)}
          onRetry={() => refetch()}
        />
      ) : !jobs?.length ? (
        <EmptyState
          icon="activity"
          title="No jobs yet"
          subtitle="Background jobs will show up here as they run."
        />
      ) : (
        jobs.map(renderItem)
      )}
    </Screen>
  );
};

export default AreaAdminJobsScreen;
