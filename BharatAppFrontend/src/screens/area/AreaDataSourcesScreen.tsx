import React from 'react';
import {View, Switch} from 'react-native';
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
  EmptyState,
} from '@components/common';
import {LoadingState, ErrorState} from '@components/dashboard';
import {getApiErrorMessage} from '../../api/errors';
import {
  useAreaDataSources,
  useUpdateAreaDataSource,
} from '@hooks/useAreaIntelligence';
import {ExternalDataSourceItem} from '../../api/areaIntelligence.api';

type Nav = NativeStackNavigationProp<RootStackParamList>;

/** AREA_MANAGER: toggle which external data providers feed the scoring engine. */
const AreaDataSourcesScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();

  const {
    data: sources,
    isLoading,
    isError,
    error,
    refetch,
  } = useAreaDataSources();
  const updateDataSource = useUpdateAreaDataSource();

  const renderItem = (source: ExternalDataSourceItem) => (
    <Card key={source.id} style={{marginBottom: theme.spacing.md}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.spacing.md,
        }}>
        <View style={{flex: 1}}>
          <AppText variant="title" numberOfLines={1}>
            {source.displayName}
          </AppText>
          <AppText variant="caption" muted numberOfLines={1}>
            {source.providerKey} · Priority {source.priority}
          </AppText>
          {source.lastSuccessAt && (
            <AppText variant="caption" muted numberOfLines={1}>
              Last success: {new Date(source.lastSuccessAt).toLocaleString()}
            </AppText>
          )}
          {source.lastFailureAt && (
            <AppText
              variant="caption"
              color={theme.colors.danger}
              numberOfLines={1}>
              Last failure: {new Date(source.lastFailureAt).toLocaleString()}
            </AppText>
          )}
        </View>
        <Badge label={source.category} color={theme.colors.secondary} />
        <Switch
          value={source.isActive}
          onValueChange={value =>
            updateDataSource.mutate({id: source.id, body: {isActive: value}})
          }
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.primarySoft,
          }}
          thumbColor={
            source.isActive ? theme.colors.primary : theme.colors.textMuted
          }
        />
      </View>
    </Card>
  );

  return (
    <Screen scroll padded>
      <Header title="Data Sources" onBack={() => navigation.goBack()} />

      <View style={{marginTop: theme.spacing.lg}}>
        {isLoading ? (
          <LoadingState fullscreen={false} />
        ) : isError ? (
          <ErrorState
            fullscreen={false}
            message={getApiErrorMessage(error)}
            onRetry={() => refetch()}
          />
        ) : !sources?.length ? (
          <EmptyState icon="database" title="No data sources configured" />
        ) : (
          sources.map(renderItem)
        )}
      </View>
    </Screen>
  );
};

export default AreaDataSourcesScreen;
