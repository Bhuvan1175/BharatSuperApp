import React from 'react';
import {View, Pressable} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import {AreaListItem} from '../../api/areaIntelligence.api';
import Card from '../common/Card';
import AppText from '../common/AppText';
import Icon from '../common/Icon';
import Badge from '../common/Badge';
import {scoreColor, scoreLabel} from '../../utils/helpers';

interface AreaIntelligenceCardProps {
  area: AreaListItem;
  onPress?: () => void;
  saved?: boolean;
  onToggleSave?: () => void;
}

/**
 * Compact row card for a real backend AreaMaster — used across the Area
 * Intelligence home, saved list and compare picker. Distinct from the older
 * `AreaScoreCard` (chat rich-card), which renders the mock `Area` type.
 */
const AreaIntelligenceCard: React.FC<AreaIntelligenceCardProps> = ({
  area,
  onPress,
  saved,
  onToggleSave,
}) => {
  const {theme} = useTheme();
  const score = area.scoreSnapshot?.overallScore ?? null;
  const color = score != null ? scoreColor(score) : theme.colors.textMuted;

  return (
    <Card
      onPress={onPress}
      style={{
        marginBottom: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
      }}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: score != null ? color + '22' : theme.colors.cardAlt,
        }}>
        {score != null ? (
          <AppText variant="h3" color={color} style={{fontSize: 17}}>
            {score.toFixed(1)}
          </AppText>
        ) : (
          <Icon name="map-pin" size={20} color={theme.colors.textMuted} />
        )}
      </View>
      <View style={{flex: 1}}>
        <AppText variant="title" numberOfLines={1}>
          {area.locality.name}
        </AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {area.locality.city.name}
          {area.distanceMeters != null
            ? ` · ${(area.distanceMeters / 1000).toFixed(1)} km`
            : ''}
        </AppText>
      </View>
      {score != null && <Badge label={scoreLabel(score)} color={color} />}
      {onToggleSave && (
        <Pressable onPress={onToggleSave} hitSlop={8}>
          <Icon
            name="bookmark"
            size={19}
            color={saved ? theme.colors.primary : theme.colors.textMuted}
          />
        </Pressable>
      )}
    </Card>
  );
};

export default AreaIntelligenceCard;
