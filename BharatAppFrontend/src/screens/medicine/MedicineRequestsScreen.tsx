import React, {useState} from 'react';
import {View, Pressable, Alert} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, Card, AppText, Badge, Button, EmptyState} from '@components/common';
import {LoadingState, ErrorState} from '@components/dashboard';
import {getApiErrorMessage} from '../../api/errors';
import {useMedicineRequests, useUpdateMedicineRequestStatus} from '@hooks/useMedicines';
import {MedicineRequestItem, RequestStatus} from '../../api/medicines.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Completed',
};

const FILTER_TABS: {label: string; value: RequestStatus | 'ALL'}[] = [
  {label: 'All', value: 'ALL'},
  {label: 'Pending', value: 'PENDING'},
  {label: 'Accepted', value: 'ACCEPTED'},
  {label: 'Ready', value: 'READY_FOR_PICKUP'},
  {label: 'Completed', value: 'COMPLETED'},
  {label: 'Rejected', value: 'REJECTED'},
];

const statusColor = (status: RequestStatus, theme: ReturnType<typeof useTheme>['theme']) => {
  switch (status) {
    case 'PENDING':
      return theme.colors.warning;
    case 'ACCEPTED':
      return theme.colors.secondary;
    case 'READY_FOR_PICKUP':
      return theme.colors.primary;
    case 'COMPLETED':
      return theme.colors.accent;
    case 'REJECTED':
      return theme.colors.danger;
  }
};

/** Store manager: every citizen request — filter by status, act on each. */
const MedicineRequestsScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<RequestStatus | 'ALL'>('ALL');

  const {
    data: requests,
    isLoading,
    isError,
    error,
    refetch,
  } = useMedicineRequests(filter === 'ALL' ? undefined : {status: filter});
  const updateStatus = useUpdateMedicineRequestStatus();

  const act = (item: MedicineRequestItem, status: RequestStatus, confirmMsg?: string) => {
    const run = () =>
      updateStatus.mutate(
        {id: item.id, body: {status}},
        {onError: e => Alert.alert('Failed', getApiErrorMessage(e))},
      );
    if (confirmMsg) {
      Alert.alert('Are you sure?', confirmMsg, [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Confirm', onPress: run},
      ]);
    } else {
      run();
    }
  };

  const renderActions = (item: MedicineRequestItem) => {
    switch (item.status) {
      case 'PENDING':
        return (
          <View style={{flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md}}>
            <Button
              label="Accept"
              icon="check"
              size="sm"
              onPress={() => act(item, 'ACCEPTED')}
              style={{flex: 1}}
            />
            <Button
              label="Reject"
              icon="x"
              size="sm"
              variant="danger"
              onPress={() => act(item, 'REJECTED', `Reject the request for ${item.medicineName}?`)}
              style={{flex: 1}}
            />
          </View>
        );
      case 'ACCEPTED':
        return (
          <Button
            label="Mark ready for pickup"
            icon="package"
            size="sm"
            onPress={() => act(item, 'READY_FOR_PICKUP')}
            style={{marginTop: theme.spacing.md}}
          />
        );
      case 'READY_FOR_PICKUP':
        return (
          <Button
            label="Mark completed"
            icon="check-circle"
            size="sm"
            variant="secondary"
            onPress={() =>
              act(
                item,
                'COMPLETED',
                `Confirm ${item.medicineName} × ${item.quantity} was handed over? This reduces stock.`,
              )
            }
            style={{marginTop: theme.spacing.md}}
          />
        );
      default:
        return null;
    }
  };

  const renderItem = (item: MedicineRequestItem) => (
    <Card key={item.id} style={{marginBottom: theme.spacing.md}}>
      <View style={{flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.md}}>
        <View style={{flex: 1}}>
          <AppText variant="title" numberOfLines={1}>
            {item.medicineName} × {item.quantity}
          </AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {item.citizenName ?? item.citizen?.name ?? 'Citizen'}
            {item.citizen?.phoneNumber ? ` · ${item.citizen.phoneNumber}` : ''}
          </AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {new Date(item.createdAt).toLocaleString()}
          </AppText>
          {!!item.notes && (
            <AppText variant="caption" muted style={{marginTop: theme.spacing.xs}}>
              Note: {item.notes}
            </AppText>
          )}
        </View>
        <Badge label={STATUS_LABEL[item.status]} color={statusColor(item.status, theme)} />
      </View>
      {renderActions(item)}
    </Card>
  );

  return (
    <Screen scroll padded>
      <Header title="Requests" onBack={() => navigation.goBack()} />

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.spacing.sm,
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.lg,
        }}>
        {FILTER_TABS.map(tab => {
          const active = tab.value === filter;
          return (
            <Pressable
              key={tab.value}
              onPress={() => setFilter(tab.value)}
              style={{
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.pill,
                backgroundColor: active ? theme.colors.primary : theme.colors.cardAlt,
                borderWidth: 1,
                borderColor: active ? theme.colors.primary : theme.colors.border,
              }}>
              <AppText variant="label" color={active ? theme.colors.textInverse : theme.colors.text}>
                {tab.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {isLoading ? (
        <LoadingState fullscreen={false} />
      ) : isError ? (
        <ErrorState fullscreen={false} message={getApiErrorMessage(error)} onRetry={() => refetch()} />
      ) : !requests?.length ? (
        <EmptyState icon="inbox" title="No requests" subtitle="Requests from citizens will show up here." />
      ) : (
        requests.map(renderItem)
      )}
    </Screen>
  );
};

export default MedicineRequestsScreen;
