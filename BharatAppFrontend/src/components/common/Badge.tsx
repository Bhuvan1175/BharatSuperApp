import React from 'react';
import {View} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import AppText from './AppText';
import Icon from './Icon';

interface BadgeProps {
  label: string;
  color?: string;
  soft?: boolean;
  icon?: string;
}

/** Small status pill (in-stock, eligible, crowd level, etc.). */
const Badge: React.FC<BadgeProps> = ({label, color, soft = true, icon}) => {
  const {theme} = useTheme();
  const c = color ?? theme.colors.accent;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        alignSelf: 'flex-start',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 3,
        borderRadius: theme.radius.pill,
        backgroundColor: soft ? withAlpha(c) : c,
      }}>
      {icon && <Icon name={icon} size={11} color={soft ? c : theme.colors.textInverse} />}
      <AppText
        variant="caption"
        color={soft ? c : theme.colors.textInverse}
        numberOfLines={1}
        style={{fontWeight: '600', flexShrink: 1}}>
        {label}
      </AppText>
    </View>
  );
};

const withAlpha = (hex: string): string => {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.14)`;
};

export default Badge;
