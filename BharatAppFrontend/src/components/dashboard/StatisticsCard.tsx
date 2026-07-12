import React from 'react';
import {View, StyleProp, ViewStyle} from 'react-native';
import {useTheme} from '@context/ThemeContext';
import {AppText, Card, Icon} from '@components/common';

interface StatisticsCardProps {
  label: string;
  value: string | number;
  icon?: string;
  iconColor?: string;
  style?: StyleProp<ViewStyle>;
}

/** StatisticsCard — a single KPI tile (value + label). Placeholder value: '—'. */
const StatisticsCard: React.FC<StatisticsCardProps> = ({
  label,
  value,
  icon,
  iconColor,
  style,
}) => {
  const {theme} = useTheme();
  const tint = iconColor ?? theme.colors.primary;
  return (
    <Card style={style}>
      {icon && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: theme.radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: tint + '22',
            marginBottom: theme.spacing.sm,
          }}>
          <Icon name={icon} size={16} color={tint} />
        </View>
      )}
      <AppText variant="h2" numberOfLines={1}>
        {String(value)}
      </AppText>
      <AppText variant="caption" muted numberOfLines={1}>
        {label}
      </AppText>
    </Card>
  );
};

export default StatisticsCard;
