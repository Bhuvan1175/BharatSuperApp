import React, {useEffect, useState} from 'react';
import {View, ScrollView, Pressable, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, RouteProp} from '@react-navigation/native';
import {MainTabParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {useAreas, useAreaSearch} from '../../hooks/useAreaIntelligence';
import {scoreColor} from '../../utils/helpers';
import {getApiErrorMessage} from '../../api/errors';
import {
  AppText,
  SearchBar,
  Card,
  SectionHeader,
  EmptyState,
} from '../../components/common';
import AreaDetail from './AreaDetail';

const ExploreScreen: React.FC = () => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const route = useRoute<RouteProp<MainTabParamList, 'ExploreTab'>>();
  const [query, setQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  const browse = useAreas({limit: 5});
  const search = useAreaSearch(searchQuery ? {q: searchQuery} : undefined);

  const runSearch = (q: string) => {
    if (!q.trim()) {
      return;
    }
    setSearchQuery(q.trim());
  };

  useEffect(() => {
    if (route.params?.query) {
      setQuery(route.params.query);
      runSearch(route.params.query);
    }
  }, [route.params?.query]);

  // Default selection: first browse result, once loaded (if nothing picked/searched yet).
  useEffect(() => {
    if (!selectedAreaId && !searchQuery && browse.data?.items.length) {
      setSelectedAreaId(browse.data.items[0].id);
    }
  }, [browse.data, selectedAreaId, searchQuery]);

  // After a search resolves, select its first hit.
  useEffect(() => {
    if (searchQuery) {
      setSelectedAreaId(search.data?.[0]?.id ?? null);
    }
  }, [search.data, searchQuery]);

  const isSearching = searchQuery != null;
  const searching = isSearching && search.isLoading;
  const noResults =
    isSearching &&
    !search.isLoading &&
    !search.isError &&
    search.data?.length === 0;

  return (
    <SafeAreaView
      edges={['top']}
      style={{flex: 1, backgroundColor: theme.colors.background}}>
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.md,
        }}>
        <AppText variant="h2">{t.explore.title}</AppText>
        <View style={{marginTop: theme.spacing.md}}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            placeholder={t.explore.searchPlaceholder}
            onSubmit={() => runSearch(query)}
            showAi={false}
            showVoice
            onVoicePress={() => runSearch(query || 'Baner')}
          />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: theme.spacing.giant,
        }}>
        {/* Popular areas quick chips */}
        <SectionHeader title="Popular areas" />
        {browse.isLoading ? (
          <ActivityIndicator
            color={theme.colors.primary}
            style={{marginBottom: theme.spacing.lg}}
          />
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.spacing.sm,
              marginBottom: theme.spacing.lg,
            }}>
            {(browse.data?.items ?? []).map(a => {
              const chipScore = a.scoreSnapshot?.overallScore ?? null;
              const active = !isSearching && selectedAreaId === a.id;
              return (
                <Pressable
                  key={a.id}
                  onPress={() => {
                    setQuery(a.locality.name);
                    setSearchQuery(null);
                    setSelectedAreaId(a.id);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.radius.pill,
                    backgroundColor: active
                      ? theme.colors.primarySoft
                      : theme.colors.cardAlt,
                    borderWidth: 1,
                    borderColor: active
                      ? theme.colors.primary
                      : theme.colors.border,
                  }}>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor:
                        chipScore != null
                          ? scoreColor(chipScore)
                          : theme.colors.textMuted,
                    }}
                  />
                  <AppText variant="label">{a.locality.name}</AppText>
                </Pressable>
              );
            })}
          </View>
        )}

        {searching ? (
          <Card
            style={{alignItems: 'center', paddingVertical: theme.spacing.huge}}>
            <ActivityIndicator color={theme.colors.primary} />
            <AppText
              variant="caption"
              muted
              style={{marginTop: theme.spacing.md}}>
              Searching…
            </AppText>
          </Card>
        ) : isSearching && search.isError ? (
          <Card
            style={{alignItems: 'center', paddingVertical: theme.spacing.huge}}>
            <AppText variant="body" muted center>
              {getApiErrorMessage(search.error)}
            </AppText>
          </Card>
        ) : noResults ? (
          <EmptyState
            icon="search"
            title="No areas found"
            subtitle={`Nothing matched "${searchQuery}".`}
          />
        ) : selectedAreaId ? (
          <AreaDetail areaId={selectedAreaId} />
        ) : browse.isLoading ? null : (
          <EmptyState
            icon="map-pin"
            title="No areas available yet"
            subtitle="Areas will appear here once your city's data is synced."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExploreScreen;
