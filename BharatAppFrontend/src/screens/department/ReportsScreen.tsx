import React from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, AppText, SectionHeader, EmptyState, Card} from '@components/common';
import {StatisticsCard} from '@components/dashboard';
import {useAuthStore} from '../../store/authStore';
import {useListingStats, useListings} from '../../hooks/useListings';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const ReportsScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const department = useAuthStore(s => s.department);
  const moduleKey = department?.moduleKey;

  const {data: stats} = useListingStats(moduleKey);
  const {data: recent} = useListings(moduleKey ? {moduleKey} : undefined);

  const tiles = [
    {key: 'total', label: 'Total', value: stats?.total, icon: 'layers'},
    {key: 'active', label: 'Active', value: stats?.active, icon: 'check-circle'},
    {key: 'scheduled', label: 'Scheduled', value: stats?.scheduled, icon: 'clock'},
    {key: 'archived', label: 'Archived', value: stats?.archived, icon: 'archive'},
  ];

  return (
    <Screen scroll padded>
      <Header
        title={`${department?.label ?? 'Department'} · Reports`}
        onBack={() => navigation.goBack()}
      />

      <View style={{marginTop: theme.spacing.md}}>
        <SectionHeader title="Summary" />
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md}}>
          {tiles.map(t => (
            <StatisticsCard
              key={t.key}
              label={t.label}
              value={t.value ?? '—'}
              icon={t.icon}
              style={{width: '47%'}}
            />
          ))}
        </View>
      </View>

      <View style={{marginTop: theme.spacing.lg}}>
        <SectionHeader title="Latest entries" />
        {!recent?.length ? (
          <Card>
            <EmptyState
              icon="bar-chart-2"
              title="Nothing to report yet"
              subtitle="Reports populate as you add entries."
            />
          </Card>
        ) : (
          recent.slice(0, 8).map(item => (
            <Card key={item.id} style={{marginBottom: theme.spacing.sm}}>
              <AppText variant="title" numberOfLines={1}>
                {item.title}
              </AppText>
              <AppText variant="caption" muted numberOfLines={1}>
                {item.locality?.name ?? item.city?.name ?? 'All areas'} ·{' '}
                {item.status} · {new Date(item.createdAt).toLocaleDateString()}
              </AppText>
            </Card>
          ))
        )}
      </View>
    </Screen>
  );
};

export default ReportsScreen;
