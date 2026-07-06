import React from 'react';
import {View, Pressable} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {useAppData} from '../../context/AppDataContext';
import {useTranslation} from '../../hooks/useTranslation';
import {navigateTo} from '../../navigation/navigationRef';
import {Area} from '../../types';
import {scoreColor} from '../../utils/helpers';
import {AppText, Card, ScoreCircle, MapPreview, Icon, Button, SectionHeader, FadeInView} from '../../components/common';

/** Full Area Intelligence detail — shared by Explore tab and AreaScore screen. */
const AreaDetail: React.FC<{area: Area}> = ({area}) => {
  const {theme} = useTheme();
  const {t} = useTranslation();
  const {toggleSaved, isSaved} = useAppData();
  const saved = isSaved('areas', `${area.name}, ${area.city}`);

  const property = [
    {label: t.explore.avgRent, value: area.property.avgRent, icon: 'key'},
    {label: t.explore.avgPrice, value: area.property.avgPrice, icon: 'home'},
    {label: t.explore.priceGrowth, value: area.property.priceGrowth, icon: 'trending-up'},
    {label: t.explore.builderRating, value: `${area.property.builderRating} / 5`, icon: 'star'},
  ];
  const nearby = [
    {label: t.explore.hospitals, value: area.nearby.hospitals, icon: 'activity'},
    {label: t.explore.schools, value: area.nearby.schools, icon: 'book-open'},
    {label: t.explore.police, value: area.nearby.police, icon: 'shield'},
    {label: t.explore.atms, value: area.nearby.atms, icon: 'credit-card'},
  ];

  return (
    <View style={{gap: theme.spacing.lg}}>
      <MapPreview label={`${area.name}, ${area.city}`} height={170} />

      {/* Score */}
      <FadeInView>
        <Card>
          <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg}}>
            <ScoreCircle score={area.score} label={area.label} />
            <View style={{flex: 1}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                <AppText variant="h2">{area.name}</AppText>
                <Pressable
                  hitSlop={10}
                  onPress={() => toggleSaved('areas', `${area.name}, ${area.city}`)}>
                  <Icon
                    name="bookmark"
                    size={22}
                    color={saved ? theme.colors.primary : theme.colors.textMuted}
                  />
                </Pressable>
              </View>
              <AppText variant="caption" muted>
                {area.city}
              </AppText>
              <AppText variant="body" style={{marginTop: theme.spacing.sm}}>
                {area.aiSummary}
              </AppText>
            </View>
          </View>
        </Card>
      </FadeInView>

      {/* Categories */}
      <View>
        <SectionHeader title={t.explore.categories} />
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.md}}>
          {area.categories.map((c, i) => (
            <FadeInView key={c.key} delay={i * 40} style={{width: '47.5%'}}>
              <Card padded={false} style={{padding: theme.spacing.md}}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                  <Icon name={c.icon} size={18} color={scoreColor(c.score)} />
                  <AppText variant="bodyStrong" color={scoreColor(c.score)}>
                    {c.score.toFixed(1)}
                  </AppText>
                </View>
                <AppText variant="label" style={{marginTop: 6}}>
                  {c.label}
                </AppText>
                <AppText variant="caption" muted numberOfLines={2} style={{marginTop: 2}}>
                  {c.summary}
                </AppText>
              </Card>
            </FadeInView>
          ))}
        </View>
      </View>

      {/* Property */}
      <View>
        <SectionHeader title={t.explore.property} />
        <Card>
          <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
            {property.map((p, i) => (
              <View key={p.label} style={{width: '50%', paddingVertical: theme.spacing.sm, borderTopWidth: i > 1 ? 1 : 0, borderTopColor: theme.colors.border}}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                  <Icon name={p.icon} size={14} color={theme.colors.textMuted} />
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
          {nearby.map(n => (
            <Card key={n.label} padded={false} style={{flex: 1, alignItems: 'center', paddingVertical: theme.spacing.md}}>
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
        onPress={() => navigateTo('AIChat', {initialQuery: 'Compare ' + area.name + ' vs Wakad'})}
      />
    </View>
  );
};

export default AreaDetail;
