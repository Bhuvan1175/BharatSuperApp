import React from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '@context/ThemeContext';
import {
  Screen,
  Header,
  Card,
  AppText,
  Button,
  Icon,
  EmptyState,
} from '@components/common';
import {useAdminDepartments} from '../../hooks/useAdmin';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DepartmentsScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const {data: departments, isLoading} = useAdminDepartments();

  return (
    <Screen scroll padded>
      <Header title="Departments" onBack={() => navigation.goBack()} />

      <Button
        label="Add department"
        icon="plus"
        style={{marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}
        onPress={() => navigation.navigate('AdminAddDepartment')}
      />

      {isLoading ? (
        <AppText variant="body" muted center style={{marginTop: theme.spacing.xl}}>
          Loading…
        </AppText>
      ) : !departments?.length ? (
        <EmptyState icon="grid" title="No departments" subtitle="Add your first department." />
      ) : (
        departments.map(d => (
          <Card
            key={d.id}
            onPress={() =>
              navigation.navigate('AdminEditDepartment', {department: d})
            }
            style={{marginBottom: theme.spacing.md}}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <View style={{flex: 1}}>
                <AppText variant="title">{d.label ?? d.name}</AppText>
                <AppText variant="caption" muted style={{marginTop: 2}}>
                  {d.name} · manager: {d.defaultRole?.name ?? '—'}
                </AppText>
              </View>
              <AppText variant="caption" muted style={{marginRight: theme.spacing.sm}}>
                {d.moduleKey}
              </AppText>
              <Icon name="chevron-right" size={18} color={theme.colors.textMuted} />
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
};

export default DepartmentsScreen;
