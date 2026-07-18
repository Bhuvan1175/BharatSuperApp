import React from 'react';
import {RefreshControl} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {Screen, Header, AppText} from '../../components/common';
import {ModuleAlertCard} from '../../components/cards';
import {usePublicAlerts} from '../../hooks/useListings';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/**
 * Full "Local Alerts" list — every active alert from all departments, newest
 * first. Reached from the Home "Local Alerts" section (View all / a card).
 */
const LocalAlertsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {data: alerts, isLoading, refetch, isRefetching} = usePublicAlerts();

  return (
    <Screen
      scroll
      padded
      scrollProps={{
        refreshControl: (
          <RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />
        ),
      }}>
      <Header title="Local alerts" onBack={() => navigation.goBack()} />

      {isLoading ? (
        <AppText variant="caption" muted>
          Loading alerts…
        </AppText>
      ) : alerts && alerts.length ? (
        alerts.map(a => <ModuleAlertCard key={a.id} alert={a} fullWidth />)
      ) : (
        <AppText variant="caption" muted>
          No alerts right now — you’re all caught up.
        </AppText>
      )}
    </Screen>
  );
};

export default LocalAlertsScreen;
