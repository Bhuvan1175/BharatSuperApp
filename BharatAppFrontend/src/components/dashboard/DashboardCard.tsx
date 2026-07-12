import React from 'react';
import {View, StyleProp, ViewStyle} from 'react-native';
import {useTheme} from '@context/ThemeContext';
import {AppText, Card, Icon} from '@components/common';

interface DashboardCardProps {
  title: string;
  subtitle?: string;
  icon?: string;
  iconColor?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * DashboardCard — the base labelled card (icon chip + title/subtitle + optional
 * right slot and body) used across dashboards. Built ON TOP of the existing
 * common Card so it inherits the app's surface/border/shadow styling — no
 * duplication of the base surface.
 */
const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  subtitle,
  icon,
  iconColor,
  onPress,
  right,
  style,
  children,
}) => {
  const {theme} = useTheme();
  const tint = iconColor ?? theme.colors.primary;
  return (
    <Card onPress={onPress} style={style}>
      <View
        style={{flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md}}>
        {icon && (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: theme.radius.sm,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: tint + '22',
            }}>
            <Icon name={icon} size={20} color={tint} />
          </View>
        )}
        <View style={{flex: 1}}>
          <AppText variant="title" numberOfLines={1}>
            {title}
          </AppText>
          {subtitle && (
            <AppText variant="caption" muted numberOfLines={2}>
              {subtitle}
            </AppText>
          )}
        </View>
        {right}
      </View>
      {children}
    </Card>
  );
};

export default DashboardCard;
