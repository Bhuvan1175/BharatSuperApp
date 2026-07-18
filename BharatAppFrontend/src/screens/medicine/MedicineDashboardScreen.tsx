import React from 'react';
import {View, ScrollView, Pressable, Linking} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@navigation/types';
import {MODULES} from '@/rbac';
import {useAuthStore} from '@/store/authStore';
import {useTheme} from '@context/ThemeContext';
import {AppText, Card, Icon, SectionHeader, Badge, Button, MapPreview} from '@components/common';
import RoleGuard from '@navigation/RoleGuard';
import {StatisticsCard, QuickActionCard, AccountButton, LoadingState} from '@components/dashboard';
import {useMedicineRequests, useMedicineStats, useMedicineStore} from '@hooks/useMedicines';
import {RequestStatus} from '../../api/medicines.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  READY_FOR_PICKUP: 'Ready for pickup',
  COMPLETED: 'Completed',
};

/**
 * Medicine Store Dashboard — the real, bespoke home for MEDICINE_MANAGER.
 * Unlike other departments (which share the generic bulletin-style
 * DepartmentDashboard), Medicine has a first-class domain: real inventory +
 * a citizen request workflow, so it gets its own dashboard wired to that data.
 */
const MedicineDashboardScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const department = useAuthStore(s => s.department);
  const meta = MODULES.medicine;
  const title = department?.label ?? department?.name ?? meta.label;

  const {data: stats, isLoading: statsLoading} = useMedicineStats();
  const {data: pending} = useMedicineRequests({status: 'PENDING'});
  const {data: store} = useMedicineStore();

  const statTiles = [
    {key: 'total', label: 'Total Medicines', value: stats?.totalMedicines, icon: 'package'},
    {key: 'requests', label: 'Total Requests', value: stats?.totalRequests, icon: 'inbox'},
    {key: 'pending', label: 'Pending Requests', value: stats?.pendingRequests, icon: 'clock'},
    {key: 'low', label: 'Low Stock', value: stats?.lowStockMedicines, icon: 'alert-triangle'},
  ];

  const actions = [
    {
      key: 'inventory',
      label: 'Inventory',
      icon: 'package',
      onPress: () => navigation.navigate('MedicineInventory'),
    },
    {
      key: 'requests',
      label: 'Requests',
      icon: 'inbox',
      hint: pending?.length ? `${pending.length} pending` : undefined,
      onPress: () => navigation.navigate('MedicineRequests'),
    },
    {
      key: 'add',
      label: 'Add Medicine',
      icon: 'plus-circle',
      onPress: () => navigation.navigate('AddMedicine'),
    },
  ];

  const recentPending = (pending ?? []).slice(0, 5);

  return (
    <RoleGuard moduleKey="medicine" requireManage>
      <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: theme.colors.background}}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{padding: theme.spacing.lg, paddingBottom: theme.spacing.giant}}>
          {/* ---- Header: identity + account ---- */}
          <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md}}>
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
                Medicine Store Dashboard
              </AppText>
            </View>
            <AccountButton />
          </View>

          {/* ---- Overview stats ---- */}
          <View style={{marginTop: theme.spacing.xl}}>
            <SectionHeader title="Overview" />
            {statsLoading ? (
              <LoadingState fullscreen={false} />
            ) : (
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md}}>
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
          </View>

          {/* ---- Management actions ---- */}
          <View style={{marginTop: theme.spacing.xl}}>
            <SectionHeader title="Manage" />
            <View style={{flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between'}}>
              {actions.map(a => (
                <QuickActionCard
                  key={a.key}
                  label={a.label}
                  icon={a.icon}
                  hint={a.hint}
                  color={meta.color}
                  onPress={a.onPress}
                  style={{width: '31%', marginBottom: theme.spacing.md}}
                />
              ))}
            </View>
          </View>

          {/* ---- Store location ---- */}
          <View style={{marginTop: theme.spacing.xl}}>
            <SectionHeader
              title="Store Location"
              actionLabel={store?.address ? 'Edit' : 'Set up'}
              onAction={() => navigation.navigate('StoreLocation')}
            />
            {store?.address ? (
              <Card>
                <MapPreview label={store.address} height={130} pinColor={meta.color} />
                <View style={{marginTop: theme.spacing.md, gap: theme.spacing.sm}}>
                  <View style={{flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing.sm}}>
                    <Icon name="map-pin" size={15} color={theme.colors.textMuted} />
                    <AppText variant="body" style={{flex: 1}}>
                      {store.address}
                    </AppText>
                  </View>
                  {store.openingHours && (
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm}}>
                      <Icon name="clock" size={15} color={theme.colors.textMuted} />
                      <AppText variant="caption" muted>
                        {store.openingHours}
                      </AppText>
                    </View>
                  )}
                  {store.phone && (
                    <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm}}>
                      <Icon name="phone" size={15} color={theme.colors.textMuted} />
                      <AppText variant="caption" muted>
                        {store.phone}
                      </AppText>
                    </View>
                  )}
                </View>
                <Button
                  label="Directions"
                  icon="navigation"
                  variant="outline"
                  size="sm"
                  style={{marginTop: theme.spacing.md}}
                  onPress={() =>
                    Linking.openURL(
                      store.latitude != null && store.longitude != null
                        ? `https://maps.google.com/?q=${store.latitude},${store.longitude}`
                        : `https://maps.google.com/?q=${encodeURIComponent(store.address ?? '')}`,
                    )
                  }
                />
              </Card>
            ) : (
              <Card onPress={() => navigation.navigate('StoreLocation')} style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md}}>
                <View style={{width: 44, height: 44, borderRadius: theme.radius.md, backgroundColor: meta.color + '22', alignItems: 'center', justifyContent: 'center'}}>
                  <Icon name="map-pin" size={22} color={meta.color} />
                </View>
                <View style={{flex: 1}}>
                  <AppText variant="bodyStrong">Add your pickup location</AppText>
                  <AppText variant="caption" muted>
                    Citizens will see this address on the medicine page.
                  </AppText>
                </View>
                <Icon name="chevron-right" size={20} color={theme.colors.textMuted} />
              </Card>
            )}
          </View>

          {/* ---- Pending requests preview ---- */}
          <View style={{marginTop: theme.spacing.sm}}>
            <SectionHeader
              title="Pending Requests"
              actionLabel={recentPending.length ? 'See all' : undefined}
              onAction={recentPending.length ? () => navigation.navigate('MedicineRequests') : undefined}
            />
            {!recentPending.length ? (
              <Card>
                <AppText variant="body" muted center>
                  No pending requests right now.
                </AppText>
              </Card>
            ) : (
              recentPending.map(item => (
                <Pressable key={item.id} onPress={() => navigation.navigate('MedicineRequests')}>
                  <Card
                    style={{
                      marginBottom: theme.spacing.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: theme.spacing.md,
                    }}>
                    <View style={{flex: 1}}>
                      <AppText variant="title" numberOfLines={1}>
                        {item.medicineName} × {item.quantity}
                      </AppText>
                      <AppText variant="caption" muted numberOfLines={1}>
                        {item.citizenName ?? 'Citizen'} · {new Date(item.createdAt).toLocaleString()}
                      </AppText>
                    </View>
                    <Badge label={STATUS_LABEL[item.status]} color={theme.colors.warning} />
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

export default MedicineDashboardScreen;
