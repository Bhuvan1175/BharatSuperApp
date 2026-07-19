import React from 'react';
import {View, Pressable, ActivityIndicator, Linking} from 'react-native';
import axios from 'axios';
import {useTheme} from '../../context/ThemeContext';
import {useTranslation} from '../../hooks/useTranslation';
import {navigateTo} from '../../navigation/navigationRef';
import {
  scoreColor,
  scoreLabel,
  computePriceGrowthPct,
  averageBuilderRating,
} from '../../utils/helpers';
import {getApiErrorMessage} from '../../api/errors';
import {
  useAreaDetail,
  useAreaIntelligenceDetail,
  useAreaNearby,
  useAreaPropertyStats,
  useAreaSummary,
  useSaveArea,
  useSavedAreas,
  useUnsaveArea,
} from '../../hooks/useAreaIntelligence';
import {
  AmenityCategory,
  AreaScoreCategory,
} from '../../api/areaIntelligence.api';
import {
  AppText,
  Card,
  ScoreCircle,
  MapPreview,
  Icon,
  Button,
  SectionHeader,
  FadeInView,
} from '../../components/common';

const CATEGORY_META: Record<AreaScoreCategory, {label: string; icon: string}> =
  {
    SAFETY: {label: 'Safety', icon: 'shield'},
    HEALTHCARE: {label: 'Health', icon: 'activity'},
    SCHOOL: {label: 'Schools', icon: 'book-open'},
    INTERNET: {label: 'Internet', icon: 'wifi'},
    UTILITIES: {label: 'Water & Power', icon: 'zap'},
    TRAFFIC: {label: 'Traffic', icon: 'navigation'},
  };
const CATEGORY_ORDER: AreaScoreCategory[] = [
  'SAFETY',
  'HEALTHCARE',
  'SCHOOL',
  'INTERNET',
  'UTILITIES',
  'TRAFFIC',
];

const NEARBY_META: {category: AmenityCategory; label: string; icon: string}[] =
  [
    {category: 'HOSPITAL', label: 'Hospitals', icon: 'activity'},
    {category: 'SCHOOL', label: 'Schools', icon: 'book-open'},
    {category: 'POLICE', label: 'Police', icon: 'shield'},
    {category: 'ATM', label: 'ATMs', icon: 'credit-card'},
  ];

const isNotFound = (error: unknown) =>
  axios.isAxiosError(error) && error.response?.status === 404;

/**
 * Full Area Intelligence detail — shared by the Explore tab and the pushed
 * AreaScore screen. Backed entirely by the real backend (`/v1/areas/*`), not
 * the mock catalogue.
 */
const AreaDetail: React.FC<{areaId: string}> = ({areaId}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();

  const detail = useAreaDetail(areaId);
  const intelligence = useAreaIntelligenceDetail(areaId);
  const summary = useAreaSummary(areaId);
  const nearby = useAreaNearby(areaId);
  const propertyStats = useAreaPropertyStats(areaId);
  const saved = useSavedAreas();
  const saveArea = useSaveArea();
  const unsaveArea = useUnsaveArea();

  if (detail.isLoading) {
    return (
      <Card style={{alignItems: 'center', paddingVertical: theme.spacing.huge}}>
        <ActivityIndicator color={theme.colors.primary} />
      </Card>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <Card
        style={{
          alignItems: 'center',
          paddingVertical: theme.spacing.huge,
          gap: theme.spacing.md,
        }}>
        <Icon name="alert-triangle" size={28} color={theme.colors.danger} />
        <AppText variant="body" muted center>
          {getApiErrorMessage(detail.error, 'This area could not be loaded.')}
        </AppText>
        <Button
          label="Retry"
          variant="outline"
          fullWidth={false}
          onPress={() => detail.refetch()}
        />
      </Card>
    );
  }

  const area = detail.data;
  const isSaved = (saved.data ?? []).some(s => s.areaId === areaId);
  const score = area.scoreSnapshot?.overallScore ?? null;

  const growthPct = propertyStats.data
    ? computePriceGrowthPct(propertyStats.data.priceHistory)
    : null;
  const builderRating = propertyStats.data
    ? averageBuilderRating(propertyStats.data.builderRatings)
    : null;

  const property = [
    {
      label: t.explore.avgPrice,
      value:
        propertyStats.data?.stats?.avgPrice != null
          ? `₹${propertyStats.data.stats.avgPrice.toLocaleString('en-IN')}`
          : '—',
      icon: 'home',
    },
    {
      label: t.explore.pricePerSqft,
      value:
        propertyStats.data?.stats?.pricePerSqft != null
          ? `₹${propertyStats.data.stats.pricePerSqft.toLocaleString('en-IN')}`
          : '—',
      icon: 'key',
    },
    {
      label: t.explore.priceGrowth,
      value:
        growthPct != null
          ? `${growthPct >= 0 ? '+' : ''}${growthPct.toFixed(1)}%`
          : '—',
      icon: 'trending-up',
    },
    {
      label: t.explore.builderRating,
      value: builderRating != null ? `${builderRating.toFixed(1)} / 5` : '—',
      icon: 'star',
    },
  ];

  const nearbyCounts = NEARBY_META.map(n => ({
    ...n,
    value: (nearby.data ?? []).filter(
      item => item.amenity.category === n.category,
    ).length,
  }));

  const summaryText = summary.isLoading
    ? 'Loading AI summary…'
    : summary.data?.summary ??
      (isNotFound(summary.error)
        ? 'AI insights for this area are being generated.'
        : '');

  return (
    <View style={{gap: theme.spacing.lg}}>
      <MapPreview
        label={`${area.locality.name}, ${area.locality.city.name}`}
        height={170}
        onPress={() =>
          Linking.openURL(
            area.locality.latitude != null && area.locality.longitude != null
              ? `https://maps.google.com/?q=${area.locality.latitude},${area.locality.longitude}`
              : `https://maps.google.com/?q=${encodeURIComponent(
                  `${area.locality.name}, ${area.locality.city.name}`,
                )}`,
          )
        }
      />

      {/* Score */}
      <FadeInView>
        <Card>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.spacing.lg,
            }}>
            {score != null ? (
              <ScoreCircle score={score} label={scoreLabel(score)} />
            ) : (
              <View
                style={{
                  width: 132,
                  height: 132,
                  borderRadius: 66,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.cardAlt,
                }}>
                <Icon
                  name="bar-chart-2"
                  size={28}
                  color={theme.colors.textMuted}
                />
              </View>
            )}
            <View style={{flex: 1}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                <AppText variant="h2">{area.locality.name}</AppText>
                <Pressable
                  hitSlop={10}
                  onPress={() =>
                    isSaved
                      ? unsaveArea.mutate(areaId)
                      : saveArea.mutate(areaId)
                  }>
                  <Icon
                    name="bookmark"
                    size={22}
                    color={
                      isSaved ? theme.colors.primary : theme.colors.textMuted
                    }
                  />
                </Pressable>
              </View>
              <AppText variant="caption" muted>
                {area.locality.city.name}
              </AppText>
              {!!summaryText && (
                <AppText variant="body" style={{marginTop: theme.spacing.sm}}>
                  {summaryText}
                </AppText>
              )}
            </View>
          </View>
        </Card>
      </FadeInView>

      {/* Categories */}
      <View>
        <SectionHeader title={t.explore.categories} />
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.spacing.md,
          }}>
          {CATEGORY_ORDER.map((cat, i) => {
            const meta = CATEGORY_META[cat];
            const row = intelligence.data?.categories.find(
              c => c.category === cat,
            );
            const cScore = row?.score ?? null;
            const cColor =
              cScore != null ? scoreColor(cScore) : theme.colors.textMuted;
            return (
              <FadeInView key={cat} delay={i * 40} style={{width: '47.5%'}}>
                <Card padded={false} style={{padding: theme.spacing.md}}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                    <Icon name={meta.icon} size={18} color={cColor} />
                    <AppText variant="bodyStrong" color={cColor}>
                      {cScore != null ? cScore.toFixed(1) : '—'}
                    </AppText>
                  </View>
                  <AppText variant="label" style={{marginTop: 6}}>
                    {meta.label}
                  </AppText>
                </Card>
              </FadeInView>
            );
          })}
        </View>
      </View>

      {/* Property */}
      <View>
        <SectionHeader title={t.explore.property} />
        <Card>
          <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
            {property.map((p, i) => (
              <View
                key={p.label}
                style={{
                  width: '50%',
                  paddingVertical: theme.spacing.sm,
                  borderTopWidth: i > 1 ? 1 : 0,
                  borderTopColor: theme.colors.border,
                }}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Icon
                    name={p.icon}
                    size={14}
                    color={theme.colors.textMuted}
                  />
                  <AppText variant="caption" muted>
                    {p.label}
                  </AppText>
                </View>
                <AppText variant="title" style={{marginTop: 2}}>
                  {p.value}
                </AppText>
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* Nearby */}
      <View>
        <SectionHeader title={t.explore.nearby} />
        <View style={{flexDirection: 'row', gap: theme.spacing.sm}}>
          {nearbyCounts.map(n => (
            <Card
              key={n.label}
              padded={false}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: theme.spacing.md,
              }}>
              <Icon name={n.icon} size={18} color={theme.colors.secondary} />
              <AppText variant="h3" style={{marginTop: 4}}>
                {n.value}
              </AppText>
              <AppText variant="caption" muted>
                {n.label}
              </AppText>
            </Card>
          ))}
        </View>
      </View>

      <Button
        label={t.explore.compareCta}
        icon="bar-chart-2"
        variant="secondary"
        onPress={() => navigateTo('AreaCompare', {areaIds: [areaId]})}
      />
    </View>
  );
};

export default AreaDetail;
