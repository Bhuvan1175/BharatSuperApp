import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {useAreaSearch} from '../../hooks/useAreaIntelligence';
import {getApiErrorMessage} from '../../api/errors';
import {Screen, Header, AppText, EmptyState} from '../../components/common';
import AreaDetail from './AreaDetail';

type Props = NativeStackScreenProps<RootStackParamList, 'AreaScore'>;

/** Pushed screen (e.g. deep-linked from AI chat): shows one area's real detail
 * directly by id, or resolves it from a free-text query first. */
const AreaScoreScreen: React.FC<Props> = ({navigation, route}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {areaId, query} = route.params ?? {};

  const search = useAreaSearch(!areaId && query ? {q: query} : undefined);
  const resolvedAreaId = areaId ?? search.data?.[0]?.id ?? null;

  return (
    <Screen scroll padded>
      <Header title={t.explore.areaScore} onBack={() => navigation.goBack()} />
      {resolvedAreaId ? (
        <View style={{marginTop: theme.spacing.md}}>
          <AreaDetail areaId={resolvedAreaId} />
        </View>
      ) : search.isLoading ? (
        <ActivityIndicator
          color={theme.colors.primary}
          style={{marginTop: theme.spacing.huge}}
        />
      ) : search.isError ? (
        <AppText
          variant="body"
          muted
          center
          style={{marginTop: theme.spacing.huge}}>
          {getApiErrorMessage(search.error)}
        </AppText>
      ) : (
        <EmptyState
          icon="search"
          title="No area found"
          subtitle={query ? `Nothing matched "${query}".` : undefined}
        />
      )}
    </Screen>
  );
};

export default AreaScoreScreen;
