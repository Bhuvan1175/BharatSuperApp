import React, {useEffect, useState} from 'react';
import {View, ScrollView} from 'react-native';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@navigation/types';
import {useTheme} from '@context/ThemeContext';
import {
  Screen,
  Header,
  AppText,
  Card,
  SearchBar,
  SectionHeader,
  EmptyState,
} from '@components/common';
import {LoadingState, ErrorState} from '@components/dashboard';
import {AreaIntelligenceCard} from '@components/cards';
import {getApiErrorMessage} from '../../api/errors';
import {
  useAreaSearch,
  useAreas,
  useCompareAreas,
} from '@hooks/useAreaIntelligence';
import {
  AreaCompareResult,
  AreaScoreCategory,
} from '../../api/areaIntelligence.api';
import {scoreColor} from '../../utils/helpers';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'AreaCompare'>;

const MAX_COMPARE = 4;

const CATEGORY_LABEL: Record<AreaScoreCategory, string> = {
  SAFETY: 'Safety',
  TRAFFIC: 'Traffic',
  HEALTHCARE: 'Healthcare',
  SCHOOL: 'Schools',
  INTERNET: 'Internet',
  UTILITIES: 'Utilities',
};
const ALL_CATEGORIES = Object.keys(CATEGORY_LABEL) as AreaScoreCategory[];

const CompareColumn: React.FC<{result: AreaCompareResult}> = ({result}) => {
  const {theme} = useTheme();
  const score = result.overallScore;
  return (
    <Card style={{width: 190, marginRight: theme.spacing.md}}>
      <AppText variant="bodyStrong" numberOfLines={1}>
        {result.name}
      </AppText>
      <AppText variant="caption" muted numberOfLines={1}>
        {result.city}
      </AppText>
      <AppText
        variant="h1"
        color={score != null ? scoreColor(score) : theme.colors.textMuted}
        style={{marginTop: theme.spacing.sm}}>
        {score != null ? score.toFixed(1) : '—'}
      </AppText>
      <View style={{marginTop: theme.spacing.md, gap: 6}}>
        {ALL_CATEGORIES.map(cat => {
          const cScore = result.categoryScores[cat];
          return (
            <View
              key={cat}
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <AppText variant="caption" muted>
                {CATEGORY_LABEL[cat]}
              </AppText>
              <AppText
                variant="caption"
                color={
                  cScore != null ? scoreColor(cScore) : theme.colors.textMuted
                }>
                {cScore != null ? cScore.toFixed(1) : '—'}
              </AppText>
            </View>
          );
        })}
      </View>
    </Card>
  );
};

/** Pick 2–4 areas and see their scores side by side (stateless on the backend). */
const AreaCompareScreen: React.FC = () => {
  const {theme} = useTheme();
  const navigation = useNavigation<Nav>();
  const {params} = useRoute<Rt>();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    params?.areaIds ?? [],
  );
  const [searchText, setSearchText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchText.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const isSearching = debouncedQuery.length > 0;
  const search = useAreaSearch(isSearching ? {q: debouncedQuery} : undefined);
  const browse = useAreas({limit: 20});
  const compare = useCompareAreas(selectedIds);

  const pickList = isSearching ? search.data : browse.data?.items;
  const pickLoading = isSearching ? search.isLoading : browse.isLoading;
  const pickError = isSearching ? search.error : browse.error;
  const pickIsError = isSearching ? search.isError : browse.isError;

  const toggleSelect = (areaId: string) => {
    setSelectedIds(ids => {
      if (ids.includes(areaId)) {
        return ids.filter(i => i !== areaId);
      }
      if (ids.length >= MAX_COMPARE) {
        return ids;
      }
      return [...ids, areaId];
    });
  };

  return (
    <Screen scroll edges={['top']}>
      <Header title="Compare Areas" onBack={() => navigation.goBack()} />

      <AppText variant="caption" muted style={{marginTop: theme.spacing.sm}}>
        Select 2–4 areas ({selectedIds.length}/{MAX_COMPARE})
      </AppText>

      {compare.isLoading ? (
        <LoadingState fullscreen={false} />
      ) : compare.isError ? (
        <ErrorState
          fullscreen={false}
          message={getApiErrorMessage(compare.error)}
          onRetry={() => compare.refetch()}
        />
      ) : compare.data?.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginTop: theme.spacing.md}}>
          {compare.data.map(result => (
            <CompareColumn key={result.id} result={result} />
          ))}
        </ScrollView>
      ) : (
        <View style={{marginTop: theme.spacing.md}}>
          <EmptyState
            icon="bar-chart-2"
            title="Pick areas to compare"
            subtitle="Select at least 2 areas below to see them side by side."
          />
        </View>
      )}

      <View style={{marginTop: theme.spacing.xl}}>
        <SectionHeader title="Add an area" />
        <SearchBar
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search an area, locality or pincode…"
          showAi={false}
          showVoice={false}
        />

        <View style={{marginTop: theme.spacing.lg}}>
          {pickLoading ? (
            <LoadingState fullscreen={false} />
          ) : pickIsError ? (
            <ErrorState
              fullscreen={false}
              message={getApiErrorMessage(pickError)}
            />
          ) : !pickList?.length ? (
            <EmptyState icon="search" title="No areas found" />
          ) : (
            pickList.map(area => (
              <View
                key={area.id}
                style={
                  selectedIds.includes(area.id)
                    ? {
                        borderRadius: theme.radius.lg,
                        borderWidth: 2,
                        borderColor: theme.colors.primary,
                      }
                    : undefined
                }>
                <AreaIntelligenceCard
                  area={area}
                  onPress={() => toggleSelect(area.id)}
                />
              </View>
            ))
          )}
        </View>
      </View>
    </Screen>
  );
};

export default AreaCompareScreen;
