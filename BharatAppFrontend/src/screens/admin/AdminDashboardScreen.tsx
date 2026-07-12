import React from 'react';
import {View, ScrollView, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {MODULES, ModuleKey} from '@/rbac';
import {useTheme} from '@context/ThemeContext';
import {
  AppText,
  Card,
  Icon,
  SectionHeader,
  EmptyState,
  ListRow,
  Divider,
} from '@components/common';
import {StatisticsCard} from '@components/dashboard';
import AccountButton from '@components/dashboard/AccountButton';
import RoleGuard from '@navigation/RoleGuard';
import {useAdminDepartments, useAdminStats} from '../../hooks/useAdmin';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const AdminDashboardScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const {data: stats} = useAdminStats();
  const {data: departments, isLoading} = useAdminDepartments();

  const overview = [
    {key: 'departments', label: 'Departments', value: stats ? String(stats.departments) : '—'},
    {key: 'managers', label: 'Managers', value: stats ? String(stats.managers) : '—'},
    {key: 'roles', label: 'Roles', value: stats ? String(stats.roles) : '—'},
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
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
            <View style={{flex: 1}}>
              <AppText variant="h1">Super Admin</AppText>
              <AppText variant="body" muted style={{marginTop: theme.spacing.xs}}>
                Manage departments, users & roles
              </AppText>
            </View>
            <AccountButton />
          </View>

          {/* Overview */}
          <View style={{marginTop: theme.spacing.xl}}>
            <SectionHeader title="Overview" />
            <View style={{flexDirection: 'row', gap: theme.spacing.md}}>
              {overview.map(o => (
                <StatisticsCard key={o.key} label={o.label} value={o.value} style={{flex: 1}} />
              ))}
            </View>
          </View>

          {/* Departments — tap to manage users */}
          <View style={{marginTop: theme.spacing.xl}}>
            <SectionHeader title="Departments" />
            {isLoading ? (
              <ActivityIndicator color={theme.colors.primary} style={{marginTop: theme.spacing.lg}} />
            ) : !departments?.length ? (
              <Card>
                <EmptyState icon="grid" title="No departments" subtitle="Add one from Manage below." />
              </Card>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}>
                {departments.map(dept => {
                  const meta = MODULES[dept.moduleKey as ModuleKey];
                  const color = meta?.color ?? theme.colors.primary;
                  const icon = meta?.icon ?? 'grid';
                  return (
                    <Card
                      key={dept.name}
                      onPress={() =>
                        navigation.navigate('AdminDepartmentUsers', {
                          department: dept.name,
                          label: dept.label ?? dept.name,
                        })
                      }
                      style={{width: '48%', marginBottom: theme.spacing.md}}>
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: theme.radius.sm,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: color + '22',
                        }}>
                        <Icon name={icon} size={20} color={color} />
                      </View>
                      <AppText variant="title" numberOfLines={1} style={{marginTop: theme.spacing.sm}}>
                        {dept.label ?? dept.name}
                      </AppText>
                      <AppText variant="caption" muted numberOfLines={1}>
                        Manage users →
                      </AppText>
                    </Card>
                  );
                })}
              </View>
            )}
          </View>

          {/* Manage */}
          <View style={{marginTop: theme.spacing.md}}>
            <SectionHeader title="Manage" />
            <Card padded={false} style={{paddingHorizontal: theme.spacing.lg}}>
              <ListRow
                icon="grid"
                title="Departments"
                subtitle="Create & view departments"
                showChevron
                onPress={() => navigation.navigate('AdminDepartments')}
              />
              <Divider spacing={0} />
              <ListRow
                icon="shield"
                title="Roles"
                subtitle="Create & view roles"
                showChevron
                onPress={() => navigation.navigate('AdminRoles')}
              />
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </RoleGuard>
  );
};

export default AdminDashboardScreen;
