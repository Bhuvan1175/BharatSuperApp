import React from 'react';
import {StyleProp, ViewStyle} from 'react-native';
import {useTheme} from '@context/ThemeContext';
import {AppText, Card, Icon} from '@components/common';

interface QuickActionCardProps {
  label: string;
  icon: string;
  color?: string;
  /** Optional sub-label, e.g. "Coming soon". */
  hint?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * QuickActionCard — a tappable action tile for dashboards (icon + label +
 * optional hint). Distinct from the Home `QuickActionTile`, which is the small
 * fixed-width horizontal-scroller variant; this is the grid-cell variant.
 */
const QuickActionCard: React.FC<QuickActionCardProps> = ({
  label,
  icon,
  color,
  hint,
  onPress,
  disabled,
  style,
}) => {
  const {theme} = useTheme();
  const tint = color ?? theme.colors.primary;
  return (
    <Card
      onPress={disabled ? undefined : onPress}
      style={[{opacity: disabled ? 0.6 : 1}, style]}>
      <Icon name={icon} size={22} color={tint} />
      <AppText
        variant="title"
        numberOfLines={1}
        style={{marginTop: theme.spacing.sm}}>
        {label}
      </AppText>
      {hint && (
        <AppText variant="caption" muted numberOfLines={1}>
          {hint}
        </AppText>
      )}
    </Card>
  );
};

export default QuickActionCard;
