import React from 'react';
import {Pressable, View} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import AppText from './AppText';
import Icon from './Icon';
import {MIN_TOUCH} from '../../theme';

interface QuickActionTileProps {
  label: string;
  icon: string;
  color: string;
  onPress: () => void;
}

/** Horizontally-scrolling quick-action tile on Home. */
const QuickActionTile: React.FC<QuickActionTileProps> = ({label, icon, color, onPress}) => {
  const {theme} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({pressed}) => ({
        alignItems: 'center',
        width: 76,
        opacity: pressed ? 0.8 : 1,
      })}>
      <View
        style={{
          width: 60,
          height: 60,
          minWidth: MIN_TOUCH,
          minHeight: MIN_TOUCH,
          borderRadius: theme.radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: withAlpha(color, 0.14),
          marginBottom: theme.spacing.xs,
        }}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <AppText variant="caption" center numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
};

const withAlpha = (hex: string, a: number): string => {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
};

export default QuickActionTile;
