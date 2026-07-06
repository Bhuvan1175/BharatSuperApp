import React from 'react';
import {View} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {Area} from '../../types';
import Card from '../common/Card';
import AppText from '../common/AppText';
import Icon from '../common/Icon';
import ScoreCircle from '../common/ScoreCircle';
import MapPreview from '../common/MapPreview';
import {scoreColor} from '../../utils/helpers';

/** Compact Area Score card used inline in chat. */
const AreaScoreCard: React.FC<{area: Area; onPress?: () => void}> = ({area, onPress}) => {
  const {theme} = useTheme();
  return (
    <Card onPress={onPress} padded={false} style={{overflow: 'hidden'}}>
      <MapPreview label={`${area.name}, ${area.city}`} height={110} />
      <View style={{padding: theme.spacing.lg}}>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.lg}}>
          <ScoreCircle score={area.score} label={area.label} size={92} strokeWidth={8} />
          <View style={{flex: 1}}>
            <AppText variant="h3" numberOfLines={1}>{area.name}</AppText>
            <AppText variant="caption" muted numberOfLines={3} style={{marginTop: 4}}>
              {area.aiSummary}
            </AppText>
          </View>
        </View>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginTop: theme.spacing.md}}>
          {area.categories.slice(0, 3).map(c => (
            <View
              key={c.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                backgroundColor: theme.colors.cardAlt,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 5,
                borderRadius: theme.radius.pill,
              }}>
              <Icon name={c.icon} size={12} color={scoreColor(c.score)} />
              <AppText variant="caption">
                {c.label} {c.score.toFixed(1)}
              </AppText>
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
};

export default AreaScoreCard;
