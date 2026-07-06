import React, {useEffect, useState} from 'react';
import {View, ScrollView, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {navigateTo} from '../../navigation/navigationRef';
import {travelService} from '../../services/travelService';
import {FUEL_CATEGORIES} from '../../constants/categories';
import {FuelStation, FuelType} from '../../types';
import {AppText, MapPreview, Chip, SectionHeader, Card, Icon, FadeInView} from '../../components/common';
import {FuelStationCard} from '../../components/cards';

const TravelScreen: React.FC = () => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const [filter, setFilter] = useState<FuelType>('Petrol');
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    travelService.getStations(filter).then(s => {
      setStations(s);
      setLoading(false);
    });
  }, [filter]);

  return (
    <SafeAreaView edges={['top']} style={{flex: 1, backgroundColor: theme.colors.background}}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: theme.spacing.giant}}>
        <View style={{paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md}}>
          <AppText variant="h2">{t.travel.title}</AppText>
          <View style={{marginTop: theme.spacing.md}}>
            <MapPreview label="Near you · Baner" height={160} pinColor={theme.colors.primary} />
          </View>
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal: theme.spacing.lg, gap: theme.spacing.sm, paddingVertical: theme.spacing.lg}}>
          {FUEL_CATEGORIES.map(c => (
            <Chip key={c.key} label={c.key} icon={c.icon} selected={filter === c.key} onPress={() => setFilter(c.key)} />
          ))}
        </ScrollView>

        {/* Road-trip planner entry */}
        <View style={{paddingHorizontal: theme.spacing.lg}}>
          <Card onPress={() => navigateTo('RoadTrip')} style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md}}>
            <View style={{width: 44, height: 44, borderRadius: theme.radius.md, backgroundColor: theme.colors.secondarySoft, alignItems: 'center', justifyContent: 'center'}}>
              <Icon name="map" size={22} color={theme.colors.secondary} />
            </View>
            <View style={{flex: 1}}>
              <AppText variant="bodyStrong">{t.travel.roadTrip}</AppText>
              <AppText variant="caption" muted>
                {t.travel.roadTripPlaceholder}
              </AppText>
            </View>
            <Icon name="chevron-right" size={20} color={theme.colors.textMuted} />
          </Card>
        </View>

        {/* Station list */}
        <View style={{paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg}}>
          <SectionHeader title={t.travel.stations} />
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: theme.spacing.md}}>
            <Icon name="trending-down" size={14} color={theme.colors.accent} />
            <AppText variant="caption" color={theme.colors.accent}>
              {t.travel.leastCrowded}
            </AppText>
          </View>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} style={{marginTop: theme.spacing.xl}} />
          ) : (
            stations.map((s, i) => (
              <FadeInView key={s.id} delay={i * 50}>
                <FuelStationCard station={s} />
              </FadeInView>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TravelScreen;
