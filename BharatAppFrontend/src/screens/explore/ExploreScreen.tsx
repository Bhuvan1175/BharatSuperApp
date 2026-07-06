import React, {useEffect, useState} from 'react';
import {View, ScrollView, Pressable, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useRoute, RouteProp} from '@react-navigation/native';
import {MainTabParamList} from '../../navigation/types';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {areaService} from '../../services/areaService';
import {AREAS} from '../../data/areas';
import {Area} from '../../types';
import {scoreColor} from '../../utils/helpers';
import {AppText, SearchBar, Card, Icon, SectionHeader} from '../../components/common';
import AreaDetail from './AreaDetail';

const ExploreScreen: React.FC = () => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const route = useRoute<RouteProp<MainTabParamList, 'ExploreTab'>>();
  const [query, setQuery] = useState('');
  const [area, setArea] = useState<Area | null>(AREAS[0]);
  const [loading, setLoading] = useState(false);

  const runSearch = (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    areaService.getScore(q).then(a => {
      setArea(a);
      setLoading(false);
    });
  };

  useEffect(() => {
    if (route.params?.query) {
      setQuery(route.params.query);
      runSearch(route.params.query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.query]);

  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: theme.colors.background}}>
      <View style={{paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md}}>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{padding: theme.spacing.lg, paddingBottom: theme.spacing.giant}}>
        {/* Popular areas quick chips */}
        <SectionHeader title="Popular areas" />
        <View style={{flexDirection: 'row', gap: theme.spacing.sm, marginBottom: theme.spacing.lg}}>
          {AREAS.map(a => (
            <Pressable
              key={a.id}
              onPress={() => {
                setQuery(a.name);
                runSearch(a.name);
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.radius.pill,
                backgroundColor: area?.id === a.id ? theme.colors.primarySoft : theme.colors.cardAlt,
                borderWidth: 1,
                borderColor: area?.id === a.id ? theme.colors.primary : theme.colors.border,
              }}>
              <View style={{width: 8, height: 8, borderRadius: 4, backgroundColor: scoreColor(a.score)}} />
              <AppText variant="label">{a.name}</AppText>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <Card style={{alignItems: 'center', paddingVertical: theme.spacing.huge}}>
            <ActivityIndicator color={theme.colors.primary} />
            <AppText variant="caption" muted style={{marginTop: theme.spacing.md}}>
              Scoring area…
            </AppText>
          </Card>
        ) : area ? (
          <AreaDetail area={area} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExploreScreen;
