import React from 'react';
import {View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '@context/ThemeContext';
import {Screen, Header, Card, AppText, Button, EmptyState} from '@components/common';
import {useAdminRoles} from '../../hooks/useAdmin';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const RolesScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const {data: roles, isLoading} = useAdminRoles();

  return (
    <Screen scroll padded>
      <Header title="Roles" onBack={() => navigation.goBack()} />

      <Button
        label="Add role"
        icon="plus"
        style={{marginTop: theme.spacing.md, marginBottom: theme.spacing.lg}}
        onPress={() => navigation.navigate('AdminAddRole')}
      />

      {isLoading ? (
        <AppText variant="body" muted center style={{marginTop: theme.spacing.xl}}>
          Loading…
        </AppText>
      ) : !roles?.length ? (
        <EmptyState icon="shield" title="No roles" subtitle="Add your first role." />
      ) : (
        roles.map(r => (
          <Card key={r.name} style={{marginBottom: theme.spacing.md}}>
            <AppText variant="title">{r.label ?? r.name}</AppText>
            <AppText variant="caption" muted style={{marginTop: 2}}>
              {r.name}
            </AppText>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.sm}}>
              {(r.permissions.length ? r.permissions : ['—']).map(p => (
                <View
                  key={p}
                  style={{
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: 4,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.colors.cardAlt,
                  }}>
                  <AppText variant="caption" muted>
                    {p}
                  </AppText>
                </View>
              ))}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
};

export default RolesScreen;
