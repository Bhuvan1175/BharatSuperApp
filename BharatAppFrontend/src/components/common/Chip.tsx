import React from 'react';
import {Pressable} from 'react-native';
import {useTheme} from '../../context/ThemeContext';
import AppText from './AppText';
import Icon from './Icon';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: string;
  color?: string;
}

/** Pill chip used for categories, filters and suggestions. */
const Chip: React.FC<ChipProps> = ({label, selected, onPress, icon, color}) => {
  const {theme} = useTheme();
  const accent = color ?? theme.colors.primary;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{selected}}
      style={({pressed}) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.pill,
        backgroundColor: selected ? accent : theme.colors.cardAlt,
        borderWidth: 1,
        borderColor: selected ? accent : theme.colors.border,
        opacity: pressed ? 0.85 : 1,
      })}>
      {icon && <Icon name={icon} size={14} color={selected ? theme.colors.textInverse : accent} />}
      <AppText
        variant="label"
        color={selected ? theme.colors.textInverse : theme.colors.text}
        numberOfLines={1}
        style={{flexShrink: 1}}>
        {label}
      </AppText>
    </Pressable>
  );
};

export default Chip;
